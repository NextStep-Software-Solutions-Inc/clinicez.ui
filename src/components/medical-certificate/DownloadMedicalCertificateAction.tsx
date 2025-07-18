import type React from "react"
import { promiseWrapper } from "@/lib/with-error-handling"
import { toast } from "sonner"
import { getMedicalCertificateAction } from "@/actions/clinics/clinical-record/medical-certificate.action"
import dayjs from "@lib/day-utils"
import { handlePrintHtmlToPDF } from "@/lib/print-pdf"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip"
import { formatAddress } from "@/lib/utils/format-address"
import { calculateAge } from "@/lib/utils"

interface DownloadMedicalCertificateActionProps {
  onUpdated?: () => void
  certificate: { id: number }
  children?: React.ReactNode
}

const DownloadMedicalCertificateAction = ({
  certificate,
  children,
  onUpdated,
}: DownloadMedicalCertificateActionProps) => {
  const handleDownload = async () => {
    toast.promise(promiseWrapper(getMedicalCertificateAction)(certificate.id), {
      loading: "Downloading medical certificate...",
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

        const addressObj =
          Array.isArray(patient.UserAddresses) && patient.UserAddresses.length > 0
            ? patient.UserAddresses[0]
            : undefined
        const address = formatAddress(addressObj)

        // Helper function to get the selected text value
        const getSelectedText = (value: string | undefined): string => {
          return value || ""
        }

        // Get selected values
        const selectedClassification = getSelectedText(data.Classification?.name)
        const selectedClassificationDescription = data.Classification?.description || ""
        const selectedReason = getSelectedText(data.Reason?.name)
        const selectedFinding = getSelectedText(data.Finding?.name)

        const recommendations = data.remarks || ""
        const createdDate = data.createdAt ? dayjs(data.createdAt).format("MM/DD/YYYY") : ""
        const createdDateTime = data.createdAt ? dayjs(data.createdAt).format("MM/DD/YYYY h:mm A") : ""

        const replacements = {
          "@{createdDate}": createdDate,
          "@{createdDateTime}": createdDateTime,
          "@{patientName}": patientName,
          "@{age}": String(age),
          "@{gender}": gender,
          "@{address}": address,
          "@{doctorName}": doctorName,
          "@{licenseNo}": licenseNo,
          "@{ptrNo}": ptrNo,
          "@{doctorAddress}": doctorAddress,
          "@{selectedClassification}": selectedClassification,
          "@{selectedClassificationDescription}": selectedClassificationDescription,
          "@{selectedReason}": selectedReason,
          "@{selectedFinding}": selectedFinding,
          "@{recommendations}": recommendations,
        }

        let html = data.DocumentTemplate?.htmlContent ?? ""

        Object.entries(replacements).forEach(([placeholder, value]) => {
          html = html.replaceAll(placeholder, value)
        })

        handlePrintHtmlToPDF(html)
        return res.message
      },
      error: "Failed to download medical certificate",
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

export default DownloadMedicalCertificateAction
