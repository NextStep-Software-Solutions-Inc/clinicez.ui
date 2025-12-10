import EMRFiles from "./EMRFiles";

interface EMRFilesWrapperProps {
  patientId: string;
  clinicUid: string;
}

export default function EMRFilesWrapper({
  patientId,
  clinicUid,
}: EMRFilesWrapperProps) {
  return <EMRFiles patientId={patientId} clinicUid={clinicUid} />;
}
