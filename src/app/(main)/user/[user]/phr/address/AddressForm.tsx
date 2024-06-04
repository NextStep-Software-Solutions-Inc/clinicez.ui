"use client";

import ActionButton from "@components/ActionButton";
import { Button } from "@components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@components/ui/form";
import { Input } from "@components/ui/input";
import { Separator } from "@components/ui/separator";
import { toast } from "@components/ui/use-toast";
import Each from "@components/utils/Each";
import { zodResolver } from "@hookform/resolvers/zod";
import { delay } from "@lib/wait";
import React from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";


const addressFormSchema = z.object({
  addresses: z.array(z.object({
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
    defaultValues: {
      addresses: [],
    }
  });

  const {fields, append, remove} = useFieldArray({
    control: form.control,
    name: "addresses",
  });

  const indexedFields = fields.map((field, index) => ({ ...field, index}));

  const addresses = {
    primary: indexedFields.filter(field => field.isPrimary),
    secondary: indexedFields.filter(field => !field.isPrimary),
  };

  const initialAddressValues = {
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

  const handleSaveChanges = async (formData: FormData) => {
    await delay(1000);
    form.handleSubmit((data) => {
      form.reset(data);
      toast({
        title: "You submitted the following values:",
        description: (
          <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
            <code className="text-white">{JSON.stringify(data, null, 2)}</code>
          </pre>
        ),
      })
    })();
  };

  return (
    <div>
      <Form {...form}>
        <form action={handleSaveChanges} className="space-y-8">
          <Each
            of={Object.keys(addresses)}
            render={(key) => (
              <Card key={key}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="capitalize">{key} Address</span>
                    <Button className="capitalize" type="button" onClick={() => append(initialAddressValues[key as keyof typeof initialAddressValues])}>Add {key} Address</Button>
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
          {form.formState.isDirty && <ActionButton disabled={form.formState.isLoading || !form.formState.isValid}>Save Changes</ActionButton>}
        </form>
      </Form>
    </div>
  );
}
