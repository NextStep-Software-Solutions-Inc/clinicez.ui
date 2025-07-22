import React from "react"
import { promiseWrapper } from "@/lib/with-error-handling"
import { toast } from "sonner"
import { getMedicalCertificateAction } from "@/actions/clinics/clinical-record/medical-certificate.action"
import { handlePrintHtmlToPDF } from "@/lib/print-pdf"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip"
import { formatAddress } from "@/lib/utils/format-address"
import { calculateAge } from "@/lib/utils"
import { prepareMedicalCertificate } from "@/lib/prepare-medical-certificate"

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
            address: doctorAddress,
          },
          certificate: {
            classification: data.Classification?.name || "",
            classificationDescription: data.Classification?.description || "",
            reason: data.Reason?.name || "",
            finding: data.Finding?.name || "",
            recommendations: data.remarks || "",
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
