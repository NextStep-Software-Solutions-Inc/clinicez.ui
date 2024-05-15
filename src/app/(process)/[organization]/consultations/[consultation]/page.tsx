import { getConsultation } from "@actions/consultations.action";
import { AppRouterPageRouteOpts, withPageAuthRequired } from "@auth0/nextjs-auth0";
import Suspend from "@components/Suspend";
import { Separator } from "@components/ui/separator";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Consultation Details",
  description: "Consultation details of a consultation.",
}

async function ConsultationPage({params}: AppRouterPageRouteOpts) {
  const consultationId = params?.consultation as string

  const consultation = await getConsultation(consultationId)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Consultation # {consultationId}</h2>
        <p className="text-sm text-muted-foreground">
          Consultation details of Consultation # {consultationId}
        </p>
      </div>
      <Separator />
      <Suspend>
        <pre>
          {JSON.stringify(consultation, null, 2)}
        </pre>
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