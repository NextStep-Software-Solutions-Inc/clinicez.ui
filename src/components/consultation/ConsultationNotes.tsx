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
import { MedicalNoteSummarizer } from "@/components/ai";
interface ConsultationNotesProps {
  consultation: NonNullable<GetConsultationTicket["data"]>;
  patientUserId?: string;
}

export default function ConsultationNotes({ consultation, patientUserId }: ConsultationNotesProps) {
  const { user } = useUser()
  const authUserHPS = useHPs({
    userId: user?.id ?? ""
  })
  const consultationTicketHps = consultation.ConsultationTicketHPs.map(c => c.hpId)
  const isConsultationAuthor = (authUserHPS.data ?? []).some(hp => consultationTicketHps.includes(hp.id))
  const isPatientView = patientUserId ? user?.id === patientUserId : false

  const params = useParams<{ clinicUid: string }>()
  const clinicUid = params.clinicUid;
  const { data: consultationNotes, mutate } = useConsultationNotes({ clinicUid, consultationId: consultation.id })
  const { data: noteTemplate, isLoading: loadingNoteTemplate } = useNoteTemplate(consultation.ConsultationTicketAttribute?.NoteTemplate.name ?? "")

  // DEBUG: Log authorization details
  console.log('🔍 ConsultationNotes Debug:', {
    clerkUserId: user?.id,
    authUserHPs: authUserHPS.data,
    authUserHPsLoading: authUserHPS.isLoading,
    authUserHPsError: authUserHPS.error,
    consultationTicketHps,
    isConsultationAuthor,
    hpMatches: authUserHPS.data?.map(hp => ({
      hpId: hp.id,
      isMatch: consultationTicketHps.includes(hp.id)
    }))
  });

  const notes = createOrderedConsultationNotes(
    noteTemplate?.NoteSections ?? [],
    consultationNotes
  )
  if (loadingNoteTemplate || authUserHPS.isLoading) return <div>Loading...</div>
  
  // Collect all consultation notes text for AI summarization
  const allNotesText = notes.map(note => `${note.label}: ${note.value || ''}`).join('\n\n');
  
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
            {/* AI Medical Note Summarizer — hidden once resolved */}
            {isConsultationAuthor && allNotesText && consultation.ConsultationTicketAttribute?.status !== 'RESOLVED' && (
              <MedicalNoteSummarizer
                consultationNotes={allNotesText}
                outputFormat="plain_text"
                clinicId={consultation.clinicId}
                noteSections={noteTemplate?.NoteSections?.map((s: { label?: string; name: string }) => s.label || s.name)}
                onApplyToForm={(sectionData) => {
                  // Handle applying summary to form if needed
                  console.log('Summary generated:', sectionData);
                }}
              />
            )}
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
                    isPatientView={isPatientView}
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


