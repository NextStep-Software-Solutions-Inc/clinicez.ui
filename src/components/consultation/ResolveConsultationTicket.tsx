"use client";

import { resolveConsultationTicket } from "@actions/consultation/consultation-ticket.action";
import ActionButton from "@components/ActionButton";
import { toast } from "sonner";

interface ResolveConsultationTicketProps {
  ticketId: number;
  onResolved?: () => void;
}
export default function ResolveConsultationTicket({ticketId, onResolved}: ResolveConsultationTicketProps) {
  const action = async () => {
    
    toast.promise(resolveConsultationTicket(ticketId), {
      loading: "Resolving consultation ticket...",
      success: res => {
        if(res.status) {
          onResolved?.()
        }
        return res.message
      },
      error: "Failed to resolve consultation ticket."
    })
  }


  return (
    <form action={action}>
      <ActionButton variant="outline" size="sm" className="">Set Resolved</ActionButton>
    </form>
  );
}
