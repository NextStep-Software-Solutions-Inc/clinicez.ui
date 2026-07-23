import Suspend from "@/components/Suspend";
import { Separator } from "@/components/ui/separator";
import PhilHealthFormWrapper from "./PhilHealthFormWrapper";
import DependentsSection from "./DependentsSection";
import { isUserOwner } from "@/lib/org-utils";
import { AppRouterPageRouteOpts } from "@/types";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "PHR | PhilHealth Yakap",
  description: "Manage your PhilHealth Yakap information",
};

export default async function PhilHealthPage(props: AppRouterPageRouteOpts) {
  const params = await props.params;
  const userId = decodeURI(params?.user as string);
  if (!userId) throw new Error("User ID is required to view this page.");
  const userOwner = await isUserOwner(userId);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-medium">PhilHealth Yakap</h3>
        <p className="text-sm text-muted-foreground">
          Manage your PhilHealth eKonsulta information
        </p>
      </div>
      <Separator />
      <Suspend>
        <div className="space-y-10">
          <PhilHealthFormWrapper userUid={userId} readonly={!userOwner} />
          <Separator />
          <DependentsSection userUid={userId} readonly={!userOwner} />
        </div>
      </Suspend>
    </div>
  );
}