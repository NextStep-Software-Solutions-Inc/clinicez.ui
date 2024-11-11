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
import { cn } from "@lib/utils";
  
interface MedicalHistoryProps {
    patientId: string
    clinicUid: string
}

export default function MedicalHistory({clinicUid, patientId}: MedicalHistoryProps) {

  const {data: consultationTickets} = useConsultations({
    clinicUid,
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
                    clinicUid={clinicUid}
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
    clinicUid: string
}
export const MedicalHistorySummary = ({consultationTicketId, clinicUid}: MedicalHistorySummaryProps) => {
  const {data: consultationTicket} = useConsultation({
    consultationId: consultationTicketId,
    clinicUid
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
              <p className={cn("text-sm text-gray-500", !note.showOnPatient && "blur-sm")}>{note.showOnPatient? note.content: "This content is blurred intentionally but you're a little bit techie."}</p>
            </div>
          )
        }}
      />
    </div>
  )
}