"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { CalendarIcon, Download, Filter } from "lucide-react"
import { format } from "date-fns"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { exportCSV, CSVExportData } from "@/lib/file-manipulation"
import { useConsultations } from "@/hooks/useConsultation"
import { toast } from "sonner"
import { calculateAge } from "@/lib/utils"
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
  const filteredData = (data ?? []).filter(ticket => {
    const ticketDate = new Date(ticket.createdAt)
    const patient = ticket.Appointment?.Requesters[0]?.User

    const isInDateRange = filterValues.startDate && filterValues.endDate
      ? ticketDate >= filterValues.startDate && ticketDate <= filterValues.endDate
      : true

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

  const csvData: CSVExportData[] = filteredData.map(ticket => {
    const patient = ticket.Appointment?.Requesters[0]?.User
    const patientNameParts = [
      patient?.firstName,
      patient?.middleName,
      patient?.lastName,
      patient?.suffix
    ].filter(Boolean)
    const patientName = patientNameParts.length ? patientNameParts.join(" ") : "Unknown"

    const age = patient?.dob ? calculateAge(patient.dob) : null
    const program = patient?.StudentRecords?.[0]?.Program?.name || "-"

    const hp = ticket.ConsultationTicketHPs?.[0]?.HealthCareProvider
    const doctorNameParts = [hp?.User?.firstName, hp?.User?.lastName].filter(Boolean)
    const taggedDoctor = hp?.HPProfile?.name || (doctorNameParts.length ? doctorNameParts.join(" ") : "-")

    // Find nurse in charge from healthcare providers
    const nurseHP = ticket.ConsultationTicketHPs?.find(
      (hp) => hp.HealthCareProvider?.User?.OrganizationMembers?.some(
        (member) => member.OrganizationRole?.name === "Nurse"
      )
    )?.HealthCareProvider

    const nurseNameParts = [nurseHP?.User?.firstName, nurseHP?.User?.lastName].filter(Boolean)
    const nurseIncharge = nurseHP?.HPProfile?.name || (nurseNameParts.length ? nurseNameParts.join(" ") : "-")

    // Get the latest Pre-Assessment Note created by a Nurse
    const latestNursePreAssessmentNote = ticket.Appointment?.PreAssessmentNotes?.find(
      (note) => note.CreatedBy?.OrganizationMembers?.some(
        (member) => member.OrganizationRole?.name === "Nurse"
      )
    )

    const icd10ConsultationNote = ticket?.ConsultationNotes?.find(
      (note) => note.section === "icd10"
    );

    const nurseImpression = latestNursePreAssessmentNote?.assessment || "-"

    return {
      "ID": `Ticket #${ticket.id}`,
      "Date": format(new Date(ticket.createdAt), "yyyy-MM-dd"),
      "Patient": patientName,
      "Age": age !== null ? age.toString() : "-",
      "Sex": patient?.gender || "-",
      "Role": patient?.OrganizationMembers?.[0]?.OrganizationRole?.name || "-",
      "Year Level": patient?.StudentRecords?.[0]?.OrganizationYearLevel?.name || "-",
      "Campus": patient?.OrganizationMembers?.[0]?.Organization?.name || "-",
      "Service Category": ticket.Appointment?.AppointmentAttribute?.Service?.ServiceCategory?.name || "-",
      "Service": ticket.Appointment?.AppointmentAttribute?.Service?.name || "-",
      "Status": ticket.Appointment?.AppointmentAttribute?.status || "-",
      "Program": program,
      "Appointment Mode": ticket.Appointment?.AppointmentAttribute?.AppointmentMode?.name || "-",
      "Appointment Type": ticket.Appointment?.AppointmentAttribute?.AppointmentType?.name || "-",
      "Purpose/Chief Complaint": ticket.Appointment?.complaint || ticket.subject || "-",
      "Tagged Doctor": taggedDoctor,
      "Nurse Incharge": nurseIncharge,
      "Nurse Impression": nurseImpression,
      "Doctor's DX": icd10ConsultationNote?.content || "-",
      "System": ticket.System.name,
    }
  })

  const columns = [
    "ID", "Date", "Patient", "Age", "Sex", "Role", "Year Level", "Campus", "Service Category",
    "Service", "Status", "Program", "Appointment Mode", "Appointment Type",
    "Purpose/Chief Complaint", "Tagged Doctor", "Nurse Incharge", "Nurse Impression", "Doctor's DX", "System"
  ]

  const filename = `consultation_reports_${format(new Date(), "yyyy-MM-dd")}`

  exportCSV(columns, csvData, { filename })
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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