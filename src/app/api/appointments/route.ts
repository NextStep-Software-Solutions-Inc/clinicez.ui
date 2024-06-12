"use server";

import { getAppointmentsAction } from "@actions/appointments.action";
import { AppointmentStatus } from "@public/json/appointment-list";
import { NextRequest, NextResponse } from "next/server";


export const GET = async (req: NextRequest) => {
  const type = (req.nextUrl.searchParams.get("_type") ?? "all") as AppointmentStatus
  const appointments = await getAppointmentsAction(type)
  return NextResponse.json(appointments);
}