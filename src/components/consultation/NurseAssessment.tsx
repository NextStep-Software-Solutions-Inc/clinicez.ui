"use client";

import { GetPreAssessmentNotes } from "@actions/appointments/pre-assessment-note.action";
import { GetConsultationTicket } from "@actions/consultation/consultation-ticket.action";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card";
import Each from "@components/utils/Each";
import { usePreAssessmentNotes } from "@hooks/usePreAssessmentNotes";
import { useParams } from "next/navigation";
import dayjs from "@lib/day-utils";

interface NurseAssessmentProps {
  consultation: NonNullable<GetConsultationTicket["data"]>;
}
export default function NurseAssessment({ consultation }: NurseAssessmentProps) {

  const { clinicUid } = useParams<{ clinicUid: string }>()
  const { data: preConsultationNotes } = usePreAssessmentNotes({ clinicUid, appointmentId: consultation.appointmentId ?? 0 })

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
  note: NonNullable<GetPreAssessmentNotes["data"]>[number];
}
export const PreConsultationNote = ({ note }: PreConsultationNoteProps) => {
  const name = `${note.CreatedBy?.firstName} ${note.CreatedBy?.middleName ?? ""} ${note.CreatedBy?.lastName} ${note.CreatedBy?.suffix ?? ""}`.trim()
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-primary text-lg">{`Assessed by ${name}`}</CardTitle>
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
            <CardContent className="whitespace-pre-wrap">
              {note.assessment}
            </CardContent>
          </Card>

          <Card className="grow lg:basis-1/4">
            <CardHeader>
              <CardTitle className="text-lg">
                Instructions
              </CardTitle>
            </CardHeader>
            <CardContent className="whitespace-pre-wrap">
              {note.homeInstructions}
            </CardContent>
          </Card>
          {note.remarks && (
          <Card className="grow lg:basis-1/4">
            <CardHeader>
              <CardTitle className="text-lg">
                Remarks
              </CardTitle>
            </CardHeader>
            <CardContent className="whitespace-pre-wrap">
              {note.remarks}
            </CardContent>
          </Card>
          )}
        </div>
      </CardContent>
    </Card>
  )
}