"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

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
import ActionButton from "@components/ActionButton"
import { resetPasswordAction } from "@actions/users/user.action"
import { useUser } from "@auth0/nextjs-auth0"
import { useRouter } from "next/navigation"

const accountFormSchema = z.object({
  password: z.string().min(6),
  confirmPassword: z.string().min(6)
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
})

type GeneraSettingsFormValues = z.infer<typeof accountFormSchema>

export default function SecuritySettingsForm() {
  const user = useUser()
  const router = useRouter()
  
  const form = useForm<GeneraSettingsFormValues>({
    resolver: zodResolver(accountFormSchema),
    mode: "onChange"
  })

  const action = async () => {
    form.handleSubmit(async (values) => {
      const userId = user?.user?.sub
      if (!userId) return toast.error("User not found");

      toast.promise(resetPasswordAction(userId, values.password), {
        loading: "Updating password...",
        success: () => {
          form.reset(values);
          router.replace("/auth/logout");
          return "Password updated successfully. Please login again for security reasons."
        },
        error: (error) => `Failed to update password. Error: ${error}`
      })
    })()
  }

  return (
    <div>
      <div className="prose">
        <h2>Change Password</h2>
      </div>
      <Form {...form}>
        
        <form action={action} className="space-y-8">
          <FormField
            control={form.control}
            name="password"
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
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirmation Password</FormLabel>
                <FormControl>
                  <Input placeholder="Confirm your password" {...field} type="password" />
                </FormControl>
                <FormDescription>
                Confirm your new password.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        
          {form.formState.isDirty && <ActionButton disabled={form.formState.isLoading} type="submit">Update</ActionButton>}
        </form>
      </Form>
    </div>
  )
}
