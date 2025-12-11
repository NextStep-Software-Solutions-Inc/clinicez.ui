"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { CalendarIcon, Download, Filter } from "lucide-react"
import { endOfDay, format, startOfDay } from "date-fns"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { cn, calculateAge } from "@/lib/utils"
import { exportXLSX, XLSXExportData } from "@/lib/file-manipulation"
import { useConsultations } from "@/hooks/useConsultation"
import { toast } from "sonner"
import { GetConsultationTickets } from "@/actions/consultation/consultation-ticket.action"

const reportsFilterSchema = z.object({
  startDate: z.date({
    required_error: "Start date is required",
  }),
  endDate: z.date({
    required_error: "End date is required",
  }),
  gender: z.enum(["ALL", "MALE", "FEMALE", "OTHER"]).default("ALL"),
  status: z.enum(["ALL", "PENDING", "PROCESSING", "RESOLVED"]).default("ALL"),
  system: z.string().default("ALL"),
})

type ReportsFilterValues = z.infer<typeof reportsFilterSchema>

interface ReportsFiltersProps {
  clinicUid: string
}

async function generateAndExportConsultationReport(
  data: NonNullable<GetConsultationTickets["data"]>,
  filterValues: ReportsFilterValues
): Promise<number> {
  const startDateBoundary = filterValues.startDate ? startOfDay(filterValues.startDate) : undefined
  const endDateBoundary = filterValues.endDate ? endOfDay(filterValues.endDate) : undefined

  const filteredData = (data ?? []).filter(ticket => {
    const ticketDate = new Date(ticket.createdAt)
    const patient = ticket.Appointment?.Requesters[0]?.User

    const matchesStartDate = startDateBoundary ? ticketDate >= startDateBoundary : true
    const matchesEndDate = endDateBoundary ? ticketDate <= endDateBoundary : true
    const isInDateRange = matchesStartDate && matchesEndDate

    const matchesGender = filterValues.gender === "ALL" ||
      !filterValues.gender ||
      patient?.gender === filterValues.gender

    const matchesStatus = filterValues.status === "ALL" ||
      !filterValues.status ||
      ticket.ConsultationTicketAttribute?.status === filterValues.status ||
      ticket.Appointment?.AppointmentAttribute?.status === filterValues.status

    const matchesSystem = filterValues.system === "ALL" ||
      !filterValues.system ||
      ticket.System.name === filterValues.system

    return isInDateRange && matchesGender && matchesStatus && matchesSystem
  })

  type ConsultationTicketRecord = NonNullable<GetConsultationTickets["data"]>[number]
  type TicketProviderRecord = NonNullable<
    NonNullable<ConsultationTicketRecord["ConsultationTicketHPs"]>[number]
  >
  type HealthcareProviderRecord = NonNullable<TicketProviderRecord["HealthCareProvider"]>
  type ProviderUserRecord = NonNullable<HealthcareProviderRecord["User"]>
  type OrganizationMembersArray = ProviderUserRecord["OrganizationMembers"]
  type OrganizationMemberRecord = OrganizationMembersArray extends (infer Member)[]
    ? NonNullable<Member>
    : never
  type HealthcareProviderProfileRecord = NonNullable<HealthcareProviderRecord["HPProfile"]>
  type OrganizationMemberLike = {
    OrganizationRole?: Maybe<{
      name?: Maybe<string>
    }>
  }
  type BasicUserRecord = {
    firstName?: Maybe<string>
    middleName?: Maybe<string>
    lastName?: Maybe<string>
    suffix?: Maybe<string>
    OrganizationMembers?: Maybe<OrganizationMemberLike[]>
  }
  type UserRecord = ProviderUserRecord

  type Maybe<T> = T | null | undefined

  const isNonNullable = <T,>(value: T): value is NonNullable<T> => value !== null && value !== undefined

  const formatUserName = (user?: Maybe<BasicUserRecord>) => {
    if (!user) return "-"
    const parts = [user.firstName, user.middleName, user.lastName, user.suffix]
      .map(part => part?.trim())
      .filter((value): value is string => Boolean(value && value.length))
    return parts.length ? parts.join(" ") : "-"
  }

  const formatHealthcareProviderName = (hp?: Maybe<HealthcareProviderRecord>) => {
    if (!hp) return "-"
    const profileParts = [hp.HPProfile?.title, hp.HPProfile?.name, hp.HPProfile?.suffix]
      .map(part => part?.trim())
      .filter((value): value is string => Boolean(value && value.length))

    if (profileParts.length) {
      return profileParts.join(" ")
    }

    return formatUserName(hp.User)
  }

  const matchesKeyword = (value: Maybe<string>, keywords: readonly string[]) => {
    if (!value) return false
    const normalized = value.toLowerCase().trim()
    if (!normalized.length) return false
    return keywords.some(keyword => normalized.includes(keyword))
  }

  const hasRoleMatch = (members: Maybe<OrganizationMemberLike[]>, keywords: readonly string[]) => {
    if (!members) return false
    return members.some(member => matchesKeyword(member.OrganizationRole?.name ?? null, keywords))
  }

  const DOCTOR_ROLE_KEYWORDS = ["doctor", "physician", "medical doctor", "attending physician", "consultant", "dentist"] as const
  const DOCTOR_TITLE_KEYWORDS = ["dr", "dr.", "doctor", "physician", "md", "dmd", "dentist", "consultant"] as const
  const DOCTOR_FIELD_KEYWORDS = ["doctor", "physician", "dentist", "medical", "md", "dmd", "consultant", "surgeon", "ob-gyn", "pediatrician"] as const
  const DOCTOR_SUFFIX_KEYWORDS = ["md", "m.d", "dmd", "d.o", "do"] as const

  const NURSE_ROLE_KEYWORDS = ["nurse", "head nurse", "staff nurse", "registered nurse", "charge nurse"] as const
  const NURSE_TITLE_KEYWORDS = ["nurse", "rn", "registered nurse"] as const
  const NURSE_FIELD_KEYWORDS = ["nurse", "rn", "registered nurse"] as const

  const matchesDoctorName = (value: Maybe<string>) => {
    if (!value) return false
    const normalized = value.toLowerCase().trim()
    if (!normalized.length) return false
    return normalized.startsWith("dr ") ||
      normalized.startsWith("dr.") ||
      normalized.endsWith(" md") ||
      normalized.endsWith(" m.d") ||
      normalized.endsWith(", md") ||
      normalized.endsWith(", m.d") ||
      normalized.includes(" md ") ||
      normalized.includes(" m.d ") ||
      normalized.includes(" dmd")
  }

  const isDoctorProvider = (provider: Maybe<HealthcareProviderRecord>): provider is HealthcareProviderRecord => {
    if (!provider) return false
    if (hasRoleMatch(provider.User?.OrganizationMembers ?? null, DOCTOR_ROLE_KEYWORDS)) return true
    if (matchesKeyword(provider.User?.suffix ?? null, DOCTOR_SUFFIX_KEYWORDS)) return true
    if (matchesKeyword(provider.HPProfile?.title ?? null, DOCTOR_TITLE_KEYWORDS)) return true
    if (matchesDoctorName(provider.HPProfile?.name ?? null)) return true
    if (provider.HPProfile?.specialties?.some(specialty => matchesKeyword(specialty ?? null, DOCTOR_FIELD_KEYWORDS))) return true
    return false
  }

  const isNurseProvider = (provider: Maybe<HealthcareProviderRecord>): provider is HealthcareProviderRecord => {
    if (!provider) return false
    if (hasRoleMatch(provider.User?.OrganizationMembers ?? null, NURSE_ROLE_KEYWORDS)) return true
    if (matchesKeyword(provider.HPProfile?.title ?? null, NURSE_TITLE_KEYWORDS)) return true
    if (provider.HPProfile?.specialties?.some(specialty => matchesKeyword(specialty ?? null, NURSE_FIELD_KEYWORDS))) return true
    return false
  }

  const resolvedStatusKeywords = new Set(["RESOLVED", "DONE"])
  const routedStatusKeywords = new Set(["PROCESSING", "ROUTED"])

  const xlsxData: XLSXExportData[] = filteredData.map(ticket => {
    const patient = ticket.Appointment?.Requesters[0]?.User
    const appointmentAttribute = ticket.Appointment?.AppointmentAttribute
    const appointmentDateSource = appointmentAttribute?.date || ticket.createdAt
    const appointmentDate = appointmentDateSource ? new Date(appointmentDateSource) : new Date()

    const ticketStatusRaw = ticket.ConsultationTicketAttribute?.status ?? appointmentAttribute?.status ?? "-"
    const status = (() => {
      const normalized = ticketStatusRaw?.toUpperCase?.() ?? "-"
      if (resolvedStatusKeywords.has(normalized)) return "Done"
      if (routedStatusKeywords.has(normalized)) return "Routed"
      if (!ticketStatusRaw) return "-"
      const trimmedStatus = ticketStatusRaw.trim()
      if (!trimmedStatus.length) return "-"
      return `${trimmedStatus.charAt(0).toUpperCase()}${trimmedStatus.slice(1).toLowerCase()}`
    })()

    const isResolved = (() => {
      const normalized = ticketStatusRaw?.toUpperCase?.() ?? ""
      return resolvedStatusKeywords.has(normalized)
    })()

    const programName = patient?.StudentRecords?.[0]?.Program?.name
    const yearLevel = patient?.StudentRecords?.[0]?.OrganizationYearLevel?.name
    const deptYearLevel = [programName, yearLevel].filter(Boolean).join(" / ") || "-"

    const providers: HealthcareProviderRecord[] = (ticket.ConsultationTicketHPs ?? [])
      .map(hp => hp.HealthCareProvider)
      .filter(isNonNullable)

    const nurseProvider = providers.find(isNurseProvider)
    const doctorProviders = providers.filter(isDoctorProvider)
    const fallbackDoctorCandidates = providers.filter(provider => provider && provider !== nurseProvider)
    const fallbackDoctorBySuffix = fallbackDoctorCandidates.find(provider => matchesKeyword(provider.User?.suffix ?? null, DOCTOR_SUFFIX_KEYWORDS))
    const fallbackDoctorByName = fallbackDoctorCandidates.find(provider =>
      matchesDoctorName(provider.HPProfile?.name ?? null) || matchesDoctorName(provider.HPProfile?.title ?? null)
    )
    const primaryDoctor = doctorProviders[0]
      ?? fallbackDoctorBySuffix
      ?? fallbackDoctorByName
      ?? (fallbackDoctorCandidates.length === 1 ? fallbackDoctorCandidates[0] : undefined)
    const primaryDoctorName = primaryDoctor ? formatHealthcareProviderName(primaryDoctor) : "-"

    const latestNursePreAssessmentNote = ticket.Appointment?.PreAssessmentNotes?.find(
      (note) => hasRoleMatch(note.CreatedBy?.OrganizationMembers ?? null, NURSE_ROLE_KEYWORDS)
    )

    const nurseFromPreAssessment = formatUserName(latestNursePreAssessmentNote?.CreatedBy)

    const receivedByUser = appointmentAttribute?.ReceivedBy
    const receivedByIsNurse = hasRoleMatch(receivedByUser?.OrganizationMembers ?? null, NURSE_ROLE_KEYWORDS)

    const nurseIncharge =
      nurseFromPreAssessment !== "-"
        ? nurseFromPreAssessment
        : receivedByIsNurse
          ? formatUserName(receivedByUser)
          : formatHealthcareProviderName(nurseProvider)

    const nurseImpression = latestNursePreAssessmentNote?.assessment || "-"

    const diagnosisNote = ticket.ConsultationNotes?.find(note => {
      const section = note.section?.toLowerCase()
      return section === "assessment"
    })

    const doctorDiagnosis = diagnosisNote?.content?.trim() || "-"

    const taggedDoctor = primaryDoctorName

    const ageValue = patient?.dob ? calculateAge(patient.dob) : undefined

    return {
      "Consultation Ticket #": ticket.id,
      "Date": format(appointmentDate, "yyyy-MM-dd"),
      "Patient Name": formatUserName(patient),
      "Age": ageValue ?? "-",
      "Gender": patient?.gender || "-",
      "Client": patient?.OrganizationMembers?.[0]?.OrganizationRole?.name || "-",
      "Service Category": appointmentAttribute?.Service?.ServiceCategory?.name || "-",
      "Campus": patient?.OrganizationMembers?.[0]?.Organization?.name || "-",
      "Dept/Year Level": deptYearLevel,
      "Status": status,
      "Appointment Type": appointmentAttribute?.AppointmentMode?.name || "-",
      "Consultation Type": appointmentAttribute?.AppointmentType?.name || "-",
      "Purpose/Chief Complaint": ticket.Appointment?.complaint || ticket.subject || "-",
      "Service Offered": appointmentAttribute?.Service?.name || "-",
      "Resolved By": isResolved ? primaryDoctorName : "-",
      "Doctor DX": doctorDiagnosis,
      "Nurse In-charge": nurseIncharge,
      "Tagged Doctor": taggedDoctor,
      "Nursing Impression": nurseImpression,
      "System": ticket.System.name || "-",
    }
  })

  const columns = [
    "Consultation Ticket #",
    "Date",
    "Patient Name",
    "Age",
    "Gender",
    "Client",
    "Service Category",
    "Campus",
    "Dept/Year Level",
    "Status",
    "Appointment Type",
    "Consultation Type",
    "Purpose/Chief Complaint",
    "Service Offered",
    "Resolved By",
    "Doctor DX",
    "Nurse In-charge",
    "Tagged Doctor",
    "Nursing Impression",
    "System",
  ]

  const filename = `consultation_reports_${format(new Date(), "yyyy-MM-dd")}`

  exportXLSX(columns, xlsxData, {
    filename,
    sheetName: "Consultations",
  })
  return filteredData.length
}

