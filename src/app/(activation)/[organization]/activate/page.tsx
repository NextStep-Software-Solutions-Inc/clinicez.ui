import { Separator } from "@components/ui/separator";
import { Metadata } from "next";
import ActivationForm from "./components/ActivationForm";
import { AppRouterPageRouteOpts, withPageAuthRequired } from "@auth0/nextjs-auth0";
import { AlertTriangle, FileWarning } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@components/ui/alert";

export const metadata: Metadata = {
  title: "User Activation",
  description: "Organization provides a way to activate users aside from the default manual application to become a member.",
}

async function ActivatePage({params}: AppRouterPageRouteOpts) {
  const organization = params?.organization;
  
  return (

    <div className="container mx-auto my-10 space-y-6">

      <div className="group/upload">
        <div className="flex items-center">
          <h2 className="text-2xl font-bold tracking-tight">User Activation for <code className="bg-slate-200 py-1 px-4 rounded">{organization}</code></h2>
        </div>
        <p className="text-sm text-muted-foreground">
            Organization provides a way to activate users aside from the default manual application to become a member.
        </p>
      </div>
        
      <Separator />
      <Alert variant="default">
        <AlertTriangle className="h-4 w-4"/>
        <AlertTitle>Info</AlertTitle>
        <AlertDescription>
          {`When you activation turns out to be successful, you will be able to access the organization's resources and services.`}
        </AlertDescription>
      </Alert>
      <ActivationForm />
    </div>

  );
}

export default  withPageAuthRequired(ActivatePage, {
  returnTo: ({params, searchParams}) => {
    const searchStr = Object.entries(searchParams ?? {}).map(([key, value]) => `${key}=${value}`).join("&");
    return `/${params?.organization}/activate?${searchStr}`;
  }
});