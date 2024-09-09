import { getConsultationAction } from "@actions/consultations.action";
import { AppRouterPageRouteOpts, withPageAuthRequired } from "@auth0/nextjs-auth0";
import Suspend from "@components/Suspend";
import { Separator } from "@components/ui/separator";
import { Metadata } from "next";
import ConsultationDetails from "../components/ConsultationDetails";
import { Button } from "@components/ui/button";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { Badge } from "@components/ui/badge";
import { getConsultationRecordAction } from "@actions/consultation/consultation-record.action";

export const metadata: Metadata = {
  title: "Consultation Details",
  description: "Consultation details of a consultation.",
}

async function ConsultationPage({params}: AppRouterPageRouteOpts) {
  const consultationId = parseInt(params?.consultation as string)

  const consultation = await getConsultationRecordAction(consultationId)

  return (
    <div className="space-y-6">
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
        <Link className="ml-auto invisible group-hover/issue:visible transition-all" href={{
          pathname: `/${params?.organization}/generate-document`,
          query: {
            _consultationId: consultationId,
            _patientId: consultation.data?.id,
          }
        }}>
          <Button variant="default" size="sm">Issue e-Document <ExternalLink className="h-4 w-4 ml-2"/></Button>
        </Link>
      </div>
      <Separator />
      <Suspend>
        <ConsultationDetails consultation={consultation.data! }/>
      </Suspend>
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