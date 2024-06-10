"use client"

import { z } from "zod"
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@components/ui/form"
import { Input } from "@components/ui/input"
import { useForm } from "react-hook-form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@components/ui/select"
import { Textarea } from "../../../../../components/ui/textarea"
import { Affiliations } from "./Affiliations"
import { Certifications } from "./Certifications"
import { Fields } from "./Fields"
import { Education } from "./Education"
import { Specialties } from "./Specialties"
import { Languages } from "./Languages"
import { formSchema } from "../../profile/[practitioner]/editor/hp-form.schema"

type HPBasicInfoProps = {
  form: ReturnType<typeof useForm<z.infer<typeof formSchema>>>
}

export default function HPBasicInfo({ form }: HPBasicInfoProps) {

  return (
    <>
      <div className="flex flex-col md:flex-row gap-2">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem className="basis-1/4 flex-grow">
              <FormLabel>Title</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} {...field}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a title to display" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Select Your Title</SelectLabel>
                    <SelectItem value="Mr.">Mr.</SelectItem>
                    <SelectItem value="Mrs.">Mrs.</SelectItem>
                    <SelectItem value="Ms.">Ms.</SelectItem>
                    <SelectItem value="Dr.">Dr.</SelectItem>
                    <SelectItem value="Prof.">Prof.</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              <FormDescription>
                This is your public display title.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="John Doe Dao" {...field} />
              </FormControl>
              <FormDescription>
                This is your public display name.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="suffix"
          render={({ field }) => (
            <FormItem className="basis-1/4 flex-grow">
              <FormLabel>Suffix</FormLabel>
              <FormControl>
                <Input placeholder="Jr." {...field} />
              </FormControl>
              <FormDescription>
                Jr., Sr., III, etc.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      {/* <FormField
        control={form.control}
        name="dob"
        render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel>Date of birth</FormLabel>
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
            <FormDescription>
                Your date of birth is used to calculate your age.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      /> */}
      <FormField
        control={form.control}
        name="workEmail"
        render={({ field }) => (
          <FormItem className="w-full">
            <FormLabel>Work Email</FormLabel>
            <FormControl>
              <Input placeholder="example@email.com" {...field} />
            </FormControl>
            <FormDescription>
              This will reflect in you public profile.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="workPhone"
        render={({ field }) => (
          <FormItem className="w-full">
            <FormLabel>Work Phone Number</FormLabel>
            <FormControl>
              <Input placeholder="Phone no." {...field} />
            </FormControl>
            <FormDescription>
              This will reflect in you public profile.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="philosophy"
        render={({ field }) => (
          <FormItem className="w-full">
            <FormLabel>Philosophy of Care</FormLabel>
            <FormControl>
              <Textarea placeholder="" {...field}/>
            </FormControl>
            <FormDescription>
              This will reflect in you public profile.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="areaOfInterest"
        render={({ field }) => (
          <FormItem className="w-full">
            <FormLabel>Area of Interest</FormLabel>
            <FormControl>
              <Textarea placeholder="" {...field}/>
            </FormControl>
            <FormDescription>
              This will reflect in you public profile.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="experience"
        render={({ field }) => (
          <FormItem className="w-full">
            <FormLabel>Experiences</FormLabel>
            <FormControl>
              <Input placeholder="You earned experience" {...field} />
            </FormControl>
            <FormDescription>
              This is your public experiences.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <Languages form={form}/>

      <Fields form={form}/>

      <Specialties form={form}/>

      <Education form={form}/>

      <Certifications form={form}/>

      <Affiliations form={form}/>
    </>
  )
}
