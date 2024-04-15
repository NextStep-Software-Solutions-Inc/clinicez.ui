import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";

export const GET = async (req: NextRequest ) => {
    
  // read the steps.json from public/json
  const stepsJson = await fs.readFile('./public/json/steps.json', 'utf-8');
  const parsed = JSON.parse(stepsJson);
  const data = {
    steps: parsed,
    state: {
      role: "doctor",
      plan: "basic",
      profile: {
        name: "Wave",
        bio: "I am a doctor",
      },
    }
  }
  return NextResponse.json(data, {status: 200})
}
