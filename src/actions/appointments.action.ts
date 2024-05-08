"use server";

import { AppointmentStatus, appointmentList } from "@public/json/appointment-list";

export const getAppointments = async (type: AppointmentStatus) => {
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