"use client";

import { getPatient } from "@actions/hims-migration.action";
import { updateUserAction } from "@actions/user.action";
import { useUser } from "@auth0/nextjs-auth0/client";
import ActionButton from "@components/ActionButton";
import { Button } from "@components/ui/button";
import { Checkbox } from "@components/ui/checkbox";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@components/ui/form";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { Separator } from "@components/ui/separator";
import ConditionalRender from "@components/utils/ConditionalRender";
import Each from "@components/utils/Each";
import { zodResolver } from "@hookform/resolvers/zod";
import { delay } from "@lib/wait";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";


const activationFormSchema = z.object({
  activationCode: z.string({
    required_error: "Please enter your activation code",
  }).min(6).max(6)
})

export default function ActivationForm() {
  const [ready, setReady] = useState(false);
  const [json, setJson] = useState<Record<string, any>>({});
  const [inputValues, setInputValues] = useState<Record<string, any>>({});
  const user = useUser()
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

  const action = async (formData: FormData) => {
    form.handleSubmit(async (data) => {
      if (!user?.user?.sub || !user?.user?.email) {
        toast.error("You must be logged in to activate a user")
        return;
      }

      toast.promise(getPatient(user.user.email), {
        success: (data) => {
          console.log(data)
          setReady(true)
          setInputValues(data as Record<string, any>)
          return "Users data found!"
        },
        loading: "Looking the email from the database...",
      })

      // toast.promise(assignRolesAction(user.user.sub, ["rol_b6qG22YUOZdfqb1T"]), {
      //   success: () => {
      //     setReady(true)
      //     return "User ready successfully"
      //   },
      //   loading: "Activating user...",
      // })
    })()
  }

  const getActivationCodeAction = async () => {
    toast.promise(delay(5000), {
      success: "Activation code sent to your email",
      loading: "Sending activation code...",
    })
  }

  const migrateAction = async () => {

    if (!user?.user?.sub) {
      toast.error("You must be logged in to migrate a user")
      return;
    }
    toast.promise(updateUserAction(user.user?.sub, {
      email: json.email,
      firstName: json.first_name,
      middleName: json.middle_name,
      lastName: json.last_name,
      dob: json.dob,
      religion: json.religion,
      nationality: json.nationality,
      telephone: json.tel_no,
      mobile: json.mobile,
      picture: `https://hims.ustp.edu.ph/apis/storage/${json.picture}`,

    }), {
      success: "User's data migrated successfully",
      loading: "Migrating user's data...",
    })
  }
  return (
    <>
      <ConditionalRender condition={!ready}>
        <div className="max-w-md mx-auto">
          <Form {...form}>
            <form action={action} className="space-y-6">
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
                <Button formAction={getActivationCodeAction} variant="link" className="text-sm">
                  Get Activation Code
                </Button>
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
