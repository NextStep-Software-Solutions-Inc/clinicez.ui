"use server";
import 'server-only'

import { NextRequest, NextResponse } from "next/server";
import { withClerkAuth } from '@middlewares/withClerkAuth';
import { getAppointmentTabsAction } from '@actions/appointment-tab.action';


export const GET = withClerkAuth(async (req: NextRequest) => {
  const searchParams = req.nextUrl.searchParams
  const appointmentTabs = await getAppointmentTabsAction();

  return NextResponse.json(appointmentTabs,  {status: 200});
});