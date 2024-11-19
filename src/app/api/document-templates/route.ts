"use server";
import 'server-only'

import { withJwtAuth } from '@middlewares/withJwtAuth';
import { NextRequest, NextResponse } from "next/server";
import { parseObject } from '@lib/utils';
import { getDocumentTemplatesAction } from '@/actions/document-template.action';

export const GET = withJwtAuth(async (req: NextRequest) => {
  const searchParams = req.nextUrl.searchParams

  const filters = parseObject(Object.fromEntries(searchParams.entries()))
  const documentTemplates = await getDocumentTemplatesAction(filters);

  return NextResponse.json(documentTemplates, { status: 200});
});

