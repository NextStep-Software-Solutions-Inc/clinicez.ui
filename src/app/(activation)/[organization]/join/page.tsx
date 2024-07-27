import { AppRouterPageRouteOpts, withPageAuthRequired } from "@auth0/nextjs-auth0";
import Suspend from "@components/Suspend";
import { Alert, AlertDescription, AlertTitle } from "@components/ui/alert"
import { Separator } from "@components/ui/separator"
import { AlertTriangle } from "lucide-react"
import { getCachedSession } from "@actions/session.action";
import { redirect } from "next/navigation";
import OrganizationSteps from "./OrganizationSteps";
import { getOrganizationAction } from "@actions/organization.action";

async function JoinOrgPage({params}: AppRouterPageRouteOpts) {
  const orgId = params?.organization as string;
  const [session, org] = await Promise.all([
    getCachedSession(),
    getOrganizationAction(orgId),
  ])
  if(!session) return redirect("/api/auth/login");
  const userId = session?.user.sub;

  return (
    <div className="container mx-auto my-10 space-y-6">

      <div className="group/upload">
        <div className="flex items-center">
          <h2 className="text-2xl  tracking-tight">Welcome to <span className="font-bold">{org?.name}</span> membership portal.</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Please follow the steps below to join the organization.
        </p>
      </div>
      
      <Separator />
      <Alert variant="default">
        <AlertTriangle className="h-4 w-4"/>
        <AlertTitle>Warning</AlertTitle>
        <AlertDescription>
          {`You are about to join the organization ${org?.name}. Please make sure you have read and understood the organization's policies and requirements before proceeding.`}
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