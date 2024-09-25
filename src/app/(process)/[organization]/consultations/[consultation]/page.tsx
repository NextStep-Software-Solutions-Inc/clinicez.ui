import { AppRouterPageRouteOpts, withPageAuthRequired } from "@auth0/nextjs-auth0";
import Suspend from "@components/Suspend";
import { Separator } from "@components/ui/separator";
import { Metadata } from "next";
import ConsultationDetails from "../components/ConsultationDetails";
import { Button } from "@components/ui/button";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { Badge } from "@components/ui/badge";
import { getConsultationTicketAction } from "@actions/consultation/consultation-ticket.action";
import { getUserAction } from "@actions/users/user.action";
import { notFound } from "next/navigation";
import { Avatar, AvatarFallback } from "@components/ui/avatar";
import Image from "next/image";
import { differenceInCalendarYears } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { DropdownMenuProvider } from "@components/DropdownMenuProvider";
import { DataTableRowActions } from "../components/data-table-row-actions";

export const metadata: Metadata = {
  title: "Consultation Details",
  description: "Consultation details of a consultation.",
}

async function ConsultationPage({params}: AppRouterPageRouteOpts) {
  const consultationId = parseInt(params?.consultation as string)
  const orgUid = params?.organization as string

  const consultation = await getConsultationTicketAction(consultationId, orgUid)
  if(!consultation.data) notFound()
  const hp = await getUserAction(consultation.data?.createdBy)

  return (
    <div className="space-y-5">
      <div className="group/issue flex sticky top-10 z-10 bg-opacity-30 backdrop-blur p-2 items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{consultation.data?.subject}</h2>
          <div className="flex h-5 items-center gap-2 mt-3 capitalize">
            <Badge variant="outline">{consultation.data?.Appointment.AppointmentAttribute?.Service?.name}</Badge>
            <Separator orientation="vertical" />
            <Badge variant="outline">{consultation.data?.Appointment.AppointmentAttribute?.AppointmentType?.name}</Badge>
            <Separator orientation="vertical" />
            <Badge variant="outline">{consultation.data?.Appointment.AppointmentAttribute?.AppointmentMode?.name}</Badge>
          </div>
        </div>
        <div className="ml-auto flex gap-1">
          <Link className="invisible group-hover/issue:visible transition-all" href={{
            pathname: `/${params?.organization}/generate-document`,
            query: {
              _consultationId: consultationId,
              _patientId: consultation.data?.id,
            }
          }}>
            <Button variant="default" size="sm">Issue e-Document <ExternalLink className="h-4 w-4 ml-2"/></Button>
          </Link>
          <Button variant="outline" size="sm" className="">Set Resolved</Button>
          <DropdownMenuProvider>
            <DataTableRowActions consultation={consultation.data}/>
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