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
import dayjs from "dayjs"
import { Check } from "lucide-react"
import { Checkbox } from "@components/ui/checkbox"

const accountFormSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  nickname: z.string().optional(),
  isEmailVerified: z.boolean().optional(),
  picture: z.string().optional(),
  lastUpdated: z.date().nullable(),

})

type GeneraSettingsFormValues = z.infer<typeof accountFormSchema>


export default function GeneralSettingsForm() {
  
  const { user } = useUser()


  const form = useForm<GeneraSettingsFormValues>({
    resolver: zodResolver(accountFormSchema),
    values: {
      id: user?.sub || "",
      email: user?.email || "",
      name: user?.name || "",
      nickname: user?.nickname || "",
      isEmailVerified: user?.email_verified || false,
      lastUpdated: dayjs(user?.updated_at).toDate(),
      picture: user?.picture || undefined,
    }
  })

  function onSubmit(data: GeneraSettingsFormValues) {
    toast("You submitted the following values")
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>User ID</FormLabel>
              <FormControl>
                <Input placeholder="Your name" {...field}  readOnly/>
              </FormControl>
              <FormDescription>
                This is you unique ID.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
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
          control={form.control}
          name="nickname"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nickname</FormLabel>
              <FormControl>
                <Input placeholder="Your nickname" {...field} />
              </FormControl>
              <FormDescription>
                  This is the nickname that is displayed on your profile
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <div className="flex w-full max-w-sm items-center space-x-2">
                  <Input placeholder="Your email" {...field} />
                  <Button type="submit" disabled={form.getValues("isEmailVerified")}>{form.getValues("isEmailVerified") ? "Verified": "Verify"}</Button>
                </div>
              </FormControl>
              <FormDescription>
                This is the email that is used to login.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="picture"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Picture</FormLabel>
              <FormControl>
                <Input placeholder="Your picture" {...field} />
              </FormControl>
              <FormDescription>
                This is the picture that is displayed on your profile
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
        
        <Button disabled={!form.formState.isDirty} type="submit">Update</Button>
      </form>
    </Form>
  )
}
