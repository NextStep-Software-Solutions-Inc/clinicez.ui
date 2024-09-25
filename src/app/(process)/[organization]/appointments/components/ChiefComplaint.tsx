"use client";

import BackSubmitAndNext from "@components/SubmitAndNext";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@components/ui/form";
import { Input } from "@components/ui/input";
import { Textarea } from "@components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { bookAppointmentAtom } from "@state/book-appointment";
import { useAtom } from "jotai";
import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const chiefComplaintFormSchema = z.object({
  subject: z.string({
    required_error: "You need to enter a subject.",
    invalid_type_error: "Invalid subject",
  }).trim().min(3, "Subject is too short"), 
  chiefComplaint: z.string({
    required_error: "You need to enter a chief complaint.",
    invalid_type_error: "Invalid chief complaint",
  }).trim().min(20, "Chief complaint is too short"),
})

interface ChiefComplaintProps {
    nextStep?: () => void;
    prevStep?: () => void;
    isFirstStep?: boolean;
    isLastStep?: boolean;
}

export default function ChiefComplaint({ nextStep, prevStep, isLastStep, isFirstStep }: ChiefComplaintProps) {
  const [bookAppointmentForm, setBookAppointmentForm] = useAtom(bookAppointmentAtom)

  const form = useForm<z.infer<typeof chiefComplaintFormSchema>>({
    resolver: zodResolver(chiefComplaintFormSchema),
    defaultValues: {
      subject: bookAppointmentForm.subject ?? "",
      chiefComplaint: bookAppointmentForm.chiefComplaint ?? "",
    },
    mode: "onChange"
  })

  const onSubmit = async (data: z.infer<typeof chiefComplaintFormSchema>) => {
    setBookAppointmentForm((prev) => ({...prev, ...data}))
    nextStep?.();
  }
  
  return (
    
    <Form {...form}>
      <div className="prose max-w-full shadow-lg w-full p-8 bg-white rounded-md">
        <h2>Chief Complaint Form</h2>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="subject"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Subject</FormLabel>
                <FormControl>
                  <Input placeholder="Subject here..." {...field} />
                </FormControl>
                <FormDescription>
                 What is your complaint all about?
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="chiefComplaint"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Message</FormLabel>
                <FormControl>
                  <Textarea placeholder="You complaint here..." {...field} />
                </FormControl>
                <FormDescription>
                    Briefly describe your complaint. Mention the symptoms, the pain, the medication, the allergies, etc.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="mt-5">
            <BackSubmitAndNext
              labels={{
                submit: "Save & Continue",
              }}
              disabled={{
                next: isLastStep || true,
                previous: isFirstStep,
                submit:!form.formState.isValid,
              }}
              actions={{
                previous: prevStep,
                next: nextStep,
              
              }}
            />
          </div>
        </form>
      </div>
    </Form>
  );
}
