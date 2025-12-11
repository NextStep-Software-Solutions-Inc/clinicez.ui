import EMRFiles from "./EMRFiles";

interface EMRFilesWrapperProps {
  patientId: string;
  clinicUid: string;
}

export default function EMRFilesWrapper({
  patientId,
}: EMRFilesWrapperProps) {
  return <EMRFiles patientId={patientId} />;
}
