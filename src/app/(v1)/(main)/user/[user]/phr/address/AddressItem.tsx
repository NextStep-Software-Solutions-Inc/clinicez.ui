"use client";


import { deleteAddressAction, updateAddressAction } from "@actions/address.action";
import countries from "@public/json/contries.json";
import { revalidatePath } from "@actions/cache.action";
import ActionButton from "@components/ActionButton";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@components/ui/form";
import { Input } from "@components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@components/ui/select";
import ConditionalRender from "@components/utils/ConditionalRender";
import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import Each from "@components/utils/Each";


export const addressFormSchema = z.object({
  id: z.number(),
  isPrimary: z.boolean(),
  fullAddress: z.string({
    required_error: "Full address is required.",
  }),
  apartmentUnit: z.string()
    .optional()
    .transform((e) => e === "" ? undefined : e),
  bldgName: z.string()
    .optional()
    .transform((e) => e === "" ? undefined : e),
  addressLine: z.string()
    .optional()
    .transform((e) => e === "" ? undefined : e),
  street: z.string()
    .optional()
    .transform((e) => e === "" ? undefined : e),
  barangay: z.string()
    .optional()
    .transform((e) => e === "" ? undefined : e),
  subdivision: z.string()
    .optional()
    .transform((e) => e === "" ? undefined : e),
  city: z.string({
    required_error: "City is required.",
  }).min(2, {
    message: "City must be at least 2 characters.",
  }).max(255, {
    message: "City must not be longer than 255 characters.",
  }),
  state: z.string({
    required_error: "State is required.",
  }).min(2, {
    message: "State must be at least 2 characters.",
  }).max(255, {
    message: "State must not be longer than 255 characters.",
  }),
  zipCode: z.string({
    required_error: "Zip Code is required.",
  }).min(4, {
    message: "Zip Code must be at least 4 characters.",
  }).max(10, {
    message: "Zip Code must not be longer than 10 characters.",
  }),
  country: z.string({
    required_error: "Country is required.",
  }),
});

type AddressFormSchema = z.infer<typeof addressFormSchema>;

export interface AddressItemProps {
  address: {
    id: number;
    isPrimary: boolean;
    fullAddress: string;
    apartmentUnit?: string | null;
    bldgName?: string | null;
    addressLine?: string | null;
    street?: string | null;
    barangay?: string | null;
    subdivision?: string | null;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  readOnly?: boolean;
}

export const AddressItem = ({ address, readOnly }: AddressItemProps) => {

  const form = useForm<AddressFormSchema>({
    resolver: zodResolver(addressFormSchema),
    defaultValues: {
      id: address.id,
      isPrimary: address.isPrimary,
      fullAddress: address.fullAddress ?? "",
      apartmentUnit: address.apartmentUnit ?? "",
      bldgName: address.bldgName ?? "",
      addressLine: address.addressLine ?? "",
      street: address.street ?? "",
      barangay: address.barangay ?? "",
      subdivision: address.subdivision ?? "",
      city: address.city,
      state: address.state,
      zipCode: address.zipCode,
      country: address.country,
    }
  });


  const saveChangesAction = async () => {
    form.handleSubmit(async (data) => {
      const updateData = {
        ...data,
        fullAddress: [data.addressLine, data.street, data.subdivision, data.barangay, data.city, data.state, data.zipCode, data.country]
          .filter(Boolean)
          .join(", ")
      }
      toast.promise(updateAddressAction(updateData), {
        loading: "Saving changes...",
        success: async () => {
          await revalidatePath("/user/[user]/phr/address", "page");
          form.reset(updateData);
          return "Changes saved successfully."
        },
        error: "An error occurred while saving changes.",
      })
    })();
  }

  const deleteAction = async () => {
    toast.promise(deleteAddressAction(address.id), {
      loading: "Deleting address...",
      success: () => {
        revalidatePath("/user/[user]/phr/address", "page")
        return "Address deleted successfully."
      },
      error: "An error occurred while deleting address.",
    })
  }

  return (
    <Form {...form}>
      <form className="space-y-3">
        <input type="checkbox"  {...form.register("isPrimary")} hidden />
        <div className="space-y-3">
          <FormField
            disabled={readOnly}
            control={form.control}
            name={`country`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Country <span className="text-destructive">*</span></FormLabel>
                <Select disabled={readOnly} onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger disabled={readOnly}>
                      <SelectValue placeholder="Select a country" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <Each
                      of={countries.countries}
                      render={(country, index) => (
                        <SelectItem key={index} value={country}>{country}</SelectItem>
                      )}
                    />
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* <FormField
            disabled={readOnly}
            control={form.control}
            name={`address`}
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Address Line (Legacy)</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormDescription>
                  Use the detailed fields below or this field for backward compatibility.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          /> */}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <FormField
              disabled={readOnly}
              control={form.control}
              name="apartmentUnit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Apartment/Unit</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Apartment XYZ" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              disabled={readOnly}
              control={form.control}
              name="bldgName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Building Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Building XYZ" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              disabled={readOnly}
              control={form.control}
              name="addressLine"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Premises</FormLabel>
                  <FormControl>
                    <Input placeholder="Landmark or Description" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              disabled={readOnly}
              control={form.control}
              name="street"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Street Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Main St." {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              disabled={readOnly}
              control={form.control}
              name="barangay"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Barangay</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Barangay XYZ" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              disabled={readOnly}
              control={form.control}
              name="subdivision"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subdivision</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Subdivision XYZ" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            disabled={readOnly}
            control={form.control}
            name={`state`}
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>State/Province <span className="text-destructive">*</span></FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Province XYZ" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            disabled={readOnly}
            control={form.control}
            name={`city`}
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>City <span className="text-destructive">*</span></FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Rockfort City" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            disabled={readOnly}
            control={form.control}
            name={`zipCode`}
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Zip Code <span className="text-destructive">*</span></FormLabel>
                <FormControl>
                  <Input placeholder="e.g., 1234" {...field} type="number" inputMode="tel" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <ConditionalRender condition={!readOnly}>
          <div className="flex flex-wrap gap-2 justify-end">
            {form.formState.isDirty && <ActionButton formAction={saveChangesAction} variant="default" className="flex-grow sm:flex-grow-0">Save Changes</ActionButton>}
            <ActionButton formAction={deleteAction} variant="destructive" className="flex-grow sm:flex-grow-0">Remove</ActionButton>
          </div>
        </ConditionalRender>
      </form>
    </Form>
  );
};
