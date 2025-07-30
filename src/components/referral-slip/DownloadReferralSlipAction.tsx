import React from "react"
import { promiseWrapper } from "@/lib/with-error-handling"
import { toast } from "sonner"
import { getReferralSlipAction } from "@/actions/clinics/clinical-record/referral-slip.action"
import { handlePrintHtmlToPDF } from "@/lib/print-pdf"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip"
import { formatAddress } from "@/lib/utils/format-address"
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

        const referringHP = data.CreatedBy?.HealthcareProviders?.[0]
        const referringHPProfile = referringHP?.HPProfile
        const referringHPName = `${referringHPProfile?.title ?? ""} ${referringHPProfile?.name ?? ""} ${referringHPProfile?.suffix ?? ""}`.trim()
        // Fallback to user's full name if HP profile name is empty
        const referringUserName = `${data.CreatedBy?.firstName ?? ""} ${data.CreatedBy?.lastName ?? ""}`.trim()
        const referringDoctorName = referringHPName || referringUserName || "N/A"

        const patient = data.ClinicPatient?.Patient ?? {}
        const patientName =
          `${patient.firstName ?? ""} ${patient.middleName ?? ""} ${patient.lastName ?? ""} ${patient.suffix ?? ""}`.trim()
        const age = patient.dob ? String(calculateAge(patient.dob)) : ""

        const gender = patient.gender ?? ""
        const sex = gender.charAt(0) ?? ""

        const dob = patient.dob ? dayjs(patient.dob).format("MM/DD/YYYY") : ""

        const addressObj =
          Array.isArray(patient.UserAddresses) && patient.UserAddresses.length > 0
            ? patient.UserAddresses[0]
            : undefined
        const address = formatAddress(addressObj)

        const referredTo = data.ReferredTo
        const referredToHPProfile = referredTo?.HPProfile
        const referredToHPName = `${referredToHPProfile?.title ?? ""} ${referredToHPProfile?.name ?? ""} ${referredToHPProfile?.suffix ?? ""}`.trim()
        // Fallback to user's full name if HP profile name is empty
        const referredToUserName = `${referredTo?.User?.firstName ?? ""} ${referredTo?.User?.lastName ?? ""}`.trim()
        const referredToDoctorName = referredToHPName || referredToUserName || "N/A"

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
            referredToSpecialty: referredToDoctorName, // Will show HP profile name or user full name
            chiefComplaint: data.Appointment?.complaint || "",
            briefHistory: data.history || "",
            impression: data.impression || "",
            recommendation: data.recommendation || "",
            reasonForReferral: data.Reason?.name || "",
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
