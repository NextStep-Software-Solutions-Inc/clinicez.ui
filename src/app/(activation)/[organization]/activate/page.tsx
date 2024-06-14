import { Separator } from "@components/ui/separator";
import { Metadata } from "next";
import ActivationForm from "./components/ActivationForm";
import { AppRouterPageRouteOpts, getSession } from "@auth0/nextjs-auth0";

export const metadata: Metadata = {
  title: "User Activation",
  description: "Organization provides a way to activate users aside from the default manual application to become a member.",
}

export default async function ActivatePage({params}: AppRouterPageRouteOpts) {
  const organization = params?.organization;

  const session = await getSession();

  console.log({session});
  
  
  return (

    <div className="container mx-auto my-10 space-y-6">

      <div className="group/upload">
        <div className="flex items-center">
          <h2 className="text-2xl font-bold tracking-tight">User Activation for <code className="bg-slate-200 p-1 rounded">{organization}</code></h2>
        </div>
        <p className="text-sm text-muted-foreground">
            Organization provides a way to activate users aside from the default manual application to become a member.
        </p>
      </div>
        
      <Separator />

      <ActivationForm />
    </div>

  );
}
