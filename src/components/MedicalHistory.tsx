"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@components/ui/accordion"
import { useUser } from "@clerk/nextjs"
import { useConsultation, useConsultations } from "@hooks/useConsultation";
import Each from "./utils/Each";
import dayjs from "dayjs";
import { Badge } from "./ui/badge";
import { cn } from "@lib/utils";

interface MedicalHistoryProps {
  patientId: string
  clinicUid: string
}

export default function MedicalHistory({ clinicUid, patientId }: MedicalHistoryProps) {
  const { user: authUser } = useUser()
  const isPatientView = authUser?.id === patientId

  const { data: consultationTickets } = useConsultations({
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
                    isPatientView={isPatientView}
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
  consultationTicketId: number
  clinicUid: string
  isPatientView?: boolean
}
export const MedicalHistorySummary = ({ consultationTicketId, clinicUid, isPatientView = false }: MedicalHistorySummaryProps) => {
  const { data: consultationTicket } = useConsultation({
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
          const shouldBlur = isPatientView && !note.showOnPatient
          const displayContent = shouldBlur
            ? "This content is blurred intentionally but you're a little bit techie."
            : (note.content ?? "")
          return (
            <div key={note.section} className="p-2 bg-gray-100 rounded-lg">
              <p className="capitalize font-semibold ">{note.section}</p>
              <p className={cn("text-sm text-gray-500", shouldBlur && "blur-sm")}>{displayContent}</p>
            </div>
          )
        }}
      />
    </div>
  )
}