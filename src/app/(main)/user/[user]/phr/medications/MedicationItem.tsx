import ActionButton from "@components/ActionButton";
import { Button } from "@components/ui/button";
import { Calendar } from "@components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@components/ui/form";
import { Input } from "@components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@components/ui/popover";
import { Separator } from "@components/ui/separator";
import { toast } from "@components/ui/use-toast";
import ConditionalRender from "@components/utils/ConditionalRender";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "@lib/utils";
import { delay } from "@lib/wait";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

export const medicationSchema = z.object({
  id: z.number(),
  name: z.string({
    required_error: "Medication name is required",
  }).min(2, "Name must be at least 2 characters")
    .max(255, "Name must not be longer than 30 characters"),
  reason: z.string({
    required_error: "Reason is required",
  }).min(2, "Reason must be at least 2 characters")
    .max(255, "Reason must not be longer than 30 characters"),
  dateStarted: z.date(),
  dateResolved: z.date(),
})

  type Medication = z.infer<typeof medicationSchema>;
interface MedicationItemProps {
    medication: Medication;
    index: number;
    remove: (index: number) => void;
    update: (index: number, data: Medication) => void;
}


export default function MedicationItem({ medication, index, remove, update }: MedicationItemProps) {

  const [isEditing, setIsEditing] = React.useState(!medication.name);

  const form = useForm<Medication>({
    resolver: zodResolver(medicationSchema),
    defaultValues: medication
  });

  const handleDoneEditing = async () => {
    await delay(100);
    form.handleSubmit((data) => {
      update(index, data);
      setIsEditing(false);
      toast({
        title: "Medication Updated",
        description: "Medication has been updated successfully.",
      })
    })();
  };
  return (
    <>
      <ConditionalRender condition={!isEditing}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center group/actions">
              <span>{medication.name}</span>
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
                  <div className="font-semibold">Reaction</div>
                  <div>{medication.reason}</div>
                </div>
                <div>
                  <div className="font-semibold">Date Started</div>
                  <div>{format(medication.dateStarted, "PP")}</div>
                </div>
                <div>
                  <div className="font-semibold">Date Resolved</div>
                  <div>{format(medication.dateResolved, "PP")}</div>
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
                    name="name"
                    render={({ field }) => (
                      <FormItem className="flex-1 ">
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter name" {...field}  />
                        </FormControl>
                        <FormDescription>
                          What is the name of the medication?
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <span  className="ml-auto space-x-2 group-hover/actions:visible transition-all">
                    <ActionButton size="sm" variant="ghost" >Done Editing</ActionButton>
                    <Button size="sm" variant="destructive" type="button" onClick={() => remove(index)}>Delete</Button>
                  </span>
                </CardTitle>
                <Separator/>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <FormField
                    control={form.control}
                    name="reason"
                    render={({ field }) => (
                      <FormItem className="w-full">
                        <FormLabel>Reason</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter here..." {...field}  />
                        </FormControl>
                        <FormDescription>
                          What is the reason for the medication?
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
                          When did you start taking this medication?
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="dateResolved"
                      render={({ field }) => (
                        <FormItem className="w-full flex-col flex">
                          <FormLabel>Date Resolved</FormLabel>
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
                          When did you resolve this medication?
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
