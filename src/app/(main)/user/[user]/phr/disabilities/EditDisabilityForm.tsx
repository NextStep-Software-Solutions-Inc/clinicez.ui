"use client";


import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@components/ui/form";
import DoneEditingDisabilityButton from "./DoneEditingDisabilityButton";
import DeleteDisabilityButton from "./DeleteDisabilityButton";
import { ComboBox } from "./ComboBox";
import { Separator } from "@components/ui/separator";
import Each from "@components/utils/Each";
import { RadioGroup, RadioGroupItem } from "@components/ui/radio-group";
import { Severity } from "@prisma/common/client";
import { Input } from "@components/ui/input";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { Disability } from "./DisabilityList";
import { getDisabilityAction } from "@actions/disability.action";

interface EditDisabilityFormProps {
  index: number;
  disability: Disability
  remove: (index: number) => void;
  onUpdate: (index: number, value: Disability) => void;
}
  
export default function EditDisabilityForm({ disability, index, remove, onUpdate}:EditDisabilityFormProps ) {
  const [disabilities, setDisabilities] = useState<string[]>([])

  const form = useForm<Disability>({
    defaultValues: disability
  });

  useEffect(() => {
    (async () => {
      const disabilities = await getDisabilityAction()
      await setDisabilities(() => disabilities.map(({name}) => name))
    })()
  }, [])
  
  return (
    <Form {...form}>
      <Card className="ring-2 basis-full">
        <CardHeader>
          <span className="ml-auto flex space-x-2 group-hover/actions:visible transition-all">
            <DoneEditingDisabilityButton form={form} index={index} onUpdate={onUpdate}/>
            <DeleteDisabilityButton disabilityId={disability.id} remove={remove} index={index}/>
          </span>
          <CardTitle className="flex items-center group/actions gap-2">
            <FormField
              rules={{
                required: "Disability name is required"
              }}
              control={form.control}
              name="Disability.name"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>Disability</FormLabel>
                  <ComboBox 
                    options={disabilities}
                    value={field.value} onChange={field.onChange}
                  />
                  <FormDescription>
                    Enter the name of disability
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardTitle>
          <Separator/>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <FormField
              control={form.control}
              name="severity"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Severity</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex gap-2 flex-wrap"
                    >
                      <Each
                        of={Object.values(Severity)}
                        render={(severity) => (
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value={severity} />
                            </FormControl>
                            <FormLabel className="font-normal capitalize">
                              {severity.toLowerCase()}
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    </RadioGroup>
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
              name="dateDiagnosed"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date Diagnosed</FormLabel>
                  <FormControl>
                    <Input
                      name={field.name}
                      onChange={e => field.onChange(new Date(e.target.value))}
                      value={field.value ? format(field.value, "yyyy-MM-dd") : ""}
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
              name="notes"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Notes (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Add notes here..." {...field} value={field.value ?? ""}  />
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
    </Form>
  )
}
  