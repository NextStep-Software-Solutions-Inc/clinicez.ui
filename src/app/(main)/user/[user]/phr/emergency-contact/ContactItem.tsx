"use client";


import { revalidatePath } from "@actions/cache.action";
import { deleteEmergencyContactAction, updateEmergencyContactAction } from "@actions/emergency-contact.action";
import ActionButton from "@components/ActionButton";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@components/ui/form";
import { Input } from "@components/ui/input";
import { RadioGroup, RadioGroupItem } from "@components/ui/radio-group";
import ConditionalRender from "@components/utils/ConditionalRender";
import Each from "@components/utils/Each";
import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";


export const emergencyContactFormSchema = z.object({
  isPrimary: z.boolean(),
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }).max(30, {
    message: "Name must not be longer than 30 characters.",
  }),
  relationship: z.string().min(2, {
    message: "Relationship must be at least 2 characters.",
  }).max(30, {
    message: "Relationship must not be longer than 30 characters.",
  }),
  phone: z.string().min(10, {
    message: "Phone number must be at least 10 characters.",
  }).max(15, {
    message: "Phone number must not be longer than 15 characters.",
  }),
});

type EmergencyContactForm = z.infer<typeof emergencyContactFormSchema>;

export const ContactItem = ({ contact, readOnly }: {
    readOnly?: boolean;
  contact: {
    id: number;
    name: string;
    relationship: string;
    phone: string;
    isPrimary: boolean;
  };
}) => {
  
  type EmergencyContactForm = z.infer<typeof emergencyContactFormSchema>;

  const form = useForm<EmergencyContactForm>({
    resolver: zodResolver(emergencyContactFormSchema),
    defaultValues: contact
  });

  
  const saveChangesAction = async () => {
    form.handleSubmit(async (data) => {
        
      toast.promise(updateEmergencyContactAction(contact.id, data), {
        loading: "Saving changes...",
        success: () => {
          form.reset(data);
          revalidatePath("/user/[user]/phr/emergency-contact")
          return "Changes saved successfully."
        },
        error: "An error occurred while saving changes.",
      })
    })();
  }

  const deleteAction = async () => {
    toast.promise(deleteEmergencyContactAction(contact.id), {
      loading: "Deleting contact...",
      success: () => {
        revalidatePath("/user/[user]/phr/emergency-contact")
        return "Contact deleted successfully."
      },
      error: "An error occurred while deleting contact.",
    })
  }

  return (
    <Form {...form}>
      <form className="space-y-3">
        <input type="checkbox"  {...form.register("isPrimary")} hidden />
        <FormField
          disabled={readOnly}
          control={form.control}
          name={`relationship`}
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Relationship</FormLabel>
              <FormControl>
                <RadioGroup
                  disabled={readOnly}
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex space-y-1"
                >
                  <Each
                    of={["spouse", "parent", "sibling", "relative", "others"]}
                    render={(value) => (
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value={value} />
                        </FormControl>
                        <FormLabel className="font-normal capitalize">{value}</FormLabel>
                      </FormItem>
                    )} />
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
        <FormField
          disabled={readOnly}
          control={form.control}
          name={`name`}
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="Name here" {...field} />
              </FormControl>
              <FormDescription>
              The name of the person you want to be contacted in case of emergency.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )} />
        <FormField
          disabled={readOnly}
          control={form.control}
          name={`phone`}
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel>Contact Number</FormLabel>
              <FormControl>
                <Input placeholder="09000" {...field} type="number" inputMode="tel" />
              </FormControl>
              <FormDescription>
              The phone number of the person you want to be contacted in case of emergency.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )} />
        <ConditionalRender condition={!readOnly}>
          <div className="flex gap-2 justify-end">
            {form.formState.isDirty &&  <ActionButton formAction={saveChangesAction} variant="default">Save Changes</ActionButton>}
            <ActionButton formAction={deleteAction} variant="destructive">Remove</ActionButton>
          </div>
        </ConditionalRender>
      </form>
    </Form>
  );
};
