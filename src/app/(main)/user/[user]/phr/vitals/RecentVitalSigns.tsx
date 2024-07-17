import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@components/ui/card";
import AddVitalSignsModal from "./AddVitalSignsModal";
import MoreVitals from "./MoreVitals";
import ConditionalRender from "@components/utils/ConditionalRender";
import Suspend from "@components/Suspend";
import ChangeViewMode from "./ChangeViewMode";
import VitalsSignView from "./VitalsSignView";
import { VitalChartInteractive } from "@components/charts/VitalChartInteractive";
import VitalSign from "./VitalSign";
import { GetUserVitalSignsType } from "@actions/vitals.action";
import dayjs from "dayjs";
import localizedFormat from 'dayjs/plugin/localizedFormat'
dayjs.extend(localizedFormat)
interface RecentVitalSignsProps {
  readOnly?: boolean;
  userId: string;
  viewMode?: "chart" | "tile";
  vitalSigns: GetUserVitalSignsType
}

export default function RecentVitalSigns({readOnly = true, userId, viewMode, vitalSigns}: RecentVitalSignsProps) {

  const latestVitalSign = vitalSigns.length > 0 ? vitalSigns[vitalSigns.length - 1] : null;
  const restVitalSigns = vitalSigns.length > 0 ? vitalSigns.slice(0, vitalSigns.length - 1) : [];
  
  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap gap-2 items-center">
        <div>
          <CardTitle>Recent Vitals</CardTitle>
          {!!latestVitalSign && (
            <CardDescription>
              Most recent vital record was taken last {dayjs(latestVitalSign?.dateTaken).format("llll")}
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
            <ConditionalRender condition={restVitalSigns.length > 0} fallback="">
              <MoreVitals readOnly={readOnly} vitalSigns={restVitalSigns}/>
            </ConditionalRender>
          </Suspend>
        </VitalsSignView>
      </CardFooter>
    </Card>
  )
}


