"use server";
import 'server-only'

import { NextRequest, NextResponse } from "next/server";
import { withJwtAuth } from '@middlewares/withJwtAuth';
import { getNoteTemplateAction } from '@actions/note-template.action';

export const GET = withJwtAuth(async (req: NextRequest, { params }: {
  params: { noteTemplateName: string }
}) => {
  const { noteTemplateName } = params;
  const searchParams = req.nextUrl.searchParams
  const noteTemplate = await getNoteTemplateAction(noteTemplateName);
  return NextResponse.json(noteTemplate, { status: 200 });
});