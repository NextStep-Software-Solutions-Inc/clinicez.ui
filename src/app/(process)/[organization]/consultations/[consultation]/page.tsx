import { getConsultation } from "@actions/consultations.action";
import { AppRouterPageRouteOpts, withPageAuthRequired } from "@auth0/nextjs-auth0";
import Suspend from "@components/Suspend";
import { Separator } from "@components/ui/separator";
import { Metadata } from "next";
import ConsultationDetails from "../components/ConsultationDetails";
import { Button } from "@components/ui/button";
import { ExternalLink } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Consultation Details",
  description: "Consultation details of a consultation.",
}

async function ConsultationPage({params}: AppRouterPageRouteOpts) {
  const consultationId = params?.consultation as string

  const consultation = await getConsultation(consultationId)

  return (
    <div className="space-y-6">
      <div className="flex">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Consultation # {consultationId}</h2>
          <p className="text-sm text-muted-foreground">
          Consultation details of Consultation # {consultationId}
          </p>
        </div>
        <Link className="ml-auto" href={`/${params?.organization}/consultations/${consultationId}/edit`}>
          <Button variant="default" size="sm">Issue e-Document <ExternalLink className="h-4 w-4 ml-2"/></Button>
        </Link>
      </div>
      <Separator />
      <Suspend>
        <ConsultationDetails consultation={consultation}/>
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