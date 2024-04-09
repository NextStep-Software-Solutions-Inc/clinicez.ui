import { NextResponse } from "next/server";
import fs from "fs/promises";

export const POST = async (req: Request) => {
  const body = await req.json();
  
  console.log(body.step);

  // read the steps.json from public/json
  const stepsJson = await fs.readFile('./public/json/steps.json', 'utf-8');
  const parsed = JSON.parse(stepsJson);

  // update the steps object
  switch (body.step) {
  case "role": {
    parsed[0].completed = true
    break;
  }
  case "plan": {
    parsed[1].completed = true
    break;
  }
  }

  // write back to steps.json
  await fs.writeFile('./public/json/steps.json', JSON.stringify(parsed, null, 2));
    
  return NextResponse.json({
    status: true,
    data: {
      role: "doctor",
      plan: "basic",
      profile: {
        name: "Wave",
        bio: "I am a doctor",
      },
      
    }
  })
}

