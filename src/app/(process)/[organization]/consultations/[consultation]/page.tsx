import { AppRouterPageRouteOpts, withPageAuthRequired } from "@auth0/nextjs-auth0";
import Suspend from "@components/Suspend";
import { Separator } from "@components/ui/separator";
import { Metadata } from "next";
import ConsultationDetails from "../../../../../components/consultation/ConsultationDetails";
import { Badge } from "@components/ui/badge";
import { getConsultationTicketAction } from "@actions/consultation/consultation-ticket.action";
import { notFound } from "next/navigation";
import { DropdownMenuProvider } from "@components/DropdownMenuProvider";
import ConsultationTicketTableRowActions from "../../../../../components/consultation/ConsultationTicketTableRowActions";
import ResolveConsultationTicket from "@components/consultation/ResolveConsultationTicket";
import MedicationsSheet from "@components/consultation/MedicationsSheet";
import ModifyMedicationSheet from "@components/consultation/ModifyMedicationSheet";

export const metadata: Metadata = {
  title: "Consultation Details",
  description: "Consultation details of a consultation.",
}

async function ConsultationPage({params}: AppRouterPageRouteOpts) {
  const consultationId = Number(params?.consultation)
  const orgUid = params?.organization as string

  const consultation = await getConsultationTicketAction(consultationId, orgUid)
  const patient = consultation.data?.Appointment?.Requesters[0].User
  if(!consultation.data) notFound()

  const statusBadge = {
    PENDING: "destructive",
    RESOLVED: "default",
    PROCESSING: "outline",
  } as const

  const isResolved = consultation.data.ConsultationTicketAttribute?.status === "RESOLVED"

  return (
    <div className="space-y-5">
      <div className="group/issue flex sticky top-10 z-10 bg-opacity-30 backdrop-blur p-2 items-center">
        <div>
          <div className="flex items-center gap-5">
            <h2 className="text-2xl font-bold tracking-tight">{consultation.data?.subject?.trim() || `Consultation Ticket #${consultation.data.id}`}</h2>
            <Badge variant={statusBadge[consultation.data.ConsultationTicketAttribute?.status as keyof typeof statusBadge]}>{consultation.data.ConsultationTicketAttribute?.status}</Badge>
          </div>
          <div className="flex h-5 items-center gap-2 mt-3 capitalize">
            <Badge>{consultation.data.System.name}</Badge>
            <Separator orientation="vertical" />
            <Badge variant="outline">{consultation.data.Appointment?.AppointmentAttribute?.Service?.name}</Badge>
            <Separator orientation="vertical" />
            <Badge variant="outline">{consultation.data.Appointment?.AppointmentAttribute?.AppointmentType?.name}</Badge>
            <Separator orientation="vertical" />
            <Badge variant="outline">{consultation.data.Appointment?.AppointmentAttribute?.AppointmentMode?.name}</Badge>
          </div>
        </div>
        <div className="ml-auto flex gap-1">
          
          <MedicationsSheet 
            readonly={isResolved}
            consultation={{
              id: consultationId,
              patientId: patient?.id ?? 0
            }}/>
          <ModifyMedicationSheet
            readonly={isResolved}
          />
          {
            consultation.data.ConsultationTicketAttribute?.status !== "RESOLVED" &&
            <ResolveConsultationTicket ticketId={consultationId}/>
          }
          <DropdownMenuProvider>
            <ConsultationTicketTableRowActions consultation={consultation.data}/>
          </DropdownMenuProvider>
        </div>
      </div>
      <Separator />

      <Suspend>
        <ConsultationDetails consultation={consultation.data! }/>
      </Suspend>

      <div className="w-full text-center sticky bottom-5">
      </div>
    </div>
  );
}

export default withPageAuthRequired(ConsultationPage, {
  returnTo: ({params, searchParams}) => {
    const organization = params?.organization
    const consultation = params?.consultation
    const newSearchParams = new URLSearchParams(searchParams as Record<string, string>)
    return `/${organization}/consultations/${consultation}?${newSearchParams.toString()}`
  }
});
