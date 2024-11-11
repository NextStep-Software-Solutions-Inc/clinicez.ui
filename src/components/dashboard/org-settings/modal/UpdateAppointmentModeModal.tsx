"use client";

import { GetAppointmentModes, updateAppointmentModeAction } from "@actions/appointments/appointment-mode.action";
import ActionButton from "@components/ActionButton";
import CustomModalContent from "@components/CustomModalContent";
import { Button } from "@components/ui/button";
import { Dialog, DialogClose, DialogFooter, DialogTrigger } from "@components/ui/dialog";
import { Form, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@components/ui/form";
import { Input } from "@components/ui/input";
import { Textarea } from "@components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@components/ui/tooltip";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus } from "lucide-react";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const updatedAppointmentModeSchema = z.object({
  name: z.string({
    required_error: "Please provide a name for the appointment type"
  }).trim().min(3, {
    message: "Name must be at least 3 characters long"
  }),
  description: z.string({
    required_error: "Please provide a description for the appointment type"
  }).trim().min(3, {
    message: "Description must be at least 3 characters long"
  })
});

interface UpdateAppointmentModeModalProps {
  appointmentMode: GetAppointmentModes[number];
    onAddAppointmentMode?: () => void;
}
export default function UpdateAppointmentModeModal({appointmentMode, onAddAppointmentMode}:UpdateAppointmentModeModalProps) {
  const closeBtnRef = React.useRef<HTMLInputElement>(null);
  const form = useForm<z.infer<typeof updatedAppointmentModeSchema>>({
    resolver: zodResolver(updatedAppointmentModeSchema),
    values: {
      name: appointmentMode.name,
      description: appointmentMode.description ?? ""
    }
  });

  const action = async () => {
    form.handleSubmit(async (values) => {
      toast.promise(updateAppointmentModeAction({
        id: appointmentMode.id,
        name: values.name,
        description: values.description,
      }), {
        loading: "Updating appointment mode...",
        success: res => {
          if(res.status) {
            onAddAppointmentMode?.()
            closeBtnRef.current?.click()
          }
          return res.message
        },
        error: "Failed to update appointment mode"
      })
    })();
  }
  return (
    <Dialog>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon">
              <Pencil className="text-primary" size={16} />
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>Update Appointment Mode</TooltipContent>
      </Tooltip>
      <CustomModalContent 
        className="sm:max-w-[525px]"
        label="Update Appointment Mode" 
        description="Update the appointment mode for the organization."
      >
        <Form {...form}>
          <form 
            action={action}
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
                    Provide a name for the appointment mode.
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
                    Provide a description for the appointment mode.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <DialogClose asChild>
                <input ref={closeBtnRef} type="hidden"  value="ok"/>
              </DialogClose>
              <ActionButton type="submit">
                Save Changes
              </ActionButton>
            </DialogFooter>
          </form>
        </Form>
      </CustomModalContent>
    </Dialog>
  );
}
