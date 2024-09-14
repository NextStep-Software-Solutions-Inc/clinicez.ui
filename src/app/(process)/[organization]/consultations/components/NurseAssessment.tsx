"use client";

import { GetPreConsultationNotes } from "@actions/appointments/pre-consultation-note.action";
import { GetConsultationRecord } from "@actions/consultation/consultation-record.action";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card";
import { Textarea } from "@components/ui/textarea";
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
      <CardContent>
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
        <CardTitle className="text-primary">{`Assessed by ${note.createdBy}`}</CardTitle>
        <CardDescription>Assessed {dayjs(note.updatedAt).fromNow()}</CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple">
          <AccordionItem value="preAssessment">
            <AccordionTrigger className="hover:no-underline">
              <div>
                Pre-Assessment <span className="italic text-primary">(readonly)</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="m-1">
              <Textarea 
                rows={5} 
                readOnly
                value={note.assessment ?? ""}
              // placeholder="Write the remarks here..."
              />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="instructions">
            <AccordionTrigger className="hover:no-underline">
              <div>
                Instructions <span className="italic text-primary">(readonly)</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="m-1">
              <Textarea 
                rows={5}
                readOnly
                value={note.homeInstructions ?? ""}
              // placeholder="Write the remarks here..." 
              />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="remarks">
            <AccordionTrigger className="hover:no-underline">
              <div>
                Remarks <span className="italic text-primary">(readonly)</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="m-1">
              <Textarea 
                rows={5} 
                readOnly
                value={note.remarks ?? ""}
              // placeholder="Write the remarks here..."
              />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>        
    </Card>
  )
}