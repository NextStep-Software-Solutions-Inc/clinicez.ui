"use client";

import { createAppointmentAction } from "@actions/appointments/appointments.action";
import BackSubmitAndNext from "@components/SubmitAndNext";
import React, { FormEvent } from "react";
import { toast } from "sonner";
import { useUser } from "@auth0/nextjs-auth0/client";
import useSound from "use-sound";
import { useOrgAppointments } from "@hooks/useAppointment";
import { useAtom } from "jotai";
import { bookAppointmentAtom } from "@state/book-appointment";
import { useParams } from "next/navigation";

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
  const params = useParams<{organization: string}>()
  const [playSuccess] = useSound("/audio/success-1.mp3");
  const { mutate } = useOrgAppointments({ orgId: bookAppointmentForm.orgUid ?? ""})
  const user = useUser()

  const handleBookAppointment = (e:FormEvent<HTMLFormElement>) => {
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

    toast.promise(createAppointmentAction({
      orgUid: params.organization,
      subject: bookAppointmentForm.subject ?? "Appointment Request",
      complaint: bookAppointmentForm.chiefComplaint,
      modeId: 2,
      typeId: bookAppointmentForm.appointmentTypeId,
      requesters: [user.user?.email]
    }), {
      loading: "Creating appointment...",
      success: () => {
        setComplete?.(true);
        playSuccess();
        mutate();
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
        <pre className="my-10 rounded-md bg-slate-950 p-5"><code className="text-white">{JSON.stringify(bookAppointmentForm, null, 2)}</code></pre>
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
