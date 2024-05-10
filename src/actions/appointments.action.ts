"use server";

import { delay } from "@lib/wait";
import { AppointmentStatus, appointmentList } from "@public/json/appointment-list";

export type AppointmentsCountsType = Awaited<ReturnType<typeof getAppointmentCounts>>;
export const getAppointmentCounts = async () => {
  const appointmentsCounts = {
    pending: 0,
    accepted: 0,
    rejected: 0,
    received: 0,
    routed: 0,
    reschedule: 0,
  }
  appointmentList.forEach((item) => {
    // count each status and increment the count
    appointmentsCounts[item.status]++;
  });
  return appointmentsCounts;
}

export const getAppointments = async (type: AppointmentStatus) => {
  // check if type is valid
  // if (!Object.keys(appointmentList).includes(type)) {
  //   throw new Error(`Invalid appointment type: ${type}`);
  // }
  const appointment = appointmentList.filter((item) => item.status === type);
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

export const assignAppointmentAction = async (formData: FormData) => {
  console.log("Assigning appointment...", Object.fromEntries(formData));
  await delay(1000);
  return true;
}

export const rescheduleAppointmentAction = async (formData: FormData) => {
  console.log("Reschedule appointment...", Object.fromEntries(formData));
  await delay(1000);
  return true;
}