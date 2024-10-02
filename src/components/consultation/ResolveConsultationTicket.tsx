"use client";

import { resolveConsultationTicket } from "@actions/consultation/consultation-ticket.action";
import ActionButton from "@components/ActionButton";
import { toast } from "sonner";

export default function ResolveConsultationTicket({ticketId}: {ticketId: number}) {
  const action = async () => {
    
    toast.promise(resolveConsultationTicket(ticketId), {
      loading: "Resolving consultation ticket...",
      success: "Consultation ticket resolved.",
      error: "Failed to resolve consultation ticket."
    })
  }


  return (
    <form action={action}>
      <ActionButton variant="outline" size="sm" className="">Set Resolved</ActionButton>
    </form>
  );
}
