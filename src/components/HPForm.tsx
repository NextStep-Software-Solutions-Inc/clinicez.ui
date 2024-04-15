"use client";

import React, { useEffect } from "react";
import HPBasicInfo from "./HPBasicInfo";
import { Form, FormMessage } from "@components/ui/form";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import HPAddress from "@components/HPAddress";
import HPProfessionalInfo from "./HPProfessionalInfo";
import { useFormState } from "react-dom";
import { submitProfileAction } from "@actions/healthcare-provider";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@lib/utils";
import BackSubmitAndNext from "./SubmitAndNext";
import { useLocalStorage } from "@hooks/useLocalStorage";

export const formSchema = z.object({
  title: z.string().min(2, {
    message: "Title must be at least 2 characters.",
  }),
  firstName: z.string().min(2, {
    message: "First name must be at least 2 characters.",
  }),
  middleName: z.string().optional(),
  lastName: z.string().min(2, {
    message: "Last name must be at least 2 characters.",
  }),
  suffix: z.string().optional(),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  phone: z.string().min(10, {
    message: "Please enter a valid phone number.",
  }),
  dob: z.date(),
  address1: z.string().min(2, {
    message: "Address must be at least 2 characters.",
  }),
  address2: z.string().optional(),
  city: z.string().min(2, {
    message: "City must be at least 2 characters.",
  }),
  state: z.string().min(2, {
    message: "State must be at least 2 characters.",
  }),
  zip: z.string().min(4, {
    message: "Zip code must be at least 5 characters.",
  }),
  country: z.string().min(2, {
    message: "Country must be at least 2 characters.",
  }),
  

  bio: z.string().min(2, {
    message: "Bio must be at least 2 characters.",
  }),
  languages: z.string().min(2, {
    message: "Language must be at least 2 characters.",
  }),
  experience: z.string().min(2, {
    message: "Experience must be at least 2 characters.",
  }),
  specialties: z.string().min(2, {
    message: "Specialty must be at least 2 characters.",
  }),

  licenseNumber: z.string().min(2, {
    message: "License number must be at least 2 characters.",
  }),
  licenseIssueDate: z.date(),
  licenseExpiryDate: z.date(),
  ptrNumber: z.string().min(2, {
    message: "PTR number must be at least 2 characters.",
  }),
  taxNumber: z.string().min(2, {
    message: "Tax number must be at least 2 characters.",
  }),
  fieldOfPractice: z.string().min(2, {
    message: "Field of practice must be at least 2 characters.",
  }),
})
  
const handler = async (_prevState: any, formData: FormData) => {
  const res = await submitProfileAction(_prevState, formData);
  toast("Server says:", {
    action: {
      label: "Close",
      onClick: () => toast.dismiss(),
    },
    description: res.message,
  })
  return res;
}

interface IHPFormProps {
  nextStep?: () => void;
  prevStep?: () => void;
  isFirstStep?: boolean;
  isLastStep?: boolean;
  totalSteps?: number;
}
export default function HPForm({ nextStep, isFirstStep, isLastStep, prevStep,totalSteps}: IHPFormProps) {
  const [applicationData,setApplicationData] = useLocalStorage<z.infer<typeof formSchema>>("hp-application");
  const [formState, formAction] = useFormState(handler , {
    message: "",
    status: false
  })

  useEffect(() => {
    if(formState.status){
      nextStep?.();
    }
  }, [formState.status, nextStep])

  // 1. Define your form.
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ...applicationData, 
      dob: applicationData?.dob? new Date(applicationData?.dob) : new Date(),
      licenseIssueDate: applicationData?.licenseIssueDate? new Date(applicationData?.licenseIssueDate) : new Date(), 
      licenseExpiryDate: applicationData?.licenseExpiryDate? new Date(applicationData?.licenseExpiryDate) : new Date()
    },
  })

  // 2. Define a submit handler.
  const action = async (formData: FormData) => {
    await (form.handleSubmit(async (values: z.infer<typeof formSchema>) => {
      await setApplicationData(values)
      formData.append("dob", format(values.dob, "yyyy-MM-dd"))
      formData.append("licenseIssueDate", format(values.licenseIssueDate, "yyyy-MM-dd"))
      formData.append("licenseExpiryDate", format(values.licenseExpiryDate, "yyyy-MM-dd"))
      formAction(formData)
    })())
    
  }

  return(
    <Form {...form}>
      <FormMessage><p className={cn(formState.status? "text-green-500": "")}>{formState.message}</p></FormMessage>
      <form action={action} className="space-y-8">
        <h4>Basic Information</h4>
        <HPBasicInfo form={form}/>
        <h4>Address</h4>
        <HPAddress form={form}/>
        <h4>Professional Information</h4>
        <HPProfessionalInfo form={form}/>
        <div className="mt-4">
          <BackSubmitAndNext 
            labels={{
              previous: "Back",
              submit: "Save & Continue",
              next: "Next",
            }}
            disabled={{
              submit:!form.formState.isValid,
              previous: isFirstStep,
              next: !isLastStep,
            }}
            actions={{
              previous: prevStep,
            }}
          />
        </div>
      </form>
    </Form>
  );
}
