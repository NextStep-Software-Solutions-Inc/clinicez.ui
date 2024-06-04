"use client";

import ActionButton from "@components/ActionButton";
import { Button } from "@components/ui/button";
import { Calendar } from "@components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@components/ui/form";
import { Input } from "@components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@components/ui/popover";
import { Separator } from "@components/ui/separator";
import ConditionalRender from "@components/utils/ConditionalRender";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "@lib/utils";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

export const hmoSchema = z.object({
  provider: z.string({
    required_error: "Provider is required",
  }).min(2, "Provider must be at least 2 characters")
    .max(255, "Provider must not be longer than 255 characters"),
  policyNumber: z.string({
    required_error: "Policy number is required",
  }).min(2, "Policy number must be at least 2 characters").max(255, "Policy number must not be longer than 255 characters"),
  policyType: z.string({
    required_error: "Policy type is required",
  }).min(2, "Policy type must be at least 2 characters").max(255, "Policy type must not be longer than 255 characters"),
  dateStarted: z.date(),
  dateEnded: z.date(),
  notes: z.string().optional(),
})

type HMO = z.infer<typeof hmoSchema>;

interface HMOItemProps {
  hmo: HMO;
  index: number;
  update: (index: number, data: HMO) => void;
  remove: (index: number) => void;
}

export default function HMOItem({ hmo, index, update, remove }: HMOItemProps) {
  const [isEditing, setIsEditing] = React.useState(!hmo.provider);

  const form = useForm<HMO>({
    resolver: zodResolver(hmoSchema),
    defaultValues: hmo
  });

  const handleDoneEditing = async () => {
    form.handleSubmit((data) => {
      update(index, form.getValues());
      setIsEditing(false);
    })()
  }

  return (
    <>
      <ConditionalRender condition={!isEditing}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center group/actions">
              <span>{hmo.provider}</span>
              <span  className="ml-auto space-x-2 invisible group-hover/actions:visible transition-all">
                <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)}>Edit</Button>
                <Button size="sm" variant="destructive" onClick={() => remove(index)}>Delete</Button>
              </span>
            </CardTitle>
            <Separator />
          </CardHeader>
          <CardContent>
            <section>
              <div className="grid sm:grid-cols-2 grid-cols-1 gap-4">
                <div>
                  <div className="font-semibold">Policy Number</div>
                  <div>{hmo.policyNumber}</div>
                </div>
                <div>
                  <div className="font-semibold">Policy Type</div>
                  <div>{hmo.policyType}</div>
                </div>
                <div>
                  <div className="font-semibold">Date Started</div>
                  <div>{format(hmo.dateStarted, "PP")}</div>
                </div>
                <div>
                  <div className="font-semibold">Date Ended</div>
                  <div>{format(hmo.dateEnded, "PP")}</div>
                </div>
                <div>
                  <div className="font-semibold">Notes</div>
                  <div>{hmo.notes}</div>
                </div>
              </div>
            </section>
          </CardContent>
        </Card>
      </ConditionalRender>
      <ConditionalRender condition={isEditing}>
        <Form {...form}>
          <form action={handleDoneEditing}>
            <Card className="ring-2 m-1">
              <CardHeader>
                <CardTitle className="flex items-center group/actions gap-2">
                  <FormField
                    control={form.control}
                    name="provider"
                    render={({ field }) => (
                      <FormItem className="flex-1 ">
                        <FormLabel>Provider</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter hmo provider" {...field}  />
                        </FormControl>
                        <FormDescription>
                          Who is your hmo provider?
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <span  className="ml-auto space-x-2 group-hover/actions:visible transition-all">
                    <ActionButton size="sm" variant="ghost">Done Editing</ActionButton>
                    <Button size="sm" variant="destructive" type="button" onClick={() => remove(index)}>Delete</Button>
                  </span>
                </CardTitle>
                <Separator/>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <FormField
                    control={form.control}
                    name="policyType"
                    render={({ field }) => (
                      <FormItem className="w-full">
                        <FormLabel>Policy Type</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter here..." {...field}  />
                        </FormControl>
                        <FormDescription>
                          Life, Health, etc.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex">
                    <FormField
                      control={form.control}
                      name="dateStarted"
                      render={({ field }) => (
                        <FormItem className="w-full flex-col flex">
                          <FormLabel>Date Started</FormLabel>
                          <FormControl>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className={cn(
                                      "w-[240px] pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, "PPP")
                                    ) : (
                                      <span>Pick a date</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  disabled={(date) =>
                                    date > new Date() || date < new Date("1900-01-01")
                                  }
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </FormControl>
                          <FormDescription>
                            When did you start your policy?
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="dateEnded"
                      render={({ field }) => (
                        <FormItem className="w-full flex-col flex">
                          <FormLabel>Expiry Date</FormLabel>
                          <FormControl>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className={cn(
                                      "w-[240px] pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, "PPP")
                                    ) : (
                                      <span>Pick a date</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  disabled={(date) =>
                                    date > new Date() || date < new Date("1900-01-01")
                                  }
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </FormControl>
                          <FormDescription>
                            When will your policy expire?
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </form>
        </Form>
      </ConditionalRender>
    </>
  );
}
