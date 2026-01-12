import React from "react"
import { promiseWrapper } from "@/lib/with-error-handling"
import { toast } from "sonner"
import { getReferralSlipAction } from "@/actions/clinics/clinical-record/referral-slip.action"
import { handlePrintHtmlToPDF } from "@/lib/print-pdf"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip"
import { formatPatientAddress } from "@/lib/utils/format-patient-address"
import { formatHealthcareProviderName } from "@/lib/utils/format-healthcare-provider-name"
import { calculateAge } from "@/lib/utils"
import { prepareReferralSlip } from "@/lib/prepare-referral-slip"
import dayjs from "@lib/day-utils"

interface DownloadReferralSlipActionProps {
  onUpdated?: () => void
  referralSlip: { id: number }
  children?: React.ReactNode
}

const DownloadReferralSlipAction = React.forwardRef<
  HTMLFormElement,
  DownloadReferralSlipActionProps
>(({ referralSlip, children }, ref) => {
  const handleDownload = async () => {
    toast.promise(promiseWrapper(getReferralSlipAction)(referralSlip.id), {
      loading: "Downloading referral slip...",
      success: (res) => {
        const data = res.data
        if (!data) throw new Error("No data returned")

        const referringHP = data.CreatedBy?.HealthcareProvider
        const referringDoctorName = formatHealthcareProviderName(
          { hpProfile: referringHP?.HPProfile || undefined, user: data.CreatedBy || undefined }
        )

        const patient = data.ClinicPatient?.Patient ?? {}
        const patientName = [
          patient.firstName,
          patient.middleName,
          patient.lastName,
          patient.suffix,
        ].filter(Boolean).join(" ");
        const age = String(calculateAge(patient.dob) ?? "")

        const gender = patient.gender ?? ""
        const sex = gender.charAt(0) ?? ""

        const dob = patient.dob ? dayjs(patient.dob).format("MM/DD/YYYY") : ""

        const address = formatPatientAddress(patient)

        const referredToText = data.referredTo || "Unknown Provider"
        const reasonText = data.reason || "No reason specified"

        const template = prepareReferralSlip({
          template: data.DocumentTemplate?.htmlContent ?? "",
          patient: {
            name: patientName,
            age,
            sex,
            dob,
            address,
          },
          referral: {
            referredToSpecialty: referredToText,
            chiefComplaint: data.Appointment?.complaint || "",
            briefHistory: data.history || "",
            impression: data.impression || "",
            recommendation: data.recommendation || "",
            reasonForReferral: reasonText,
            referredBy: referringDoctorName, // Will show HP profile name or user full name
            createdAt: data.createdAt || new Date(),
          },
        })

        handlePrintHtmlToPDF(template)
        return res.message
      },
      error: "Failed to download referral slip",
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

DownloadReferralSlipAction.displayName = "DownloadReferralSlipAction"

export default DownloadReferralSlipAction
