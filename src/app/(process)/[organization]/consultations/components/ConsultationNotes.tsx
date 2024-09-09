"use client";

import {
  Accordion,
  AccordionItem,
} from "@components/ui/accordion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@components/ui/card";
import { GetConsultationRecord } from "@actions/consultation/consultation-record.action";
import { useParams } from "next/navigation";
import { useConsultationNotes } from "@hooks/useConsultationNote";
import Each from "@components/utils/Each";
import GenericSection from "@components/GenericSection";
interface ConsultationNotesProps {
  consultation: NonNullable<GetConsultationRecord["data"]>;
}

const template = {
  id: 1,
  name: "SOAP",
  sections: [
    {
      name: "subjective",
      label: "Subjective History"
    },
    {
      name: "objective",
      label: "Objective History"
    },
    {
      name: "assessment",
      label: "Assessment"
    },
    {
      name: "plan",
      label: "Plan"
    }
  ]
}

export default function ConsultationNotes({
  consultation
}: ConsultationNotesProps) {

  const params = useParams<{organization: string}>()
  const orgUid = params.organization;
  const {data: consultationNotes} = useConsultationNotes({ orgUid, consultationId: consultation.id })
 
  const notes = template.sections.map(section => {
    const note = consultationNotes?.find(note => note.section === section.name)
    return {
      ...section,
      value: note?.content ?? ""
    }
  })
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-row">
          <div>
            <CardTitle>Consultation Notes</CardTitle>
            <CardDescription>
                This notes follow the {template.name} format.
            </CardDescription>
          </div>
          <div className="ml-auto">
            
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple">
          <Each
            of={notes}
            render={(note, index) => (
              <AccordionItem key={note.name} value={note.name}>
                <GenericSection value={note.value} consultationId={consultation.id} name={note.name} label={note.label}/>
              </AccordionItem>
            )}
          />
        </Accordion>
      </CardContent>
    </Card>
  );
}


