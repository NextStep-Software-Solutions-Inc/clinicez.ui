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
import { formSchema } from "./HPForm"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@components/ui/popover"
import { Button } from "@components/ui/button"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@lib/utils"
import { Calendar } from "@components/ui/calendar"
import { Textarea } from "./ui/textarea"

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
            <FormItem className="w-1/2">
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
          name="firstName"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel>First Name</FormLabel>
              <FormControl>
                <Input placeholder="John" {...field} />
              </FormControl>
              <FormDescription>
                This is your public display first name.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="middleName"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel>Middle Name</FormLabel>
              <FormControl>
                <Input placeholder="Micheal" {...field} />
              </FormControl>
              <FormDescription>
                This is your public display middle name.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="lastName"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel>Last Name</FormLabel>
              <FormControl>
                <Input placeholder="Doe" {...field} />
              </FormControl>
              <FormDescription>
                This is your public display last name.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="suffix"
          render={({ field }) => (
            <FormItem className="w-1/4">
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
      <FormField
        control={form.control}
        name="email"
        render={({ field }) => (
          <FormItem className="w-full">
            <FormLabel>Email</FormLabel>
            <FormControl>
              <Input placeholder="example@email.com" {...field} />
            </FormControl>
            <FormDescription>
                This is your public display email address.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="phone"
        render={({ field }) => (
          <FormItem className="w-full">
            <FormLabel>Phone Number</FormLabel>
            <FormControl>
              <Input placeholder="Phone no." {...field} />
            </FormControl>
            <FormDescription>
                This is your public display phone number.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
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
      />

      <FormField
        control={form.control}
        name="bio"
        render={({ field }) => (
          <FormItem className="w-full">
            <FormLabel>Biography</FormLabel>
            <FormControl>
              <Textarea placeholder="Tell us a little bit about yourself" {...field}/>
            </FormControl>
            <FormDescription>
                This is your public biography.
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
      <FormField
        control={form.control}
        name="specialties"
        render={({ field }) => (
          <FormItem className="w-full">
            <FormLabel>Specialties</FormLabel>
            <FormControl>
              <Input placeholder="Internal Medicine" {...field} />
            </FormControl>
            <FormDescription>
                This is your public specialties. (comma separated)
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="languages"
        render={({ field }) => (
          <FormItem className="w-full">
            <FormLabel>Languages</FormLabel>
            <FormControl>
              <Input placeholder="" {...field} />
            </FormControl>
            <FormDescription>
                This is your public languages.(comma separated) 
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  )
}

