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
  firstName: z.string()
    .optional()
    .transform((e) => e === "" ? undefined : e),
  middleName: z.string()
    .optional().nullable()
    .transform((e) => e === "" ? undefined : e),
  lastName: z.string()
    .optional()
    .transform((e) => e === "" ? undefined : e),
  suffix: z.string()
    .optional()
    .transform((e) => e === "" ? undefined : e),
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
  address: z.string().nullable()
});

type EmergencyContactForm = z.infer<typeof emergencyContactFormSchema>;

export const ContactItem = ({ contact, readOnly }: {
  readOnly?: boolean;
  contact: {
    id: number;
    name: string;
    firstName?: string | null;
    middleName?: string | null;
    lastName?: string | null;
    suffix?: string | null;
    relationship: string;
    phone: string;
    isPrimary: boolean;
    address: string | null;
  };
}) => {

  type EmergencyContactForm = z.infer<typeof emergencyContactFormSchema>;

  const form = useForm<EmergencyContactForm>({
    resolver: zodResolver(emergencyContactFormSchema),
    defaultValues: {
      ...contact,
      firstName: contact.firstName ?? "",
      middleName: contact.middleName ?? "",
      lastName: contact.lastName ?? "",
      suffix: contact.suffix ?? "",
    }
  });


  const saveChangesAction = async () => {
    form.handleSubmit(async (data) => {
      // Combine name fields for backward compatibility
      const fullName = [data.firstName, data.middleName, data.lastName, data.suffix]
        .filter(Boolean)
        .join(' ')
        .trim();

      const updateData = {
        ...data,
        name: fullName || data.name, // fallback to original name if no separate fields
      };

      toast.promise(updateEmergencyContactAction(contact.id, updateData), {
        loading: "Saving changes...",
        success: () => {
          form.reset(data);
          revalidatePath("/user/[user]/phr/emergency-contact", "page")
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
        revalidatePath("/user/[user]/phr/emergency-contact", "page")
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
                  className="flex flex-wrap gap-2"
                >
                  <Each
                    of={["spouse", "father", "mother", "guardian", "sibling", "relative", "others"]}
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
        <div className="flex flex-col md:flex-row gap-2">
          <FormField
            disabled={readOnly}
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input placeholder="First name" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            disabled={readOnly}
            control={form.control}
            name="middleName"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Middle Name</FormLabel>
                <FormControl>
                  <Input placeholder="Middle name" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            disabled={readOnly}
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input placeholder="Last name" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            disabled={readOnly}
            control={form.control}
            name="suffix"
            render={({ field }) => (
              <FormItem className="w-1/4">
                <FormLabel>Suffix</FormLabel>
                <FormControl>
                  <Input placeholder="Jr., Sr." {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          disabled={readOnly}
          control={form.control}
          name={`name`}
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel>Full Name (Legacy)</FormLabel>
              <FormControl>
                <Input placeholder="Leave empty if using name fields above" {...field} />
              </FormControl>
              <FormDescription>
                Use the separate name fields above or this field for backward compatibility.
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
                <Input placeholder="09000" {...field} type="text" inputMode="tel" />
              </FormControl>
              <FormDescription>
                The phone number of the person you want to be contacted in case of emergency.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )} />
        <FormField
          disabled={readOnly}
          control={form.control}
          name={`address`}
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Input placeholder="Enter their address" type="text"  {...field} value={field.value ?? ""} />
              </FormControl>
              <FormDescription>
                The address of the person you want to be contacted in case of emergency.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )} />
        <ConditionalRender condition={!readOnly}>
          <div className="flex flex-wrap gap-2 justify-end">
            {form.formState.isDirty && <ActionButton formAction={saveChangesAction} variant="default" className="flex-grow sm:flex-grow-0">Save Changes</ActionButton>}
            <ActionButton formAction={deleteAction} variant="destructive" className="flex-grow sm:flex-grow-0">Remove</ActionButton>
          </div>
        </ConditionalRender>
      </form >
    </Form >
  );
};
