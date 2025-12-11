import React from "react"
import { promiseWrapper } from "@/lib/with-error-handling"
import { toast } from "sonner"
import { getImagingStudyAction } from "@/actions/clinics/clinical-record/imaging-studies.action"
import dayjs from "@lib/day-utils"
import { handlePrintHtmlToPDF } from "@/lib/print-pdf"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip"
import { formatPatientAddress } from "@/lib/utils/format-patient-address"
import { calculateAge } from "@/lib/utils"
import { prepareImagingStudy } from "@/lib/prepare-imaging-study"
import { safeImageUrlToBase64 } from "@/lib/image-to-base64"

interface DownloadImagingStudiesActionProps {
  onUpdated?: () => void
  study: { id: number }
  children?: React.ReactNode
}

const DownloadImagingStudiesAction = React.forwardRef<
  HTMLFormElement,
  DownloadImagingStudiesActionProps
>(({ study, children, onUpdated }, ref) => {
  const handleDownload = async () => {
    toast.promise(promiseWrapper(getImagingStudyAction)(study.id), {
      loading: "Downloading imaging study request...",
      success: async (res) => {
        const data = res.data
        if (!data) throw new Error("No data returned")

        const hpProfile = data.HealthCareProvider?.HPProfile
        const professionalDetails = data.HealthCareProvider?.ProfessionalDetails
        const doctorName = `${hpProfile?.title ?? ""} ${hpProfile?.name ?? ""} ${hpProfile?.suffix ?? ""}`.trim()
        const licenseNo = professionalDetails?.licenseNumber ?? ""
        const ptrNo = professionalDetails?.ptrNumber ?? ""
        const eSignatureUrl = hpProfile?.eSignatureUrl ?? ""
        const doctorAddress = ""

        const eSignatureBase64 = eSignatureUrl ? await safeImageUrlToBase64(eSignatureUrl) : ""

        const patient = data.ClinicPatient?.Patient ?? {}
        const patientName =
          `${patient.firstName ?? ""} ${patient.middleName ?? ""} ${patient.lastName ?? ""} ${patient.suffix ?? ""}`.trim()
        const age = calculateAge(patient.dob) ?? ""
        const gender = patient?.gender ?? ""
        const birthdate = patient.dob ? dayjs(patient.dob).format("MM/DD/YYYY") : ""

        const address = formatPatientAddress(patient)

        const diagnostics = data.ImagingRequestDiagnostics
          ?.map(item => {
            const diag = item.ImagingDiagnostic || {};
            if (diag.name && diag.description && diag.name !== diag.description) {
              return `${diag.name} (${diag.description})`;
            }
            return diag.name || diag.description;
          })
          .filter(Boolean)
          .join(", ") || "";

        const template = prepareImagingStudy({
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
            eSignatureBase64,
          },
          study: {
            diagnostics,
            history: data.history || "",
            impression: data.impression || "",
            requestFor: data.reason || "",
            createdAt: data.createdAt || new Date(),
          },
        })

        handlePrintHtmlToPDF(template)
        return res.message
      },
      error: "Failed to download imaging study request",
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

DownloadImagingStudiesAction.displayName = "DownloadImagingStudiesAction"

export default DownloadImagingStudiesAction
