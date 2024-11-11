"use server";
import 'server-only'

import { NextRequest, NextResponse } from "next/server";
import { withJwtAuth } from '@middlewares/withJwtAuth';
import { getNoteTemplatesAction } from '@actions/note-template.action';

export const GET = withJwtAuth(async (req: NextRequest) => {
  const searchParams = req.nextUrl.searchParams

  const noteTemplates = await getNoteTemplatesAction();
  return NextResponse.json(noteTemplates, { status: 200 });
});