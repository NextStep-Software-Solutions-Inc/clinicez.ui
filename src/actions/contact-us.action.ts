"use server";

import { sendMail } from "./email.action";

export const sendContactUsMessage = async (data: { name: string, email: string, message: string }) => {
  await sendMail({
    to: process.env.REPLY_TO_EMAIL,
    subject: "Contact Us Message",
    text: `Name: ${data.name}\nEmail: ${data.email}\nMessage: ${data.message}`,
    html: `<p>Name: ${data.name}</p><p>Email: ${data.email}</p><p>Message: ${data.message}</p>`
  })
}