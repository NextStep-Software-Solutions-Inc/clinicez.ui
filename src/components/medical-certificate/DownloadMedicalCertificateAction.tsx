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

        // Helper function to get checkbox class with debugging
        const getCheckboxClass = (condition: boolean, debugSymbol = "✓"): string => {
          return condition ? "checked" : ""
        }

        // Classification checkboxes
        const classA = getCheckboxClass(data.Classification?.name === "Class A", "A")
        const classB = getCheckboxClass(data.Classification?.name === "Class B", "B")
        const classC = getCheckboxClass(data.Classification?.name === "Class C", "C")
        const classD = getCheckboxClass(data.Classification?.name === "Class D", "D")

        // Reason checkboxes
        const physicalExamOnly = getCheckboxClass(data.Reason?.name === "Physical Exam Only", "1")
        const physicalExamWithTests = getCheckboxClass(data.Reason?.name === "Physical Exam with Tests", "2")
        const consultation = getCheckboxClass(data.Reason?.name === "Consultation/Treatment", "3")

        // Finding checkboxes
        const unremarkable = getCheckboxClass(data.Finding?.name === "Unremarkable")
        const abnormal = getCheckboxClass(data.Finding?.name === "Abnormal")
        const normal = getCheckboxClass(data.Finding?.name === "Normal")

        const recommendations = data.remarks || ""
        const createdDate = data.createdAt ? dayjs(data.createdAt).format("MM/DD/YYYY") : ""
        const createdDateTime = data.createdAt ? dayjs(data.createdAt).format("MM/DD/YYYY h:mm A") : ""

        // Create replacement map for cleaner code
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
          "@{classA}": classA,
          "@{classB}": classB,
          "@{classC}": classC,
          "@{classD}": classD,
          "@{physicalExamOnly}": physicalExamOnly,
          "@{physicalExamWithTests}": physicalExamWithTests,
          "@{consultation}": consultation,
          "@{unremarkable}": unremarkable,
          "@{abnormal}": abnormal,
          "@{normal}": normal,
          "@{recommendations}": recommendations,
        }

        let html = data.DocumentTemplate?.htmlContent ?? ""

        // Apply all replacements
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
