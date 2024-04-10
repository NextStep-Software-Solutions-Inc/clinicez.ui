"use server";

import fs from "fs/promises";
import { delay } from "@lib/wait";
import { revalidatePath } from "next/cache";

export const submitRoleAction = async (_prevState: any ,formData: FormData) => {
  const form = Object.fromEntries(formData);
  
  if(!form.role) return {
    message: "You need to select a role.",
    status: false,
  };
  const data = await postData("role")
    
  if(data.status) revalidatePath("/healthcare-provider/register", "page")
  return {
    message: "Role accepted",
    status: true
  };
};

export const submitPlanAction = async (_prevState: any ,formData: FormData) => {
  const form = Object.fromEntries(formData);
  
  if(!form.plan) return {
    message: "You need to select a plan.",
    status: false,
  };

  const data = await postData("plan")
  
  if(data.status) revalidatePath("/healthcare-provider/register", "page")
  return {
    message: "Plan accepted",
    status: true
  };
};


export const postData = async (step: string) => {
  await delay(2000);

  // read the steps.json from public/json
  const stepsJson = await fs.readFile('./public/json/steps.json', 'utf-8');
  const parsed = JSON.parse(stepsJson);

  // update the steps object
  switch (step) {
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
  return {
    status: true,
    data: {
      role: "doctor",
      plan: "basic",
      profile: {
        name: "Wave",
        bio: "I am a doctor",
      },
      
    }
  }
}
