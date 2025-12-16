import EMRFiles from "./EMRFiles";

interface EMRFilesWrapperProps {
  patientId: string;
}

export default function EMRFilesWrapper({
  patientId,
}: EMRFilesWrapperProps) {
  return <EMRFiles patientId={patientId} />;
}
