import Suspend from "@components/Suspend";
import { Separator } from "@components/ui/separator";
import { Metadata } from "next";
import ClinicSettings from "@/components/clinic/ClinicSettings";
import { AppRouterPageRouteOpts } from "@/types";

export const metadata: Metadata = {
  title: "Clinic Settings",
  description: "Configure your clinic settings",
}

export default async function ClinicSettingsPage({params}: AppRouterPageRouteOpts) {
  return (
    <>
      <div className="space-y-6">
        <div className="group/create-folder">
          <div className="flex items-center">
            <h2 className="text-2xl font-bold tracking-tight">Clinic Settings</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            {`Configure your clinic settings. This includes your clinic's profile, settings, and more.`}
          </p>

        </div>
        <Separator />
        <Suspend>
          <ClinicSettings/>
        </Suspend>
      </div>
    
    </>
  );
}
