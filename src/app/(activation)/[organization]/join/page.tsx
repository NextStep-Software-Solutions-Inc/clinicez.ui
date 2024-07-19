import { AppRouterPageRouteOpts, withPageAuthRequired } from "@auth0/nextjs-auth0";
import Suspend from "@components/Suspend";
import { Alert, AlertDescription, AlertTitle } from "@components/ui/alert"
import { Separator } from "@components/ui/separator"
import { AlertTriangle } from "lucide-react"
import { getCachedSession } from "@actions/session.action";
import { redirect } from "next/navigation";
import OrganizationSteps from "./OrganizationSteps";

async function JoinOrgPage({params}: AppRouterPageRouteOpts) {
  const session = await getCachedSession();
  if(!session) return redirect("/api/auth/login");
  const userId = session?.user.sub;
  const orgId = params?.organization as string;

  return (
    <div className="container mx-auto my-10 space-y-6">

      <div className="group/upload">
        <div className="flex items-center">
          <h2 className="text-2xl font-bold tracking-tight">You are about to join <code className="bg-slate-200 py-1 px-4 rounded">{params?.organization}</code> as their organization member.</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          {`You are about to join an organization as a member. Please be aware that you will be able to access the organization's resources and services once you are accepted.`}
        </p>
      </div>
      
      <Separator />
      <Alert variant="default">
        <AlertTriangle className="h-4 w-4"/>
        <AlertTitle>Warning</AlertTitle>
        <AlertDescription>
          Spamming join requests will result in a ban from the organization.
        </AlertDescription>
      </Alert>

      <Suspend>
        <OrganizationSteps orgId={orgId} userId={userId}/>
      </Suspend>
    
    </div>
  );
}

export default  withPageAuthRequired(JoinOrgPage, {
  returnTo: ({params, searchParams}) => {
    const searchStr = Object.entries(searchParams ?? {}).map(([key, value]) => `${key}=${value}`).join("&");
    return `/${params?.organization}/join?${searchStr}`;
  }
});