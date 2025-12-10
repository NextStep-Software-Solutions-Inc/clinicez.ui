import Suspend from "./Suspend";
import EMRFiles from "./EMRFiles";

interface EMRFilesWrapperProps {
  patientId: string;
  clinicUid: string;
}

export default function EMRFilesWrapper({
  patientId,
  clinicUid,
}: EMRFilesWrapperProps) {
  return (
    <Suspend>
      <EMRFiles patientId={patientId} clinicUid={clinicUid} />
    </Suspend>
  );
}
