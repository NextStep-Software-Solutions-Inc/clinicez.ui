"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@components/ui/card";
import AddInterventionModal from "./modals/AddInterventionModal";
import Each from "@components/utils/Each";
import { Avatar, AvatarFallback } from "@components/ui/avatar";
import { GetConsultationTicket } from "@actions/consultation/consultation-ticket.action";
import dayjs from "@lib/day-utils";

import Image from "next/image";
import { useInterventions } from "@hooks/useIntervention";
import { useHPsByIds } from "@hooks/useHP";

interface InterventionsProps {
  consultation: NonNullable<GetConsultationTicket["data"]>;
}
export default function Interventions({ consultation }: InterventionsProps) {
  const {data: interventions} = useInterventions({
    clinicUid: consultation.Clinic.clinicUid,
    consultationTicketId: consultation.id
  })
  const hpIds = interventions?.data.map(intervention => intervention.hpId) ?? []
  const {data: hps } = useHPsByIds(hpIds)

  return (
    <Card>
      <CardHeader >
        <div className="flex flex-row">
          <div>
            <CardTitle>Interventions</CardTitle>
            <CardDescription>
              Logs on all the interventions performed on the patient.
            </CardDescription>
          </div>
          <div className="ml-auto">
            <AddInterventionModal consultation={consultation}/>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* list of interventions */}
        <div className="flex flex-wrap gap-2">
          <Each
            of={interventions?.data ?? []}
            fallback={<div className="flex justify-center text-muted-foreground">No interventions</div>}
            render={(intervention) => {
              const hp = (hps ?? []).find(hp => hp.id === intervention.hpId)
              return (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base font-normal">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8 object-cover">
                          {hp?.HPProfile?.picture ? <Image alt={hp.HPProfile.name} className="object-cover" src={hp.HPProfile.picture} height={50} width={50} /> : <AvatarFallback>{hp?.HPProfile?.name.substring(0,2)}</AvatarFallback>}
                        </Avatar> 
                        <div>
                          <span className="font-medium capitalize text-sm">{intervention.Action.name}</span>
                          <div className="text-muted-foreground text-xs">{hp?.HPProfile?.name} <span className="italic">({hp?.HPType.name})</span></div>
                        </div>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="ml-9 italic">- {intervention.details}</p>
                  </CardContent>
                  <CardFooter className="text-xs">
                    {dayjs(intervention.createdAt).fromNow()}
                  </CardFooter>
                </Card>
              )
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
