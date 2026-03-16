import React from "react";
import { promiseWrapper } from "@/lib/with-error-handling";
import { toast } from "sonner"
import { getHeartStationRequestAction } from "@/actions/clinics/clinical-record/heart-station.action"
import dayjs from "@lib/day-utils"
import { handlePrintHtmlToPDF } from "@/lib/print-pdf"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { formatPatientAddress } from "@/lib/utils/format-patient-address"
import { calculateAge } from "@/lib/utils"
import { prepareHeartStationRequest } from "@/lib/prepare-heart-station-request"
import { safeImageUrlToBase64 } from "@/lib/image-to-base64"

interface DownloadHeartStationRequestActionProps {
  request: { id: number }
  children?: React.ReactNode
}

const DownloadHeartStationRequestAction = React.forwardRef<
  HTMLFormElement,
  DownloadHeartStationRequestActionProps
>(({ request, children }, ref) => {
  const handleDownload = async () => {
    toast.promise(promiseWrapper(getHeartStationRequestAction)(request.id), {
      loading: "Downloading heart station request...",
      success: async (res) => {
        const data = res.data
        if (!data) throw new Error("No data returned")

        const hpProfile = data.HealthCareProvider?.HPProfile
        const professionalDetails = data.HealthCareProvider?.ProfessionalDetails
        const doctorName = `${hpProfile?.title ?? ""} ${hpProfile?.name ?? ""}`.trim()
        const licenseNo = professionalDetails?.licenseNumber ?? ""
        const ptrNo = professionalDetails?.ptrNumber ?? ""
        const eSignatureUrl = hpProfile?.eSignatureUrl ?? ""

        const eSignatureBase64 = eSignatureUrl ? await safeImageUrlToBase64(eSignatureUrl) : ""

        const patient = data.ClinicPatient?.Patient ?? {}
        const patientName =
          `${patient.firstName ?? ""} ${patient.middleName ?? ""} ${patient.lastName ?? ""} ${patient.suffix ?? ""}`.trim()
        const age = String(calculateAge(patient.dob) ?? "")
        const gender = patient.gender ?? ""
        const address = formatPatientAddress(patient)

        const diagnostics = data.HeartStationRequestProcedures
          ?.map((item) => item.HeartStationProcedure?.name)
          .filter((name): name is string => !!name) ?? []

        const template = prepareHeartStationRequest({
          template: data.DocumentTemplate?.htmlContent ?? "",
          patient: { name: patientName, age, gender, address },
          doctor: { name: doctorName, licenseNo, ptrNo, eSignatureBase64 },
          request: {
            diagnostics,
            impression: data.impression ?? "",
            history: data.history ?? "",
            requestFor: data.reason ?? "",
            createdAt: data.createdAt,
          },
        })

        handlePrintHtmlToPDF(template)
        return res.message
      },
      error: "Failed to download heart station request",
    })
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <form ref={ref} action={handleDownload}>{children}</form>
        </TooltipTrigger>
        <TooltipContent side="top">Preview PDF</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
})

DownloadHeartStationRequestAction.displayName = "DownloadHeartStationRequestAction"

export default DownloadHeartStationRequestAction
