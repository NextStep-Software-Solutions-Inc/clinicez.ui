"use server";

import { getCachedSession } from "@actions/session.action";
import { getUserPlansAction } from "@actions/users/user-plan.action";
import { cache } from "react";

export const isTenant = cache(async () => {
  const session = await getCachedSession();
  if(!session) throw new Error("No session found");
  const userPlans = await getUserPlansAction(session.user.sub);
  return userPlans.some((plan) => plan.Plan.type === "TENANT" && !["ON_HOLD", "PENDING", "EXPIRED"].includes(plan.status));
})
