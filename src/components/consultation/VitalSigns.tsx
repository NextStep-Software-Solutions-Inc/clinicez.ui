import { GetConsultationTicket } from "@actions/consultation/consultation-ticket.action";
import RecentVitalSigns from "../../app/(main)/user/[user]/phr/vitals/RecentVitalSigns";
import { getUserVitalSignsAction } from "@actions/vitals.action";

interface VitalSignsProps {
    consultation:  NonNullable<GetConsultationTicket["data"]>;
    userId: string;
}
export default async function VitalSigns({ consultation, userId}: VitalSignsProps) {

  const requesterEmail = consultation.Appointment?.Requesters?.[0].email
  
  if (!requesterEmail) {
    return null;
  }
  const vitalSigns = await getUserVitalSignsAction(requesterEmail);
  return (
    <RecentVitalSigns vitalSigns={vitalSigns} readOnly={false} userId={userId} />
  );
}
