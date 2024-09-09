"use client";

import { GetConsultationRecord } from "@actions/consultation/consultation-record.action";
import { addVitalSignsAction } from "@actions/consultations.action"
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
import { Tooltip, TooltipContent, TooltipTrigger } from "@components/ui/tooltip"
import { zodResolver } from "@hookform/resolvers/zod";
import {  Plus } from "lucide-react"
import { useRef } from "react"
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";


interface AddVitalSignsModalProps {
  consultation:  NonNullable<GetConsultationRecord["data"]>;
}

const AddVitalSignsFormSchema = z.object({
  temperature: z.number({
    required_error: "Please provide the temperature"
  }),
  pulse: z.number({
    required_error: "Please provide the pulse"
  }),
  respiration: z.number({
    required_error: "Please provide the respiration"
  }),
  bloodPressure: z.string({
    required_error: "Please provide the blood pressure"
  }),
  oxygenSaturation: z.number({
    required_error: "Please provide the oxygen saturation"
  }),
  height: z.number({
    required_error: "Please provide the height"
  }),
  weight: z.number({
    required_error: "Please provide the weight"
  }),
})


export default function AddVitalSignsModal({consultation}: AddVitalSignsModalProps) {

  const form = useForm<z.infer<typeof AddVitalSignsFormSchema>>({
    resolver: zodResolver(AddVitalSignsFormSchema)
  })

  const closeBtnRef = useRef<HTMLInputElement>(null)
  const action = async (formData: FormData) => {
    form.handleSubmit(async (data) => {

      const res = await addVitalSignsAction(formData)
      if (res) {
        toast.success("Vital signs added successfully")
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
              Add Vital Signs
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>Add Vital Signs</TooltipContent>
      </Tooltip>
      <CustomModalContent 
        className="sm:max-w-[625px]"
        label="Add Vital Signs" 
        description="Enter the vital signs of the patient during the consultation."
      >
        <Form {...form}>
          <form 
            action={action}
            id="add-vital-signs-form"
            className="grid gap-4 py-4"
          >
            
            <div className="flex flex-wrap gap-2">
              <FormField
                control={form.control}
                name="temperature"
                render={({ field }) => (
                  <FormItem className="grow basis-[200px]">
                    <FormLabel>Temperature</FormLabel>
                    <Input
                      id="temperature"
                      placeholder="Enter the temperature"
                      className="col-span-3"
                      {...field}
                      onChange={(e) =>  field.onChange(+e.target.value)}
                    />
                    <FormDescription>
                      Example of temperature: 37.5 °C
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="pulse"
                render={({ field }) => (
                  <FormItem className="grow basis-[200px]">
                    <FormLabel>Pulse Rate</FormLabel>
                    <Input
                      id="pulse"
                      placeholder="Enter the pulse"
                      className="col-span-3"
                      {...field}
                      onChange={(e) =>  field.onChange(+e.target.value)}
                    />
                    <FormDescription>
                      Example of pulse: 70 bpm
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="respiration"
                render={({ field }) => (
                  <FormItem className="grow basis-[200px]">
                    <FormLabel>Respiration Rate</FormLabel>
                    <Input
                      id="respiration"
                      placeholder="Enter the respiration"
                      className="col-span-3"
                      {...field}
                      onChange={(e) =>  field.onChange(+e.target.value)}
                    />
                    <FormDescription>
                      Example of respiration: 12 cpm
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="oxygenSaturation"
                render={({ field }) => (
                  <FormItem className="grow basis-[200px]">
                    <FormLabel>Oxygen Saturation</FormLabel>
                    <Input
                      id="oxygenSaturation"
                      placeholder="Enter the oxygen saturation"
                      className="col-span-3"
                      {...field}
                      onChange={(e) =>  field.onChange(+e.target.value)}
                    />
                    <FormDescription>
                      Example of oxygen saturation: 98%
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bloodPressure"
                render={({ field }) => (
                  <FormItem className="grow basis-[200px]">
                    <FormLabel>Blood Pressure</FormLabel>
                    <Input
                      id="bloodPressure"
                      placeholder="Enter the blood pressure"
                      className="col-span-3"
                      {...field}
                    />
                    <FormDescription>
                      Example of blood pressure: 120/80 mmHg
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="height"
                render={({ field }) => (
                  <FormItem className="grow basis-[200px]">
                    <FormLabel>Height</FormLabel>
                    <Input
                      id="height"
                      placeholder="Enter the height"
                      className="col-span-3"
                      {...field}
                      onChange={(e) =>  field.onChange(+e.target.value)}
                    />
                    <FormDescription>
                      Example of height: 170 cm
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="weight"
                render={({ field }) => (
                  <FormItem className="grow basis-[200px]">
                    <FormLabel>Weight</FormLabel>
                    <Input
                      id="weight"
                      placeholder="Enter the weight"
                      className="col-span-3"
                      {...field}
                      onChange={(e) =>  field.onChange(+e.target.value)}
                    />
                    <FormDescription>
                      Example of weight: 65 kg
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
           
            <DialogFooter>
              <DialogClose asChild>
                <input ref={closeBtnRef} type="hidden"  value="ok"/>
              </DialogClose>
              <ActionButton disabled={form.formState.isSubmitting} form="add-vital-signs-form" type="submit">
                Add
              </ActionButton>
            </DialogFooter>
          </form>
        </Form>
      </CustomModalContent>
    </Dialog>
  )
}
