"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@components/ui/form"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select"
import Each from "@components/utils/Each"
import { useOrgAppointmentTypes } from "@hooks/useOrgAppointmentType"
import { useParams } from "next/navigation"
import { useHPs } from "@hooks/useHP"
import { bookAppointmentAtom } from "../../state/book-appointment"
import { useAtom } from "jotai"
import ActionButton from "@components/ActionButton"
import { toast } from "sonner"
import { useOrgAppointmentModes } from "@hooks/useOrgAppointmentMode"
import { useClinicServiceCategories } from "@/hooks/useClinicServiceCategory"
import { useMemo } from "react"
import { Checkbox } from "@components/ui/checkbox"
import { useUsers } from "@hooks/useUser"
import { Separator } from "@components/ui/separator"
import { usePermissions } from "@hooks/usePermission"
import { PERMISSIONS } from "@lib/permissions"
import { useUser } from "@auth0/nextjs-auth0/client"

const FilterFormSchema = z.object({
  appointmentTypeId: z.coerce.number({
    description: 'Select an appointment type',
  }).min(1, 'Appointment type is required'),
  serviceId: z.coerce.number({
    description: 'Select a service',
  }),
  modeId: z.coerce.number({
    description: 'Select a Mode',
  }),
  hpId: z.number({
    coerce: true,
    description: 'Select a healthcare provider',
  }).optional(),
  bookAFriend: z.boolean().default(false),
  requester: z.string({
    description: 'Select a patient',
  }).optional()
}).superRefine((data, ctx) => {
  if(data.bookAFriend && !data.requester) {
    ctx.addIssue({
      message: 'Requester is required when booking for a friend',
      code: 'custom',
      path: ['requester']
    })
  }
})

interface FilterFormProps {
  onContinue?: () => void
}

