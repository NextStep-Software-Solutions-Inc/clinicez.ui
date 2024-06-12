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
import dayjs from "dayjs";
import { CalendarIcon } from "lucide-react";
import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const vaccinationSchema = z.object({
  vaccineType: z.string().min(2, {
    message: "Vaccine type must be at least 2 characters.",
  }).max(30, {
    message: "Vaccine type must not be longer than 30 characters.",
  }),
  vaccine: z.string().min(2, {
    message: "Vaccine must be at least 2 characters.",
  }).max(30, {
    message: "Vaccine must not be longer than 30 characters.",
  }),
  dateGiven: z.date({
    required_error: "Please select a date.",
  }),
  route: z.string().min(2, {
    message: "Route must be at least 2 characters.",
  }).max(30, {
    message: "Route must not be longer than 30 characters.",
  }),
  dose: z.string().min(2, {
    message: "Dose must be at least 2 characters.",
  }).max(30, {
    message: "Dose must not be longer than 30 characters.",
  }),
  administeredBy: z.string().min(2, {
    message: "Administered by must be at least 2 characters.",
  }).max(30, {
    message: "Administered by must not be longer than 30 characters.",
  })
})
  interface VaxItemProps {
    vaccination: z.infer<typeof vaccinationSchema>;
    index: number;
    remove: (index: number) => void;
    update: (index: number, value: z.infer<typeof vaccinationSchema>) => void;
  }
  
export default function VaxItem({vaccination, index, remove, update}: VaxItemProps){
  const [isEditing, setIsEditing] = React.useState(false);
  
  const form = useForm<z.infer<typeof vaccinationSchema>>({
    resolver: zodResolver(vaccinationSchema),
    defaultValues: vaccination
  });
  
  const handleDoneEditing = (formData: FormData) => {
    form.handleSubmit((data) => {
      update(index, data);
      setIsEditing(false);
    })()
  }
    
  
  return (
    <>
      <ConditionalRender condition={!isEditing && !!vaccination.vaccineType}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center group/actions">
              <span>{vaccination.vaccineType}</span>
              <span  className="ml-auto space-x-2 invisible group-hover/actions:visible transition-all">
                <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)}>Edit</Button>
                <Button size="sm" variant="destructive" onClick={() => remove(index)}>Delete</Button>
              </span>
            </CardTitle>
            <Separator/>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 grid-cols-1 gap-4">
              <div>
                <div className="font-semibold">Vaccine</div>
                <div>{vaccination.vaccine}</div>
              </div>
              <div>
                <div className="font-semibold">Date Given</div>
                <div>{dayjs(vaccination.dateGiven).format("DD/MM/YYYY")}</div>
              </div>
              <div>
                <div className="font-semibold">Route</div>
                <div>{vaccination.route}</div>
              </div>
              <div>
                <div className="font-semibold">Dose</div>
                <div>{vaccination.dose}</div>
              </div>
              <div>
                <div className="font-semibold">Administered By</div>
                <div>{vaccination.administeredBy}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </ConditionalRender>
      <ConditionalRender condition={isEditing || !vaccination.vaccineType}>
        <Form {...form}>
          <form action={handleDoneEditing}>
            <Card className="ring-2">
              <CardHeader>
                <CardTitle className="flex items-center group/actions gap-2">
                  <FormField
                    control={form.control}
                    name="vaccineType"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Vaccine Type</FormLabel>
                        <FormControl>
                          <Select name="vaccine" onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select Vaccine Type"/>
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="covid-19">COVID-19</SelectItem>
                              <SelectItem value="hepB">Hepatitis B</SelectItem>
                              <SelectItem value="hepC">Hepatitis C</SelectItem>
                              <SelectItem value="pentavalent">Pentavalent</SelectItem>
                              <SelectItem value="polio">Polio</SelectItem>
                              <SelectItem value="rotavirus">Rotavirus</SelectItem>
                              <SelectItem value="varicella">Varicella</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormDescription>
                        Enter the type of vaccine administered.
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
                    name="vaccine"
                    render={({ field }) => (
                      <FormItem className="w-full">
                        <FormLabel>Vaccine</FormLabel>
                        <FormControl>
                          <Select name="vaccine" onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select Vaccine"/>
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="moderna">Moderna</SelectItem>
                              <SelectItem value="pfizer">Pfizer</SelectItem>
                              <SelectItem value="astrazeneca">AstraZeneca</SelectItem>
                              <SelectItem value="sinovac">Sinovac</SelectItem>
                              <SelectItem value="janssen">Janssen</SelectItem>
                              <SelectItem value="johnson">Johnson & Johnson</SelectItem>
                              <SelectItem value="sinopharm">Sinopharm</SelectItem>
                              <SelectItem value="sinovax">Sinovax</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormDescription>
                          Vaccine name or brand name.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="dose"
                    render={({ field }) => (
                      <FormItem className="w-full">
                        <FormLabel>Dose</FormLabel>
                        <FormControl>
                          <Select name="dose" onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select Dose"/>
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="1st">1st</SelectItem>
                              <SelectItem value="2nd">2nd</SelectItem>
                              <SelectItem value="3rd">3rd</SelectItem>
                              <SelectItem value="4th">4th</SelectItem>
                              <SelectItem value="5th">5th</SelectItem>
                              <SelectItem value="booster">Booster</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormDescription>
                          Enter 1st, 2nd, 3rd, etc. if applicable.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="route"
                    render={({ field }) => (
                      <FormItem className="w-full">
                        <FormLabel>Route</FormLabel>
                        <FormControl>
                          <Select name="dose" onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select Route"/>
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="intramuscular">Intramuscular</SelectItem>
                              <SelectItem value="subcutaneous">Subcutaneous</SelectItem>
                              <SelectItem value="intravenous">Intravenous</SelectItem>
                              <SelectItem value="oral">Oral</SelectItem>
                              <SelectItem value="nasal">Nasal</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormDescription>
                           Route of administration.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="dateGiven"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Date Received</FormLabel>
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
                          Date of vaccination.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="administeredBy"
                    render={({ field }) => (
                      <FormItem className="w-full">
                        <FormLabel>Administered By</FormLabel>
                        <FormControl>
                          <Input placeholder="DOH" {...field}  />
                        </FormControl>
                        <FormDescription>
                          Date of vaccination.
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