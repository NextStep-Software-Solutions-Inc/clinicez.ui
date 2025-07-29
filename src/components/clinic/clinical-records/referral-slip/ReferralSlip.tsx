"use client"

import { PatientProfile } from "@/components/consultation/ConsultationDetails";
import Suspend from "@/components/Suspend";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import CreateReferralSlipModal from "./CreateReferralSlipModal";

interface ReferralSlipProps {
  clinicUid: string;
  patientId: number;
  hpIds: number[];
  consultationTicketId: number;
  userInfo?: PatientProfile | null;
  appointment: {
    id: number;
    complaint: string;
  }
}

export default function ReferralSlip({
  clinicUid,
  patientId,
  hpIds,
  consultationTicketId,
  userInfo,
  appointment
}: ReferralSlipProps) {

  return (
    <Card className="group/referral-slip">
      <CardHeader>
        <div className="flex flex-wrap gap-2 items-center">
          <div>
            <CardTitle className="text-lg">Referral Slip</CardTitle>
            <CardDescription>Manage referral slips for the patient</CardDescription>
          </div>
          <div className="ml-auto flex flex-grow sm:flex-grow-0 items-center gap-2">
            <Suspend>
              <CreateReferralSlipModal
                clinicUid={clinicUid}
                patientId={patientId}
                hpIds={hpIds}
                consultationTicketId={consultationTicketId}
                userInfo={userInfo}
                appointment={appointment}
              />
            </Suspend>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}