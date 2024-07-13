import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@components/ui/card";
import AddVitalSignsModal from "./AddVitalSignsModal";
import MoreVitals from "./MoreVitals";
import ConditionalRender from "@components/utils/ConditionalRender";
import { getVitalSignsAction } from "@actions/vitals.action";
import Suspend from "@components/Suspend";
import { format } from "date-fns";
import ChangeViewMode from "./ChangeViewMode";
import VitalsSignView from "./VitalsSignView";
import { VitalChartInteractive } from "@components/charts/VitalChartInteractive";
import VitalSign from "./VitalSign";

interface RecentVitalSignsProps {
  readOnly?: boolean;
  userId: string;
  viewMode?: "chart" | "tile";
}

export type VitalSignsType = Awaited<ReturnType<typeof getVitalSignsAction>>
export default async function RecentVitalSigns({readOnly = true, userId, viewMode}: RecentVitalSignsProps) {

  const vitalSigns = await getVitalSignsAction(userId);
  const latestVitalSign = vitalSigns.length > 0 ? vitalSigns[vitalSigns.length - 1] : null;
  const restVitalSigns = vitalSigns.length > 0 ? vitalSigns.slice(0, vitalSigns.length - 1) : [];

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap gap-2 items-center">
        <div>
          <CardTitle>Recent Vitals</CardTitle>
          {latestVitalSign && (
            <CardDescription>
              Your most recent vital record was taken on {format(latestVitalSign.dateTaken, "PPp")}
            </CardDescription>
          )}
          
        </div>
        <div className="ml-auto flex-grow sm:flex-grow-0 flex flex-wrap items-center justify-end gap-2">
          <ChangeViewMode/>
          <ConditionalRender condition={!readOnly} fallback="">
            <AddVitalSignsModal userId={userId}/>
          </ConditionalRender>
        </div>
      </CardHeader>
      <CardContent>
        <VitalsSignView fallback={<VitalChartInteractive vitalSigns={vitalSigns}/>}>
          <ConditionalRender condition={!!latestVitalSign} fallback="No recent vital signs record">
            <VitalSign vitalSign={latestVitalSign!} readOnly={readOnly}/>
          </ConditionalRender>
        </VitalsSignView>
      </CardContent>
      <CardFooter>
        <VitalsSignView fallback={null}>
          <Suspend>
            <ConditionalRender condition={!!restVitalSigns && viewMode === "tile"} fallback="">
              <MoreVitals readOnly={readOnly} vitalSigns={restVitalSigns}/>
            </ConditionalRender>
          </Suspend>
        </VitalsSignView>
      </CardFooter>
    </Card>
  )
}


