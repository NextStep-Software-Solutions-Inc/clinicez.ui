import { AppRouterPageRouteOpts, withPageAuthRequired } from "@auth0/nextjs-auth0";
import Suspend from "@components/Suspend";
import { Separator } from "@components/ui/separator";
import RecentVitalSigns from "./RecentVitalSigns";
import { isUserOwner } from "@lib/protect-org";

export const metadata = {
  title: "Vital Signs & Anthropometric Measurements | PHR",
  description: "Track your vital signs and anthropometric measurements."
}

async function VitalsPage({params, searchParams}: AppRouterPageRouteOpts) {
  const viewMode = (searchParams?.view_mode as "chart" | "tile") || "tile";
  const userId = decodeURI(params?.user as string);
  const userOwner = await isUserOwner(userId);

  return (
    <div className="space-y-6">
      <div className="group/create-folder">
        <h2 className="text-2xl font-bold tracking-tight">Vital Signs & Anthropometric Measurements</h2>
        <p className="text-sm text-muted-foreground">
            To track your vital signs and anthropometric measurements, you can add old and new records here.
        </p>
      </div>
      <Separator />
      <Suspend>
        <RecentVitalSigns readOnly={!userOwner} userId={userId} viewMode={viewMode}/>
      </Suspend>
    </div>
  );
}

export default withPageAuthRequired(VitalsPage);
