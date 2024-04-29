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

type HPAddressProps = {
    form: ReturnType<typeof useForm<z.infer<typeof formSchema>>>
}

export default function HPAddress({ form }: HPAddressProps) {
  return (
    <>
      <div className="flex flex-col md:flex-row gap-2">
        <FormField
          control={form.control}
          name="country"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel>Country</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} {...field}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a country to display" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Select Country</SelectLabel>
                    <SelectItem value="Philippines">Philippines</SelectItem>
                    <SelectItem value="United States">United States</SelectItem>
                    <SelectItem value="Canada">Canada</SelectItem>
                    <SelectItem value="Australia">Australia</SelectItem>
                    <SelectItem value="United Kingdom">United Kingdom</SelectItem>
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
          name="state"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel>State</FormLabel>
              <FormControl>
                <Input placeholder="Your state..." {...field} />
              </FormControl>
              <FormDescription>
              State or Province
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="city"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel>City</FormLabel>
              <FormControl>
                <Input placeholder="Your city or municipality" {...field} />
              </FormControl>
              {/* <FormDescription>
                This is your public display middle name.
            </FormDescription> */}
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <FormField
        control={form.control}
        name="address1"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Address Line 1</FormLabel>
            <FormControl>
              <Input placeholder="Gloria Str. Macapagal Road" {...field} />
            </FormControl>
            <FormDescription>
                This is your public display address.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="address2"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Address Line 2</FormLabel>
            <FormControl>
              <Input placeholder="Don Mcqueen Villa" {...field} />
            </FormControl>
            <FormDescription>
                This is your public display secondary address.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="zip"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Zip Code</FormLabel>
            <FormControl>
              <Input placeholder="Your Area code" {...field} />
            </FormControl>
            <FormDescription>
                This is your public display area code.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  )
}

