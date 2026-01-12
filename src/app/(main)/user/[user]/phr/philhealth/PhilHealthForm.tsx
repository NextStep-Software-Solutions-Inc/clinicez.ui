"use client";

import { getPhilHealthMemberTypesAction } from "@/actions/philhealth/philhealth-member-type.action";
import { createPhilHealthRecordAction, updatePhilHealthRecordAction } from "@/actions/philhealth/philhealth-record.action";
import ActionButton from "@/components/ActionButton";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import ConditionalRender from "@/components/utils/ConditionalRender";
import PhilHealthMemberTypeSelect from "./PhilHealthMemberTypeSelect";
import { promiseWrapper } from "@/lib/with-error-handling"; // still used for submit
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { PhilHealthMemberType } from "@prisma";
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
    memberTypeId?: number;
    photoUrl?: string;
  };
  memberTypes?: PhilHealthMemberType[]; // optional preloaded server data
}

// philSysId may be optional. However, if provided, it should contain exactly 12 characters.
const philHealthFormSchema = z.object({
  pin: z.string({
    required_error: "PhilHealth Identification Number (PIN) is required",
    invalid_type_error: "PhilHealth Identification Number (PIN) must be a string",
  }).min(12, {
    message: "PhilHealth Identification Number (PIN) must be at least 12 characters long",
  }),
  philSysId: z.string()
    .optional()
    .transform((e) => e === "" ? undefined : e)
    .refine((val) => !val || val.length === 12, {
      message: "PhilHealth System ID (PhilSysID) must be exactly 12 characters long",
    }),
  tin: z.string()
    .optional()
    .transform((e) => e === "" ? undefined : e)
    .refine((val) => !val || val.length === 9, {
      message: "Tax Identification Number (TIN) must be exactly 9 characters long",
    }),
  memberTypeId: z.number({
    required_error: "Member Type ID is required",
    invalid_type_error: "Member Type ID must be a number"
  }),
});

export function PhilHealthForm({ userUid, readonly = false, philhealth, memberTypes: initialMemberTypes }: PhilHealthFormProps) {
  const [memberTypes, setMemberTypes] = useState<PhilHealthMemberType[]>(initialMemberTypes ?? []);
  const [loadingMemberTypes, setLoadingMemberTypes] = useState(!initialMemberTypes);

  useEffect(() => {
    if (initialMemberTypes) return; // already loaded from server
    (async () => {
      try {
        const mts = await getPhilHealthMemberTypesAction();
        setMemberTypes(mts);
      } catch {
        setMemberTypes([]);
      } finally {
        setLoadingMemberTypes(false);
      }
    })();
  }, [initialMemberTypes]);

  const router = useRouter();
  const form = useForm<z.infer<typeof philHealthFormSchema>>({
    resolver: zodResolver(philHealthFormSchema),
    defaultValues: {
      pin: philhealth?.pin ?? "",
      philSysId: philhealth?.philSysId ?? "",
      tin: philhealth?.tin ?? "",
      memberTypeId: philhealth?.memberTypeId as number | undefined,
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
          memberTypeId: data.memberTypeId,
        }
      })
      : promiseWrapper(createPhilHealthRecordAction)({
        userUid,
        philhealth: {
          pin: data.pin,
          philSysId: data.philSysId,
          tin: data.tin,
          memberTypeId: data.memberTypeId,
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
              <FormLabel>PhilHealth Identification Number (PIN)</FormLabel>
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
          name="memberTypeId"
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>PhilHealth Member Type</FormLabel>
              <FormControl>
                <PhilHealthMemberTypeSelect
                  memberTypes={memberTypes}
                  value={field.value}
                  onChange={(id) => field.onChange(id)}
                  disabled={readonly}
                  loading={loadingMemberTypes}
                />
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