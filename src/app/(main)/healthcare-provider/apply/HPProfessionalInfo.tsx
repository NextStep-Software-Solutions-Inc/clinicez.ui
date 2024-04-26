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
import { Select, SelectContent, SelectItem, SelectLabel, SelectTrigger, SelectValue, SelectGroup } from "@components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "../../../../components/ui/popover"
import { Button } from "../../../../components/ui/button"
import { cn } from "@lib/utils"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { Calendar } from "../../../../components/ui/calendar"

type HPProfessionalInfoProps = {
    form: ReturnType<typeof useForm<z.infer<typeof formSchema>>>
}

export default function HPProfessionalInfo({ form }: HPProfessionalInfoProps) {
  return (
    <>
      <FormField
        control={form.control}
        name="fieldOfPractice"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Field of Practice</FormLabel>
            <FormControl>
              <Input placeholder="Your field of practice" {...field} />
            </FormControl>
            <FormDescription>
                This is your public display of your field of practice.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="licenseNumber"
        render={({ field }) => (
          <FormItem>
            <FormLabel>License Number</FormLabel>
            <FormControl>
              <Input placeholder="Your License Number" {...field} />
            </FormControl>
            <FormDescription>
            This is going to be used internally (Private).
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <div className="flex gap-2">
        <FormField
          control={form.control}
          name="licenseIssueDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>License Issued Date</FormLabel>
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
              This is going to be used internally (Private).
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="licenseExpiryDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>License Expiry  Date</FormLabel>
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
              This is going to be used internally (Private).
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <FormField
        control={form.control}
        name="ptrNumber"
        render={({ field }) => (
          <FormItem>
            <FormLabel>PTR Number</FormLabel>
            <FormControl>
              <Input placeholder="Your PTR Number" {...field} />
            </FormControl>
            <FormDescription>
                This is going to be used internally (Private).
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="taxNumber"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Tax Number</FormLabel>
            <FormControl>
              <Input placeholder="Your TIN or Tax Number" {...field} />
            </FormControl>
            <FormDescription>
                This is going to be used internally (Private).
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  )
}

