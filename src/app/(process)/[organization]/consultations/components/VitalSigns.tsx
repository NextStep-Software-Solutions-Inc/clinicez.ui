import { GetConsultationRecord } from "@actions/consultation/consultation-ticket.action";
import RecentVitalSigns from "../../../../(main)/user/[user]/phr/vitals/RecentVitalSigns";
import { getUserVitalSignsAction } from "@actions/vitals.action";

interface VitalSignsProps {
    consultation:  NonNullable<GetConsultationRecord["data"]>;
    userId: string;
}
export default async function VitalSigns({ consultation, userId}: VitalSignsProps) {

  const vitalSigns = await getUserVitalSignsAction(consultation.Appointment.Requesters?.[0].email);
  return (
    <RecentVitalSigns vitalSigns={vitalSigns} readOnly={false} userId={userId} />
  );
}
