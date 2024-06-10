"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useParams, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { HealthcareProviderType } from "@prisma/client";
import { useFormState } from "react-dom";
import { cn } from "@lib/utils";

// Components and utilities
import HPBasicInfo from "../../../apply/components/HPBasicInfo";
import HPAddress from "../../../apply/components/HPAddress";
import HPProfessionalInfo from "../../../apply/components/HPProfessionalInfo";
import ActionButton from "@components/ActionButton";
import { Form, FormMessage } from "@components/ui/form";
import { useLocalStorage } from "@hooks/useLocalStorage";
import { upsertNurseAction } from "@actions/nurse.action";
import { upsertDoctorAction } from "@actions/doctor.action";
import { formSchema, ProfileFormType } from "./hp-form.schema"; // Assuming formSchema is moved to a separate file for clarity

const actions = {
  LAB_TECHNICIAN: upsertNurseAction,
  NURSE: upsertNurseAction,
  DOCTOR: upsertDoctorAction,
}

interface IHPFormProps {
  profile?: ProfileFormType
}

export default function HPForm({profile}: IHPFormProps) {
  const params = useParams() as { practitioner: string }
  const [profileId, setProfileId] = React.useState<number | undefined>(profile?.id)
  const searchParams = useSearchParams();
  const practitioner = parseInt(params.practitioner)
  const _type = searchParams.get("_type") as HealthcareProviderType
  const HP_FORM_KEY = `hp-${practitioner}-${_type}-profile`;

  const [hpProfile, setHpProfile] = useLocalStorage<ProfileFormType>(HP_FORM_KEY, profile);
  
  const form = useForm<ProfileFormType>({
    resolver: zodResolver(formSchema),
    defaultValues: hpProfile,
  })
    
  const action = async () => {
    await (form.handleSubmit(async (values: ProfileFormType) => {
      await setHpProfile(values) // save to local storage
      formAction(values)
    })())
  }

  const formHandler = async (_prevState: any, data: ProfileFormType) => {
    const mappedData = {
      title: data.title,
      name: data.name,
      suffix: data.suffix,
      workEmail: data.workEmail,
      workPhone: data.workPhone,
      philosophy: data.philosophy,
      areaOfInterest: data.areaOfInterest,
      experience: data.experience,
  
      languages: data.languages.map((lang) => lang.name),
      specialties: data.specialties.map((lang) => lang.name),
      education: data.education.map((lang) => lang.name),
      certifications: data.certifications.map((lang) => lang.name),
      fields: data.fields.map((lang) => lang.name),
      affiliations: data.affiliations.map((lang) => lang.name),
  
      healthcareProviderId: practitioner,
  
      // dob: format(data.dob, "yyyy-MM-dd"),
      // licenseIssueDate: format(data.licenseIssueDate, "yyyy-MM-dd"),
      // licenseExpiryDate: format(data.licenseExpiryDate, "yyyy-MM-dd"),
    }
    const latestProfile = await actions[_type as keyof typeof actions]({
      where: { id: profileId },
      create: mappedData,
      update: mappedData
    });
    setProfileId(latestProfile.id)
    toast.success("Profile updated successfully.")
    form.reset(data)
    return {
      status: true,
      message: "Profile updated successfully."
    };
  }
  
  const [formState, formAction] = useFormState(formHandler , {
    message: "",
    status: false
  })

  return(
    <Form {...form}>
      <FormMessage><p className={cn(formState.status? "text-green-500": "")}>{formState.message}</p></FormMessage>
      <form action={action} className="prose max-w-full space-y-8 shadow-lg w-full p-8 bg-white rounded-md">
        <h4>Basic Information</h4>
        <HPBasicInfo form={form}/>
        <div>
          <h4>Address</h4>
          <p className="text-sm italic">We respect your privacy. Your address will not be displayed publicly.</p>
          <HPAddress form={form}/>
        </div>
        <div>
          <h4>Professional Information <span className="text-xs italic">(Private)</span></h4>
          <p className="text-sm italic">
            Please ensure that you are providing accurate information for validation. 
            Your information will be verified before your profile is published.
          </p>
          <HPProfessionalInfo form={form}/>
        </div>
        <div className="mt-4">
          {form.formState.isDirty && <ActionButton disabled={!form.formState.isValid}>Save Changes</ActionButton>}
        </div>
      </form>
    </Form>
  );
}
