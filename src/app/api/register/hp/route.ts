import { postData } from "@actions/healthcare-provider";
import { NextResponse } from "next/server";

export const POST = async (req: Request) => {
  const body = await req.json();
  const data = await postData(body.step);
  return NextResponse.json(data)
}

