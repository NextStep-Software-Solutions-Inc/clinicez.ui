"use server";

import { delay } from "@lib/wait";
import { AppointmentStatus, appointmentList } from "@public/json/appointment-list";

export const getAppointments = async (type: AppointmentStatus) => {
  // check if type is valid
  if (!Object.keys(appointmentList).includes(type)) {
    throw new Error(`Invalid appointment type: ${type}`);
  }
  const appointment = appointmentList[type];
  return appointment;
}

export const getAppointment = async (id: string) => {
  const appointment = Object.values(appointmentList).flatMap((list) => list).find((item) => item.id === id);
  return appointment;
}

export const sendMsgAction = async(formData: FormData) => {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  console.log(Object.fromEntries(formData));
}


export const acceptAppointmentAction = async (formData: FormData) => {
  console.log("Accepting appointment...");
  await delay(1000);
  return true;
}

export const rejectAppointmentAction = async (formData: FormData) => {
  console.log("Rejecting appointment...", Object.fromEntries(formData));
  await delay(1000);
  return true;
}

export const receiveAppointmentAction = async (formData: FormData) => {
  console.log("Receiving appointment...");
  await delay(1000);
  return true;
}