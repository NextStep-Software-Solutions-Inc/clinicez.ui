"use server";
import 'server-only'

import { NextRequest, NextResponse } from "next/server";
import { getStudentLevelsAction } from '@actions/student-level.action';
import { auth } from '@clerk/nextjs/server';

export const GET = async (req: NextRequest) => {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const studentLevels = await getStudentLevelsAction();
    return NextResponse.json(studentLevels, { status: 200 });
  } catch (error) {
    console.error('Error in student-levels API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};