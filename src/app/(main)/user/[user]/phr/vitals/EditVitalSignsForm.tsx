"use client";

import { Form } from "@components/ui/form"
import { useForm } from "react-hook-form"
import VitalSignsFields, { vitalSignsSchema, VitalSignsType as VitalSignsTypeSchema } from "./VitalSignFields"
import ActionButton from "@components/ActionButton";
import { Button } from "@components/ui/button";
import { DialogClose, DialogFooter } from "@components/ui/dialog";
import { toast } from "sonner";
import ConditionalRender from "@components/utils/ConditionalRender";
import { zodResolver } from "@hookform/resolvers/zod";
import { VitalSignsType } from "./RecentVitalSigns";
import { updateVitalSignAction } from "@actions/vitals.action";
import { usePathname } from "next/navigation";
import { revalidatePath } from "@actions/cache.action";
import { useRef } from "react";

export default function EditVitalSignsForm({vitalSign}: {vitalSign: VitalSignsType[number]}){
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname()
  const form = useForm<VitalSignsTypeSchema>({
    resolver: zodResolver(vitalSignsSchema),
    defaultValues: {
      ...vitalSign.bpSystolic? {bpSystolic: vitalSign.bpSystolic}: {},
      ...vitalSign.bpDiastolic? {bpDiastolic: vitalSign.bpDiastolic}: {},
      ...vitalSign.weight? {weight: vitalSign.weight}: {},
      ...vitalSign.height? {height: vitalSign.height}: {},
      ...vitalSign.bmi? {bmi: vitalSign.bmi}: {},
      ...vitalSign.respRate? {respRate: vitalSign.respRate}: {},
      ...vitalSign.spo2? {spo2: vitalSign.spo2}: {},
      ...vitalSign.temp? {temp: vitalSign.temp}: {},
      ...vitalSign.dateTaken? {dateTaken: vitalSign.dateTaken}: {},
      ...vitalSign.pulseRate? {pulseRate: vitalSign.pulseRate}: {},
      ...vitalSign.notes? {notes: vitalSign.notes}: {},
    }
  })

  const action = async () => {
    form.handleSubmit(async (data) => {
      toast.promise(updateVitalSignAction(vitalSign.id, data), {
        loading: "Saving...",
        success: () => {
          form.reset(data)
          revalidatePath(pathname, "page")
          closeBtnRef.current?.click();
          return "Vital Signs Updated"
        },
        error: "Failed to update vital signs"
      })
    })()
  }
  return (
    <Form {...form}>
      <form action={action} className="space-y-0">
        <VitalSignsFields form={form}/>
        <DialogFooter >
          <DialogClose asChild>
            <Button ref={closeBtnRef} type="button"variant="ghost">Close</Button>
          </DialogClose>
          <ConditionalRender condition={form.formState.isDirty} fallback="">
            <ActionButton type="submit">Save Changes</ActionButton>
          </ConditionalRender>
        </DialogFooter>
      </form>
    </Form>
  )
}