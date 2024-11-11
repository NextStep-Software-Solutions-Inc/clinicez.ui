"use client";

import { createAppointmentTypeAction } from "@actions/appointments/appointment-type.action";
import ActionButton from "@components/ActionButton";
import CustomModalContent from "@components/CustomModalContent";
import { Button } from "@components/ui/button";
import { Dialog, DialogClose, DialogFooter, DialogTrigger } from "@components/ui/dialog";
import { Form, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@components/ui/form";
import { Input } from "@components/ui/input";
import { Textarea } from "@components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@components/ui/tooltip";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const addAppointmentTypeSchema = z.object({
  name: z.string({
    required_error: "Please provide a name for the appointment type"
  }).trim().min(3, {
    message: "Name must be at least 3 characters long"
  }),
  description: z.string({
    required_error: "Please provide a description for the appointment type"
  }).trim().min(3, {
    message: "Description must be at least 3 characters long"
  }),
  duration: z.number({
    coerce: true,
    message: "Duration must be a number"
  }).min(10, {
    message: "Duration must be greater than 10"
  }),
  durationPadding: z.number({
    coerce: true,
    message: "Duration padding must be a number"
  }).min(5, {
    message: "Duration padding must be greater than 5"
  })
});

interface AddAppointmentTypeModalProps {
  clinicUid: string;
  onAddAppointmentType?: () => void;
}
export default function AddAppointmentTypeModal({clinicUid, onAddAppointmentType}:AddAppointmentTypeModalProps) {
  const closeBtnRef = React.useRef<HTMLInputElement>(null);
  const form = useForm<z.infer<typeof addAppointmentTypeSchema>>({
    resolver: zodResolver(addAppointmentTypeSchema),
    defaultValues: {
      name: "",
      description: ""
    }
  });

  const action = async () => {
    form.handleSubmit(async (values) => {
      toast.promise(createAppointmentTypeAction({
        name: values.name,
        description: values.description,
        clinicUid
      }), {
        loading: "Creating appointment type...",
        success: res => {
          if(res.status) {
            onAddAppointmentType?.()
            closeBtnRef.current?.click()
          }
          return res.message
        },
        error: "Failed to create appointment type"
      })
    })();
  }
  return (
    <Dialog>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Appointment Type
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>Add Appointment Type</TooltipContent>
      </Tooltip>
      <CustomModalContent 
        className="sm:max-w-[525px]"
        label="Add Appointment Type" 
        description="Create a new appointment type for the organization."
      >
        <Form {...form}>
          <form 
            action={action}
            id="add-role-form"
            className="grid gap-4 py-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <Input
                    id="name"
                    placeholder="Enter name"
                    className="col-span-3"
                    {...field}
                  />
                  <FormDescription>
                    Provide a name for the appointment type.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <Textarea
                    id="description"
                    placeholder="Enter description"
                    className="col-span-3"
                    {...field}
                  />
                  <FormDescription>
                    Provide a description for the appointment type.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duration</FormLabel>
                  <Input
                    id="duration"
                    type="number"
                    inputMode="numeric"
                    placeholder="Enter duration"
                    className="col-span-3"
                    {...field}
                  />
                  <FormDescription>
                    How long does the appointment type last?
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="durationPadding"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Buffer</FormLabel>
                  <Input
                    id="name"
                    placeholder="Enter padding/buffer"
                    className="col-span-3"
                    {...field}
                  />
                  <FormDescription>
                    How much buffer time should be added to the appointment type?
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
           
            <DialogFooter>
              <DialogClose asChild>
                <input ref={closeBtnRef} type="hidden"  value="ok"/>
              </DialogClose>
              <ActionButton form="add-role-form" type="submit">
                Add
              </ActionButton>
            </DialogFooter>
          </form>
        </Form>
      </CustomModalContent>
    </Dialog>
  );
}
