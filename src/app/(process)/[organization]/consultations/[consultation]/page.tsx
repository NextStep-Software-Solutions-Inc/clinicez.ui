import { AppRouterPageRouteOpts, withPageAuthRequired } from "@auth0/nextjs-auth0";
import Suspend from "@components/Suspend";
import { Separator } from "@components/ui/separator";

async function ConsultationPage({params}: AppRouterPageRouteOpts) {
  const consultation = params?.consultation
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Consultation # {consultation}</h2>
        <p className="text-sm text-muted-foreground">
          Consultation details of Consultation # {consultation}
        </p>
      </div>
      <Separator />
      <Suspend>
        Hey
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