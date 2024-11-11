"use server";

import "server-only";
import prismaCommon from "@lib/prisma-common";
import { cache } from "react";

export type GetBookings = Awaited<ReturnType<typeof getBookingsAction>>;
export const getBookingsAction = cache(async (userId: string, type: "upcoming" | "passed" | "all" = "all") => {
  const bookings = await prismaCommon.booking.findMany({
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