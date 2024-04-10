"use server";

import { revalidatePath } from "next/cache";
import { postData } from "../app/api/register/hp/route";

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