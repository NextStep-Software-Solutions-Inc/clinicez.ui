import Suspend from "@components/Suspend";
import { Separator } from "@components/ui/separator";
import { Metadata } from "next";
import { AppRouterPageRouteOpts } from "@auth0/nextjs-auth0";
import MyOrgProfile from "@components/dashboard/MyOrgProfile";

export const metadata: Metadata = {
  title: "Profile",
  description: "Manage your profile inside the organization.",
}

export default async function UserOrgProfilePage({params}: AppRouterPageRouteOpts) {
  const organization = params?.organization as string
  return (
    <>
      <div className="space-y-6">
        <div className="group/create-folder">
          <div className="flex items-center">
            <h2 className="text-2xl font-bold tracking-tight">Organization Profile</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Manage your profile inside the organization.
            Your profile is private by default and only accessible to you and organization administrators.
          </p>
        </div>
          
        <Separator />
        <Suspend>
          <MyOrgProfile/>
        </Suspend>
      </div>
    
    </>
  );
}
