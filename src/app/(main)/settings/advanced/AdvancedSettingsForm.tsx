"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@components/ui/button"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@components/ui/dialog"

import {toast} from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@components/ui/select"
import Each from "@components/utils/Each"
import { Alert, AlertDescription, AlertTitle } from "@components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Label } from "@components/ui/label"
import { Input } from "@components/ui/input"
import ConfirmDeactivateAccountForm from "./ConfirmDeactivateAccountForm"

const organizationFormSchema = z.object({
  orgUid: z.string(),
})

type GeneraSettingsFormValues = z.infer<typeof organizationFormSchema>

const myOrganizations = [
  {
    id: "1",
    uid: "hims",
    name: "Healthcare Information Management System",
  },
  {
    id: "2",
    uid: "cums",
    name: "Capitol University Medical Center",
  }
]

export default function AdvancedSettingsForm() {
  
  const form = useForm<GeneraSettingsFormValues>({
    resolver: zodResolver(organizationFormSchema),
    defaultValues: {
      orgUid: myOrganizations[0].id,
    }
  })

  function onSubmit(data: GeneraSettingsFormValues) {
    toast("You submitted the following values")
  }

  return (
    <>
      <h3 className="text-red-600 font-bold">Danger Zone</h3>
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Warning</AlertTitle>
        <AlertDescription>
          The following settings are dangerous and can cause serious issues if not used properly.
        </AlertDescription>
      </Alert>
      
      <Dialog>
        <DialogTrigger><Button variant="destructive" type="submit">Deactivate Account</Button></DialogTrigger>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Deactivate Account</DialogTitle>
            <DialogDescription>
              Deactivating your account will permanently remove all of your data from the system.
            </DialogDescription>
          </DialogHeader>
          <ConfirmDeactivateAccountForm/>
        </DialogContent>
      </Dialog>
    </>
  )
}
