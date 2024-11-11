"use server";
import 'server-only'

import { NextRequest, NextResponse } from "next/server";
import { withJwtAuth } from '@middlewares/withJwtAuth';
import { getAppointmentTabsAction } from '@actions/appointment-tab.action';


export const GET = withJwtAuth(async (req: NextRequest) => {
  const searchParams = req.nextUrl.searchParams
  const appointmentTabs = await getAppointmentTabsAction();

  return NextResponse.json(appointmentTabs,  {status: 200});
});