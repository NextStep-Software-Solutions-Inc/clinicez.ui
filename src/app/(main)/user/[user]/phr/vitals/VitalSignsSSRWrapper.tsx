"use server";

import { getUserVitalSignsAction } from "@actions/vitals.action";
import RecentVitalSigns from "./RecentVitalSigns";

interface VitalSignsSSRWrapperProps {
    readOnly: boolean
    userId: string,
    viewMode?: "chart" | "tile";
}

export default async function VitalSignsSSRWrapper({readOnly, userId, viewMode}: VitalSignsSSRWrapperProps) {
  const vitalSigns = await getUserVitalSignsAction(userId);

  return (
    <RecentVitalSigns vitalSigns={vitalSigns} readOnly={readOnly} userId={userId} viewMode={viewMode}/>
  );
}
