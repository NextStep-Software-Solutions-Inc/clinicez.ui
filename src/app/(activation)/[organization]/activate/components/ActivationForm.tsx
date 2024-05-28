"use client";

import { assignRolesAction, getRolesAction } from "@actions/user-management.action";
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


const dummyJson: Record<string, string> = {
  firstName: "John",
  lastName: "Doe",
  middleName: "Smith",
}

const activationFormSchema = z.object({
  activationCode: z.string({
    required_error: "Please enter your activation code",
  }).min(6).max(6)
})

export default function ActivationForm() {
  const [activated, setActivated] = useState(false);
  const [json, setJson] = useState(dummyJson);
  const [inputValues, setInputValues] = useState(dummyJson);
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
      if (user?.user?.sub) {
        toast.promise(assignRolesAction(user.user.sub, ["rol_h449rSzvU0pyn1Be"]), {
          success: () => {
            setActivated(true)
            return "User activated successfully"
          },
          loading: "Activating user...",
        })
      }
    })()
  }

  const getActivationCodeAction = async () => {
    toast.promise(delay(5000), {
      success: "Activation code sent to your email",
      loading: "Sending activation code...",
    })
  }

  const migrateAction = async () => {
    toast.promise(delay(5000), {
      success: "User migrated successfully",
      loading: "Migrating user...",
    })
  }
  return (
    <>
      <ConditionalRender condition={!activated}>
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

      <ConditionalRender condition={activated}>
        <form action={migrateAction}>
          <div className="flex gap-5 flex-wrap">
            <div className="flex-grow">
              <Each
                of={Object.entries(dummyJson)}
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
            <div className="prose flex-1">
              <pre className="whitespace-pre-wrap">{JSON.stringify(json, null, 2)}</pre>
            </div>
          </div>
          <ActionButton className="block w-full mt-5">Migrate now</ActionButton>
        </form>
      </ConditionalRender>
    </>
  )

  ;
}


interface ExampleProps {
  value: string;
  dataType: string;
  age: number;
}


