"use client";

import { sendContactUsMessage } from "@actions/contact-us.action";
import ActionButton from "@components/ActionButton";
import { Alert, AlertDescription, AlertTitle } from "@components/ui/alert";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@components/ui/form";
import { Input } from "@components/ui/input";
import { Textarea } from "@components/ui/textarea";
import ConditionalRender from "@components/utils/ConditionalRender";
import { zodResolver } from "@hookform/resolvers/zod";
import { RocketIcon } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const contactUseFormSchema = z.object({
  name: z.string({
    message: "Please enter your name.",
  }).min(2, {
    message: "Name must be at least 2 characters.",
  }).max(30, {
    message: "Name must not be longer than 30 characters.",
  }),
  email: z.string({
    message: "Please enter your email address.",
  }).email({
    message: "Please enter a valid email address.",
  }),
  message: z.string({
    message: "Please enter your message.",
  }).min(10, {
    message: "Message must be at least 10 characters.",
  }).max(500, {
    message: "Message must not be longer than 500 characters.",
  }),

});

type ContactUsFormSchema = z.infer<typeof contactUseFormSchema>;

export const ContactUsForm = () => {
  const [status, setStatus] = useState(false)

  const form = useForm<ContactUsFormSchema>({
    resolver: zodResolver(contactUseFormSchema),
  })
  
  const action = async () => {
    form.handleSubmit(async (data) => {
      setStatus(false)
      toast.promise(sendContactUsMessage(data), {
        loading: "Sending message...",
        success: () => {
          setStatus(true)
          form.reset()
          return "Message sent successfully."
        },
        error: "An error occurred while sending message.",
      })
    })()
  }
  return (
    <Form {...form}>
      <ConditionalRender condition={status}>
        <Alert>
          <RocketIcon className="h-4 w-4" />
          <AlertTitle>Hello, {form.watch("name")}!</AlertTitle>
          <AlertDescription>
            Your message has been sent successfully. Please wait for a response. Thank you!
          </AlertDescription>
        </Alert>
      </ConditionalRender>
      <form action={action}>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Your Name" {...field} />
              </FormControl>
              <FormDescription>
              </FormDescription>
              <FormMessage/>
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
                <Input placeholder="Your Email address" {...field} />
              </FormControl>
              <FormDescription>
              </FormDescription>
              <FormMessage/>
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
                <Textarea  placeholder="How we can help you!" {...field} />
              </FormControl>
              <FormDescription>
              </FormDescription>
              <FormMessage/>
            </FormItem>
           
          )}
        />
        <ActionButton>Send</ActionButton>
      </form>
    </Form>
  );
};
