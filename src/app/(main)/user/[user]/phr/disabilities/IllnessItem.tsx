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

export const illnessSchema = z.object({
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

interface IllnessItemProps {
  illness: z.infer<typeof illnessSchema>;
  index: number;
  remove: (index: number) => void;
  update: (index: number, value: z.infer<typeof illnessSchema>) => void;
}
  
export default function IllnessItem({illness, index, remove, update}: IllnessItemProps){
  const [isEditing, setIsEditing] = React.useState(false);
  
  const form = useForm<z.infer<typeof illnessSchema>>({
    resolver: zodResolver(illnessSchema),
    defaultValues: illness
  });
  
  const handleDoneEditing = (formData: FormData) => {
    form.handleSubmit((data) => {
      update(index, data);
      setIsEditing(false);
    })()
  }
    
  
  return (
    <>
      <ConditionalRender condition={!isEditing && !!illness.type}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center group/actions">
              <span>{illness.type}</span>
              <span  className="ml-auto space-x-2 invisible group-hover/actions:visible transition-all">
                <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)}>Edit</Button>
                <Button size="sm" variant="destructive" onClick={() => remove(index)}>Delete</Button>
              </span>
            </CardTitle>
            <Separator/>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <span>Date Diagnosed: {illness.dateDiagnosed.toString()}</span>
              </div>
              <div>
                <span>Severity: {illness.severity}</span>
              </div>
              <div>
                <span>Notes: {illness.notes}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </ConditionalRender>
      <ConditionalRender condition={isEditing || !illness.type}>
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
                              <SelectItem value="asthma">Asthma</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormDescription>
                        Enter the type of illness.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <span  className="ml-auto space-x-2 group-hover/actions:visible transition-all">
                    <ActionButton size="sm" variant="ghost" >Done Editing</ActionButton>
                    <Button size="sm" variant="destructive" onClick={() => remove(index)}>Delete</Button>
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
                          <Input
                            name={field.name}
                            onChange={e => field.onChange(new Date(e.target.value))}
                            defaultValue={field.value ? format(field.value, "yyyy-MM-dd") : ""}
                            type="date"
                            placeholder="Select date" 
                          />
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