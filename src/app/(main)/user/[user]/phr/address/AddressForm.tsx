"use client";

import { Button } from "@components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@components/ui/form";
import { Input } from "@components/ui/input";
import { RadioGroup, RadioGroupItem } from "@components/ui/radio-group";
import { Separator } from "@components/ui/separator";
import Each from "@components/utils/Each";
import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";


const addressFormSchema = z.object({
  addresses: z.array(z.object({
    isPrimary: z.boolean(),
    address: z.string().min(2, {
      message: "Name must be at least 2 characters.",
    }).max(30, {
      message: "Name must not be longer than 30 characters.",
    }),
    city: z.string().min(2, {
      message: "City must be at least 2 characters.",
    }).max(30, {
      message: "City must not be longer than 30 characters.",
    }),
    state: z.string().min(2, {
      message: "State must be at least 2 characters.",
    }).max(30, {
      message: "State must not be longer than 30 characters.",
    }),
    zip: z.string().min(2, {
      message: "Zip must be at least 2 characters.",
    }).max(30, {
      message: "Zip must not be longer than 30 characters.",
    }),
  })),
})

export default function AddressFormForm() {
  const form = useForm<z.infer<typeof addressFormSchema>>({
    resolver: zodResolver(addressFormSchema),
  });


  const {fields, append, remove} = useFieldArray({
    control: form.control,
    name: "addresses",
  });

  function onSubmit(data: z.infer<typeof addressFormSchema>) {
    toast("You submitted the following values:")
  }

  
  const indexedFields = fields.map((field, index) => ({ ...field, index}));

  const addresses = {
    primary: indexedFields.filter(field => field.isPrimary),
    secondary: indexedFields.filter(field => !field.isPrimary),
  };

  const defaultValues = {
    primary: {
      isPrimary: true,
      address: "",
      city: "",
      state: "",
      zip: "",
    },
    secondary: {
      isPrimary: false,
      address: "",
      city: "",
      state: "",
      zip: "",
    },
  }
  return (
    <div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Each
            of={Object.keys(addresses)}
            render={(key) => (
              <Card key={key}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="capitalize">{key} Address</span>
                    <Button className="capitalize" type="button" onClick={() => append(defaultValues[key as keyof typeof defaultValues])}>Add {key} Address</Button>
                  </CardTitle>
                  <Separator />
                </CardHeader>
                <CardContent>
                  <Each
                    of={addresses[key as keyof typeof addresses]}
                    render={(field, index) => (
                      <div className="space-y-3">
                        <FormField
                          control={form.control}
                          name={`addresses.${field.index}.address`}
                          render={({ field }) => (
                            <FormItem className="w-full">
                              <FormLabel>Address</FormLabel>
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
                          name={`addresses.${field.index}.state`}
                          render={({ field }) => (
                            <FormItem className="w-full">
                              <FormLabel>State or Province</FormLabel>
                              <FormControl>
                                <Input placeholder="Your State or Province" {...field} />
                              </FormControl>
                              <FormDescription>
                                Municipality or State or Province that you belong to.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`addresses.${field.index}.city`}
                          render={({ field }) => (
                            <FormItem className="w-full">
                              <FormLabel>City</FormLabel>
                              <FormControl>
                                <Input placeholder="City here.." {...field} />
                              </FormControl>
                              <FormDescription>
                                City or Town that you belong to.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`addresses.${field.index}.zip`}
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
                        <Button className="flex ml-auto" type="button" variant="destructive" onClick={() => remove(field.index)}>Remove</Button>
                        {index !== addresses[key as keyof typeof addresses].length - 1 && <Separator />}
                      </div> 
                    )}
                  />
                </CardContent>
              </Card>
            )}
          />
          {form.formState.isValid && <Button disabled={form.formState.isLoading}>Save</Button>}
        </form>
      </Form>
    </div>
  );
}
