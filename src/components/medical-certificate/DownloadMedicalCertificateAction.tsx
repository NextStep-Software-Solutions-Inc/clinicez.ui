import { promiseWrapper } from "@/lib/with-error-handling";
import { toast } from "sonner";
import { getMedicalCertificateAction } from "@/actions/clinics/clinical-record/medical-certificate.action";
import dayjs from "@lib/day-utils";
import { handlePrintHtmlToPDF } from "@/lib/print-pdf";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";

interface DownloadMedicalCertificateActionProps {
  onUpdated?: () => void;
  certificate: { id: number };
  children?: React.ReactNode;
}
const DownloadMedicalCertificateAction = ({ certificate, children, onUpdated }: DownloadMedicalCertificateActionProps) => {
  const handleDownload = async () => {
    toast.promise(promiseWrapper(getMedicalCertificateAction)(certificate.id), {
      loading: "Downloading medical certificate...",
      success: (res) => {
        const data = res.data;
        if (!data) throw new Error("No data returned");
        // Doctor info
        const hpProfile = data.HealthCareProvider?.HPProfile;
        const professionalDetails = data.HealthCareProvider?.ProfessionalDetails;
        const doctorName = `${hpProfile?.title ?? ""} ${hpProfile?.name ?? ""} ${hpProfile?.suffix ?? ""}`.trim();
        const licenseNo = professionalDetails?.licenseNumber ?? "";
        const ptrNo = professionalDetails?.ptrNumber ?? "";

        // TODO: Need to be mapped to an address
        const doctorAddress = "";
        // Patient info
        const patient = data.ClinicPatient?.Patient ?? {};
        const patientName = `${patient.firstName ?? ""} ${patient.middleName ?? ""} ${patient.lastName ?? ""} ${patient.suffix ?? ""}`.trim();
        const age = patient.dob ? (new Date().getFullYear() - new Date(patient.dob).getFullYear()) : "";
        const gender = patient.gender ?? "";

        // TODO: Need to be mapped to an address
        const addressObj = Array.isArray(patient.UserAddresses) && patient.UserAddresses.length > 0 ? patient.UserAddresses[0] : undefined;
        const address = addressObj ? `${addressObj.address ?? ""}, ${addressObj.city ?? ""}, ${addressObj.state ?? ""}, ${addressObj.country ?? ""}, ${addressObj.zipCode ?? ""}`.replace(/(, )+/g, ', ').replace(/^, |, $/g, '') : "";
        // Classification checkboxes
        const classA = data.Classification?.name === "Class A" ? "checked" : "";
        const classB = data.Classification?.name === "Class B" ? "checked" : "";
        const classC = data.Classification?.name === "Class C" ? "checked" : "";
        const classD = data.Classification?.name === "Class D" ? "checked" : "";

        const physicalExamOnly = data.Reason?.name === "Physical Exam Only" ? "checked" : "";
        const physicalExamWithTests = data.Reason?.name === "Physical Exam with Tests" ? "checked" : "";
        const consultation = data.Reason?.name === "Consultation/Treatment" ? "checked" : "";

        const unremarkable = data.Finding?.name === "Unremarkable" ? "checked" : "";
        const abnormal = data.Finding?.name === "Abnormal" ? "checked" : "";

        const recommendations = data.remarks || "";

        const createdDate = data.createdAt ? dayjs(data.createdAt).format("MM/DD/YYYY") : "";
        const createdDateTime = data.createdAt ? dayjs(data.createdAt).format("MM/DD/YYYY h:mm A") : "";

        const html = (data.DocumentTemplate?.htmlContent ?? "")
          .replaceAll("@{createdDate}", createdDate)
          .replaceAll("@{createdDateTime}", createdDateTime)
          .replaceAll("@{patientName}", patientName)
          .replaceAll("@{age}", String(age))
          .replaceAll("@{gender}", gender)
          .replaceAll("@{address}", address)
          .replaceAll("@{doctorName}", doctorName)
          .replaceAll("@{licenseNo}", licenseNo)
          .replaceAll("@{ptrNo}", ptrNo)
          .replaceAll("@{doctorAddress}", doctorAddress)
          .replaceAll("@{classA}", classA)
          .replaceAll("@{classB}", classB)
          .replaceAll("@{classC}", classC)
          .replaceAll("@{classD}", classD)
          .replaceAll("@{physicalExamOnly}", physicalExamOnly)
          .replaceAll("@{physicalExamWithTests}", physicalExamWithTests)
          .replaceAll("@{consultation}", consultation)
          .replaceAll("@{unremarkable}", unremarkable)
          .replaceAll("@{abnormal}", abnormal)
          .replaceAll("@{recommendations}", recommendations);
        handlePrintHtmlToPDF(html);
        return res.message;
      },
      error: "Failed to download medical certificate"
    })
  }

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <form action={handleDownload}>
              {children}
            </form>
          </TooltipTrigger>
          <TooltipContent side="top">Download</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </>
  )
}

export default DownloadMedicalCertificateAction;
