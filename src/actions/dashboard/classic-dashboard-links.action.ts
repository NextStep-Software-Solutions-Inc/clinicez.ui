"use server";

import prisma from "@lib/prisma";
import { getCachedSession } from "@actions/session.action";
import { getMyDefaultClinicAction } from "@actions/clinics/clinic.action";
import { getMyDefaultOrganizationAction } from "@actions/organizations/organization.action";

export interface ClassicDashboardLinks {
  clinicUid: string | null;
  orgUid: string | null;
}

/**
 * Fetch the user's default clinic and organization for classic mode dashboard links.
 * If no default is set, returns null.
 */
export async function getClassicDashboardLinksAction(): Promise<ClassicDashboardLinks> {
  const session = await getCachedSession();
  if (!session) return { clinicUid: null, orgUid: null };

  try {
    const [clinicResult, orgResult] = await Promise.all([
      getMyDefaultClinicAction(),
      getMyDefaultOrganizationAction()
    ]);

    const clinicUid = clinicResult?.data?.Clinic?.clinicUid || null;
    const orgUid = orgResult?.data?.Organization?.orgUid || null;

    return { clinicUid, orgUid };
  } catch (error) {
    console.error("Error fetching classic dashboard links:", error);
    return { clinicUid: null, orgUid: null };
  }
}
