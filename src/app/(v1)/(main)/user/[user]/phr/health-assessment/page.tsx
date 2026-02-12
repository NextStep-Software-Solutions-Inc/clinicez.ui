import Suspend from "@/components/Suspend";
import { Separator } from "@/components/ui/separator";
import { FamilyAndPersonalHistory } from "./FamilyAndPersonalHistory";
import { isUserOwner } from "@/lib/org-utils";

export default async function HealthAssessmentPage({
  params
}: {
  params: Promise<{ user: string }>;
}) {
  const resolvedParams = await params;
  const userId = decodeURI(resolvedParams.user as string)
  const isOwner = await isUserOwner(userId);
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Health Assessment</h3>
        <p className="text-sm text-muted-foreground">
          Complete health assessment form including medical history, family history, personal/social history, surgical history, and OB-Gyne history for comprehensive healthcare evaluation.
        </p>
      </div>
      <Separator />
      <Suspend>
        <FamilyAndPersonalHistory userId={userId} readOnly={!isOwner} />
      </Suspend>
    </div>
  )
}
