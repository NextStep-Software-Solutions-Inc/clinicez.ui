"use client";

import { createPhilHealthRecordAction, updatePhilHealthRecordAction } from "@/actions/philhealth/philhealth-record.action";
import ActionButton from "@/components/ActionButton";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ConditionalRender from "@/components/utils/ConditionalRender";
import { promiseWrapper } from "@/lib/with-error-handling"; // still used for submit
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

interface PhilHealthFormProps {
  userUid: string;
  readonly?: boolean;
  philhealth?: {
    id?: number; // include id when editing existing record
    pin?: string;
    philSysId?: string;
    tin?: string;
    memberType?: string;
    photoUrl?: string;
  };
}

// philSysId may be optional. However, if provided, it should contain exactly 12 characters.
const philHealthFormSchema = z.object({
  pin: z.string({
    required_error: "PhilHealth Identification Number (PIN) is required",
    invalid_type_error: "PhilHealth Identification Number (PIN) must be a string",
  }).transform(val => val.replace(/\D/g, ""))
    .refine(val => val.length === 12 || val.length === 15, "PIN must be 12 or 15 digits"),
  philSysId: z.string()
    .optional()
    .transform((e) => {
       if (!e) return undefined;
       const digits = e.replace(/\D/g, "");
       return digits === "" ? undefined : digits;
    })
    .refine((val) => !val || val.length === 12 || val.length === 15, {
      message: "PhilHealth System ID (PhilSysID) must be 12 or 15 digits",
    }),
  tin: z.string()
    .optional()
    .transform((e) => {
       if (!e) return undefined;
       const digits = e.replace(/\D/g, "");
       return digits === "" ? undefined : digits;
    })
    .refine((val) => !val || (val.length >= 9 && val.length <= 15), {
      message: "Tax Identification Number (TIN) must be between 9 and 15 digits",
    }),
  memberType: z.string().optional(),
});

export function PhilHealthForm({ userUid, readonly = false, philhealth }: PhilHealthFormProps) {
  const router = useRouter();
  const form = useForm<z.infer<typeof philHealthFormSchema>>({
    resolver: zodResolver(philHealthFormSchema),
    defaultValues: {
      pin: philhealth?.pin ?? "",
      philSysId: philhealth?.philSysId ?? "",
      tin: philhealth?.tin ?? "",
      memberType: philhealth?.memberType,
    },
  });

  const handleSaveChanges = form.handleSubmit(data => {
    const isUpdate = Boolean(philhealth?.id);
    const action = isUpdate
      ? promiseWrapper(updatePhilHealthRecordAction)({
        philHealthRecordId: philhealth!.id!,
        philhealth: {
          pin: data.pin,
          philSysId: data.philSysId,
          tin: data.tin,
          memberType: data.memberType,
        }
      })
      : promiseWrapper(createPhilHealthRecordAction)({
        userUid,
        philhealth: {
          pin: data.pin,
          philSysId: data.philSysId,
          tin: data.tin,
          memberType: data.memberType,
        }
      });

    toast.promise(action, {
      loading: isUpdate ? "Updating PhilHealth record..." : "Creating PhilHealth record...",
      success: (res) => {
        form.reset(data);
        router.refresh();
        return res.message;
      },
      error: error => error,
    })
  });

  return (
    <Form {...form}>
      <form onSubmit={handleSaveChanges} className="grid gap-6 md:grid-cols-2">
        <FormField
          control={form.control}
          name="pin"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {form.watch("memberType") === "DD" ? "Principal Member PIN" : "PhilHealth Identification Number (PIN)"}
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Enter PhilHealth PIN"
                  disabled={readonly}
                />
              </FormControl>
              <FormDescription>12-digit PhilHealth PIN.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="philSysId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>PhilHealth System ID (PhilSysID)</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Enter PhilHealth System ID"
                  disabled={readonly}
                />
              </FormControl>
              <FormDescription>12-digit PhilSys ID (optional).</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tin"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tax Identification Number (TIN)</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Enter Tax Identification Number"
                  disabled={readonly}
                />
              </FormControl>
              <FormDescription>9-digit TIN (optional).</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="memberType"
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>PhilHealth Member Type</FormLabel>
              <FormControl>
                <Select
                  value={field.value || ''}
                  onValueChange={(val) => field.onChange(val)}
                  disabled={readonly}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Member Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MM">Principal Member</SelectItem>
                    <SelectItem value="DD">Dependent</SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormDescription>Current active classification.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Show action button only when form is NOT read-only */}
        <ConditionalRender condition={!readonly}>
          <div className="md:col-span-2">
            <ActionButton
              type="submit"
              disabled={form.formState.isSubmitting}
              className="flex-shrink sm:flex-shrink-0"
            >
              {philhealth?.id ? "Update" : "Create"} PhilHealth Record
            </ActionButton>
          </div>
        </ConditionalRender>
      </form>
    </Form>
  )
};