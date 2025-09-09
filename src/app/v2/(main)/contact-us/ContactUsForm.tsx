"use client"

import { sendContactUsMessage } from "@/actions/contact-us.action"
import ActionButton from "@/components/ActionButton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import ConditionalRender from "@/components/utils/ConditionalRender"
import { zodResolver } from "@hookform/resolvers/zod"
import { RocketIcon } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

const contactUseFormSchema = z.object({
  name: z
    .string({
      message: "Please enter your name.",
    })
    .min(2, {
      message: "Name must be at least 2 characters.",
    })
    .max(30, {
      message: "Name must not be longer than 30 characters.",
    }),
  email: z
    .string({
      message: "Please enter your email address.",
    })
    .email({
      message: "Please enter a valid email address.",
    }),
  message: z
    .string({
      message: "Please enter your message.",
    })
    .min(10, {
      message: "Message must be at least 10 characters.",
    })
    .max(500, {
      message: "Message must not be longer than 500 characters.",
    }),
})

type ContactUsFormSchema = z.infer<typeof contactUseFormSchema>

export const ContactUsForm = () => {
  const [status, setStatus] = useState(false)
  const [prevName, setPrevName] = useState("")

  const form = useForm<ContactUsFormSchema>({
    resolver: zodResolver(contactUseFormSchema),
    defaultValues: {
      email: "",
      message: "",
      name: "",
    },
  })

  const action = async () => {
    form.handleSubmit(async (data) => {
      setStatus(false)
      toast.promise(sendContactUsMessage(data), {
        loading: "Sending message...",
        success: () => {
          setStatus(true)
          form.reset()
          setPrevName(data.name)
          return "Message sent successfully"
        },
        error: "An error occured while sending message",
      })
    })()
  }

  return (
    <Form {...form}>
      <ConditionalRender condition={status}>
        <Alert className="my-10 border-primary">
          <RocketIcon className="h-4 w-4" />
          <AlertTitle>Hello, {prevName}</AlertTitle>
          <AlertDescription>
            Your message has been sent successfully. Please wait for a response. Thank you!
          </AlertDescription>
        </Alert>
      </ConditionalRender>
      <div className="bg-white/75 rounded-lg shadow-lg border border-gray-200 p-8">
        <div className="mb-8 text-center mx-auto max-w-xs">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">Contact Us</h2>
          <p className="text-slate-600">Fill out the form below our team will get back to you as soon as possible</p>
        </div>
        <form autoComplete="off" action={action}>
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email address</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field}
                      className="resize-none" />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
          <div className="mt-4">
            <ActionButton className="w-full">Get Started</ActionButton>
          </div>
        </form>
      </div>
    </Form>
  )
}
