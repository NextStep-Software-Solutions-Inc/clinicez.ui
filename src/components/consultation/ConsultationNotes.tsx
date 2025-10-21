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
import { GetConsultationTicket } from "@actions/consultation/consultation-ticket.action";
import { useParams } from "next/navigation";
import { useConsultationNotes } from "@hooks/useConsultationNote";
import Each from "@components/utils/Each";
import GenericSection from "@components/GenericSection";
import { useNoteTemplate } from "@hooks/useNoteTemplate";
import { useHPs } from "@hooks/useHP";
import { useUser } from "@clerk/nextjs";
import { createOrderedConsultationNotes } from "@/utils/soap-ordering";
interface ConsultationNotesProps {
  consultation: NonNullable<GetConsultationTicket["data"]>;
}

export default function ConsultationNotes({ consultation }: ConsultationNotesProps) {
  const { user } = useUser()
  const authUserHPS = useHPs({
    userId: user?.id ?? ""
  })
  const consultationTicketHps = consultation.ConsultationTicketHPs.map(c => c.hpId)
  const isConsultationAuthor = (authUserHPS.data ?? []).some(hp => consultationTicketHps.includes(hp.id))

  const params = useParams<{ clinicUid: string }>()
  const clinicUid = params.clinicUid;
  const { data: consultationNotes, mutate } = useConsultationNotes({ clinicUid, consultationId: consultation.id })
  const { data: noteTemplate, isLoading: loadingNoteTemplate } = useNoteTemplate(consultation.ConsultationTicketAttribute?.NoteTemplate.name ?? "")

  const notes = createOrderedConsultationNotes(
    noteTemplate?.NoteSections ?? [],
    consultationNotes
  )
  if (loadingNoteTemplate) return <div>Loading...</div>
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-row">
          <div>
            <CardTitle>Consultation Notes</CardTitle>
            <CardDescription>
              This notes follow the {noteTemplate?.name} format.
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
            render={(note, index) => {
              return (
                <AccordionItem key={note.name} value={note.name}>
                  <GenericSection
                    readonly={!isConsultationAuthor}
                    onUpdated={mutate}
                    hpId={consultationTicketHps[0]}
                    value={note.value}
                    consultationId={consultation.id}
                    name={note.name} label={note.label}
                    showOnPatient={note.showOnPatient}
                  />
                </AccordionItem>
              )
            }}
          />
        </Accordion>
      </CardContent>
    </Card>
  );
}


