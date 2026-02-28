import { GetConsultationTicket } from "@actions/consultation/consultation-ticket.action";
import { RecentVitalSigns } from "@app/(v1)/(main)/user/[user]/phr/vitals";
import { getUserVitalSignsAction } from "@actions/vitals.action";

interface VitalSignsProps {
    consultation:  NonNullable<GetConsultationTicket["data"]>;
    userId: string;
}
export default async function VitalSigns({ consultation, userId}: VitalSignsProps) {

  const requesterUserId = consultation.Appointment?.Requesters?.[0].User.userId
  
  if (!requesterUserId) {
    return null;
  }
  const vitalSigns = await getUserVitalSignsAction(requesterUserId);
  return (
    <RecentVitalSigns vitalSigns={vitalSigns} readOnly={false} userId={userId} />
  );
}
