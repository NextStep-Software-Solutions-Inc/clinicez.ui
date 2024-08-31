"use server";

import dayjs from "dayjs"
import isBetween from "dayjs/plugin/isBetween"
import localizeFormat from "dayjs/plugin/localizedFormat"
dayjs.extend(isBetween)
dayjs.extend(localizeFormat)

import prismaTenant from "@lib/prisma-tenant";
import { getHPAppointmentsSchedule, GetUserSchedules, getUserSchedulesAction } from "./user-schedule.action";
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
  status: boolean;
  timeSlots: { start: Date, end: Date }[];
}

export const getAvailableDates = cache(async ({appointmentTypeId, serviceId, hpEmail}: GenerateTimeSlotsArgs): Promise<{
  status: boolean;
  message: string;
  data: Availability[]
}> => {

  const response = {
    status: false,
    message: "Unable to generate time slots",
    data: []
  }

  const [serviceAttribute, appointmentTypeAttribute, userSchedules, appointmentSchedules] = await Promise.all([
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
    getUserSchedulesAction(hpEmail),
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

  const baseSchedule = userSchedules?.find(schedule => schedule.type === "base")
  if (!baseSchedule) {
    toast.error("Healthcare provider base schedule not found")
    return {
      ...response,
      message: "Healthcare provider base schedule not found",
      data: []
    };
  }
  
  const exceptionSchedules = userSchedules.filter(s => s.type === "exception")
  const defaultDateTime = dayjs().startOf("day").toDate()
  const startDate = baseSchedule.startDate  ?? defaultDateTime 
  const endDate = baseSchedule.endDate ?? defaultDateTime
  const isRecurring = baseSchedule.isRecurring 
  const recurringPattern = baseSchedule.pattern 
  const weeksOfMonth = baseSchedule.weekOfMonth  ?? []
  
  const checkAvailability = (date: Date, schedule: NonNullable<GetUserSchedules>[number]): boolean => {
    const currentDateTime = dayjs(date);
    const end = formatDateTime(currentDateTime.toDate(), schedule?.endTime);
    const isBeforeEnd = dayjs().isBefore(end, "minutes");
    
    let available = isRecurring ? false : isBeforeEnd;
    if (!available) {
      const daysOfWeek = schedule.daysOfWeek ?? [];
      const isDayIncluded = daysOfWeek.includes(currentDateTime.day());
      if (isDayIncluded) {
        switch (recurringPattern) {
        case 'daily':
          available = isBeforeEnd
          break;
        case 'weekly':
          const isWithinWeeklyPattern = currentDateTime.isBefore(dayjs(schedule.endDate)) && daysOfWeek.includes(currentDateTime.day());
          available = isBeforeEnd && isWithinWeeklyPattern;
          break;
        case 'monthly':
          const isWithinMonthlyPattern = currentDateTime.isBefore(dayjs(schedule.endDate)) && weeksOfMonth.includes(getWeekOfMonth(currentDateTime.toDate()));
          available = isBeforeEnd  && isWithinMonthlyPattern;
          break;
        default:
          available = false;
          break;
        }
      }
    }
    return available
  };

  const allDates = eachDayOfInterval({ start: startDate, end: endDate })
  const availability: Availability[] = allDates.map(date => {
    const currentDateTime = dayjs(date);
    const isAvailable = checkAvailability(date, baseSchedule);
    const start = formatDateTime(date, baseSchedule?.startTime).toDate();
    const end = formatDateTime(date, baseSchedule?.endTime).toDate();
    const exceptionSlots = generateExceptionSlots(exceptionSchedules)
    const bookedTimeSlots = appointmentSchedules.map(apt => {
      return {
        dateStart: apt.AppointmentAttribute?.date!,
        dateEnd: apt.AppointmentAttribute?.date!,
        timeStart: apt.AppointmentAttribute?.timeStart!,
        timeEnd: apt.AppointmentAttribute?.timeEnd!
      }
    });

    const timeSlots = isAvailable ? generateTimeSlotsV2(start, end, totalDuration, [...bookedTimeSlots, ...exceptionSlots]) : [];
    return {
      date: currentDateTime.endOf("day").toDate(),
      status: isAvailable,
      timeSlots
    };
  });

  return {
    status: true,
    message: "Time slots generated",
    data: availability
  }
})

type Schedule = {
  dateStart: Date;
  dateEnd: Date;
  timeStart: Date;
  timeEnd: Date;
}
const isOccupied = (timeSlot: { start: Date, end: Date }, schedules: Schedule[], ): boolean => {
  return schedules.some(schedule => {
    if(!schedule.timeStart || !schedule.timeEnd) {
      throw new Error("Invalid schedule time");
    }
    const start = formatDateTime(dayjs(schedule.dateStart).startOf("day").toDate(), schedule.timeStart);
    const end = formatDateTime(dayjs(schedule.dateEnd).startOf("day").toDate(), schedule?.timeEnd);
    return dayjs(timeSlot.start).isBetween(start, end, "minutes", "[)") || dayjs(timeSlot.end).isBetween(start, end, "minutes", "(]");
  });
}

const generateExceptionSlots = (exceptions: GetUserSchedules): Schedule[] => {
  const exceptionSchedules:Schedule[] = [];
  for (const exception of exceptions) {
    if(!exception.isRecurring){
      exceptionSchedules.push(
        {
          dateStart: exception.startDate,
          dateEnd: exception.endDate,
          timeStart: exception.startTime,
          timeEnd: exception.endTime
        }
      )
      continue;
    }
    function addExceptionSchedule(currentDateTime: dayjs.Dayjs, isNowBetween: boolean, exception: any, exceptionSchedules: any[]) {
      const now = dayjs();
      exceptionSchedules.push({
        dateStart: isNowBetween ? now.toDate() : currentDateTime.toDate(),
        dateEnd: exception.endDate,
        timeStart: isNowBetween ? now.toDate() : currentDateTime.toDate(),
        timeEnd: exception.endTime
      });
    }
    const dateRange = eachDayOfInterval({ start: exception.startDate, end: exception.endDate });
    dateRange.forEach(date => {
      const currentDateTime = dayjs(date);
      const start = formatDateTime(currentDateTime.toDate(), exception.startTime);
      const end = formatDateTime(currentDateTime.toDate(), exception.endTime);
      const isNowBetween = dayjs().isBetween(start, end, "minutes", "[]");
    
      switch (exception.pattern) {
      case 'daily':
        addExceptionSchedule(currentDateTime, isNowBetween, exception, exceptionSchedules);
        break;
    
      case 'weekly':
        const isWithinWeeklyPattern = currentDateTime.isBefore(dayjs(exception.endDate)) && exception.daysOfWeek.includes(currentDateTime.day());
        if (isWithinWeeklyPattern) {
          addExceptionSchedule(currentDateTime, isNowBetween, exception, exceptionSchedules);
        }
        break;
    
      case 'monthly':
        const isWithinMonthlyPattern = currentDateTime.isBefore(dayjs(exception.endDate)) && exception.weekOfMonth.includes(getWeekOfMonth(currentDateTime.toDate()));
        if (isWithinMonthlyPattern) {
          addExceptionSchedule(currentDateTime, isNowBetween, exception, exceptionSchedules);
        }
        break;
    
      default:
        break;
      }
    });


  }
  return exceptionSchedules
}

const generateTimeSlotsV2 = (start: Date, end: Date, duration: number, occupiedSlots: Schedule[] ) => {
  const timeSlots: { start: Date, end: Date }[] = [];
  let clonedStart = dayjs(start);
  while (clonedStart.add(duration, "minute").isBetween(dayjs(), end, "minute", "[]")) {
    const newStart = clonedStart.add(duration, "minute");
    const isOccupiedSlot = isOccupied({ start: clonedStart.toDate(), end: newStart.toDate() }, occupiedSlots);
    if(!isOccupiedSlot) {
      timeSlots.push({ start: clonedStart.toDate(), end: newStart.toDate() });
    }
    clonedStart = newStart;
  }
  return timeSlots;
}
