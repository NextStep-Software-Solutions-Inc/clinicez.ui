"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { format, isValid } from "date-fns"
import { useForm } from "react-hook-form"
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
import ActionButton from "@components/ActionButton"
import { toast } from "sonner"
import { updateUserAction } from "@actions/users/user.action"
import { BloodType, CivilStatus, Gender, User } from "@prisma/client"
import Each from "@components/utils/Each"
import { RadioGroup, RadioGroupItem } from "@components/ui/radio-group"
import { useUser } from "@clerk/nextjs"
import ConditionalRender from "@components/utils/ConditionalRender"
import { personalInformationFormSchema, PersonalInformationFormValues } from "@schemas/personal-information.schema"
import { promiseWrapper } from "@/lib/with-error-handling"

interface PersonalInformationFormProps {
  user: User,
  readOnly?: boolean
}

export function PersonalInformationForm({ readOnly, ...props }: PersonalInformationFormProps) {

  const { user } = useUser();

  // constant to disables users from accessing future dates
  const today = new Date().toISOString().split('T')[0];

  const form = useForm<PersonalInformationFormValues>({
    resolver: zodResolver(personalInformationFormSchema),
    defaultValues: {
      firstName: props.user.firstName ?? "",
      middleName: props.user.middleName,
      lastName: props.user.lastName ?? "",
      suffix: props.user.suffix,
      nickname: props.user.nickname ?? "",
      nationality: props.user.nationality ?? "",
      telephone: props.user.telephone,
      ...(props.user.religion ? { religion: props.user.religion } : {}),
      ...(props.user.bloodType ? { bloodType: props.user.bloodType } : {}),
      ...(props.user.civilStatus ? { civilStatus: props.user.civilStatus } : {}),
      ...(props.user.gender ? { gender: props.user.gender } : {}),
      ...(props.user.dob ? { dob: props.user.dob } : {}),
      ...(props.user.mobile ? { mobile: props.user.mobile } : {}),
      ...(props.user.placeOfBirth ? { placeOfBirth: props.user.placeOfBirth } : {}),
    },
    mode: "all"
  })

  const handleSaveChanges = async () => {
    const userId = user?.id
    if (!userId) return toast.error("User not found.")

    form.handleSubmit(data => {
      toast.promise(promiseWrapper(updateUserAction)(userId, data), {
        loading: "Saving changes...",
        success: (res) => {
          form.reset(data)
          return res.message
        },
        error: error => error,
      })
    })()
  }

  return (
    <Form {...form}>
      <form action={handleSaveChanges} className="space-y-8 flex flex-col">
        <div className="flex flex-col md:flex-row gap-2">
          <FormField
            disabled={readOnly}
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ""} />
                </FormControl>
                <FormDescription>
                  Your first name is used for identification purposes.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            disabled={readOnly}
            control={form.control}
            name="middleName"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Middle Name</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ""} />
                </FormControl>
                <FormDescription>
                  Your middle name is used for identification purposes.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            disabled={readOnly}
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormDescription>
                  Your last name is used for identification purposes.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            disabled={readOnly}
            control={form.control}
            name="suffix"
            render={({ field }) => (
              <FormItem className="w-1/4">
                <FormLabel>Suffix</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ""} />
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
          disabled={readOnly}
          control={form.control}
          name="nickname"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel>Nickname</FormLabel>
              <FormControl>
                <Input placeholder="Nickname" {...field} />
              </FormControl>
              <FormDescription>
                We love to call you by the name you prefer.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          disabled={readOnly}
          control={form.control}
          name="dob"
          render={({ field }) => (
            <FormItem
              className="flex flex-col">
              <FormLabel>Date of birth</FormLabel>
              <FormControl>
                <Input
                  disabled={readOnly}
                  name={field.name}
                  onChange={e => field.onChange(new Date(e.target.value))}
                  defaultValue={field.value instanceof Date && isValid(field.value) ? format(field.value, "yyyy-MM-dd") : ""}
                  type="date"
                  placeholder="Select date"
                  max={today}
                />
              </FormControl>
              <FormDescription>
                Your date of birth is used to calculate your age.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          disabled={readOnly}
          control={form.control}
          name="placeOfBirth"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel>Place of Birth</FormLabel>
              <FormControl>
                <Input placeholder="City, State/Province, Country" {...field} value={field.value ?? ""} />
              </FormControl>
              <FormDescription>
                The city, state or province, and country where you were born.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          disabled={readOnly}
          control={form.control}
          name="gender"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Gender at Birth</FormLabel>
              <FormControl>
                <RadioGroup
                  disabled={readOnly}
                  onValueChange={field.onChange}
                  {...field.value && { defaultValue: field.value }}
                  className="flex flex-row gap-5 flex-wrap"
                >
                  <Each
                    of={Object.values(Gender).map(g => ({ name: g.toLowerCase(), value: g }))}
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
              <FormDescription>
                Your gender identity is used for medical purposes.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          disabled={readOnly}
          control={form.control}
          name="civilStatus"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Civil Status</FormLabel>
              <FormControl>
                <RadioGroup
                  disabled={readOnly}
                  onValueChange={field.onChange}
                  {...field.value && { defaultValue: field.value }}
                  className="flex flex-row gap-5 flex-wrap"
                >
                  <Each
                    of={Object.values(CivilStatus).map(c => ({ name: c.toLowerCase(), value: c }))}
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
              <FormDescription>
                {`Healthcare providers may ask for your civil status for medical purposes.`}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          disabled={readOnly}
          control={form.control}
          name="bloodType"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Blood Type</FormLabel>
              <FormControl>
                <RadioGroup
                  disabled={readOnly}
                  onValueChange={field.onChange}
                  {...field.value && { defaultValue: field.value }}
                  className="flex flex-row gap-5 flex-wrap"
                >
                  <Each
                    of={Object.values(BloodType).map(b => ({ name: b.split("_").join(" ").toLowerCase(), value: b }))}
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
              <FormDescription>
                {`Your blood type is used for medical purposes. If you don't know your blood type, you can select "Unknown".`}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />


        <FormField
          disabled={readOnly}
          control={form.control}
          name="mobile"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <Input placeholder="Phone no." {...field} value={field.value ?? ""} />
              </FormControl>
              <FormDescription>
                Your mobile number is used for account recovery and notifications purposes.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          disabled={readOnly}
          control={form.control}
          name="telephone"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel>Alternative Number</FormLabel>
              <FormControl>
                <Input placeholder="Contact no." {...field} value={field.value ?? ""} />
              </FormControl>
              <FormDescription>
                {`We can contact you through this number if we can't reach you on your mobile number.`}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          disabled={readOnly}
          control={form.control}
          name="religion"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel>Religion</FormLabel>
              <FormControl>
                <Input placeholder="Religion" {...field} value={field.value ?? ""} />
              </FormControl>
              <FormDescription>
                What group or belief do you belong to?
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          disabled={readOnly}
          control={form.control}
          name="nationality"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel>Nationality</FormLabel>
              <FormControl>
                <Input placeholder="Nationality" {...field} value={field.value ?? ""} />
              </FormControl>
              <FormDescription>
                Tell us your nationality or citizenship.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <ConditionalRender condition={!readOnly}>
          <ActionButton disabled={form.formState.isLoading} className="flex-shrink sm:flex-shrink-0">Save Changes</ActionButton>
        </ConditionalRender>
      </form>
    </Form>
  )
}
