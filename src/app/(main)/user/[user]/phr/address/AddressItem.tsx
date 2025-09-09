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
  address: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }).max(255, {
    message: "Name must not be longer than 255 characters.",
  }),
  apartmentUnit: z.string()
    .optional()
    .transform((e) => e === "" ? undefined : e),
  bldgName: z.string()
    .optional()
    .transform((e) => e === "" ? undefined : e),
  premises: z.string()
    .optional()
    .transform((e) => e === "" ? undefined : e),
  streetName: z.string()
    .optional()
    .transform((e) => e === "" ? undefined : e),
  barangay: z.string()
    .optional()
    .transform((e) => e === "" ? undefined : e),
  subdivision: z.string()
    .optional()
    .transform((e) => e === "" ? undefined : e),
  city: z.string().min(2, {
    message: "City must be at least 2 characters.",
  }).max(255, {
    message: "City must not be longer than 255 characters.",
  }),
  state: z.string().min(2, {
    message: "State must be at least 2 characters.",
  }).max(255, {
    message: "State must not be longer than 255 characters.",
  }),
  zipCode: z.string().min(2, {
    message: "Zip must be at least 2 characters.",
  }).max(30, {
    message: "Zip must not be longer than 30 characters.",
  }),
  country: z.string().min(2, {
    message: "Country must be at least 2 characters.",
  }).max(30, {
    message: "Country must not be longer than 30 characters.",
  }),
});

type AddressFormSchema = z.infer<typeof addressFormSchema>;

export interface AddressItemProps {
  address: {
    id: number;
    isPrimary: boolean;
    address: string;
    apartmentUnit?: string | null;
    bldgName?: string | null;
    premises?: string | null;
    streetName?: string | null;
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
      ...address,
      apartmentUnit: address.apartmentUnit ?? "",
      bldgName: address.bldgName ?? "",
      premises: address.premises ?? "",
      streetName: address.streetName ?? "",
      barangay: address.barangay ?? "",
      subdivision: address.subdivision ?? "",
    }
  });


  const saveChangesAction = async () => {
    form.handleSubmit(async (data) => {
      toast.promise(updateAddressAction(data), {
        loading: "Saving changes...",
        success: () => {
          form.reset(data);
          revalidatePath("/user/[user]/phr/address", "page")
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
                <FormLabel>Country</FormLabel>
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
                <FormDescription>
                  Country that you belong to.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            disabled={readOnly}
            control={form.control}
            name={`address`}
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Address Line (Legacy)</FormLabel>
                <FormControl>
                  <Input placeholder="Your location" {...field} />
                </FormControl>
                <FormDescription>
                  Use the detailed fields below or this field for backward compatibility.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <FormField
              disabled={readOnly}
              control={form.control}
              name="apartmentUnit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Apartment/Unit</FormLabel>
                  <FormControl>
                    <Input placeholder="Unit 123" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormDescription>
                    Apartment, unit, or room number
                  </FormDescription>
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
                    <Input placeholder="ABC Building" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormDescription>
                    Name of the building or complex
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              disabled={readOnly}
              control={form.control}
              name="premises"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Premises</FormLabel>
                  <FormControl>
                    <Input placeholder="Commercial/Residential" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormDescription>
                    Type of premises or landmark
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              disabled={readOnly}
              control={form.control}
              name="streetName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Street Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Main Street" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormDescription>
                    Name of the street or road
                  </FormDescription>
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
                    <Input placeholder="Barangay name" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormDescription>
                    Barangay or district name
                  </FormDescription>
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
                    <Input placeholder="Subdivision name" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormDescription>
                    Subdivision or village name
                  </FormDescription>
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
                <FormLabel>State or Province</FormLabel>
                <FormControl>
                  <Input placeholder="Your State or Province" {...field} />
                </FormControl>
                <FormDescription>
                  State or Province that you belong to.
                </FormDescription>
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
                <FormLabel>City</FormLabel>
                <FormControl>
                  <Input placeholder="City here.." {...field} />
                </FormControl>
                <FormDescription>
                  City or Municipality that you belong to.
                </FormDescription>
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
                <FormLabel>Zip Code</FormLabel>
                <FormControl>
                  <Input placeholder="9000" {...field} type="number" inputMode="tel" />
                </FormControl>
                <FormDescription>
                  Postal code of your area.
                </FormDescription>
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
