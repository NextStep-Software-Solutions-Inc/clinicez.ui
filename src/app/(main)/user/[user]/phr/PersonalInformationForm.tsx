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
import { CalendarIcon } from "lucide-react"
import ActionButton from "@components/ActionButton"
import { toast } from "sonner"
import { updateUserAction } from "@actions/user.action"
import { BloodType, CivilStatus, Gender, User } from "@prisma/client"
import Each from "@components/utils/Each"
import { RadioGroup, RadioGroupItem } from "@components/ui/radio-group"
import { useUser } from "@auth0/nextjs-auth0/client"
import ConditionalRender from "@components/utils/ConditionalRender"
import { isUserOwner } from "@lib/protect-org"
import { useEffect, useState } from "react"

const personalInformationFormSchema = z.object({
  firstName: z.string().max(30, {
    message: "Name must not be longer than 30 characters.",
  }).nullable(),
  middleName: z.string().max(30, {
    message: "Middle name must not be longer than 30 characters.",
  }).optional().nullable(),
  lastName: z.string().max(30, {
    message: "Name must not be longer than 30 characters.",
  }),
  suffix: z.string().max(10, {
    message: "Suffix must not be longer than 10 characters.",
  }).optional().nullable(),
  nickname: z.string().max(30, {
    message: "Nickname must not be longer than 30 characters.",
  }),
  religion: z.string().max(30, {
    message: "Religion must not be longer than 30 characters.",
  }).nullable(),
  nationality: z.string().max(30, {
    message: "Nationality must not be longer than 30 characters.",
  }).nullable(),
  telephone: z.string().max(30, {
    message: "Telephone number must not be longer than 30 characters.",
  }).nullable(),
  mobile: z.string().min(10, {
    message: "Phone number must be at least 10 characters.",
  }).max(15, {
    message: "Phone number must not be longer than 15 characters.",
  }).nullable(),
  gender: z.nativeEnum(Gender).nullable(),
  bloodType: z.nativeEnum(BloodType).nullable(),
  civilStatus: z.nativeEnum(CivilStatus).nullable(),
  dob: z.date({
    required_error: "A date of birth is required.",
  }).nullable(),
})

type PersonalInformationFormValues = z.infer<typeof personalInformationFormSchema>
interface PersonalInformationFormProps {
  user: User
}

export function PersonalInformationForm(props: PersonalInformationFormProps) {

  const user = useUser();
  const [isOwn, setIsOwn] = useState<boolean>(false)
  
  const form = useForm<PersonalInformationFormValues>({
    resolver: zodResolver(personalInformationFormSchema),
    defaultValues: personalInformationFormSchema.safeParse(props.user).data,
  })

  const handleSaveChanges = async () => {
    const userId = user?.user?.sub
    if(!userId) return toast.error("User not found.")

    form.handleSubmit(data => {
      toast.promise(updateUserAction(userId, data), {
        loading: "Saving changes...",
        success: () => {
          form.reset(data)
          return "Changes saved successfully."
        },
        error: "Failed to save changes.",
      })
    })()
  }

  useEffect(() => {
    (async () => {
      setIsOwn(await isUserOwner(props.user.userId))
    })()
  }, [props.user.userId])

  return (
    <Form {...form}>
      <form action={handleSaveChanges} className="space-y-8">
        <div className="flex flex-col md:flex-row gap-2">
          <FormField
            disabled={!isOwn}
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input placeholder="John" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormDescription>
                This is your public display first name.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            disabled={!isOwn}
            control={form.control}
            name="middleName"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Middle Name</FormLabel>
                <FormControl>
                  <Input placeholder="Micheal" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormDescription>
                This is your public display middle name.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            disabled={!isOwn}
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
            disabled={!isOwn}
            control={form.control}
            name="suffix"
            render={({ field }) => (
              <FormItem className="w-1/4">
                <FormLabel>Suffix</FormLabel>
                <FormControl>
                  <Input placeholder="Jr." {...field} value={field.value ?? ""} />
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
          disabled={!isOwn}
          control={form.control}
          name="nickname"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel>Nickname</FormLabel>
              <FormControl>
                <Input placeholder="Nickname" {...field} />
              </FormControl>
              <FormDescription>
                This is your public display nickname.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          disabled={!isOwn}
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
                    defaultMonth={new Date("2000-01-01")}
                    mode="single"
                    {...field.value && { selected: field.value }}
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
          disabled={!isOwn}
          control={form.control}
          name="gender"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Gender</FormLabel>
              <FormControl>
                <RadioGroup
                  disabled={!isOwn}
                  onValueChange={field.onChange}
                  {...field.value && { defaultValue: field.value }}
                  className="flex flex-row gap-5 flex-wrap"
                >
                  <Each
                    of={Object.values(Gender).map(g => ({name: g.toLowerCase(), value:g}))}
                    render={(gender) => (
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value={gender.value} />
                        </FormControl>
                        <FormLabel className="font-normal capitalize">
                          {gender.name}
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

        <FormField
          disabled={!isOwn}
          control={form.control}
          name="civilStatus"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Civil Status</FormLabel>
              <FormControl>
                <RadioGroup
                  disabled={!isOwn}
                  onValueChange={field.onChange}
                  {...field.value && { defaultValue: field.value }}
                  className="flex flex-row gap-5 flex-wrap"
                >
                  <Each
                    of={Object.values(CivilStatus).map(c => ({name: c.toLowerCase(), value:c}))}
                    render={(cs) => (
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value={cs.value} />
                        </FormControl>
                        <FormLabel className="font-normal capitalize">
                          {cs.name}
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

        <FormField
          disabled={!isOwn}
          control={form.control}
          name="bloodType"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Blood Type</FormLabel>
              <FormControl>
                <RadioGroup
                  disabled={!isOwn}
                  onValueChange={field.onChange}
                  {...field.value && { defaultValue: field.value }}
                  className="flex flex-row gap-5 flex-wrap"
                >
                  <Each
                    of={Object.values(BloodType).map(b => ({name: b.split("_").join(" ").toLowerCase(), value:b}))}
                    render={(b) => (
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value={b.value} />
                        </FormControl>
                        <FormLabel className="font-normal capitalize">
                          {b.name}
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
        
        <FormField
          disabled={!isOwn}
          control={form.control}
          name="telephone"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel>Telephone Number</FormLabel>
              <FormControl>
                <Input placeholder="Telephone no." {...field} value={field.value ?? ""}/>
              </FormControl>
              <FormDescription>
                This is your public display telephone number.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          disabled={!isOwn}
          control={form.control}
          name="mobile"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <Input placeholder="Phone no." {...field} value={field.value ?? ""} />
              </FormControl>
              <FormDescription>
                This is your public display phone number.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          disabled={!isOwn}
          control={form.control}
          name="religion"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel>Religion</FormLabel>
              <FormControl>
                <Input placeholder="Religion" {...field} value={field.value ?? ""} />
              </FormControl>
              <FormDescription>
                This is your public display religion.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          disabled={!isOwn}
          control={form.control}
          name="nationality"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel>Nationality</FormLabel>
              <FormControl>
                <Input placeholder="Nationality" {...field} value={field.value ?? ""} />
              </FormControl>
              <FormDescription>
                This is your public display nationality.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      
        <ConditionalRender condition={isOwn}>
          {form.formState.isDirty && <ActionButton disabled={form.formState.isLoading || !form.formState.isValid}>Save Changes</ActionButton>}
        </ConditionalRender>
      </form>
    </Form>
  )
}
