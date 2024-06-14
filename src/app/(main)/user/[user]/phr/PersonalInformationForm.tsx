"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { cn } from "@lib/utils"
import { Button } from "@components/ui/button"
import { Calendar } from "@components/ui/calendar"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@components/ui/form"
import { Input } from "@components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@components/ui/popover"
import { toast } from "@components/ui/use-toast"
import { CalendarIcon, SortAscIcon, CheckIcon } from "lucide-react"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@components/ui/select"
import ActionButton from "@components/ActionButton"
import { delay } from "@lib/wait"


const personalInformationFormSchema = z.object({
  firstName: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }).max(30, {
    message: "Name must not be longer than 30 characters.",
  }),
  middleName: z.string().max(30, {
    message: "Middle name must not be longer than 30 characters.",
  }).optional(),
  lastName: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }).max(30, {
    message: "Name must not be longer than 30 characters.",
  }),
  suffix: z.string().max(10, {
    message: "Suffix must not be longer than 10 characters.",
  }).optional(),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  phone: z.string().min(10, {
    message: "Phone number must be at least 10 characters.",
  }).max(15, {
    message: "Phone number must not be longer than 15 characters.",
  }),
  gender: z.enum(["Male", "Female"]).refine((val) => {
    if (val === "Male" || val === "Female") {
      return true
    }
    return false
  }, {
    message: "Please select a gender.",
  }),
  dob: z.date({
    required_error: "A date of birth is required.",
  }),
})

type PersonalInformationFormValues = z.infer<typeof personalInformationFormSchema>

// This can come from your database or API.
const defaultValues: Partial<PersonalInformationFormValues> = {
  // name: "Your name",
  // dob: new Date("2023-01-23"),
}

export function PersonalInformationForm() {
  const form = useForm<PersonalInformationFormValues>({
    resolver: zodResolver(personalInformationFormSchema),
    defaultValues,
  })

  const handleSaveChanges = async (formData: FormData) => {
    await delay(1000);
    form.handleSubmit(data => {
      form.reset(data)
      toast({
        title: "You submitted the following values:",
        description: (
          <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
            <code className="text-white">{JSON.stringify(data, null, 2)}</code>
          </pre>
        ),
      })
    })()
  }

  return (
    <Form {...form}>
      <form action={handleSaveChanges} className="space-y-8">
        <div className="flex flex-col md:flex-row gap-2">
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
          name="gender"
          render={({ field }) => (
            <FormItem className="w-1/2">
              <FormLabel>Gender</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} {...field}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a gender" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Select Gender</SelectLabel>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              <FormDescription>
                This is your public display gender.
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
        {form.formState.isDirty && <ActionButton disabled={form.formState.isLoading || !form.formState.isValid}>Save Changes</ActionButton>}
      </form>
    </Form>
  )
}
