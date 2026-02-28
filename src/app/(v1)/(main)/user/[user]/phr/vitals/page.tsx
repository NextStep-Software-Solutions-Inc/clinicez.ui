import Suspend from "@components/Suspend";
import { Separator } from "@components/ui/separator";
import { isUserOwner } from "@lib/org-utils";
import VitalSignsSSRWrapper from "./VitalSignsSSRWrapper";
import { AppRouterPageRouteOpts } from "@/types";

export const metadata = {
  title: "Vital Signs & Anthropometric Measurements | PHR",
  description: "Track your vital signs and anthropometric measurements."
}

export default async function VitalsPage(props: AppRouterPageRouteOpts) {
  const params = await props.params;
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
        <VitalSignsSSRWrapper readOnly={!userOwner} userId={userId}/>
      </Suspend>
    </div>
  );
}