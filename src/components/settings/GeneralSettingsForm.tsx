"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@components/ui/button"

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@components/ui/form"
import { Input } from "@components/ui/input"

import {toast} from "sonner"
import { useUser } from "@auth0/nextjs-auth0/client"
import { Check } from "lucide-react"
import dayjs from "@lib/day-utils";
import { resendEmailVerificationAction } from "@/actions/users/user-management.action"
import { useState } from "react"


const accountFormSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  isEmailVerified: z.boolean().optional(),
  lastUpdated: z.date().nullable(),
})

type GeneraSettingsFormValues = z.infer<typeof accountFormSchema>

export default function GeneralSettingsForm() {
  
  const { user } = useUser()

  const [isVerifying, setIsVerifying] = useState(false);

  const handleResendEmailVerification = () => {
    if (!user?.sub) {
      return alert("Warning user is unknown!");
    }
    
    setIsVerifying(true);
    try {
      toast.promise(resendEmailVerificationAction(user.sub), {
        loading: "Sending email verification",
        success: "Email verification sent.",
        error: "Failed to send verification."
      });
    } finally {
      setIsVerifying(true);
    }
  }

  const form = useForm<GeneraSettingsFormValues>({
    resolver: zodResolver(accountFormSchema),
    values: {
      id: user?.sub || "",
      email: user?.email || "",
      name: user?.name || "",
      isEmailVerified: user?.email_verified || false,
      lastUpdated: dayjs(user?.updated_at).toDate(),
    }
  })

  function onSubmit(data: GeneraSettingsFormValues) {
    toast("You submitted the following values")
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          disabled
          control={form.control}
          name="id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>User ID</FormLabel>
              <FormControl>
                <Input placeholder="Your name" {...field}  readOnly/>
              </FormControl>
              <FormDescription>
                This is your unique ID.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          disabled
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Your name" {...field} />
              </FormControl>
              <FormDescription>
                This is the name that is displayed on your profile
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
       
        <FormField
          disabled
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <div className="flex w-full max-w-sm items-center space-x-2">
                  <Input placeholder="Your email" {...field} />
                  <Button type="button" onClick={handleResendEmailVerification} disabled={form.watch("isEmailVerified") || isVerifying}>{form.watch("isEmailVerified") ? "Verified": "Verify"}</Button>
                </div>
              </FormControl>
              <FormDescription>
                This is the email that is used to login.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Display last updated */}
        <div className="flex items-center space-x-2">
          <Check className="h-5 w-5 text-green-500"/>
          <span>Last updated on {dayjs(form.getValues("lastUpdated")).format("DD/MM/YYYY")}</span>
        </div>
      </form>
    </Form>
  )
}