const GENDER_OPTIONS = [
  { value: "ALL", label: "All Genders" },
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
] as const

const STATUS_OPTIONS = [
  { value: "ALL", label: "All Statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "PROCESSING", label: "Processing" },
  { value: "RESOLVED", label: "Resolved" },
] as const

export function ReportsFilters({ clinicUid }: ReportsFiltersProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [activeFilters, setActiveFilters] = useState<Partial<ReportsFilterValues>>({})

  const form = useForm<ReportsFilterValues>({
    resolver: zodResolver(reportsFilterSchema),
    defaultValues: {
      startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      endDate: new Date(),
      gender: "ALL",
      status: "ALL",
      system: "ALL",
    },
  })

  const { data: consultations } = useConsultations({
    clinicUid,
    showArchived: false
  })

  const handleApplyFilters = (values: ReportsFilterValues) => {
    setActiveFilters(values)
    toast.success("Filters applied successfully")
  }

  const handleDownloadReport = async () => {
    if (!consultations?.data?.length) {
      toast.error("No data available for download")
      return
    }

    setIsLoading(true)

    const downloadPromise = generateAndExportConsultationReport(
      (consultations.data ?? []) as NonNullable<GetConsultationTickets["data"]>,
      form.getValues()
    )

    try {
      toast.promise(downloadPromise, {
        loading: "Preparing report for download...",
        success: (recordCount) => `Report downloaded successfully (${recordCount} records)`,
        error: "Failed to download report",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleClearFilters = () => {
    form.reset()
    setActiveFilters({})
    toast.success("Filters cleared")
  }

  const getActiveFilterCount = () => {
    return Object.values(activeFilters).filter(value =>
      value !== undefined && value !== "ALL"
    ).length
  }

  const systemOptions = [
    { value: "ALL", label: "All Systems" },
    ...(consultations?.data
      ?.reduce((acc: Array<{ value: string, label: string }>, ticket) => {
        const systemName = ticket.System.name
        if (!acc.find(item => item.value === systemName)) {
          acc.push({ value: systemName, label: systemName })
        }
        return acc
      }, []) || [])
  ]

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Consultation Reports
        </CardTitle>
        <CardDescription>
          Filter and download comprehensive consultation ticket reports.
        </CardDescription>
      </CardHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleApplyFilters)} className="space-y-6">
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a start date</span>
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
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>End Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick an end date</span>
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
                          disabled={(date) => {
                            const startDate = form.getValues("startDate")
                            return date > new Date() ||
                              date < new Date("1900-01-01") ||
                              (startDate && date < startDate)
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {GENDER_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {STATUS_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="system"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>System</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select system" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {systemOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {getActiveFilterCount() > 0 && (
              <div className="flex flex-wrap items-center gap-2 p-4 bg-muted/50 rounded-lg">
                <span className="text-sm font-medium">Active filters:</span>
                <Badge variant="secondary">
                  {getActiveFilterCount()} filter{getActiveFilterCount() !== 1 ? 's' : ''} applied
                </Badge>
              </div>
            )}
          </CardContent>

          <div className="px-6 pb-6">
            <div className="flex flex-col sm:flex-row gap-3 justify-between">
              <div className="flex gap-2">
                <Button type="submit" variant="outline" className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Apply Filters
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleClearFilters}
                  disabled={getActiveFilterCount() === 0}
                >
                  Clear Filters
                </Button>
              </div>

              <Button
                type="button"
                onClick={handleDownloadReport}
                className="flex items-center gap-2"
                disabled={isLoading || !consultations?.data?.length}
              >
                <Download className="h-4 w-4" />
                {isLoading ? "Downloading..." : "Download Report"}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </Card>
  )
}