"use server";

import "server-only";

import { revalidatePath } from "next/cache";
import prisma from "@lib/prisma";
import { $Enums } from "@prisma/client";
import { getCachedSession } from "@actions/session.action";
import { getPermissionsAction } from "@actions/permission.action";
import { PERMISSIONS } from "@lib/permissions";
import {
  requireAnyClinicPermission,
  requireClinicPermission,
} from "@/lib/permission-checker";
import { createAuditLog } from "@/actions/audit.action";
import {
  bootstrapClinicKonsultaLibraries,
  createClinicKonsultaCustomLibraryItem,
  getClinicKonsultaLibraryDomainItems,
  getClinicKonsultaLibrarySummary,
  searchClinicKonsultaTermSuggestions,
  searchPhilHealthKonsultaReferenceItems,
  updateClinicKonsultaTermMapping,
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

async function requireClinicSettingsContext(clinicUid: string): Promise<{
  clinicId: number;
  appUserId: number | null;
}> {
  const clinicId = await requireClinicSettingsAccess(clinicUid);
  const session = await getCachedSession();
  const appUser = session
    ? await prisma.user.findFirst({
        where: {
          userId: session.user.sub,
          isActive: true,
          deletedAt: null,
        },
        select: { id: true },
      })
    : null;

  return {
    clinicId,
    appUserId: appUser?.id ?? null,
  };
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

export type SearchClinicKonsultaTermSuggestions = Awaited<
  ReturnType<typeof searchClinicKonsultaTermSuggestionsAction>
>;
export async function searchClinicKonsultaTermSuggestionsAction(
  clinicUid: string,
  payload: {
    domainKeys: string[];
    query: string;
  },
): Promise<
  ActionResult<
    Awaited<ReturnType<typeof searchClinicKonsultaTermSuggestions>>
  >
> {
  try {
    const session = await getCachedSession();
    if (!session) {
      throw new Error("User not authenticated.");
    }

    await requireAnyClinicPermission(
      session.user.sub,
      clinicUid,
      [
        PERMISSIONS.CLINIC["READ:CLINIC:CONSULTATION_NOTE"].name,
        PERMISSIONS.CLINIC["WRITE:CLINIC:CONSULTATION_NOTE"].name,
        PERMISSIONS.CLINIC["READ:CLINIC:SETTINGS"].name,
        PERMISSIONS.CLINIC["UPDATE:CLINIC:SETTINGS"].name,
      ],
      "search Konsulta library suggestions",
    );

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

    const suggestions = await searchClinicKonsultaTermSuggestions(
      clinic.id,
      payload.domainKeys,
      payload.query,
    );

    return {
      status: true,
      message: "Konsulta term suggestions fetched.",
      data: suggestions,
    };
  } catch (error) {
    return {
      status: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to search Konsulta term suggestions.",
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
    const { clinicId, appUserId } = await requireClinicSettingsContext(clinicUid);
    const existingItem = await prisma.clinicKonsultaTerm.findFirst({
      where: {
        id: payload.clinicItemId,
        clinicId,
      },
      select: {
        id: true,
        displayLabel: true,
        domainKey: true,
        Mapping: {
          select: {
            philHealthReferenceItemId: true,
            PhilHealthReferenceItem: {
              select: {
                externalCode: true,
                displayLabel: true,
              },
            },
          },
        },
      },
    });

    if (!existingItem) {
      throw new Error("Clinic internal library item not found.");
    }

    const nextReference = payload.philHealthReferenceItemId
      ? await prisma.philHealthKonsultaReference.findUnique({
          where: {
            id: payload.philHealthReferenceItemId,
          },
          select: {
            id: true,
            externalCode: true,
            displayLabel: true,
          },
        })
      : null;

    await updateClinicKonsultaTermMapping(
      payload.clinicItemId,
      payload.philHealthReferenceItemId,
    );

    const previousReferenceId =
      existingItem.Mapping?.philHealthReferenceItemId ?? null;
    if (previousReferenceId !== payload.philHealthReferenceItemId) {
      const previousValue = existingItem.Mapping?.PhilHealthReferenceItem
        ? [
            existingItem.Mapping.PhilHealthReferenceItem.externalCode,
            existingItem.Mapping.PhilHealthReferenceItem.displayLabel,
          ]
            .filter(Boolean)
            .join(" — ")
        : "Unmapped";
      const newValue = nextReference
        ? [nextReference.externalCode, nextReference.displayLabel]
            .filter(Boolean)
            .join(" — ")
        : "Unmapped";

      await createAuditLog({
        entityType: $Enums.AuditEntityType.CLINIC,
        entityId: clinicId,
        action: $Enums.AuditAction.UPDATE,
        fieldName: "konsulta_library_mapping",
        previousValue,
        newValue,
        reason: `Updated mapping for ${existingItem.displayLabel}`,
        metadata: {
          clinicItemId: existingItem.id,
          clinicItemLabel: existingItem.displayLabel,
          domainKey: existingItem.domainKey,
          previousReferenceId,
          nextReferenceId: payload.philHealthReferenceItemId,
        },
        performedBy: appUserId ?? undefined,
      });
    }

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

export type GetClinicKonsultaMappingAuditHistory = Awaited<
  ReturnType<typeof getClinicKonsultaMappingAuditHistoryAction>
>;
export async function getClinicKonsultaMappingAuditHistoryAction(
  clinicUid: string,
): Promise<
  ActionResult<
    Array<{
      id: number;
      performedAt: Date;
      previousValue: string | null;
      newValue: string | null;
      reason: string | null;
      metadata: unknown;
      performerName: string;
    }>
  >
> {
  try {
    const session = await getCachedSession();
    if (!session) {
      throw new Error("User not authenticated.");
    }

    await requireClinicPermission(
      session.user.sub,
      clinicUid,
      PERMISSIONS.CLINIC["VIEW:CLINIC:AUDIT_LOG"].name,
      "view Konsulta mapping audit history",
    );

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

    const logs = await prisma.auditLog.findMany({
      where: {
        entityType: $Enums.AuditEntityType.CLINIC,
        entityId: clinic.id,
        fieldName: "konsulta_library_mapping",
      },
      orderBy: {
        performedAt: "desc",
      },
      take: 10,
      select: {
        id: true,
        performedAt: true,
        previousValue: true,
        newValue: true,
        reason: true,
        metadata: true,
        Performer: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return {
      status: true,
      message: "Konsulta mapping audit history fetched.",
      data: logs.map((log) => ({
        id: log.id,
        performedAt: log.performedAt,
        previousValue: log.previousValue,
        newValue: log.newValue,
        reason: log.reason,
        metadata: log.metadata,
        performerName:
          [log.Performer?.firstName, log.Performer?.lastName]
            .filter(Boolean)
            .join(" ")
            .trim() ||
          log.Performer?.email ||
          "System",
      })),
    };
  } catch (error) {
    return {
      status: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch Konsulta mapping audit history.",
      data: null,
    };
  }
}
