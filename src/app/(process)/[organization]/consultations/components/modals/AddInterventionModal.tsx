"use client";

import { GetConsultationRecord } from "@actions/consultation/consultation-record.action";
import { addInterventionAction } from "@actions/consultations.action"
import ActionButton from "@components/ActionButton"
import CustomModalContent from "@components/CustomModalContent";
import { Button } from "@components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogFooter,
  DialogTrigger,
} from "@components/ui/dialog"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@components/ui/tooltip"
import Each from "@components/utils/Each";
import { zodResolver } from "@hookform/resolvers/zod";
import {  Plus } from "lucide-react"
import { useRef } from "react"
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";


interface AddInterventionModalProps {
  consultation: NonNullable<GetConsultationRecord["data"]>;
  intervention: Intervention[]
}

const AddInterventionFormSchema = z.object({
  action: z.string({
    required_error: "Please select an action"
  }),
  details: z.string({
    required_error: "Please provide details"
  })
})

export default function AddInterventionModal({consultation, intervention}: AddInterventionModalProps) {

  const form = useForm<z.infer<typeof AddInterventionFormSchema>>({
    resolver: zodResolver(AddInterventionFormSchema)
  })

  const closeBtnRef = useRef<HTMLInputElement>(null)
  const action = async (formData: FormData) => {
    form.handleSubmit(async (data) => {

      const res = await addInterventionAction(formData)
      if (res) {
        toast.success("Intervention added successfully")
        closeBtnRef.current?.click()
      }
    })()
  }

  return (
    <Dialog>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Intervention
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>Add Intervention</TooltipContent>
      </Tooltip>
      <CustomModalContent 
        className="sm:max-w-[525px]"
        label="Add Intervention" 
        description="Enter the intervention performed during the consultation."
      >
        <Form {...form}>
          <form 
            action={action}
            id="add-intervention-form"
            className="grid gap-4 py-4"
          >
            <FormField
              control={form.control}
              name="action"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Action</FormLabel>
                  <Select {...field} onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select predefine interventions" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <Each
                        of={intervention}
                        render={(intervention) => <SelectItem value={intervention.id}>{intervention.action}</SelectItem>}
                      />
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    If the intervention is not predefined, you can ask your organization admin to add it.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="details"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Details</FormLabel>
                  <Input
                    id="details"
                    placeholder="Describe what was done during the intervention."
                    className="col-span-3"
                    {...field}
                  />
                  <FormDescription>
                    Example of details: &quot;Administered 500mg of Paracetamol&quot;
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
           
            <DialogFooter>
              <DialogClose asChild>
                <input ref={closeBtnRef} type="hidden"  value="ok"/>
              </DialogClose>
              <ActionButton form="add-intervention-form" type="submit">
                Add
              </ActionButton>
            </DialogFooter>
          </form>
        </Form>
      </CustomModalContent>
    </Dialog>
  )
}