export default function FilterForm({onContinue}: FilterFormProps) {
  const params = useParams()
  const {user} = useUser()
  const [bookAppointmentForm, setBookAppointmentForm] = useAtom(bookAppointmentAtom)
  const organization = params?.organization as string
  const {data: appointmentTypes} = useOrgAppointmentTypes(organization)
  const {data: appointmentModes } = useOrgAppointmentModes(organization);
  const {data: serviceCategories} = useClinicServiceCategories(organization)
  const {data: users } = useUsers({
    orgUid: organization,
  })
  const {data: myOrgPermissions, isLoading: loadingPermissions} = usePermissions({
    userId: user?.sub ?? undefined,
    type: "ORGANIZATION"
  })

  const {data: hps} = useHPs()
  const groupedHps = useMemo(() => {
    // array of array of hps
    return (hps ?? [])?.reduce((acc, hp) => {
      const existing = acc.find(a => a.hpTypeName === hp.HPType.name)
      if(existing) existing.hps.push(hp)
      else acc.push({hpTypeName: hp.HPType.name, hps: [hp]})
      return acc
    }, [] as {hpTypeName: string, hps: NonNullable<typeof hps>}[] )
  }, [hps])

  const form = useForm<z.infer<typeof FilterFormSchema>>({
    resolver: zodResolver(FilterFormSchema),
    mode: "onChange",
    defaultValues: {
      modeId: bookAppointmentForm.modeId,
      appointmentTypeId: bookAppointmentForm.appointmentTypeId,
      serviceId: bookAppointmentForm.serviceId,
      hpId: bookAppointmentForm.hpId,
      bookAFriend: bookAppointmentForm.bookAFriend || false,
      requester: bookAppointmentForm.requester ?? undefined
    },
  })

  function onSubmit(data: z.infer<typeof FilterFormSchema>) {
    
    const service = serviceCategories?.flatMap(sc => sc.Services).find(service => service.id === data.serviceId)
    const appointmentType = appointmentTypes?.find(appointmentType => appointmentType.id === data.appointmentTypeId)
    const serviceAttribute = service?.ServiceAttribute
    const appointmentTypeAttribute = appointmentType?.AppointmentTypeAttribute 
    
    if(!appointmentTypeAttribute) return toast.message("Appointment type attribute not found")
    if(!serviceAttribute) return toast.message("Service attribute not found")
    const hpUserId = (hps ?? []).find(hp => hp.id === data.hpId)?.User.userId 
    setBookAppointmentForm((prev) => ({...prev, ...{
      selectedTimeSlot: undefined,
      availabilities: undefined,
      modeId: data.modeId,
      hpId: data.hpId,
      hpUserId,
      serviceId: data.serviceId,
      appointmentTypeId: data.appointmentTypeId,
      bookAFriend: data.bookAFriend,
      requester: data.requester,
    }}))
    form.reset(data)
    onContinue?.()
  }
  const bookAFriend = form.watch('bookAFriend')
  const myPermissionArray = myOrgPermissions?.map(permission => permission.name)
  
  const writeOrgAppointmentPermissions = [PERMISSIONS.CLINIC["WRITE:ORG:APPOINTMENT"].name]
  const writeOrgAppointmentBookAFriendPermissions = [PERMISSIONS.CLINIC["WRITE:ORG:APPOINTMENT:BOOK_A_FRIEND"].name]
  const canWritePermission = writeOrgAppointmentPermissions.every(permission => myPermissionArray?.includes(permission))
  const canWriteBookAFriendPermission = writeOrgAppointmentBookAFriendPermissions.every(permission => myPermissionArray?.includes(permission))
  
  if(loadingPermissions) return <p>Loading permissions...</p>
  if(!canWritePermission) return <p>Sorry, You do not have permission to book an appointment. 😔</p>
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className=" space-y-6">
        {
          canWriteBookAFriendPermission && (
            <>
              <FormField
                control={form.control}
                name="bookAFriend"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Book appointment for a friend.
                      </FormLabel>
                      <FormDescription>
                        Check this box if you are booking an appointment for someone else other than yourself.
                        You can can only book for a friend if you are the same member of the organization.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              {
                bookAFriend && (
                  <FormField
                    control={form.control}
                    name="requester"
                    render={({ field }) => (
                      <FormItem className="flex-grow">
                        <FormLabel>Select Patient</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Search a patient" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <Each
                              of={users?.[0] ?? []}
                              render={(user) => {
                                return (
                                  <SelectItem value={user.userId}>{user.firstName} {user.middleName} {user.lastName} {user.suffix} (<span className="font-medium">{user.email}</span>)</SelectItem>
                                )
                              }}
                            />
                          </SelectContent>
                        </Select>
                        <FormDescription>
                            Select a patient to book an appointment for.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )
              }
              <Separator/>
            </>

          )
        }
        
        <h5 className="text-lg font-semibold">What service do you want to avail?</h5>
        <div className="flex flex-row gap-5 items-center justify-center md:justify-start flex-wrap">
          <FormField
            control={form.control}
            name="modeId"
            render={({ field }) => (
              <FormItem className="flex-grow">
                <FormLabel>Mode</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  value={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an appointment mode" className="capitalize"/>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <Each
                      of={appointmentModes ?? []}
                      render={(appointmentMode) => (
                        <SelectItem value={appointmentMode.id.toString()}>{appointmentMode.name}</SelectItem>
                      )}
                    />
                  </SelectContent>
                </Select>
                <FormDescription>
                  Select an appointment mode to show available slots
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="appointmentTypeId"
            render={({ field }) => (
              <FormItem className="flex-grow">
                <FormLabel>Appointment Type</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  value={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an appointment" className="capitalize"/>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <Each
                      of={appointmentTypes ?? []}
                      render={(appointmentType) => (
                        <SelectItem value={appointmentType.id.toString()}>{appointmentType.name}</SelectItem>
                      )}
                    />
                  </SelectContent>
                </Select>
                <FormDescription>
                    Select an appointment type to show available slots
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="serviceId"
            render={({ field }) => (
              <FormItem className="flex-grow">
                <FormLabel>Service</FormLabel>
                <Select onValueChange={field.onChange} value={field.value?.toString()}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a service" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <Each
                      of={serviceCategories ?? []}
                      render={(category) => (
                        <SelectGroup>
                          <SelectLabel>{category.name}</SelectLabel>
                          <Each
                            of={category.Services ?? []}
                            render={(service) => (
                              <SelectItem value={service.id.toString()}>{service.name}</SelectItem>
                            )}
                          />
                        </SelectGroup>
                      )}
                    />
                  </SelectContent>
                </Select>
                <FormDescription>
                  Select a service to filter even more available appointments
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="hpId"
            render={({ field }) => (
              <FormItem className="flex-grow">
                <FormLabel>Preferred Healthcare Provider (optional)</FormLabel>
                <Select onValueChange={field.onChange} value={field.value?.toString()}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a healthcare provider" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <Each
                      of={groupedHps}
                      render={(group) => {
                        return (
                          <SelectGroup>
                            <SelectLabel>{group.hpTypeName}</SelectLabel>
                            <Each
                              of={group.hps ?? []}
                              render={(hp) => {
                                const name = `${hp.HPProfile?.title || hp.User.firstName} ${hp.HPProfile?.name || hp.User.lastName} ${hp.HPProfile?.suffix || hp.User.suffix || ""}`
                                return (
                                  <SelectItem value={hp.id.toString()}>{name}</SelectItem>
                                )}}
                            />
                          </SelectGroup>
                          
                        )
                      }}
                    />
                  </SelectContent>
                </Select>
                <FormDescription>
                  Select a healthcare provider to show their vacant slots
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <ActionButton className="w-full" type="submit" disabled={!form.formState.isValid}>Continue</ActionButton>
        </div>
      </form>
    </Form>
  )
}
