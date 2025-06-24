"use server";

import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export const sendMail = async (payload: Pick<sgMail.MailDataRequired, "text" | "html" | "to" | "subject">) => {
  const msg:sgMail.MailDataRequired = {
    from: {
      email: process.env.MAIL_FROM_EMAIL!,
      name: process.env.MAIL_FROM_NAME!
    },
    subject: '',
    text: '',
    html: '',
    ...payload
  }

  await sgMail.send(msg)
  return true
}


