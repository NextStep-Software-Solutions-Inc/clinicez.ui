import React from "react";
import { promiseWrapper } from "@/lib/with-error-handling";
import { toast } from "sonner";
import { getPrescriptionAction } from "@/actions/medications/prescription.action";
import { differenceInCalendarYears } from "date-fns";
import { preparePrescription } from "@/lib/prepare-prescription";
import dayjs from "@lib/day-utils";
import { handlePrintHtmlToPDF } from "@/lib/print-pdf";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { GetMedication } from "@/actions/medications/medication.action";

interface DownloadPrescriptionActionProps {
  onUpdated?: () => void;
  prescription: NonNullable<GetMedication["data"]>["Prescriptions"][number];
  children?: React.ReactNode;
}

const DownloadPrescriptionAction = React.forwardRef<
  HTMLFormElement,
  DownloadPrescriptionActionProps
>(({ prescription, children, onUpdated }, ref) => {

  const handleDownload = async () => {
    toast.promise(promiseWrapper(getPrescriptionAction)(prescription.id), {
      loading: "Downloading prescription...",
      success: (res) => {
        // hp info
        const hpName = `${res.data?.Medication.HealthCareProvider.HPProfile?.title ?? ""} ${res.data?.Medication.HealthCareProvider.HPProfile?.name ?? ""} ${res.data?.Medication.HealthCareProvider.HPProfile?.suffix ?? ""}`.trim()
        const hpSpecialization = res.data?.Medication.HealthCareProvider.HPProfile?.specialties?.[0] ?? ""
        const hpLicenseNumber = res.data?.Medication.HealthCareProvider.ProfessionalDetails?.licenseNumber ?? ""
        const hpPtrNumber = res.data?.Medication.HealthCareProvider.ProfessionalDetails?.ptrNumber ?? ""

        //patient info
        const address = res.data?.Medication.Patient.UserAddresses[0]
        const addressLine = `${address?.address ?? ""}, ${address?.city ?? ""}, ${address?.state ?? ""}, ${address?.country ?? ""}, ${address?.zipCode ?? ""}`
        const patientName = `${res.data?.Medication.Patient.firstName ?? ""} ${res.data?.Medication.Patient.middleName ?? ""} ${res.data?.Medication.Patient.lastName ?? ""} ${res.data?.Medication.Patient.suffix ?? ""}`.trim()
        const patientAge = differenceInCalendarYears(new Date(), new Date(res.data?.Medication.Patient.dob ?? "")) + " years"
        const patientGender = res.data?.Medication.Patient.gender?.toLocaleLowerCase() ?? ""

        const template = preparePrescription({
          prescriptionDate: dayjs().format("lll"),
          medications: res.data?.Medication.MedicationDrugs ?? [],
          template: res.data?.DocumentTemplate.htmlContent ?? "",
          patient: {
            name: patientName,
            age: patientAge,
            gender: patientGender,
            address: addressLine
          },
          hp: {
            name: hpName,
            specialization: hpSpecialization,
            licenseNumber: hpLicenseNumber,
            ptrNumber: hpPtrNumber,
            signatureUrl: "https://via.placeholder.com/150"
          }
        })
        handlePrintHtmlToPDF(template);
        return res.message;
      },
      error: "Failed to download prescription"
    })
  }

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <form ref={ref} action={handleDownload}>
              {children}
            </form>
          </TooltipTrigger>
          <TooltipContent side="top">Download</TooltipContent>
        </Tooltip>
      </TooltipProvider></>
  )
})

DownloadPrescriptionAction.displayName = "DownloadPrescriptionAction"

export default DownloadPrescriptionAction;