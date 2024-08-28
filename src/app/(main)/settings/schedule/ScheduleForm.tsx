import DatePickerWithRange from "@components/DatePickerWithRange";
import { Checkbox } from "@components/ui/checkbox";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@components/ui/form";
import { Input } from "@components/ui/input";
import { RadioGroup, RadioGroupItem } from "@components/ui/radio-group";
import Each from "@components/utils/Each";
import { ArrowRight } from "lucide-react";
import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

export const scheduleFormSchema = z.object({
  dateRange: z.object({
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
  }, {
    required_error: "Date range is required"
  }),
  startTime: z.coerce.string({
    message: "Start time is required"
  }),
  endTime: z.coerce.string({
    message: "End time is required"
  }),
  isRecurring: z.boolean(),
  pattern: z.string(),
  daysOfWeek: z.array(z.number()).superRefine(({}, ctx) => {}),
  weekOfMonth: z.array(z.number())
}).superRefine((value, ctx) => {
  value.isRecurring && ["weekly", "monthly"].includes(value.pattern) && !value.daysOfWeek.length && ctx.addIssue({
    message: "Select at least one day of the week",
    code: "invalid_intersection_types",
    path: ["daysOfWeek"]
  });
  value.isRecurring && value.pattern === "monthly" && !value.weekOfMonth.length && ctx.addIssue({
    message: "Select at least one week of the month",
    code: "invalid_intersection_types",
    path: ["weekOfMonth"]
  });
  !(value.dateRange.from || value.dateRange.to) && ctx.addIssue({
    message: "Date range is required",
    code: "invalid_intersection_types",
    path: ["dateRange"]
  });
  console.log({
    startTime: !value.startTime.trim().length,
    endTime: !value.endTime.trim().length
  });
  !value.startTime.trim().length && ctx.addIssue({
    message: "Start and End time is required",
    code: "invalid_intersection_types",
    path: ["startTime"]
  });
  !value.endTime.trim().length && ctx.addIssue({
    message: "Start and End time is required",
    code: "invalid_intersection_types",
    path: ["endTime"]
  });
  // the end time should be greater than the start time
  if(value.dateRange.from && value.dateRange.to) {
    const startTime = new Date(new Date(value.dateRange.from).toISOString().split("T")[0] + "T" + value.startTime).getTime()
    const endTime = new Date(new Date(value.dateRange.to).toISOString().split("T")[0] + "T" + value.endTime).getTime()
    startTime > endTime && ctx.addIssue({
      message: "End time should be greater than the start time",
      code: "invalid_intersection_types",
      path: ["endTime"]
    });
  }
})
  
const daysOfWeek = [
  {
    id: 0,
    label: "Sunday"
  }, {
    id: 1,
    label: "Monday"
  }, {
    id: 2,
    label: "Tuesday"
  }, {
    id: 3,
    label: "Wednesday"
  }, {
    id: 4,
    label: "Thursday"
  }, {
    id: 5,
    label: "Friday"
  }, {
    id: 6,
    label: "Saturday"
  }
]
const weekOfMonth = [
  {
    id: 1,
    label: "First"
  }, {
    id: 2,
    label: "Second"
  }, {
    id: 3,
    label: "Third"
  }, {
    id: 4,
    label: "Fourth"
  }, {
    id: 5,
    label: "Fifth"
  }
]
  
export type ScheduleFormType = z.infer<typeof scheduleFormSchema>
  
  interface ScheduleFormProps {
    form: ReturnType<typeof useForm<ScheduleFormType>>
  }
export default function ScheduleForm({form}:ScheduleFormProps) {
  
  const isRecurring = form.watch("isRecurring")
  const pattern = form.watch("pattern") 
  return (
    <div className="my-10 space-y-5">
      <FormField
        control={form.control}
        name="dateRange"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Date Range</FormLabel>
            <DatePickerWithRange 
              onDatesChange={dates => form.setValue(field.name, dates)}  
              value={{
                from: field.value?.from,
                to: field.value?.to
              }}
            />
            <FormDescription>
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="flex items-center gap-5 flex-wrap">
        <FormField
          control={form.control}
          name="startTime"
          render={({ field }) => (
            <FormItem className="flex-grow">
              <FormLabel>Start Time</FormLabel>
              <FormControl>
                <Input {...field}  type="time" />
              </FormControl>
              <FormDescription>
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <ArrowRight className="w-4 h-4" />
        <FormField
          control={form.control}
          name="endTime"
          render={({ field }) => (
            <FormItem className="flex-grow">
              <FormLabel>End Time</FormLabel>
              <FormControl>
                <Input {...field} type="time" />
              </FormControl>
              <FormDescription>
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <FormField
        control={form.control}
        name="isRecurring"
        render={({field}) => (
          <FormItem className="flex gap-2 items-end">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
            <FormLabel className="font-normal">
              Recurring
            </FormLabel>
          </FormItem>
        )}
      />
      {
        isRecurring &&
            <FormField
              control={form.control}
              name="pattern"
              render={({field}) => (
                <FormItem className="space-x-3">
                  <FormLabel>Recurring Pattern</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-row items-center gap-5 flex-wrap"
                    >
                      <Each
                        of={["daily", "weekly", "monthly"]}
                        render={(pattern) => (
                          <FormItem
                            key={pattern}
                            className="flex items-center space-x-1 space-y-0"
                          >
                            <FormControl>
                              <RadioGroupItem value={pattern} />
                            </FormControl>
                            <FormLabel className="font-normal capitalize">
                              {pattern}
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
      }
      {
        (isRecurring && pattern !== "daily") &&
            <FormField
              control={form.control}
              name="daysOfWeek"
              render={() => (
                <FormItem className="space-x-3">
                  <div className="mb-4">
                    <FormLabel className="text-base">Days of Week</FormLabel>
                    <FormDescription>
                    Select the days of the week you want to set the schedule for.
                    </FormDescription>
                  </div>
                  <div className="flex gap-2 items-center flex-wrap">
                    <Each
                      of={daysOfWeek}
                      render={(day) => (
                        <FormField
                          key={day.id}
                          control={form.control}
                          name="daysOfWeek"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={day.id}
                                className="flex flex-row items-start space-x-2 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(day.id)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value, day.id])
                                        : field.onChange(
                                          field.value?.filter(
                                            (value) => value !== day.id
                                          )
                                        )
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  {day.label}
                                </FormLabel>
                              </FormItem>
                            )
                          }}
                        />
                      )}
                    />
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            
      }
      {
        (isRecurring && pattern === "monthly") &&
            <FormField
              control={form.control}
              name="weekOfMonth"
              render={() => (
                <FormItem className="space-x-3">
                  <div className="mb-4">
                    <FormLabel className="text-base">Weeks of the Month </FormLabel>
                    <FormDescription>
                    Select the weeks of the month you want to set the schedule for.
                    </FormDescription>
                  </div>
                  <div className="flex gap-2 items-center flex-wrap">
                    <Each
                      of={weekOfMonth}
                      render={(week) => (
                        <FormField
                          key={week.id}
                          control={form.control}
                          name="weekOfMonth"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={week.id}
                                className="flex flex-row items-start space-x-2 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(week.id)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value, week.id])
                                        : field.onChange(
                                          field.value?.filter(
                                            (value) => value !== week.id
                                          )
                                        )
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  {week.label}
                                </FormLabel>
                              </FormItem>
                            )
                          }}
                        />
                      )}
                    />
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
      }
    </div>
  );
}
