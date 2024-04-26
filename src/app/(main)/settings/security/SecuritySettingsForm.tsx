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

const accountFormSchema = z.object({
  oldPassword: z.string().min(6),
  newPassword: z.string().min(6)
})

type GeneraSettingsFormValues = z.infer<typeof accountFormSchema>

export default function SecuritySettingsForm() {
  
  const form = useForm<GeneraSettingsFormValues>({
    resolver: zodResolver(accountFormSchema)
  })

  function onSubmit(data: GeneraSettingsFormValues) {
    toast("You submitted the following values")
  }

  return (
    <div>
      <div className="prose">
        <h2>Change Password</h2>
      </div>
      <Form {...form}>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="oldPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Old Password</FormLabel>
                <FormControl>
                  <Input placeholder="Your old password" {...field} type="password" />
                </FormControl>
                <FormDescription>
                The old password you use to login.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="newPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New Password</FormLabel>
                <FormControl>
                  <Input placeholder="Your new password" {...field} type="password" />
                </FormControl>
                <FormDescription>
                The new password you want to use.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        
          <Button disabled={!form.formState.isDirty} type="submit">Update</Button>
        </form>
      </Form>
    </div>
  )
}
