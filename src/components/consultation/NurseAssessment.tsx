"use client";

import { GetPreAssessmentNotes } from "@actions/appointments/pre-assessment-note.action";
import { GetConsultationTicket } from "@actions/consultation/consultation-ticket.action";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card";
import Each from "@components/utils/Each";
import { usePreAssessmentNotes } from "@hooks/usePreAssessmentNotes";
import { useParams } from "next/navigation";
import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
dayjs.extend(utc)

import relativeTime from "dayjs/plugin/relativeTime";
import { useUser } from "@hooks/useUser";
import { useHP } from "@hooks/useHP";
dayjs.extend(relativeTime);

interface NurseAssessmentProps {
  consultation:  NonNullable<GetConsultationTicket["data"]>;
}
export default function NurseAssessment({ consultation}: NurseAssessmentProps) {

  const {organization: orgUid} = useParams<{organization: string}>()
  const {data: preConsultationNotes} = usePreAssessmentNotes({orgUid, appointmentId: consultation.appointmentId ?? 0})

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-row">
          <div>
            <CardTitle>Nurse Assessments</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <Each
          of={preConsultationNotes?.data ?? []}
          render={(note) => {
            return (
              <PreConsultationNote key={note.id} note={note} />
            )
          }}
        />
      </CardContent>
    </Card>
  );
}


interface PreConsultationNoteProps {
  note: GetPreAssessmentNotes["data"][number];
}
export const PreConsultationNote = ({note}: PreConsultationNoteProps) => {
  const {data: hp} = useUser({userId: note.createdBy})
  const hpName = `${hp?.data?.firstName} ${hp?.data?.middleName ?? ""} ${hp?.data?.lastName} ${hp?.data?.suffix ?? ""}`.trim()
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-primary text-lg">{`Assessed by ${hpName}`}</CardTitle>
        <CardDescription>Assessed on {dayjs(note.updatedAt).format("lll")} ({dayjs(note.updatedAt).fromNow()}) <span className="italic text-primary">(readonly)</span></CardDescription>
      </CardHeader>
      <CardContent>

        <div className="flex flex-wrap gap-2">
          <Card className="grow lg:basis-1/4">
            <CardHeader>
              <CardTitle className="text-lg">
                Pre-Assessment
              </CardTitle>
            </CardHeader>
            <CardContent>
              {note.assessment} 
            </CardContent>
          </Card>

          <Card className="grow lg:basis-1/4">
            <CardHeader>
              <CardTitle className="text-lg">
                Instructions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {note.homeInstructions} 
            </CardContent>
          </Card>
          <Card className="grow lg:basis-1/4">
            <CardHeader>
              <CardTitle className="text-lg">
                Remarks
              </CardTitle>
            </CardHeader>
            <CardContent>
              {note.remarks} 
            </CardContent>
          </Card>
        </div>
      </CardContent>        
    </Card>
  )
}