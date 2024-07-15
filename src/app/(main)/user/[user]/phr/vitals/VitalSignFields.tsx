
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@components/ui/form"
import { Input } from "@components/ui/input"
import { Separator } from "@components/ui/separator"
import { Textarea } from "@components/ui/textarea"
import { formatDate } from "date-fns"
import dayjs from "dayjs"
import { useForm } from "react-hook-form"
import { z } from "zod"


export const vitalSignsSchema = z.object({
  height: z.coerce.number().optional(),
  weight: z.coerce.number().optional(),
  temp: z.coerce.number().optional(),
  pulseRate: z.coerce.number().optional(),
  respRate: z.coerce.number().optional(),
  spo2: z.coerce.number().optional(),
  bpSystolic: z.coerce.number().optional(),
  bpDiastolic: z.coerce.number().optional(),
  bmi: z.coerce.number().optional(),
  notes: z.string().optional(),
  dateTaken: z.coerce.date({
    required_error: "Date taken is required"
  })
})

export type VitalSignsType = z.infer<typeof vitalSignsSchema>

interface VitalSignsFieldsProps {
    form: ReturnType<typeof useForm<VitalSignsType>>
}

export default function VitalSignsFields({form}: VitalSignsFieldsProps){
  
  return (
    <>
      <div className="flex flex-wrap gap-2 items-center">
        <FormField
          control={form.control}
          name="height"
          render={({ field }) => (
            <FormItem className="flex-grow">
              <FormLabel>Height</FormLabel>
              <FormControl>
                <Input type="number" inputMode="numeric" placeholder="Enter height in centimeter" {...field} />
              </FormControl>
              <FormDescription>Height in cm</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="weight"
          render={({ field }) => (
            <FormItem className="flex-grow">
              <FormLabel>Weight</FormLabel>
              <FormControl>
                <Input type="number" inputMode="numeric" placeholder="Enter weight in kilograms" {...field} />
              </FormControl>
              <FormDescription>Weight in kilograms</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <FormField
        control={form.control}
        name="temp"
        render={({ field }) => (
          <FormItem className="flex-grow">
            <FormLabel>Temperature</FormLabel>
            <FormControl>
              <Input type="number" inputMode="numeric" placeholder="Enter temperature in celsius" {...field} />
            </FormControl>
            <FormDescription>Body temperature from forehead of armpit</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="flex flex-wrap gap-2 items-center">
        <FormField
          control={form.control}
          name="pulseRate"
          render={({ field }) => (
            <FormItem className="flex-grow">
              <FormLabel>Pulse Rate</FormLabel>
              <FormControl>
                <Input type="number" inputMode="numeric" placeholder="Enter pulse rate" {...field} />
              </FormControl>
              <FormDescription>You can use Pulse oximeter or manual counting.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="respRate"
          render={({ field }) => (
            <FormItem className="flex-grow">
              <FormLabel>Respiratory Rate</FormLabel>
              <FormControl>
                <Input type="number" inputMode="numeric" placeholder="Enter the rate breathing here" {...field} />
              </FormControl>
              <FormDescription>You can observe the chest movements</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <div className="flex flex-wrap gap-2 items-center">
        <FormField
          control={form.control}
          name="bpSystolic"
          render={({ field }) => (
            <FormItem className="flex-grow">
              <FormLabel>BP Systolic</FormLabel>
              <FormControl>
                <Input type="number" inputMode="numeric" placeholder="Enter value here" {...field} />
              </FormControl>
              <FormDescription></FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Separator orientation="vertical" className="h-10 self-end mb-2 rotate-45 mx-3"/>
        <FormField
          control={form.control}
          name="bpDiastolic"
          render={({ field }) => (
            <FormItem className="flex-grow">
              <FormLabel>BP Diastolic</FormLabel>
              <FormControl>
                <Input type="number" inputMode="numeric" placeholder="Enter value here" {...field} />
              </FormControl>
              <FormDescription></FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <FormField
        control={form.control}
        name="spo2"
        render={({ field }) => (
          <FormItem className="flex-grow">
            <FormLabel>Oxygen Saturation (spo2)</FormLabel>
            <FormControl>
              <Input type="number" inputMode="numeric" placeholder="Enter spo2 readings here" {...field} />
            </FormControl>
            <FormDescription>Use the Pulse oximeter or other medical device to measure oxygen level of your blood.</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        rules={{
          required: {
            value: true, message: "Date taken is required"
          }
        }}
        control={form.control}
        name="dateTaken"
        render={({ field }) => {
          return (
            <FormItem className="flex-grow">
              <FormLabel>Date Taken</FormLabel>
              <FormControl>
                <Input type="datetime-local" placeholder="Enter spo2 readings here" onChange={field.onChange} name={field.name} onBlur={field.onBlur} value={dayjs(field.value).format("YYYY-MM-DDTHH:mm")}  />
              </FormControl>
              <FormDescription>Specify the date and time when was vitals taken.</FormDescription>
              <FormMessage />
            </FormItem>
          )
        }}
      />

      <FormField
        control={form.control}
        name="notes"
        render={({ field }) => {
          return (
            <FormItem className="flex-grow">
              <FormLabel>Notes (optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Additional notes" {...field} />
              </FormControl>
              <FormDescription>
                Any additional information you want to add.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )
        }}
      />
    </>
  )
}
  