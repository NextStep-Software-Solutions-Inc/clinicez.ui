"use client";

import ActionButton from "@components/ActionButton";
import { Button } from "@components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@components/ui/form";
import { Input } from "@components/ui/input";
import { RadioGroup, RadioGroupItem } from "@components/ui/radio-group";
import { Separator } from "@components/ui/separator";
import { toast } from "@components/ui/use-toast";
import Each from "@components/utils/Each";
import { zodResolver } from "@hookform/resolvers/zod";
import { delay } from "@lib/wait";
import React from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";


const emergencyContactFormSchema = z.object({
  contacts: z.array(z.object({
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
  })),
})

export default function EmergencyContactForm() {
  const form = useForm<z.infer<typeof emergencyContactFormSchema>>({
    resolver: zodResolver(emergencyContactFormSchema),
    defaultValues: {
      contacts: []
    }
  });


  const {fields, append, remove} = useFieldArray({
    control: form.control,
    name: "contacts",
  });


  const indexedFields = fields.map((field, index) => ({ ...field, index}));

  const contacts = {
    primary: indexedFields.filter(field => field.isPrimary),
    secondary: indexedFields.filter(field => !field.isPrimary),
  };

  const handleSaveChanges = async (formData: FormData) => {
    await delay(1000);
    form.handleSubmit((data) => {
      form.reset(data)
      toast({
        title: "You submitted the following values:",
        description: (
          <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
            <code className="text-white">{JSON.stringify(data, null, 2)}</code>
          </pre>
        ),
      })
    })()
  }

  return (
    <div>
      <Form {...form}>
        <form action={handleSaveChanges} className="space-y-8">
          <Each
            of={Object.keys(contacts)}
            render={(key) => (
              <Card key={key}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="capitalize">{key} Contacts</span>
                    <Button className="capitalize" type="button" onClick={() => append({ isPrimary: key === "primary", name: "", relationship: "", phone: "" })}>Add {key} Contact</Button>
                  </CardTitle>
                  <Separator />
                </CardHeader>
                <CardContent>
                  <Each
                    of={contacts[key as keyof typeof contacts]}
                    render={(field, index) => (
                      <div className="space-y-3">
                        <FormField
                          control={form.control}
                          name={`contacts.${field.index}.relationship`}
                          render={({ field }) => (
                            <FormItem className="space-y-3">
                              <FormLabel>Relationship</FormLabel>
                              <FormControl>
                                <RadioGroup
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                  className="flex space-y-1"
                                >
                                  <Each
                                    of={["parent", "sibling", "relative", "others"]}
                                    render={(value) => (
                                      <FormItem className="flex items-center space-x-3 space-y-0">
                                        <FormControl>
                                          <RadioGroupItem value={value} />
                                        </FormControl>
                                        <FormLabel className="font-normal capitalize">{value}</FormLabel>
                                      </FormItem>
                                    )}
                                  />
                                </RadioGroup>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`contacts.${field.index}.name`}
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
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`contacts.${field.index}.phone`}
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
                          )}
                        />
                        <Button className="flex ml-auto" type="button" variant="destructive" onClick={() => remove(field.index)}>Remove</Button>
                        {index !== contacts[key as keyof typeof contacts].length - 1 && <Separator />}
                      </div> 
                    )}
                  />
                </CardContent>
              </Card>
            )}
          />
          { form.formState.isDirty && <ActionButton disabled={form.formState.isLoading || !form.formState.isValid}>Save Changes</ActionButton> }
        </form>
      </Form>
    </div>
  );
}
