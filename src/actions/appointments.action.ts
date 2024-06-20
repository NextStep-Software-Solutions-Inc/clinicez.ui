"use server";

import { delay } from "@lib/wait";
import { AppointmentStatus, appointmentList } from "@public/json/appointment-list";
import { getUserAction } from "./user.action";
import 'server-only'

export type AppointmentsCountsType = Awaited<ReturnType<typeof getAppointmentCounts>>;
export const getAppointmentCounts = async () => {
  const appointmentsCounts = {
    all: 0,
    pending: 0,
    accepted: 0,
    declined: 0,
    rejected: 0,
    received: 0,
    routed: 0,
    reschedule: 0,
  }
  appointmentList.forEach((item) => {
    // count each status and increment the count
    appointmentsCounts[item.status]++;
    appointmentsCounts.all++;
  });
  return appointmentsCounts;
}

export const getAppointmentsAction = async (status: AppointmentStatus) => {
  
  // check if type is valid
  // if (!Object.keys(appointmentList).includes(type)) {
  //   throw new Error(`Invalid appointment type: ${type}`);
  // }
  const appointments = (status === "all")? appointmentList: appointmentList.filter((item) => item.status === status);
  const appointmentsWithPatient = await Promise.all(appointments.map(async (appointment) => {
    // get the patient details
    // appointment.patient = await getUserAction(appointment.patientId);
    return {
      ...appointment,
      patient: await getUserAction(appointment.patientId ?? "wala")
    };
  })
  );
  return appointmentsWithPatient;
}

export const getAppointmentAction = async (id: string) => {
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