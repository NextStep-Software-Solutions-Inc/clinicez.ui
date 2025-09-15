"use client"

import React, { useMemo, useState, useEffect } from "react"
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
import { Button } from "@components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@components/ui/command"
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
import { Checkbox } from "@components/ui/checkbox"
import { Separator } from "@components/ui/separator"
import { usePermissions } from "@hooks/usePermission"
import { PERMISSIONS } from "@lib/permissions"
import { useUser } from "@clerk/nextjs"
import { ChevronDown } from "lucide-react"
import { getFullName } from "@/lib/formatter-utils"
import { isValidStudentId } from "@/lib/formatter-utils"
import { useOrgMembers } from "@/hooks/useOrgMember"

// Debounce hook for search optimization
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

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
    description: 'Select an organization member',
  }).optional()
}).superRefine((data, ctx) => {
  if (data.bookAFriend && !data.requester) {
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

export default function FilterForm({ onContinue }: FilterFormProps) {
  const { clinicUid } = useParams<{ clinicUid: string }>()
  const { user } = useUser()
  const [bookAppointmentForm, setBookAppointmentForm] = useAtom(bookAppointmentAtom)
  const { data: appointmentTypes } = useOrgAppointmentTypes(clinicUid)
  const { data: appointmentModes } = useOrgAppointmentModes(clinicUid);
  const { data: serviceCategories } = useClinicServiceCategories(clinicUid)

  // Use search-based approach instead of loading all members
  const [memberSearch, setMemberSearch] = useState("")
  const [open, setOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<{
    key: number;
    value: string;
    label: string;
    studentIds?: string[];
  } | null>(null)
  const debouncedSearch = useDebounce(memberSearch, 300)

  const shouldFetchMembers = debouncedSearch.length >= 2
  const { data: orgMembersData, isLoading: orgMembersLoading } = useOrgMembers({
    clinicUid: clinicUid,
    searchKey: shouldFetchMembers ? debouncedSearch : undefined,
    pageSize: 20,
    pageNumber: 1
  }, shouldFetchMembers)

  const { data: myOrgPermissions, isLoading: loadingPermissions } = usePermissions({
    userId: user?.id ?? undefined,
    type: "CLINIC"
  })

  const { data: hps } = useHPs()

  const groupedHps = useMemo(() => {
    // array of array of hps
    return (hps ?? [])?.reduce((acc, hp) => {
      const existing = acc.find(a => a.hpTypeName === hp.HPType.name)
      if (existing) existing.hps.push(hp)
      else acc.push({ hpTypeName: hp.HPType.name, hps: [hp] })
      return acc
    }, [] as { hpTypeName: string, hps: NonNullable<typeof hps> }[])
  }, [hps])

  const patientOptions = useMemo(() => {
    if (!orgMembersData?.data?.data || !shouldFetchMembers) return [];

    const options = orgMembersData.data.data.map((member) => {
      const user = member.User;
      const firstName = user.firstName || "";
      const lastName = user.lastName || "";
      const suffix = user.suffix || undefined;

      const name = firstName || lastName ? getFullName({
        firstName,
        lastName: lastName || undefined,
        suffix
      }) : "No Name";

      const studentIds = user.StudentRecords?.map((sr) => sr.studentId).filter(isValidStudentId) ?? [];

      return {
        key: member.id,
        value: user.userId,
        label: name,
        studentIds,
      };
    });

    return options.reduce((acc, option) => {
      const existing = acc.find(opt => opt.value === option.value);
      if (!existing) {
        acc.push(option);
      }
      return acc;
    }, [] as typeof options);
  }, [orgMembersData?.data?.data, shouldFetchMembers]); const form = useForm<z.infer<typeof FilterFormSchema>>({
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

    if (!appointmentTypeAttribute) return toast.message("Appointment type attribute not found")
    if (!serviceAttribute) return toast.message("Service attribute not found")
    const hpUserId = (hps ?? []).find(hp => hp.id === data.hpId)?.User.userId
    setBookAppointmentForm((prev) => ({
      ...prev, ...{
        selectedTimeSlot: undefined,
        availabilities: undefined,
        modeId: data.modeId,
        hpId: data.hpId,
        hpUserId,
        serviceId: data.serviceId,
        appointmentTypeId: data.appointmentTypeId,
        bookAFriend: data.bookAFriend,
        requester: data.requester,
      }
    }))
    form.reset(data)
    onContinue?.()
  }
  const bookAFriend = form.watch('bookAFriend')
  const myPermissionArray = myOrgPermissions?.map(permission => permission.name)

  const writeOrgAppointmentPermissions = [PERMISSIONS.CLINIC["WRITE:CLINIC:APPOINTMENT"].name]
  const writeOrgAppointmentBookAFriendPermissions = [PERMISSIONS.CLINIC["WRITE:CLINIC:APPOINTMENT:BOOK_A_FRIEND"].name]
  const canWritePermission = writeOrgAppointmentPermissions.every(permission => myPermissionArray?.includes(permission))
  const canWriteBookAFriendPermission = writeOrgAppointmentBookAFriendPermissions.every(permission => myPermissionArray?.includes(permission))

  if (loadingPermissions) return <p>Loading permissions...</p>
  if (!canWritePermission) return <div role="alert" aria-live="assertive">Sorry, You do not have permission to book an appointment.</div>
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
                        Book Appointment for Someone Else
                      </FormLabel>
                      <FormDescription>
                        Check this box if you are booking an appointment for someone else other than yourself.
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
                    render={({ field }) => {
                      return (
                        <FormItem className="flex-grow">
                          <FormLabel>Select Member</FormLabel>
                          <div className="relative">
                            <Popover open={open} onOpenChange={setOpen}>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  className="w-full justify-between min-h-[40px] h-auto"
                                >
                                  <div className="flex flex-1 text-left">
                                    {selectedMember ? (
                                      <div className="flex flex-col">
                                        <span className="font-medium">{selectedMember.label}</span>
                                        {selectedMember.studentIds && selectedMember.studentIds.length > 0 && (
                                          <span className="text-xs text-muted-foreground">Student ID: {selectedMember.studentIds.join(", ")}</span>
                                        )}
                                      </div>
                                    ) : (
                                      <span className="text-muted-foreground">Select a member...</span>
                                    )}
                                  </div>
                                  <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-full p-0" align="start">
                                <Command shouldFilter={false}>
                                  <CommandInput
                                    placeholder="Type at least 2 characters to search by name or student ID..."
                                    value={memberSearch}
                                    onValueChange={(value) => {
                                      setMemberSearch(value)
                                      if (selectedMember && value !== selectedMember.label && value.length >= 2) {
                                        field.onChange("")
                                        setSelectedMember(null)
                                      }
                                    }}
                                  />
                                  <CommandList>
                                    {debouncedSearch.length < 2 ? (
                                      <CommandEmpty>
                                        Type at least 2 characters to search
                                      </CommandEmpty>
                                    ) : orgMembersLoading ? (
                                      <CommandEmpty>
                                        <div className="flex items-center gap-2">
                                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                                          Searching...
                                        </div>
                                      </CommandEmpty>
                                    ) : patientOptions.length === 0 ? (
                                      <CommandEmpty>No members found for &ldquo;{debouncedSearch}&rdquo;</CommandEmpty>
                                    ) : (
                                      <CommandGroup>
                                        {patientOptions.map((option) => (
                                          <CommandItem
                                            key={option.key}
                                            value={option.value}
                                            onSelect={() => {
                                              field.onChange(option.value)
                                              setSelectedMember(option)
                                              setMemberSearch(option.label)
                                              setOpen(false)
                                            }}
                                          >
                                            <div className="flex flex-col w-full">
                                              <span className="font-medium">{option.label}</span>
                                              {option.studentIds && option.studentIds.length > 0 && (
                                                <span className="text-xs text-muted-foreground">Student ID: {option.studentIds.join(", ")}</span>
                                              )}
                                            </div>
                                          </CommandItem>
                                        ))}
                                      </CommandGroup>
                                    )}
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                          </div>
                          <FormDescription>
                            Search and select a member to book an appointment for. Start typing their name or student ID.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )
                    }}
                  />
                )
              }
              <Separator />
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
                      <SelectValue placeholder="Select an appointment mode" className="capitalize" />
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
                      <SelectValue placeholder="Select an appointment" className="capitalize" />
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
                                )
                              }}
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
