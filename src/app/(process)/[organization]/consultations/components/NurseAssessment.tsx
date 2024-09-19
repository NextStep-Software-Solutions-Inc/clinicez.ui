"use client";

import { GetPreConsultationNotes } from "@actions/appointments/pre-consultation-note.action";
import { GetConsultationRecord } from "@actions/consultation/consultation-record.action";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card";
import Each from "@components/utils/Each";
import { usePreConsultationNotes } from "@hooks/usePreConsultationNotes";
import { useParams } from "next/navigation";
import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
dayjs.extend(utc)

import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);

interface NurseAssessmentProps {
  consultation:  NonNullable<GetConsultationRecord["data"]>;
}
export default function NurseAssessment({ consultation}: NurseAssessmentProps) {

  const {organization: orgUid} = useParams<{organization: string}>()
  const {data: preConsultationNotes} = usePreConsultationNotes({orgUid, appointmentId: consultation.appointmentId})

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
  note: GetPreConsultationNotes["data"][number];
}
export const PreConsultationNote = ({note}: PreConsultationNoteProps) => {
    
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-primary text-lg">{`Assessed by ${note.createdBy}`}</CardTitle>
        <CardDescription>Assessed {dayjs(note.updatedAt).fromNow()} <span className="italic text-primary">(readonly)</span></CardDescription>
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