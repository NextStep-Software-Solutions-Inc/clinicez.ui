"use client";

import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@components/ui/form";
import DoneEditingIllnessButton from "./DoneEditingIllnessButton";
import DeleteIllnessButton from "./DeleteIllnessButton";
import { ComboBox } from "./ComboBox";
import { Separator } from "@components/ui/separator";
import Each from "@components/utils/Each";
import { RadioGroup, RadioGroupItem } from "@components/ui/radio-group";
import { Severity } from "@prisma/client";
import { Input } from "@components/ui/input";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { getHealthConditionsAction } from "@actions/health-condition.action";
import { Illness } from "./IllnessList";
import { getMaxDate } from "@/lib/day-utils";

interface EditIllnessFormProps {
  index: number;
  illness: Illness
  remove: (index: number) => void;
  onUpdate: (index: number, value: Illness) => void;
}

export default function EditIllnessForm({ illness, index, remove, onUpdate }: EditIllnessFormProps) {

  const [conditions, setConditions] = useState<string[]>([])

  const form = useForm<Illness>({
    defaultValues: illness
  });

  useEffect(() => {
    (async () => {
      const conditions = await getHealthConditionsAction()
      await setConditions(() => conditions.map(({ name }) => name))
    })()
  }, [])

  return (
    <Form {...form}>
      <Card className="ring-2 basis-full">
        <CardHeader>
          <span className="ml-auto flex space-x-2 group-hover/actions:visible transition-all">
            <DoneEditingIllnessButton form={form} index={index} onUpdate={onUpdate} />
            <DeleteIllnessButton illnessId={illness.id} remove={remove} index={index} />
          </span>
          <CardTitle className="flex items-center group/actions gap-2">
            <FormField
              rules={{
                required: "Illness name is required"
              }}
              control={form.control}
              name="HealthCondition.name"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>Illness</FormLabel>
                  <ComboBox
                    options={conditions}
                    value={field.value} onChange={field.onChange}
                  />
                  <FormDescription>
                    Enter the name of illness
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardTitle>
          <Separator />
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
                      value={field.value}
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
                      max={getMaxDate()}
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
                    <Input placeholder="Add notes here..." {...field} value={field.value ?? ""} />
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
