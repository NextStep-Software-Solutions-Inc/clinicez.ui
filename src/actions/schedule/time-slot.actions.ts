"use server";

import dayjs from "dayjs"
import isBetween from "dayjs/plugin/isBetween"
import localizeFormat from "dayjs/plugin/localizedFormat"
dayjs.extend(isBetween)
dayjs.extend(localizeFormat)

import prismaTenant from "@lib/prisma-tenant";
import { getHPAppointmentsSchedule, getUserScheduleAction } from "./user-schedule.action";
import { eachDayOfInterval, getWeekOfMonth } from "date-fns";
import { toast } from "sonner";
import { cache } from "react";
import { formatDateTime } from "@lib/utils";

type GenerateTimeSlotsArgs = {
  hpEmail: string, 
  serviceId:number, 
  appointmentTypeId:number, 
}
interface Availability {
  date: Date;
  status: string;
  timeSlots: { start: Date, end: Date }[];
}
export const generateTimeSlots = cache(async ({appointmentTypeId, serviceId, hpEmail}: GenerateTimeSlotsArgs): Promise<{
  status: boolean;
  message: string;
  data: Availability[]
}> => {

  const response = {
    status: false,
    message: "Unable to generate time slots",
    data: []
  }

  const [serviceAttribute, appointmentTypeAttribute, userSchedule, appointmentSchedules] = await Promise.all([
    prismaTenant.serviceAttribute.findUnique({
      where: {
        serviceId: serviceId
      }
    }),
    prismaTenant.appointmentTypeAttribute.findUnique({
      where: {
        appointmentTypeId: appointmentTypeId
      }
    }),
    getUserScheduleAction(hpEmail),
    getHPAppointmentsSchedule(hpEmail)
  ])

  const totalDuration = (serviceAttribute?.duration ?? 0) + (serviceAttribute?.durationPadding ?? 0)

  if(totalDuration <= 0) {
    return {
      ...response,
      message: "Service attribute duration is invalid, value must be greater than 0",
      data: []
    }
  }

  if (!userSchedule) {
    toast.error("Healthcare provider schedule not found")
    return {
      ...response,
      message: "Healthcare provider schedule not found",
      data: []
    };
  }

  const defaultDateTime = dayjs().startOf("day").toDate()
  const startDate = userSchedule[0]?.startDate  ?? defaultDateTime // Date
  const endDate = userSchedule[0]?.endDate ?? defaultDateTime // Date
  const isRecurring = userSchedule[0]?.isRecurring // true or false
  const recurringPattern = userSchedule[0]?.pattern // DAILY, WEEKLY, MONTHLY
  const recurringDays = userSchedule[0]?.daysOfWeek ?? []// MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY
  const weeksOfMonth = userSchedule[0]?.weekOfMonth  ?? []// 1st, 2nd, 3rd, 4th, 5th
 
  const isWithinException = (exception: typeof userSchedule[number], timeSlot: {
    start: Date;
    end: Date;
  }): boolean => {
    const start = formatDateTime(dayjs(exception.startDate).startOf("day").toDate(), exception.startTime);
    const end = formatDateTime(dayjs(exception.endDate).startOf("day").toDate(), exception.endTime);
    return dayjs(timeSlot.start).isBetween(start, end, "minutes", "[)") || dayjs(timeSlot.end).isBetween(start, end, "minutes", "(]");
  };

  const isBooked = (schedules: typeof appointmentSchedules, timeSlot: {
    start: Date;
    end: Date;
  }): boolean => {
    return schedules.some(schedule => {
      if(!schedule.AppointmentAttribute?.timeStart || !schedule.AppointmentAttribute?.timeEnd) {
        return false;
      }
      const start = formatDateTime(dayjs(schedule.AppointmentAttribute?.date).startOf("day").toDate(), schedule.AppointmentAttribute?.timeStart);
      const end = formatDateTime(dayjs(schedule.AppointmentAttribute?.date).startOf("day").toDate(), schedule.AppointmentAttribute?.timeEnd);
      
      console.log({
        start: dayjs(start).format("YYYY-MM-DD HH:mm:ss"),
        end: dayjs(end).format("YYYY-MM-DD HH:mm:ss"),
        timeSlot: {
          start: dayjs(timeSlot.start).format("YYYY-MM-DD HH:mm:ss"),
          end: dayjs(timeSlot.end).format("YYYY-MM-DD HH:mm:ss")
        }
      });
      
      
      return dayjs(timeSlot.start).isBetween(start, end, "minutes", "[)") || dayjs(timeSlot.end).isBetween(start, end, "minutes", "(]");
    });
  }
  
  type userSchedule = typeof userSchedule

  const checkAvailability = (date: Date, userSchedule: NonNullable<userSchedule>, recurringDays: number[], totalDuration: number): { status: string, timeSlots: { start: Date, end: Date }[] } => {
    const currentDateTime = dayjs(date);
    const start = formatDateTime(currentDateTime.toDate(), userSchedule[0]?.startTime);
    const end = formatDateTime(currentDateTime.toDate(), userSchedule[0]?.endTime);
    const isBeforeEnd = dayjs().isBefore(end, "minutes");
    
    let available = false;
    
    if (isRecurring) {
      const isDayIncluded = recurringDays.includes(currentDateTime.day());
      if (isDayIncluded) {
        switch (recurringPattern) {
        case 'daily':
          available = isBeforeEnd
          break;
        case 'weekly':
          const isWithinWeeklyPattern = currentDateTime.isBefore(dayjs(userSchedule[0].endDate)) && recurringDays.includes(currentDateTime.day());
          available = isBeforeEnd && isWithinWeeklyPattern;
          break;
        case 'monthly':
          const isWithinMonthlyPattern = currentDateTime.isBefore(dayjs(userSchedule[0].endDate)) && weeksOfMonth.includes(getWeekOfMonth(currentDateTime.toDate()));
          available = isBeforeEnd  && isWithinMonthlyPattern;
          break;
        default:
          available = false;
          break;
        }
      }
    } else {
      available = isBeforeEnd;
    }
    
    const timeSlots: { start: Date, end: Date }[] = [];
    
    if (available) {
      let clonedStart = dayjs().isAfter(start, "minutes") ? dayjs() : start;
      const exceptionSchedule = userSchedule.filter(s => s.type === "exception")
      while (clonedStart.add(totalDuration, "minute").isBetween(dayjs(), end, "minute", "[]")) {
        const newStart = clonedStart.add(totalDuration, "minute");
        const isWithin = exceptionSchedule.some(exception => isWithinException(exception, { start: clonedStart.toDate(), end: newStart.toDate() }));
        const isBookedSlot = isBooked(appointmentSchedules, { start: clonedStart.toDate(), end: newStart.toDate() });
        if(!(isWithin || isBookedSlot)) {
          timeSlots.push({ start: clonedStart.toDate(), end: newStart.toDate() });
        }
        clonedStart = newStart;
      }
    }
    
  
    return {
      status: timeSlots.length ? "AVAILABLE" : "UNAVAILABLE",
      timeSlots
    };
  };
  

  const allDates = eachDayOfInterval({ start: startDate, end: endDate })
  const availability: Availability[] = allDates.map(date => {
    const { status, timeSlots } = checkAvailability(date, userSchedule, recurringDays, totalDuration);
    return {
      date: dayjs(date).startOf("day").toDate(),
      status,
      timeSlots
    };
  });
  return {
    status: true,
    message: "Time slots generated",
    data: availability
  }
})
  
