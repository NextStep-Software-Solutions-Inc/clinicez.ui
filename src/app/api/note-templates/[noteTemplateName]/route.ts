"use server";
import 'server-only'

import { NextRequest, NextResponse } from "next/server";
import { withClerkAuth } from '@middlewares/withClerkAuth';
import { getNoteTemplateAction } from '@actions/note-template.action';

export const GET = withClerkAuth(async (req: NextRequest, { params }: {
  params: Promise<{ noteTemplateName: string }>
}) => {
  const { noteTemplateName } = await params;
  const searchParams = req.nextUrl.searchParams
  const noteTemplate = await getNoteTemplateAction(noteTemplateName);
  return NextResponse.json(noteTemplate, { status: 200 });
});