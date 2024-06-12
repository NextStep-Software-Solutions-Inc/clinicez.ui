import { getAccessToken, updateSession, withApiAuthRequired } from "@auth0/nextjs-auth0";
import { NextRequest, NextResponse } from "next/server";


const response = new NextResponse()
export const GET = withApiAuthRequired(async (req) => {
    
  const accessToken = await getAccessToken(req, response, {
    refresh: true
  })

  return NextResponse.json(accessToken, response)
})