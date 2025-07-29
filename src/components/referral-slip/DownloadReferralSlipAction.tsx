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

        const hpProfile = data.ReferredTo?.HPProfile
        const professionalDetails = data.ReferredTo?.ProfessionalDetails
        const doctorName = `${hpProfile?.title ?? ""} ${hpProfile?.name ?? ""} ${hpProfile?.suffix ?? ""}`.trim()

        const patient = data.ClinicPatient?.Patient ?? {}
        const patientName =
          `${patient.firstName ?? ""} ${patient.middleName ?? ""} ${patient.lastName ?? ""} ${patient.suffix ?? ""}`.trim()
        const age = patient.dob ? String(calculateAge(patient.dob)) : ""
        const sex = patient.gender ?? ""
        const dob = patient.dob ? dayjs(patient.dob).format("MM/DD/YYYY") : ""

        const addressObj =
          Array.isArray(patient.UserAddresses) && patient.UserAddresses.length > 0
            ? patient.UserAddresses[0]
            : undefined
        const address = formatAddress(addressObj)

        const referredTo = data.ReferredTo
        const referredToName = `${referredTo?.User?.firstName ?? ""} ${referredTo?.User?.lastName ?? ""}`.trim()
        const referredToSpecialty = `${referredToName}${referredTo?.HPType?.name ? ` (${referredTo.HPType.name})` : ""}`

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
            referredToSpecialty,
            chiefComplaint: data.Appointment?.complaint || "",
            briefHistory: data.history || "",
            impression: data.impression || "",
            recommendation: data.recommendation || "",
            reasonForReferral: data.Reason?.name || "",
            referredBy: doctorName,
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
