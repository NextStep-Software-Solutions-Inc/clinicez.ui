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
    defaultValues: address
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
            control={form.control}
            name={`country`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Country</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
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
            control={form.control}
            name={`address`}
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Address Line</FormLabel>
                <FormControl>
                  <Input placeholder="Your location" {...field} />
                </FormControl>
                <FormDescription>
                  House number, street name, Village or Town, etc. 
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
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
          <div className="flex gap-2 justify-end">
            {form.formState.isDirty &&  <ActionButton formAction={saveChangesAction} variant="default">Save Changes</ActionButton>}
            <ActionButton formAction={deleteAction} variant="destructive">Remove</ActionButton>
          </div>
        </ConditionalRender>
      </form>
    </Form>
  );
};
