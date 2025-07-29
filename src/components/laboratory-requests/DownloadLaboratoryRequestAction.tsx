import React from "react"
import { promiseWrapper } from "@/lib/with-error-handling"
import { toast } from "sonner"
import { getLaboratoryRequestAction } from "@/actions/clinics/clinical-record/laboratory-requests.action"
import dayjs from "@lib/day-utils"
import { handlePrintHtmlToPDF } from "@/lib/print-pdf"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip"
import { formatAddress } from "@/lib/utils/format-address"
import { calculateAge } from "@/lib/utils"
import { prepareLaboratoryRequest } from "@/lib/prepare-laboratory-request"

interface DownloadLaboratoryRequestActionProps {
  onUpdated?: () => void
  request: { id: number }
  children?: React.ReactNode
}

const DownloadLaboratoryRequestAction = React.forwardRef<
  HTMLFormElement,
  DownloadLaboratoryRequestActionProps
>(({ request, children, onUpdated }, ref) => {
  const handleDownload = async () => {
    toast.promise(promiseWrapper(getLaboratoryRequestAction)(request.id), {
      loading: "Downloading laboratory request...",
      success: (res) => {
        const data = res.data
        if (!data) throw new Error("No data returned")

        const hpProfile = data.HealthCareProvider?.HPProfile
        const professionalDetails = data.HealthCareProvider?.ProfessionalDetails
        const doctorName = `${hpProfile?.title ?? ""} ${hpProfile?.name ?? ""} ${hpProfile?.suffix ?? ""}`.trim()
        const licenseNo = professionalDetails?.licenseNumber ?? ""
        const ptrNo = professionalDetails?.ptrNumber ?? ""
        const doctorAddress = ""

        const patient = data.ClinicPatient?.Patient ?? {}
        const patientName =
          `${patient.firstName ?? ""} ${patient.middleName ?? ""} ${patient.lastName ?? ""} ${patient.suffix ?? ""}`.trim()
        const age = patient.dob ? calculateAge(patient.dob) : ""
        const gender = patient.gender ?? ""

        const addressObj =
          Array.isArray(patient.UserAddresses) && patient.UserAddresses.length > 0
            ? patient.UserAddresses[0]
            : undefined
        const address = formatAddress(addressObj)
        const birthdate = patient.dob ? dayjs(patient.dob).format("MM/DD/YYYY") : ""

        const diagnosticsByCategory: Record<string, string[]> = {}
        data.LaboratoryRequestDiagnostics?.forEach((item) => {
          const diagnostic = item.LaboratoryDiagnostic
          if (diagnostic) {
            const category = diagnostic.category?.toUpperCase() || "OTHER"
            if (!diagnosticsByCategory[category]) {
              diagnosticsByCategory[category] = []
            }
            diagnosticsByCategory[category].push(diagnostic.name)
          }
        })

        const template = prepareLaboratoryRequest({
          template: data.DocumentTemplate?.htmlContent ?? "",
          patient: {
            name: patientName,
            age: String(age),
            gender,
            address,
            birthdate,
          },
          doctor: {
            name: doctorName,
            licenseNo,
            ptrNo,
            address: doctorAddress,
          },
          request: {
            impression: data.impression || "",
            diagnosticsByCategory,
            createdAt: data.createdAt || new Date(),
          },
        })

        handlePrintHtmlToPDF(template)
        return res.message
      },
      error: "Failed to download laboratory request",
    })
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <form ref={ref} action={handleDownload}>{children}</form>
        </TooltipTrigger>
        <TooltipContent side="top">Download</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
})

DownloadLaboratoryRequestAction.displayName = "DownloadLaboratoryRequestAction"

export default DownloadLaboratoryRequestAction
