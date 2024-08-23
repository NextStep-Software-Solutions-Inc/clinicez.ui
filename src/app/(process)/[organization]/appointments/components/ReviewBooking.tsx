"use client";

import { createAppointmentAction } from "@actions/appointments/appointments.action";
import BackSubmitAndNext from "@components/SubmitAndNext";
import React, { FormEvent } from "react";
import { toast } from "sonner";
import { useUser } from "@auth0/nextjs-auth0/client";
import useSound from "use-sound";
import { useAtom } from "jotai";
import { bookAppointmentAtom } from "@state/book-appointment";
import { useParams } from "next/navigation";
import { uploadMediaAction } from "@actions/blob.action";
import { mutate } from "swr";
import dayjs from "dayjs";

interface ReviewBookingProps {
    nextStep?: () => void;
    prevStep?: () => void;
    isFirstStep?: boolean;
    isLastStep?: boolean;
    setComplete?: (value: boolean) => void;
    startOver?: () => void;
}

export default function ReviewBooking({ nextStep, prevStep, isLastStep, isFirstStep, setComplete, startOver }: ReviewBookingProps) {
  const [bookAppointmentForm, setBookAppointmentForm] = useAtom(bookAppointmentAtom);
  const withoutAvailabilities = {...bookAppointmentForm, availabilities: null}
  const params = useParams<{organization: string}>()
  const [playSuccess] = useSound("/audio/success-1.mp3");
  const user = useUser()
  const userId = user.user?.sub

  const handleBookAppointment = async (e:FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if(!params.organization) {
      toast.error("Organization is required")
      return ;
    }
    if(!user.user?.email) {
      toast.error("User email is missing")
      return;
    }
    if (!bookAppointmentForm.appointmentTypeId) {
      toast.error("Appointment type is required")
      return;
    }
    if (!bookAppointmentForm.serviceId) {
      toast.error("Service is required")
      return;
    }
    if (!bookAppointmentForm.hpEmail) {
      toast.error("Doctor is required")
      return;
    }
    if (!bookAppointmentForm.selectedTimeSlot?.start || !bookAppointmentForm.selectedTimeSlot?.end) {
      toast.error("Time slot is required")
      return;
    }
    if(!bookAppointmentForm.preferredDate) {
      toast.error("Preferred date is required")
      return;
    }

    if(!userId) {
      return  toast.error("User not found")
    }

    let attachmentUrls:{url: string}[] = []
    toast.loading("Uploading attachments...")
    for (const file of bookAppointmentForm.attachments ?? []) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }
      const formData = new FormData();
      formData.append("media", file);
      formData.append("directory", `${userId}/appointment/attachments`);
      const url = await uploadMediaAction(formData);
      attachmentUrls.push(url);
    }
    toast.dismiss();

    toast.promise(createAppointmentAction({
      orgUid: params.organization,
      subject: bookAppointmentForm.subject ?? "Appointment Request",
      complaint: bookAppointmentForm.chiefComplaint,
      modeId: 2,
      typeId: bookAppointmentForm.appointmentTypeId,
      serviceId: bookAppointmentForm.serviceId,
      requesters: [user.user?.email],
      attachments: attachmentUrls.map(url => url.url),
      hpEmail: bookAppointmentForm.hpEmail,
      schedule: {
        timeStart: bookAppointmentForm.selectedTimeSlot?.start,
        timeEnd: bookAppointmentForm.selectedTimeSlot?.end,
        date: dayjs(bookAppointmentForm.preferredDate).endOf("day").toDate(),
      }
    }), {
      loading: "Creating appointment...",
      success: () => {
        setComplete?.(true);
        playSuccess();
        mutate((key) =>  typeof key === 'string' && key.startsWith(`/api/organizations/${params.organization}/appointments`), undefined, {
          revalidate:true
        })
        return "Appointment created successfully";
      },
      error: "Failed to create appointment"
    })
  }

  const reset = async () => {
    setBookAppointmentForm({})
    startOver?.();
  }

  return (
    <div className="prose max-w-full shadow-lg w-full p-8 bg-white rounded-md">
      <h2>Review details</h2>

      <form onSubmit={handleBookAppointment} >
        <pre className="my-10 rounded-md bg-slate-950 p-5"><code className="text-white">{JSON.stringify(withoutAvailabilities, null, 2)}</code></pre>
        <BackSubmitAndNext
          labels={{
            submit: "Book Appointment",
            previous: "Back",
            next: "Start Over"
      
          }}
          disabled={{
            previous: isFirstStep,
          }}
          actions={{
            next: isLastStep? reset : nextStep,
            previous: prevStep,
          }}
        />
      </form>
    </div>
  );
}
