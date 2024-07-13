import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@components/ui/card";
import AddVitalSignsModal from "./AddVitalSignsModal";
import MoreVitals from "./MoreVitals";
import ConditionalRender from "@components/utils/ConditionalRender";
import { getVitalSignsAction } from "@actions/vitals.action";
import VitalSign from "./VitalSign";
import Suspend from "@components/Suspend";
import { format } from "date-fns";

interface RecentVitalSignsProps {
  readOnly?: boolean;
  userId: string;
}

export type VitalSignsType = Awaited<ReturnType<typeof getVitalSignsAction>>
export default async function RecentVitalSigns({readOnly = true, userId}: RecentVitalSignsProps) {

  const vitalSigns = await getVitalSignsAction(userId);
  const latestVitalSign = vitalSigns.length > 0 ? vitalSigns[vitalSigns.length - 1] : null;
  const restVitalSigns = vitalSigns.slice(0, vitalSigns.length - 1);

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap gap-2 items-center">
        <div>
          <CardTitle>Recent Vitals</CardTitle>
          <ConditionalRender condition={!!latestVitalSign} fallback="">
            <CardDescription>
              Your most recent vital record was taken on {format(latestVitalSign!.dateTaken, "PPp")}
            </CardDescription>
          </ConditionalRender>
        </div>
        <ConditionalRender condition={!readOnly}>
          <AddVitalSignsModal userId={userId}/>
        </ConditionalRender>
      </CardHeader>
      <CardContent>
        <ConditionalRender condition={!!latestVitalSign} fallback="No recent vital signs record">
          <VitalSign vitalSign={latestVitalSign!} readOnly={readOnly}/>
        </ConditionalRender>
      </CardContent>
      <CardFooter>
        <Suspend>
          <ConditionalRender condition>
            <MoreVitals readOnly={readOnly} vitalSigns={restVitalSigns}/>
          </ConditionalRender>
        </Suspend>
      </CardFooter>
    </Card>
  )
}