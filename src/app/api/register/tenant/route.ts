import { NextResponse } from "next/server";
import fs from "fs/promises";

export const POST = async (req: Request) => {
  const body = await req.json();
  console.log(body);

  // read the steps.json from public/json
  const stepsJson = await fs.readFile('./public/json/steps.json', 'utf-8');
  const parsed = JSON.parse(stepsJson);

  // update the steps object
  parsed.forEach((step:any )=> {
    if(step.id === 1) {
      step.completed = true
    }
  })
  // write back to steps.json
  await fs.writeFile('./public/json/steps.json', JSON.stringify(parsed, null, 2));
    
  return NextResponse.json({
    message: "Success",
    status: true
  })
}

