"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@components/ui/accordion"
import { useConsultation, useConsultations } from "@hooks/useConsultation";
import Each from "./utils/Each";
import dayjs from "dayjs";
  
interface MedicalHistoryProps {
    patientId: string
    orgUid: string
}

export default function MedicalHistory({orgUid, patientId}: MedicalHistoryProps) {

  const {data: consultationTickets} = useConsultations({
    orgUid: orgUid,
    userId: patientId,
  })

  return (
    <Accordion type="single" collapsible className="w-full">
      <Each 
        of={consultationTickets?.data || []}
        render={(ticket) => {
          return (
            <AccordionItem key={ticket.id} value="item-3">
              <AccordionTrigger>{ticket.subject || `Consultation Ticket #${ticket.id}`} ({dayjs(ticket.createdAt).format("llll")})</AccordionTrigger>
              <AccordionContent>
                <div className="p-4">
                  <MedicalHistorySummary 
                    consultationTicketId={ticket.id}
                    orgUid={orgUid}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
          )
        }}
      />
     
     
    </Accordion>
  )
}
  

interface MedicalHistorySummaryProps {
    consultationTicketId:  number
    orgUid: string
}
export const MedicalHistorySummary = ({consultationTicketId, orgUid}: MedicalHistorySummaryProps) => {
  const {data: consultationTicket} = useConsultation({
    consultationId: consultationTicketId,
    orgUid
  })
  return (
    <div>
      <p className="text-lg font-bold">Notes Summary</p>
      <Each
        of={consultationTicket?.data?.ConsultationNotes || []}
        fallback={<p>No notes</p>}
        render={(note) => {
          return (
            <div key={note.section} className="p-2 bg-gray-100 rounded-lg">
              <p>{note.section}</p>
              <p className="text-sm text-gray-500">{note.content}</p>
            </div>
          )
        }}
      />
    </div>
  )
}