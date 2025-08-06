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
import dayjs from "@lib/day-utils"

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
      success: (res) => {
        const data = res.data
        if (!data) throw new Error("No data returned")

        const prescribingHP = data.HealthcareProvider
        const prescribingDoctorName = formatHealthcareProviderName(
          { hpProfile: prescribingHP?.HPProfile || undefined, user: prescribingHP?.User || undefined }
        )

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

        const licenseNo = prescribingHP?.ProfessionalDetails?.licenseNumber || ""
        const ptrNo = prescribingHP?.ProfessionalDetails?.ptrNumber || ""
        const doctorAddress = Array.isArray(prescribingHP?.HPProfile?.fields)
          ? prescribingHP?.HPProfile?.fields.join(", ")
          : prescribingHP?.HPProfile?.fields || ""

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
