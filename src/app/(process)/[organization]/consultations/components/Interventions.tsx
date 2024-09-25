"use client"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@components/ui/accordion";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@components/ui/card";
import AddInterventionModal from "./modals/AddInterventionModal";
import { Badge } from "@components/ui/badge";
import Each from "@components/utils/Each";
import { Avatar, AvatarFallback } from "@components/ui/avatar";
import { GetConsultationRecord } from "@actions/consultation/consultation-ticket.action";
import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
dayjs.extend(utc)

import relativeTime from "dayjs/plugin/relativeTime";
import Image from "next/image";
import { useInterventions } from "@hooks/useIntervention";
import { useHPsByIds } from "@hooks/useHP";
dayjs.extend(relativeTime);

interface InterventionsProps {
  consultation: NonNullable<GetConsultationRecord["data"]>;
}
export default function Interventions({ consultation }: InterventionsProps) {
  const payload = new FormData()
  payload.append("consultationRecordId", consultation.id.toString())
  payload.append("orgUid", consultation.orgUid)

  const {data: interventions} = useInterventions({
    orgUid: consultation.orgUid,
    consultationRecordId: consultation.id
  })
  const hpIds = interventions?.data.map(intervention => intervention.hpId) ?? []
  const {data: hps } = useHPsByIds(hpIds)

    
  type HPProfile = {
    id: number;
    type: string; 
    name: string;
    avatarUrl: string;
    fields: string[];
  }
  
  const hpsMapped = (hps ?? []).reduce((acc, hp) => {
    const profile = {} as HPProfile
    profile.id = hp.id;
    profile.type = hp.type;
    switch (hp.type) {
    case "NURSE":
      profile.name = `${hp.NurseProfile?.title} ${hp.NurseProfile?.name} ${hp.NurseProfile?.suffix}` ?? "";
      profile.avatarUrl = hp.NurseProfile?.picture ?? "";
      profile.fields = hp.NurseProfile?.fields ?? [];
      break;
    case "DOCTOR":
      profile.name = `${hp.DoctorProfile?.title} ${hp.DoctorProfile?.name} ${hp.DoctorProfile?.suffix}` ?? "";
      profile.avatarUrl = hp.DoctorProfile?.picture ?? "";
      profile.fields = hp.DoctorProfile?.fields ?? [];
      break;
    default:
      break;
    }
    acc.push(profile)
    return acc
  }, [] as HPProfile[])

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
              const hp = hpsMapped.find(hp => hp.id === intervention.hpId)
              return (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base font-normal">
                      <div className="flex items-center gap-1">
                        <Avatar className="h-8 w-8 object-cover">
                          {hp?.avatarUrl ? <Image alt={hp.name} className="object-cover" src={hp.avatarUrl} height={50} width={50} /> : <AvatarFallback>{hp?.name.substring(0,2)}</AvatarFallback>}
                        </Avatar> 
                        <div>
                          <span className="font-semibold">{intervention.Action.name}</span>
                          <div className="text-muted-foreground text-xs">{hp?.name} <span className="italic">({hp?.type})</span></div>
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
