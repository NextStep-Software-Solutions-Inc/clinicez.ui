import type React from "react"
import { promiseWrapper } from "@/lib/with-error-handling"
import { toast } from "sonner"
import { getImagingStudyAction } from "@/actions/clinics/clinical-record/imaging-studies.action"
import dayjs from "@lib/day-utils"
import { handlePrintHtmlToPDF } from "@/lib/print-pdf"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip"
import { formatAddress } from "@/lib/utils/format-address"
import { calculateAge } from "@/lib/utils"

interface DownloadImagingStudiesActionProps {
  onUpdated?: () => void
  study: { id: number }
  children?: React.ReactNode
}

const DownloadImagingStudiesAction = ({
  study,
  children,
  onUpdated,
}: DownloadImagingStudiesActionProps) => {
  const handleDownload = async () => {
    toast.promise(promiseWrapper(getImagingStudyAction)(study.id), {
      loading: "Downloading imaging study request...",
      success: (res) => {
        const data = res.data
        if (!data) throw new Error("No data returned")

        // Doctor info
        const hpProfile = data.HealthCareProvider?.HPProfile
        const professionalDetails = data.HealthCareProvider?.ProfessionalDetails
        const doctorName = `${hpProfile?.title ?? ""} ${hpProfile?.name ?? ""} ${hpProfile?.suffix ?? ""}`.trim()
        const licenseNo = professionalDetails?.licenseNumber ?? ""
        const ptrNo = professionalDetails?.ptrNumber ?? ""
        const doctorAddress = ""

        // Patient info
        const patient = data.ClinicPatient?.Patient ?? {}
        const patientName =
          `${patient.firstName ?? ""} ${patient.middleName ?? ""} ${patient.lastName ?? ""} ${patient.suffix ?? ""}`.trim()
        const age = patient.dob ? calculateAge(patient.dob) : ""
        const gender = patient.gender ?? ""
        const birthdate = patient.dob ? dayjs(patient.dob).format("MM/DD/YYYY") : ""

        const addressObj =
          Array.isArray(patient.UserAddresses) && patient.UserAddresses.length > 0
            ? patient.UserAddresses[0]
            : undefined
        const address = formatAddress(addressObj)

        // Imaging study specific data
        const diagnostics = data.ImagingRequestDiagnostics?.map(item => item.ImagingDiagnostic?.name).filter(Boolean).join(", ") || ""
        const history = data.history || ""
        const impression = data.impression || ""
        const requestFor = data.reason || ""

        const requestDate = data.createdAt ? dayjs(data.createdAt).format("MM/DD/YYYY") : ""
        const createdDateTime = data.createdAt ? dayjs(data.createdAt).format("MM/DD/YYYY h:mm A") : ""

        const replacements = {
          "@{name}": patientName,
          "@{age}": String(age),
          "@{gender}": gender,
          "@{address}": address,
          "@{birthdate}": birthdate,
          "@{requestDate}": requestDate,
          "@{diagnostics}": diagnostics,
          "@{history}": history,
          "@{impression}": impression,
          "@{requestFor}": requestFor,
          "@{doctorName}": doctorName,
          "@{licenseNo}": licenseNo,
          "@{ptrNo}": ptrNo,
          "@{doctorAddress}": doctorAddress,
          "@{createdDateTime}": createdDateTime,
        }

        let html = data.DocumentTemplate?.htmlContent ?? ""

        Object.entries(replacements).forEach(([placeholder, value]) => {
          html = html.replaceAll(placeholder, value)
        })

        handlePrintHtmlToPDF(html)
        return res.message
      },
      error: "Failed to download imaging study request",
    })
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <form action={handleDownload}>{children}</form>
        </TooltipTrigger>
        <TooltipContent side="top">Download</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export default DownloadImagingStudiesAction
