"use server";
import { delay } from "@lib/wait";

export const createConsultationAction = async (data: FormData) => {
  console.log("Creating consultation...");
  await delay(3000);
  return true;
}