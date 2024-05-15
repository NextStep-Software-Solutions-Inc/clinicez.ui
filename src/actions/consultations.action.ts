"use server";
import { delay } from "@lib/wait";
import consultations from "@public/json/consultations.json"
import { consultationRecordSchema } from "../app/(process)/[organization]/consultations/data/schema";
import { z } from "zod";

export const createConsultationAction = async (data: FormData) => {
  console.log("Creating consultation...");
  await delay(3000);
  return true;
}

export const updateConsultationAction = async (data: FormData) => {
  console.log("Creating consultation...");
  await delay(3000);
  return true;
}

export const getConsultations = async () => {
  return structuredClone(z.array(consultationRecordSchema).parse(consultations))
}


export const getConsultation = async (id: string) => {
  const consultation = consultations.find((consultation) => consultation.id === id)
  if (!consultation) {
    throw new Error("Consultation not found")
  }
  return structuredClone(consultationRecordSchema.parse(consultation))
}