"use server";
import 'server-only'

import { NextRequest, NextResponse } from "next/server";
import { withClerkAuth } from '@middlewares/withClerkAuth';
import { getNoteTemplatesAction } from '@actions/note-template.action';

export const GET = withClerkAuth(async (req: NextRequest) => {
  const searchParams = req.nextUrl.searchParams

  const noteTemplates = await getNoteTemplatesAction();
  return NextResponse.json(noteTemplates, { status: 200 });
});