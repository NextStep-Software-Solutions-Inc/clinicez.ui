"use server";
import 'server-only'

import { withClerkAuth } from '@middlewares/withClerkAuth';
import { NextRequest, NextResponse } from "next/server";
import { parseObject } from '@lib/utils';
import { getDocumentTypesAction } from '@/actions/document-type.action';

export const GET = withClerkAuth(async (req: NextRequest) => {
  const searchParams = req.nextUrl.searchParams

  const filters = parseObject(Object.fromEntries(searchParams.entries()))
  const documentTypes = await getDocumentTypesAction(filters);

  return NextResponse.json(documentTypes, { status: 200 });
});

