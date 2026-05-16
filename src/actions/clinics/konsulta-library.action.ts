"use server";

import "server-only";

import { revalidatePath } from "next/cache";
import prisma from "@lib/prisma";
import { getCachedSession } from "@actions/session.action";
import { getPermissionsAction } from "@actions/permission.action";
import { PERMISSIONS } from "@lib/permissions";
import {
  bootstrapClinicKonsultaLibraries,
  createClinicKonsultaCustomLibraryItem,
  getClinicKonsultaLibraryDomainItems,
  getClinicKonsultaLibrarySummary,
  searchPhilHealthKonsultaReferenceItems,
  updateClinicKonsultaLibraryMapping,
} from "@/lib/konsulta-library-persistence";

type ActionResult<T> = {
  status: boolean;
  message: string;
  data: T | null;
};

async function requireClinicSettingsAccess(clinicUid: string): Promise<number> {
  const session = await getCachedSession();
  if (!session) {
    throw new Error("User not authenticated.");
  }

  const permissions = await getPermissionsAction({
    userId: session.user.sub,
    type: "CLINIC",
  });
  const hasAccess = permissions.some(
    (permission) =>
      permission.name === PERMISSIONS.CLINIC["UPDATE:CLINIC:SETTINGS"].name,
  );

  if (!hasAccess) {
    throw new Error("You do not have permission to manage Konsulta libraries.");
  }

  const clinic = await prisma.clinic.findFirst({
    where: {
      clinicUid,
      isActive: true,
    },
    select: {
      id: true,
    },
  });

  if (!clinic) {
    throw new Error("Clinic not found.");
  }

  return clinic.id;
}

function revalidateClinicPaths(clinicUid: string): void {
  revalidatePath(`/v2/clinic/${clinicUid}/settings`);
  revalidatePath(`/v2/clinic/${clinicUid}/philhealth`);
}

export type GetClinicKonsultaLibrarySummary = Awaited<
  ReturnType<typeof getClinicKonsultaLibrarySummaryAction>
>;
export async function getClinicKonsultaLibrarySummaryAction(
  clinicUid: string,
): Promise<
  ActionResult<Awaited<ReturnType<typeof getClinicKonsultaLibrarySummary>>>
> {
  try {
    const clinicId = await requireClinicSettingsAccess(clinicUid);
    const summary = await getClinicKonsultaLibrarySummary(clinicId);
    return {
      status: true,
      message: "Konsulta library summary fetched.",
      data: summary,
    };
  } catch (error) {
    return {
      status: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch Konsulta library summary.",
      data: null,
    };
  }
}

export type BootstrapClinicKonsultaLibraries = Awaited<
  ReturnType<typeof bootstrapClinicKonsultaLibrariesAction>
>;
export async function bootstrapClinicKonsultaLibrariesAction(
  clinicUid: string,
): Promise<
  ActionResult<Awaited<ReturnType<typeof bootstrapClinicKonsultaLibraries>>>
> {
  try {
    const clinicId = await requireClinicSettingsAccess(clinicUid);
    const result = await bootstrapClinicKonsultaLibraries(clinicId);
    revalidateClinicPaths(clinicUid);

    return {
      status: true,
      message: "Clinic Konsulta libraries are ready.",
      data: result,
    };
  } catch (error) {
    return {
      status: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to bootstrap clinic Konsulta libraries.",
      data: null,
    };
  }
}

export type GetClinicKonsultaLibraryDomainItems = Awaited<
  ReturnType<typeof getClinicKonsultaLibraryDomainItemsAction>
>;
export async function getClinicKonsultaLibraryDomainItemsAction(
  clinicUid: string,
  domainKey: string,
  query = "",
): Promise<
  ActionResult<
    Awaited<ReturnType<typeof getClinicKonsultaLibraryDomainItems>>
  >
> {
  try {
    const clinicId = await requireClinicSettingsAccess(clinicUid);
    const items = await getClinicKonsultaLibraryDomainItems(
      clinicId,
      domainKey,
      query,
    );
    return {
      status: true,
      message: "Konsulta domain items fetched.",
      data: items,
    };
  } catch (error) {
    return {
      status: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch Konsulta domain items.",
      data: null,
    };
  }
}

export type SearchPhilHealthKonsultaReferences = Awaited<
  ReturnType<typeof searchPhilHealthKonsultaReferencesAction>
>;
export async function searchPhilHealthKonsultaReferencesAction(
  clinicUid: string,
  domainKey: string,
  query: string,
): Promise<
  ActionResult<
    Awaited<ReturnType<typeof searchPhilHealthKonsultaReferenceItems>>
  >
> {
  try {
    await requireClinicSettingsAccess(clinicUid);
    const items = await searchPhilHealthKonsultaReferenceItems(domainKey, query);
    return {
      status: true,
      message: "PhilHealth references fetched.",
      data: items,
    };
  } catch (error) {
    return {
      status: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to search PhilHealth references.",
      data: null,
    };
  }
}

export async function createClinicKonsultaLibraryItemAction(
  clinicUid: string,
  payload: {
    domainKey: string;
    internalCode?: string;
    displayLabel: string;
  },
): Promise<ActionResult<null>> {
  try {
    const clinicId = await requireClinicSettingsAccess(clinicUid);
    await createClinicKonsultaCustomLibraryItem(
      clinicId,
      payload.domainKey,
      payload.internalCode ?? null,
      payload.displayLabel,
    );
    revalidateClinicPaths(clinicUid);

    return {
      status: true,
      message: "Clinic internal library item created.",
      data: null,
    };
  } catch (error) {
    return {
      status: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to create clinic internal library item.",
      data: null,
    };
  }
}

export async function updateClinicKonsultaLibraryMappingAction(
  clinicUid: string,
  payload: {
    clinicItemId: number;
    philHealthReferenceItemId: number | null;
  },
): Promise<ActionResult<null>> {
  try {
    await requireClinicSettingsAccess(clinicUid);
    await updateClinicKonsultaLibraryMapping(
      payload.clinicItemId,
      payload.philHealthReferenceItemId,
    );
    revalidateClinicPaths(clinicUid);

    return {
      status: true,
      message: payload.philHealthReferenceItemId
        ? "Library mapping saved."
        : "Library mapping cleared.",
      data: null,
    };
  } catch (error) {
    return {
      status: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to update library mapping.",
      data: null,
    };
  }
}
