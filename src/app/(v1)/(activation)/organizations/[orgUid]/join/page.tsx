import Suspend from "@components/Suspend";
import { Alert, AlertDescription, AlertTitle } from "@components/ui/alert"
import { Separator } from "@components/ui/separator"
import { AlertTriangle, ArrowLeft } from "lucide-react"
import { getCachedSession } from "@actions/session.action";
import OrganizationSteps from "./OrganizationSteps";
import { getOrganizationAction } from "@actions/organizations/organization.action";
import { AppRouterPageRouteOpts } from "@/types";
import Link from "next/link";

export default async function JoinOrgPage(props: AppRouterPageRouteOpts) {
  const params = await props.params;
  const orgUid = String(params?.orgUid);
  const [session, org] = await Promise.all([
    getCachedSession(),
    getOrganizationAction(orgUid),
  ])

  const userId = session?.user.sub;

  return (
    <div className="container mx-auto my-10 space-y-6">

      <div className="group/upload">
        <Link
          href="/v2/organizations"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-3"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Organizations
        </Link>
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
        {userId && <OrganizationSteps orgUid={orgUid} userId={userId}/>}
      </Suspend>
    
    </div>
  );
}
