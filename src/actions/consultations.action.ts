"use server";
import { delay } from "@lib/wait";
import consultations from "@public/json/consultations.json"
import consultationNotes from "@public/json/consultation-notes.json" 
import nurseAssessment from "@public/json/nurse-assessment.json" 
import  conversation from "@public/json/conversation.json"
import vitalSigns from "@public/json/vital-signs.json"
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

export const getConsultationsActions = async () => {
  return structuredClone(z.array(consultationRecordSchema).parse(consultations))
}


export const getConsultationAction = async (id: number) => {
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

export const getNurseAssessment = async (id: number) => {
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



export const updateNurseAssessmentAction = async (data: FormData) => {
  console.log("Updating nurse assessment...", Object.fromEntries(data));
  await delay(3000);
  return true;
}

export const getConversationAction = async (id: number) => {
  console.log("Getting conversation...", id);
  return conversation.conversation
}

export const getInterventionsAction = async (id: number) => {
  console.log("Getting interventions...", id);
  return interventions
}

export const getVitalSignsAction = async (id: number) => {
  console.log("Getting vital signs...", id);
  return vitalSigns
}
