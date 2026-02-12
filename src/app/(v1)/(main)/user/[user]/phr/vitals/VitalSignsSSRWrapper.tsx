"use server";

import { getUserVitalSignsAction } from "@actions/vitals.action";
import RecentVitalSigns from "./RecentVitalSigns";

interface VitalSignsSSRWrapperProps {
    readOnly: boolean
    userId: string,
}

export default async function VitalSignsSSRWrapper({readOnly, userId}: VitalSignsSSRWrapperProps) {
  const vitalSigns = await getUserVitalSignsAction(userId);

  return (
    <RecentVitalSigns vitalSigns={vitalSigns} readOnly={readOnly} userId={userId}/>
  );
}
