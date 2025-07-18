import type React from "react"
import { promiseWrapper } from "@/lib/with-error-handling"
import { toast } from "sonner"
import { getLaboratoryRequestAction } from "@/actions/clinics/clinical-record/laboratory-requests.action"
import dayjs from "@lib/day-utils"
import { handlePrintHtmlToPDF } from "@/lib/print-pdf"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip"
import { formatAddress } from "@/lib/utils/format-address"
import { calculateAge } from "@/lib/utils"

interface DownloadLaboratoryRequestActionProps {
  onUpdated?: () => void
  request: { id: number }
  children?: React.ReactNode
}

const DownloadLaboratoryRequestAction = ({
  request,
  children,
  onUpdated,
}: DownloadLaboratoryRequestActionProps) => {
  const handleDownload = async () => {
    toast.promise(promiseWrapper(getLaboratoryRequestAction)(request.id), {
      loading: "Downloading laboratory request...",
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

        // Group diagnostics by category
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

        // Helper function to format category tests as comma-separated bold text
        const formatCategoryTests = (category: string): string => {
          const tests = diagnosticsByCategory[category] || []
          return tests.length > 0 ? `<strong>${tests.join(", ")}</strong>` : ""
        }

        const impression = data.impression || ""
        const requestDate = data.createdAt ? dayjs(data.createdAt).format("MM/DD/YYYY") : ""
        const createdDateTime = data.createdAt ? dayjs(data.createdAt).format("MM/DD/YYYY h:mm A") : ""
        const birthdate = patient.dob ? dayjs(patient.dob).format("MM/DD/YYYY") : ""

        const replacements = {
          "@{name}": patientName,
          "@{age}": String(age),
          "@{gender}": gender,
          "@{address}": address,
          "@{birthdate}": birthdate,
          "@{requestDate}": requestDate,
          "@{impression}": impression,
          "@{doctorName}": doctorName,
          "@{licenseNo}": licenseNo,
          "@{ptrNo}": ptrNo,
          "@{doctorAddress}": doctorAddress,
          "@{createdDateTime}": createdDateTime,

          "@{hematologyTests}": formatCategoryTests("HEMATOLOGY"),
          "@{clinicalMicroscopyTests}": formatCategoryTests("CLINICAL MICROSCOPY") || formatCategoryTests("MICROSCOPY"),
          "@{bloodChemistryTests}": formatCategoryTests("BLOOD CHEMISTRY") || formatCategoryTests("CHEMISTRY"),
          "@{microbiologyTests}": formatCategoryTests("MICROBIOLOGY"),
          "@{hormoneAssaysTests}": formatCategoryTests("HORMONE ASSAYS") || formatCategoryTests("HORMONES"),
          "@{cardiacDiagnosticsTests}": formatCategoryTests("CARDIAC DIAGNOSTICS") || formatCategoryTests("CARDIAC") || formatCategoryTests("ECG"),
        }

        let html = data.DocumentTemplate?.htmlContent ?? ""

        Object.entries(replacements).forEach(([placeholder, value]) => {
          html = html.replaceAll(placeholder, value)
        })

        handlePrintHtmlToPDF(html)
        return res.message
      },
      error: "Failed to download laboratory request",
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

export default DownloadLaboratoryRequestAction
