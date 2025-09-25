import React from "react"
import { promiseWrapper } from "@/lib/with-error-handling"
import { toast } from "sonner"
import { getPrescriptionAction } from "@/actions/clinics/clinical-record/prescription.action"
import { handlePrintHtmlToPDF } from "@/lib/print-pdf"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { formatPatientAddress } from "@/lib/utils/format-patient-address"
import { formatHealthcareProviderName } from "@/lib/utils/format-healthcare-provider-name"
import { calculateAge } from "@/lib/utils"
import { preparePrescription } from "@/lib/prepare-prescription"
import { safeImageUrlToBase64 } from "@/lib/image-to-base64"

interface DownloadPrescriptionActionProps {
  onUpdated?: () => void
  prescription: { id: number }
  children?: React.ReactNode
}

const DownloadPrescriptionAction = React.forwardRef<
  HTMLFormElement,
  DownloadPrescriptionActionProps
>(({ prescription, children }, ref) => {
  const handleDownload = async () => {
    toast.promise(promiseWrapper(getPrescriptionAction)(prescription.id), {
      loading: "Downloading prescription...",
      success: async (res) => {
        const data = res.data
        if (!data) throw new Error("No data returned")

        const prescribingHP = data.HealthcareProvider
        const prescribingDoctorName = formatHealthcareProviderName(
          { hpProfile: prescribingHP?.HPProfile || undefined, user: prescribingHP?.User || undefined }
        )
        const professionalDetails = prescribingHP?.ProfessionalDetails
        const hpProfile = prescribingHP?.HPProfile
        const licenseNo = professionalDetails?.licenseNumber || ""
        const ptrNo = professionalDetails?.ptrNumber || ""
        const eSignatureUrl = hpProfile?.eSignatureUrl ?? ""

        const eSignatureBase64 = eSignatureUrl ? await safeImageUrlToBase64(eSignatureUrl) : ""

        const patient = data.ClinicPatient?.Patient
        const patientName = patient ?
          `${patient.firstName ?? ""} ${patient.middleName ?? ""} ${patient.lastName ?? ""} ${patient.suffix ?? ""}`.trim() : "Unknown Patient"
        const age = patient?.dob ? String(calculateAge(patient.dob)) : ""
        const gender = patient?.gender ?? ""
        const address = formatPatientAddress(patient)

        const medicines = (data.Medicines || []).map(medicine => ({
          name: medicine.name || "",
          dosage: medicine.dosage,
          unit: medicine.unit,
          frequency: medicine.frequency,
          duration: medicine.duration ? String(medicine.duration) : null,
          notes: medicine.notes,
        }))

        const fields = hpProfile?.fields;
        const doctorAddress = Array.isArray(fields)
          ? fields.join(", ")
          : (typeof fields === "string" ? fields : "");

        const template = preparePrescription({
          template: data.DocumentTemplate?.htmlContent ?? "",
          patient: {
            name: patientName,
            age,
            gender,
            address,
          },
          prescription: {
            medicines,
            remarks: data.remarks || "",
            createdAt: data.createdAt || new Date(),
          },
          doctor: {
            name: prescribingDoctorName,
            licenseNo,
            ptrNo,
            address: doctorAddress,
            eSignatureBase64,
          },
        })

        handlePrintHtmlToPDF(template)
        return res.message
      },
      error: "Failed to download prescription",
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

DownloadPrescriptionAction.displayName = "DownloadPrescriptionAction"

export default DownloadPrescriptionAction
