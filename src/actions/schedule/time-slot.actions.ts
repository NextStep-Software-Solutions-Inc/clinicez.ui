"use server";

import dayjs, {combineDateTime, localDateTimeToUtcDateTime, utcDateTimeToLocalDateTime } from "@lib/day-utils";
import prisma from "@lib/prisma";
import { getHPAppointmentsSchedule, GetUserSchedules, getUserSchedulesAction } from "./user-schedule.action";
import { eachDayOfInterval, getWeekOfMonth } from "date-fns";
import { cache } from "react";
import { getCachedSession } from "../session.action";

type GenerateTimeSlotsArgs = {
  userId: string, 
  hpId: number,
  serviceId:number, 
  appointmentTypeId:number, 
}
interface Availability {
  date: Date;
  status: boolean;
  timeSlots: { start: Date, end: Date }[];
}
const TIME_ALLOWANCE = 30

export type GetUserTimeSlots = Awaited<ReturnType<typeof getUserTimeSlotsAction>>;
export const getUserTimeSlotsAction = cache(async ({serviceId, userId, hpId}: GenerateTimeSlotsArgs) => {
  let message = "Unable to generate time slots";
  try {
    const session = await getCachedSession()
    if(!session) throw new Error("User not authenticated.")

    const [serviceAttribute, userSchedules, appointmentSchedules] = await Promise.all([
      prisma.serviceAttribute.findUnique({
        where: {
          serviceId: serviceId
        }
      }),
      getUserSchedulesAction(userId),
      getHPAppointmentsSchedule(hpId)
    ])
    
    const totalDuration = (serviceAttribute?.duration ?? 0) + (serviceAttribute?.durationPadding ?? 0)
    if(totalDuration <= 0) throw new Error("Service attribute duration is invalid, value must be greater than 0")
  
    const baseSchedule = (userSchedules?.data ?? []).find(schedule => schedule.type === "base")
    if (!baseSchedule) throw new Error("Healthcare provider base schedule not found")
    
    const exceptionSchedules = (userSchedules?.data ?? []).filter(s => s.type === "exception")
    const defaultDateTime = dayjs().startOf("day").toDate()
    const startDate = baseSchedule.startDate  ?? defaultDateTime 
    const endDate = baseSchedule.endDate ?? defaultDateTime
    const isRecurring = baseSchedule.isRecurring 
    const recurringPattern = baseSchedule.pattern 
    const weeksOfMonth = baseSchedule.weekOfMonth  ?? []
    
    const checkAvailability = (date: Date, schedule: NonNullable<GetUserSchedules["data"]>[number]): boolean => {
      const currentDateTime = dayjs(date);
      const end = combineDateTime(currentDateTime.toDate(), schedule?.endTime);
    
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
    }

    const allDates = eachDayOfInterval({ start: startDate, end: endDate })
    const availability: Availability[] = allDates.map(date => {
      const currentDateTime = dayjs(date);
      const isAvailable = checkAvailability(date, baseSchedule);
      
      const start = new Date(combineDateTime(date, baseSchedule?.startTime));
      const end = new Date(combineDateTime(date, baseSchedule?.endTime));
   
      const exceptionSlots = generateExceptionSlots(exceptionSchedules)
    
      const bookedTimeSlots = (appointmentSchedules?.data ?? [])
        .filter(a => a.AppointmentAttribute && (a.AppointmentAttribute.date || a.AppointmentAttribute.timeEnd || a.AppointmentAttribute.timeStart))
        .map(appointment => {
          return {
            dateStart: dayjs(appointment.AppointmentAttribute!.date).toDate()!,
            dateEnd: dayjs(appointment.AppointmentAttribute!.date).toDate()!,
            timeStart: appointment.AppointmentAttribute!.timeStart!,
            timeEnd: appointment.AppointmentAttribute!.timeEnd!
          }
        });
      const timeSlots = isAvailable ? generateTimeSlotsV2(start, end, totalDuration, [...bookedTimeSlots, ...exceptionSlots]) : [];
      return {
        date: currentDateTime.toDate(),
        status: isAvailable && !!timeSlots.length,
        timeSlots
      };
    });

    return { status: true, message: "Time slots generated", data: availability }
  } catch (error) {
    console.error(`Error while fetching user schedules: ${error}`);
    message = "Unable to generate time slots";
    if(error instanceof Error) message = error.message;
    return { status: false, message, data: [] }
  }
})

type Schedule = {
  dateStart: Date;
  dateEnd: Date;
  timeStart: string;
  timeEnd: string;
}
const isOccupied = (timeSlot: { start: Date, end: Date }, schedules: Schedule[], ): boolean => {
  return schedules.some(schedule => {
    if(!schedule.timeStart || !schedule.timeEnd) {
      throw new Error("Invalid schedule time");
    }
    
    const start = combineDateTime(dayjs(schedule.dateStart).startOf("day").toDate(), schedule.timeStart);
    const end = combineDateTime(dayjs(schedule.dateEnd).startOf("day").toDate(), schedule?.timeEnd);

    return dayjs(timeSlot.start).isBetween(start, end, "minutes", "[)") || dayjs(timeSlot.end).isBetween(start, end, "minutes", "(]");
  });
}

const generateExceptionSlots = (exceptions: NonNullable<GetUserSchedules["data"]>): Schedule[] => {
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
    function addExceptionSchedule(start: Date, end: Date,  isNowBetween: boolean) {
      const now = dayjs();
      exceptionSchedules.push({
        dateStart: isNowBetween ? now.toDate() : start,
        dateEnd: end,
        timeStart: isNowBetween ? now.toDate().toISOString().split("T")[1] : start.toISOString().split("T")[1],
        timeEnd: end.toISOString().split("T")[1]
      });
    }
    const dateRange = eachDayOfInterval({ start: exception.startDate, end: exception.endDate });
    dateRange.forEach(date => {
      const currentDateTime = dayjs(date);
      
      const start = new Date(combineDateTime(currentDateTime.toDate(), exception.startTime));
      const end = new Date(combineDateTime(currentDateTime.toDate(), exception.endTime));
   
      const isNowBetween = dayjs().isBetween(start, end, "minutes", "[]");
      
      switch (exception.pattern) {
      case 'daily':
        addExceptionSchedule(start, end, isNowBetween);
        break;
    
      case 'weekly':
        const isWithinWeeklyPattern = currentDateTime.isBefore(dayjs(exception.endDate)) && exception.daysOfWeek.includes(currentDateTime.day());
        if (isWithinWeeklyPattern) {
          addExceptionSchedule(start, end, isNowBetween);
        }
        break;
    
      case 'monthly':
        const isWithinMonthlyPattern = currentDateTime.isBefore(dayjs(exception.endDate)) && exception.weekOfMonth.includes(getWeekOfMonth(currentDateTime.toDate()));
        if (isWithinMonthlyPattern) {
          addExceptionSchedule(start, end, isNowBetween);
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
  let clonedStart = dayjs().isBetween(start, end, "minutes", "[]")? dayjs().add(TIME_ALLOWANCE, "minutes"): dayjs(start);
  while (clonedStart.add(duration, "minute").isBetween(clonedStart, end, "minute", "[]")) {
    const newStart = clonedStart.add(duration, "minute");
    const isOccupiedSlot = isOccupied({ start: clonedStart.toDate(), end: newStart.toDate() }, occupiedSlots);
    if(!isOccupiedSlot) {
      timeSlots.push({ start: clonedStart.toDate(), end: newStart.toDate() });
    }
    clonedStart = newStart;
  }
  return timeSlots;
}
