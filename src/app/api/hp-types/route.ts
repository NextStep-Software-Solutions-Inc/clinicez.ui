"use server";
import 'server-only'

import { NextRequest, NextResponse } from "next/server";
import { getHPTypesAction } from '@actions/hp-type.action';
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

    const hpTypes = await getHPTypesAction();
    return NextResponse.json(hpTypes, { status: 200 });
  } catch (error) {
    console.error('Error in hp-types API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};