"use client";

import { Form } from "@components/ui/form"
import { useForm } from "react-hook-form"
import VitalSignsFields, { vitalSignsSchema, VitalSignsType } from "./VitalSignFields"
import ActionButton from "@components/ActionButton";
import { Button } from "@components/ui/button";
import { DialogClose, DialogFooter } from "@components/ui/dialog";
import { toast } from "sonner";
import ConditionalRender from "@components/utils/ConditionalRender";
import {  createVitalSignAction } from "@actions/vitals.action";
import { zodResolver } from "@hookform/resolvers/zod";
import { usePathname } from "next/navigation";
import { revalidatePath } from "@actions/cache.action";

export default function AddVitalSignsForm({userId}: {userId: string}) {
  const pathname = usePathname()
  const form = useForm<VitalSignsType>({
    resolver: zodResolver(vitalSignsSchema),
    defaultValues: {
      bmi: 0,
      bpDiastolic: 0,
      bpSystolic: 0,
      dateTaken: new Date(),
      height: 0,
      notes: "",
      pulseRate: 0,
      respRate: 0,
      spo2: 0,
      temp: 0,
      weight: 0
    }
  })
  
  const action = async () => {
    form.handleSubmit(async (data) => {
      if(!userId) return toast.error("User not found")
      toast.promise(createVitalSignAction({...data, userId}), {
        loading: "Saving...",
        success: () => {
          form.reset(data)
          revalidatePath(pathname, "page")
          return "Vital Signs Updated"
        },
        error: "Failed to update vital signs"
      })
    }, console.error
    )()
  }

  return (
    <Form {...form}>
      <form action={action} className="space-y-2">
        <VitalSignsFields form={form}/>
        <DialogFooter >
          <DialogClose asChild>
            <Button type="button"variant="ghost">Close</Button>
          </DialogClose>
          <ActionButton type="submit">Add Vital Signs</ActionButton>
        </DialogFooter>
      </form>
    </Form>
  )
}