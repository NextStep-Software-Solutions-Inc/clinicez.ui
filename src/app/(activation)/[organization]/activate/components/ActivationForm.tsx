"use client";

import { createActivationCodeAction, verifyActivationCodeAction } from "@actions/activation.action";
import { sendActivationCodeAction, getPatientAction, startMigrationTransactionAction } from "@actions/hims-migration.action";
import { updateUserAction } from "@actions/user.action";
import { useUser } from "@auth0/nextjs-auth0/client";
import ActionButton from "@components/ActionButton";
import { Checkbox } from "@components/ui/checkbox";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@components/ui/form";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { Separator } from "@components/ui/separator";
import ConditionalRender from "@components/utils/ConditionalRender";
import Each from "@components/utils/Each";
import { zodResolver } from "@hookform/resolvers/zod";
import { BloodType, CivilStatus, Gender } from "@prisma/common/client";
import { useParams } from "next/navigation";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";


const activationFormSchema = z.object({
  activationCode: z.string({
    required_error: "Please enter your activation code",
  }).min(6)
})

export default function ActivationForm() {
  const [ready, setReady] = useState(false);
  const [json, setJson] = useState<Record<string, any>>({});
  const [inputValues, setInputValues] = useState<Record<string, any>>({});
  const user = useUser()
  const params = useParams();
  const orgId = params.organization as string;
  const email = user?.user?.email;
  const userId = user?.user?.sub;

  const form = useForm<z.infer<typeof activationFormSchema>>({
    resolver: zodResolver(activationFormSchema),
  })
  const handleCheckboxChange = (key: string, checked: boolean) => {
    if (checked) {
      setJson({ ...json, [key]: inputValues[key] });
    } else {
      const { [key]: _, ...rest } = json;
      setJson(rest);
    }
  };

  const handleInputChange = (key: string, value: string) => {
    setInputValues({ ...inputValues, [key]: value });
    if (json.hasOwnProperty(key)) {
      setJson({ ...json, [key]: value });
    }
  };

  const activate = async () => {
    form.handleSubmit(async (data) => {
      if (!email) {
        toast.error("You must be logged in to activate a user")
        return;
      }

      toast.promise(verifyActivationCodeAction(email, data.activationCode), {
        loading: "Verifying activation code...",
        success: () => {
          toast.promise(getPatientAction(email), {
            success: (data) => {
              setReady(true)
              setInputValues(data as Record<string, any>)
              return "Users data found!"
            },
            loading: "Finding your email in the old server...",
            error: (err) => {
              return `User not found in the old server. Error: ${err}`
            }
          })
          return "Activation code verified"
        },
        error: "Invalid activation code"  
      })

    })()
  }

  const getActivationCode = async () => {

    if (!email) {
      toast.error("You must be logged in to get an activation code")
      return;
    }

    toast.promise(createActivationCodeAction(email), {
      loading: "Creating activation code...",
      success: (code) => {
        if(!code) return toast.error("Failed to generate activation code")
        toast.promise(sendActivationCodeAction(email, code),  {
          success: "Activation code sent to your email",
          loading: "Sending activation code...",
          error: "Failed to send activation code"
        })
        return "Activation code generated. Valid for 5 minutes."
      },
      error: (error) => `Error generating activation code. Please try again later. Error: ${error}`
    })
  }

  const migrateAction = async () => {

    if (!userId) {
      toast.error("You must be logged in to migrate a user")
      return;
    }
    const gender = json?.gender?.toUpperCase() in Gender ? json?.gender?.toUpperCase() : null
    const bloodType = json?.blood_type?.toUpperCase() in BloodType ? json?.blood_type?.toUpperCase() : null
    const civilStatus = json?.civil_status?.toUpperCase() in CivilStatus ? json?.civil_status?.toUpperCase() : null

    toast.promise(startMigrationTransactionAction({
      userId, 
      orgId,
      data: {
        email: json.email,
        firstName: json.first_name,
        middleName: json.middle_name,
        lastName: json.last_name,
        dob: json.dob,
        religion: json.religion,
        nationality: json.nationality,
        telephone: json.tel_no,
        mobile: json.mobile,
  
        bloodType,
        civilStatus,
        gender,
  
        picture: `https://hims.ustp.edu.ph/apis/storage/${json.picture}`,
      }
    }), {
      success: "User's data migrated successfully",
      loading: "Migrating user's data...",
    })
  }
  return (
    <>
      <ConditionalRender condition={!ready}>
        <div className="max-w-md">
          <Form {...form}>
            <form action={activate} className="space-y-6">
              <FormField
                control={form.control}
                name="activationCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Activation Code</FormLabel>
                    <FormControl>
                      <Input placeholder="xxxxx" {...field} />
                    </FormControl>
                    <FormDescription>
                    This is the code that was sent to your email.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex items-center h-6 space-x-4">
                <ActionButton disabled={!form.formState.isValid}>
                  Activate
                </ActionButton>
                <Separator orientation="vertical"/> 
                <ActionButton formAction={getActivationCode} variant="link" className="text-sm">
                  Get Activation Code
                </ActionButton>
              </div>
            </form>
          </Form>
        
        </div>
      </ConditionalRender>

      <ConditionalRender condition={ready}>
        <form action={migrateAction}>
          <div className="flex gap-5 flex-wrap">
            <div className="flex-grow overflow-y-scroll h-[50rem]">
              <Each
                of={Object.entries(inputValues)}
                render={([key]) => (
                  <div className="space-y-2 flex items-center gap-2">
                    <Checkbox 
                      className="self-center"
                      checked={json.hasOwnProperty(key)}
                      onCheckedChange={(e) => handleCheckboxChange(key, !!e)}
                    />
                    <Label>{key}:</Label>

                    <Input
                      type="text"
                      value={inputValues[key] || ''}
                      onChange={(e) => handleInputChange(key, e.target.value)}
                    />
                  </div>
                )}
              />
            
            </div>
            <ConditionalRender condition={Object.keys(json).length > 0}>
              <div className="prose flex-1 overflow-auto h-[50rem]">
                <pre className="whitespace-pre-wrap">{JSON.stringify(json, null, 2)}</pre>
              </div>
            </ConditionalRender>
          </div>
          <ActionButton className="block w-full mt-5">Migrate now</ActionButton>
        </form>
      </ConditionalRender>
    </>
  )

  ;
}
