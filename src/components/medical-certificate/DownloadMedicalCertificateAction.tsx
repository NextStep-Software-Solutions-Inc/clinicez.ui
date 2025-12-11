import React from "react"
import { promiseWrapper } from "@/lib/with-error-handling"
import { toast } from "sonner"
import { getMedicalCertificateAction } from "@/actions/clinics/clinical-record/medical-certificate.action"
import { handlePrintHtmlToPDF } from "@/lib/print-pdf"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip"
import { formatPatientAddress } from "@/lib/utils/format-patient-address"
import { formatHealthcareProviderName } from "@/lib/utils/format-healthcare-provider-name"
import { calculateAge } from "@/lib/utils"
import { prepareMedicalCertificate } from "@/lib/prepare-medical-certificate"
import { safeImageUrlToBase64 } from "@/lib/image-to-base64"

interface DownloadMedicalCertificateActionProps {
  onUpdated?: () => void
  certificate: { id: number }
  children?: React.ReactNode
}

const DownloadMedicalCertificateAction = React.forwardRef<
  HTMLFormElement,
  DownloadMedicalCertificateActionProps
>(({ certificate, children, onUpdated }, ref) => {
  const handleDownload = async () => {
    toast.promise(promiseWrapper(getMedicalCertificateAction)(certificate.id), {
      loading: "Downloading medical certificate...",
      success: async (res) => {
        const data = res.data
        if (!data) throw new Error("No data returned")

        const doctorName = formatHealthcareProviderName({
          hpProfile: data.HealthCareProvider?.HPProfile || undefined,
          user: data.HealthCareProvider?.User || undefined
        })
        const professionalDetails = data.HealthCareProvider?.ProfessionalDetails
        const hpProfile = data.HealthCareProvider?.HPProfile
        const licenseNo = professionalDetails?.licenseNumber ?? ""
        const ptrNo = professionalDetails?.ptrNumber ?? ""
        const eSignatureUrl = hpProfile?.eSignatureUrl ?? ""

        const eSignatureBase64 = eSignatureUrl ? await safeImageUrlToBase64(eSignatureUrl) : ""

        const patient = data.ClinicPatient?.Patient ?? {}
        const patientName =
          `${patient.firstName ?? ""} ${patient.middleName ?? ""} ${patient.lastName ?? ""} ${patient.suffix ?? ""}`.trim()
        const age = calculateAge(patient.dob) ?? ""
        const gender = patient.gender ?? ""

        const address = formatPatientAddress(patient)

        const template = prepareMedicalCertificate({
          template: data.DocumentTemplate?.htmlContent ?? "",
          patient: {
            name: patientName,
            age: String(age),
            gender,
            address,
          },
          doctor: {
            name: doctorName,
            licenseNo,
            ptrNo,
            eSignatureBase64,
          },
          certificate: {
            classification: data.Classification?.name || "",
            classificationDescription: data.Classification?.description || "",
            reason: data.Reason?.name || "",
            finding: data.Finding?.name || "",
            recommendations: data.remarks || "",
            impression: data.impression || "",
            createdAt: data.createdAt || new Date(),
          },
        })

        handlePrintHtmlToPDF(template)
        return res.message
      },
      error: "Failed to download medical certificate",
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

DownloadMedicalCertificateAction.displayName = "DownloadMedicalCertificateAction"

export default DownloadMedicalCertificateAction
