import { NextResponse } from "next/server";

export const POST = async (req: Request) => {
  const body = await req.json();
  console.log(body);

  return NextResponse.json({
    message: "Success",
    status: true
  })
}

