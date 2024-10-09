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
import { Badge } from "./ui/badge";
  
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
    <Accordion type="multiple" className="w-full">
      <Each 
        of={consultationTickets?.data || []}
        fallback={<p className="text-muted-foreground">No consultation records.</p>}
        render={(ticket) => {
          return (
            <AccordionItem key={ticket.id} value={ticket.id.toString()}>
              <AccordionTrigger>
                <div>
                  {ticket.subject || `Consultation Ticket #${ticket.id}`} ({dayjs(ticket.createdAt).format("llll")}) <Badge variant="outline" className="text-primary">{ticket.System.name}</Badge>
                </div>
              </AccordionTrigger>
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
    <div className="space-y-2">
      <p className="text-lg font-bold">Notes Summary</p>
      <Each
        of={consultationTicket?.data?.ConsultationNotes || []}
        fallback={<p className="text-muted-foreground">No notes</p>}
        render={(note) => {
          return (
            <div key={note.section} className="p-2 bg-gray-100 rounded-lg">
              <p className="capitalize font-semibold ">{note.section}</p>
              <p className="text-sm text-gray-500">{note.content}</p>
            </div>
          )
        }}
      />
    </div>
  )
}