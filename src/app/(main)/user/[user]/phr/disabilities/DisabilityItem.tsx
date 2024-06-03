import ActionButton from "@components/ActionButton";
import { Button } from "@components/ui/button";
import { Calendar } from "@components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@components/ui/form";
import { Input } from "@components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@components/ui/select";
import { Separator } from "@components/ui/separator";
import ConditionalRender from "@components/utils/ConditionalRender";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "@lib/utils";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

export const disabilitySchema = z.object({
  type: z.string().min(2, {
    message: "Type must be at least 2 characters.",
  }).max(30, {
    message: "Type must not be longer than 30 characters.",
  }),
  dateDiagnosed: z.date({
    required_error: "Please select a date.",
  }),
  severity: z.string().min(2, {
    message: "Severity must be at least 2 characters.",
  }).max(30, {
    message: "Severity must not be longer than 30 characters.",
  }),
  notes: z.string().optional(),
})

interface DisabilityItemProps {
  disability: z.infer<typeof disabilitySchema>;
  index: number;
  remove: (index: number) => void;
  update: (index: number, value: z.infer<typeof disabilitySchema>) => void;
}
  
export default function DisabilityItem({disability, index, remove, update}: DisabilityItemProps){
  const [isEditing, setIsEditing] = React.useState(false);
  
  const form = useForm<z.infer<typeof disabilitySchema>>({
    resolver: zodResolver(disabilitySchema),
    defaultValues: disability
  });
  
  const handleDoneEditing = async (formData: FormData) => {
    
    form.handleSubmit((data) => {
      update(index, data);
      setIsEditing(false);
    })()
  }
    
  
  return (
    <>
      <ConditionalRender condition={!isEditing && !!disability.type}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center group/actions">
              <span>{disability.type}</span>
              <span  className="ml-auto space-x-2 invisible group-hover/actions:visible transition-all">
                <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)}>Edit</Button>
                <Button size="sm" variant="destructive" type="button" onClick={() => remove(index)}>Delete</Button>
              </span>
            </CardTitle>
            <Separator/>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <span>Date Diagnosed: {disability.dateDiagnosed.toString()}</span>
              </div>
              <div>
                <span>Severity: {disability.severity}</span>
              </div>
              <div>
                <span>Notes: {disability.notes}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </ConditionalRender>
      <ConditionalRender condition={isEditing || !disability.type}>
        <Form {...form}>
          <form action={handleDoneEditing}>
            <Card className="ring-2">
              <CardHeader>
                <CardTitle className="flex items-center group/actions gap-2">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Type</FormLabel>
                        <FormControl>
                          <Select name="vaccine" onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select Type"/>
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="amputee">Amputee</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormDescription>
                        Enter the type of disability.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <span  className="ml-auto space-x-2 invisible group-hover/actions:visible transition-all">
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
                    name="dateDiagnosed"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Date Diagnosed</FormLabel>
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
                          Date the patient was diagnosed with the condition
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="severity"
                    render={({ field }) => (
                      <FormItem className="w-full">
                        <FormLabel>Severity</FormLabel>
                        <FormControl>
                          <Select name="vaccine" onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select Severity"/>
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="mild">Mild</SelectItem>
                              <SelectItem value="moderate">Moderate</SelectItem>
                              <SelectItem value="severe">Severe</SelectItem>
                              <SelectItem value="critical">Critical</SelectItem>
                              <SelectItem value="profound">Profound</SelectItem>
                              <SelectItem value="unknown">Unknown</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormDescription>
                          Severity of the condition.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                 
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem className="w-full">
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Input placeholder="Add notes here..." {...field}  />
                        </FormControl>
                        <FormDescription>
                          Additional notes about the condition.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </form>
        </Form>
      </ConditionalRender>
    </>
  )
}