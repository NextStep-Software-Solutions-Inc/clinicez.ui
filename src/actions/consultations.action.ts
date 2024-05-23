"use server";
import { delay } from "@lib/wait";
import consultations from "@public/json/consultations.json"
import consultationNotes from "@public/json/consultation-notes.json" 
import nurseAssessment from "@public/json/nurse-assessment.json" 
import  conversation from "@public/json/conversation.json"
import { consultationRecordSchema } from "../app/(process)/[organization]/consultations/data/schema";
import interventions from "@public/json/interventions.json"
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

export const addInterventionAction = async (data: FormData) => {
  console.log("Adding intervention...", Object.fromEntries(data));
  await delay(3000);
  return true;
}

export const getConsultationNotes = async (id: string) => {
  return consultationNotes
}

export const getNurseAssessment = async (id: string) => {
  return nurseAssessment
}

export const addVitalSignsAction = async (data: FormData) => {
  console.log("Adding vital signs...", Object.fromEntries(data));
  await delay(3000);
  return true;
}

export const updateVitalSignsAction = async (data: FormData) => {
  console.log("Updating vital signs...", Object.fromEntries(data));
  await delay(3000);
  return true;
}

export const updateConsultationNotesAction = async (data: FormData) => {
  console.log("Updating consultation notes...", Object.fromEntries(data));
  await delay(3000);
  return true;
}

export const updateNurseAssessmentAction = async (data: FormData) => {
  console.log("Updating nurse assessment...", Object.fromEntries(data));
  await delay(3000);
  return true;
}

export const getConversationAction = async (id: string) => {
  console.log("Getting conversation...", id);
  return conversation.conversation
}

export const getInterventionsAction = async (id: string) => {
  console.log("Getting interventions...", id);
  return interventions
}