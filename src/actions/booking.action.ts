"use server";

import "server-only";
import prisma from "@lib/prisma";
import { cache } from "react";

export type GetBookings = Awaited<ReturnType<typeof getBookingsAction>>;
export const getBookingsAction = cache(async (userId: string, type: "upcoming" | "passed" | "all" = "all") => {
  const bookings = await prisma.booking.findMany({
    where: {
      startDateTime: {
        ...(type === "all" ? {} : type === "upcoming" ? { lte: new Date() } : { gte: new Date() })
      },
      BookedFor: {
        userId
      }
    }
  })
  return bookings;
});