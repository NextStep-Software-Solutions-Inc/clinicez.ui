"use client";

import BackSubmitAndNext from "@components/SubmitAndNext";
import { toast } from "@components/ui/use-toast";
import { useLocalStorage } from "@hooks/useLocalStorage";
import React, { FormEvent } from "react";

interface ReviewBookingProps {
    nextStep?: () => void;
    prevStep?: () => void;
    isFirstStep?: boolean;
    isLastStep?: boolean;
    setComplete?: (value: boolean) => void;
    startOver?: () => void;
}

export default function ReviewBooking({ nextStep, prevStep, isLastStep, isFirstStep, setComplete, startOver }: ReviewBookingProps) {
  const [bookAppointmentForm, setBookAppointmentForm] = useLocalStorage("book-appointment-form")
  const handleBookAppointment = (e:FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setComplete?.(true)
    toast({
      title: "Appointment booked successfully with the following values:",
      description: <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4"><code className="text-white">{JSON.stringify(bookAppointmentForm, null, 2)}</code></pre>
        
    })
  }
  const reset = async () => {
    await setBookAppointmentForm(Object.keys(bookAppointmentForm as object).reduce((acc: {[key: string]: string}, key) => {
      acc[key] = "";
      return acc;
    }, {}))
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
