"use server";
import 'server-only'
import { withJwtAuth } from '@middlewares/withJwtAuth';

import { NextResponse } from "next/server";
import { getStudentLevelsAction } from '@actions/student-level.action';


export const GET = withJwtAuth(async () => {
  const studentLevel = await getStudentLevelsAction();

  return NextResponse.json(studentLevel, {
    status: 200
  });
});