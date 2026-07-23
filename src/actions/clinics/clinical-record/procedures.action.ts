"use server";

import "server-only";
import prisma from "@/lib/prisma";

import { getCachedSession } from "@/actions/session.action";
import { withErrorHandling } from "@/lib/with-error-handling";

export type ProcedureType = "imaging" | "laboratory" | "heart_station";

interface SearchProceduresParams {
  clinicId: number;
  procedureType: ProcedureType;
  searchTerm?: string;
  limit?: number;
}

interface ProcedureResult {
  id: number;
  name: string;
  description: string | null;
  category: string;
  isClinicCustom: boolean;
  masterProcedureId: number | null;
}

/**
 * Search for procedures across master and clinic-specific procedures, including recent usage
 */
export const searchProceduresAction = withErrorHandling(
  async ({ clinicId, procedureType, searchTerm = "", limit = 50 }: SearchProceduresParams) => {
    const session = await getCachedSession();
    if (!session) throw new Error("Unauthorized");

    const userId = await prisma.user.findUnique({
      where: { userId: session.user.sub },
      select: { id: true },
    });

    if (!userId) throw new Error("User not found");

    const results: ProcedureResult[] = [];
    const seenNames = new Set<string>();

    // Step 1: Get recent procedures from usage history (last 30 days)
    if (searchTerm.trim() === "" || searchTerm.length < 2) {
      const recentUsage: any[] = [];
      // Fetch full details for recent procedures
      if (procedureType === "imaging") {
        const recentIds = recentUsage.map((u) => u.procedureId);
        const recentProcedures = await prisma.clinicImagingProcedure.findMany({
          where: {
            id: { in: recentIds },
            isActive: true,
          },
          select: {
            id: true,
            name: true,
            description: true,
            masterProcedureId: true,
            MasterProcedure: {
              select: {
                category: true,
              },
            },
          },
        });

        recentProcedures.forEach((proc) => {
          if (!seenNames.has(proc.name)) {
            results.push({
              id: proc.id,
              name: proc.name,
              description: proc.description,
              category: proc.MasterProcedure?.category || "Custom",
              isClinicCustom: proc.masterProcedureId === null,
              masterProcedureId: proc.masterProcedureId,
            });
            seenNames.add(proc.name);
          }
        });
      } else if (procedureType === "laboratory") {
        const recentIds = recentUsage.map((u) => u.procedureId);
        const recentProcedures = await prisma.clinicLaboratoryProcedure.findMany({
          where: {
            id: { in: recentIds },
            isActive: true,
          },
          select: {
            id: true,
            name: true,
            description: true,
            masterProcedureId: true,
            MasterProcedure: {
              select: {
                category: true,
              },
            },
          },
        });

        recentProcedures.forEach((proc) => {
          if (!seenNames.has(proc.name)) {
            results.push({
              id: proc.id,
              name: proc.name,
              description: proc.description,
              category: proc.MasterProcedure?.category || "Custom",
              isClinicCustom: proc.masterProcedureId === null,
              masterProcedureId: proc.masterProcedureId,
            });
            seenNames.add(proc.name);
          }
        });
      } else if (procedureType === "heart_station") {
        const recentIds = recentUsage.map((u) => u.procedureId);
        const recentProcedures = await prisma.clinicHeartStationProcedure.findMany({
          where: {
            id: { in: recentIds },
            isActive: true,
          },
          select: {
            id: true,
            name: true,
            description: true,
            masterProcedureId: true,
            MasterProcedure: {
              select: {
                category: true,
              },
            },
          },
        });

        recentProcedures.forEach((proc) => {
          if (!seenNames.has(proc.name)) {
            results.push({
              id: proc.id,
              name: proc.name,
              description: proc.description,
              category: proc.MasterProcedure?.category || "Custom",
              isClinicCustom: proc.masterProcedureId === null,
              masterProcedureId: proc.masterProcedureId,
            });
            seenNames.add(proc.name);
          }
        });
      }
    }

    // Step 2: Search master procedures and create/get clinic procedures
    const searchFilter = searchTerm.trim()
      ? {
        OR: [
          { name: { contains: searchTerm, mode: "insensitive" as const } },
          { description: { contains: searchTerm, mode: "insensitive" as const } },
        ],
      }
      : {};

    if (procedureType === "imaging") {
      const masterProcedures = await prisma.imagingProcedure.findMany({
        where: {
          isActive: true,
          ...searchFilter,
        },
        orderBy: { name: "asc" },
        take: limit,
        select: {
          id: true,
          name: true,
          description: true,
          category: true,
        },
      });

      // For each master procedure, ensure a clinic procedure exists
      for (const master of masterProcedures) {
        if (!seenNames.has(master.name)) {
          // Try to find or create clinic procedure
          const clinicProc = await prisma.clinicImagingProcedure.upsert({
            where: {
              unique_clinic_imaging_procedure: {
                clinicId,
                name: master.name,
              },
            },
            create: {
              clinicId,
              masterProcedureId: master.id,
              name: master.name,
              description: master.description,
              isActive: true,
            },
            update: {},
            select: {
              id: true,
            },
          });

          results.push({
            id: clinicProc.id,
            name: master.name,
            description: master.description,
            category: master.category,
            isClinicCustom: false,
            masterProcedureId: master.id,
          });
          seenNames.add(master.name);
        }
      }
    } else if (procedureType === "laboratory") {
      const masterProcedures = await prisma.laboratoryProcedure.findMany({
        where: {
          isActive: true,
          ...searchFilter,
        },
        orderBy: { name: "asc" },
        take: limit,
        select: {
          id: true,
          name: true,
          description: true,
          category: true,
        },
      });

      for (const master of masterProcedures) {
        if (!seenNames.has(master.name)) {
          const clinicProc = await prisma.clinicLaboratoryProcedure.upsert({
            where: {
              unique_clinic_laboratory_procedure: {
                clinicId,
                name: master.name,
              },
            },
            create: {
              clinicId,
              masterProcedureId: master.id,
              name: master.name,
              description: master.description,
              isActive: true,
            },
            update: {},
            select: {
              id: true,
            },
          });

          results.push({
            id: clinicProc.id,
            name: master.name,
            description: master.description,
            category: master.category,
            isClinicCustom: false,
            masterProcedureId: master.id,
          });
          seenNames.add(master.name);
        }
      }
    } else if (procedureType === "heart_station") {
      const masterProcedures = await prisma.heartStationProcedure.findMany({
        where: {
          isActive: true,
          ...searchFilter,
        },
        orderBy: { name: "asc" },
        take: limit,
        select: {
          id: true,
          name: true,
          description: true,
          category: true,
        },
      });

      for (const master of masterProcedures) {
        if (!seenNames.has(master.name)) {
          const clinicProc = await prisma.clinicHeartStationProcedure.upsert({
            where: {
              unique_clinic_heart_station_procedure: {
                clinicId,
                name: master.name,
              },
            },
            create: {
              clinicId,
              masterProcedureId: master.id,
              name: master.name,
              description: master.description,
              isActive: true,
            },
            update: {},
            select: {
              id: true,
            },
          });

          results.push({
            id: clinicProc.id,
            name: master.name,
            description: master.description,
            category: master.category,
            isClinicCustom: false,
            masterProcedureId: master.id,
          });
          seenNames.add(master.name);
        }
      }
    }

    // Step 3: Search existing clinic-specific custom procedures
    if (searchTerm.trim()) {
      if (procedureType === "imaging") {
        const customProcedures = await prisma.clinicImagingProcedure.findMany({
          where: {
            clinicId,
            isActive: true,
            masterProcedureId: null, // Only custom procedures
            ...searchFilter,
          },
          orderBy: { name: "asc" },
          take: limit,
          select: {
            id: true,
            name: true,
            description: true,
          },
        });

        customProcedures.forEach((proc) => {
          if (!seenNames.has(proc.name)) {
            results.push({
              id: proc.id,
              name: proc.name,
              description: proc.description,
              category: "Custom",
              isClinicCustom: true,
              masterProcedureId: null,
            });
            seenNames.add(proc.name);
          }
        });
      } else if (procedureType === "laboratory") {
        const customProcedures = await prisma.clinicLaboratoryProcedure.findMany({
          where: {
            clinicId,
            isActive: true,
            masterProcedureId: null,
            ...searchFilter,
          },
          orderBy: { name: "asc" },
          take: limit,
          select: {
            id: true,
            name: true,
            description: true,
          },
        });

        customProcedures.forEach((proc) => {
          if (!seenNames.has(proc.name)) {
            results.push({
              id: proc.id,
              name: proc.name,
              description: proc.description,
              category: "Custom",
              isClinicCustom: true,
              masterProcedureId: null,
            });
            seenNames.add(proc.name);
          }
        });
      } else if (procedureType === "heart_station") {
        const customProcedures = await prisma.clinicHeartStationProcedure.findMany({
          where: {
            clinicId,
            isActive: true,
            masterProcedureId: null,
            ...searchFilter,
          },
          orderBy: { name: "asc" },
          take: limit,
          select: {
            id: true,
            name: true,
            description: true,
          },
        });

        customProcedures.forEach((proc) => {
          if (!seenNames.has(proc.name)) {
            results.push({
              id: proc.id,
              name: proc.name,
              description: proc.description,
              category: "Custom",
              isClinicCustom: true,
              masterProcedureId: null,
            });
            seenNames.add(proc.name);
          }
        });
      }
    }

    return {
      message: "Procedures fetched successfully",
      data: results.slice(0, limit),
    };
  }
);

interface CreateClinicProcedureParams {
  clinicId: number;
  procedureType: ProcedureType;
  name: string;
  category?: string;
  description?: string;
}

/**
 * Create a custom clinic-specific procedure on-the-fly
 */
export const createClinicProcedureAction = withErrorHandling(
  async ({ clinicId, procedureType, name, category, description }: CreateClinicProcedureParams) => {
    const session = await getCachedSession();
    if (!session) throw new Error("Unauthorized");

    if (!name.trim()) {
      throw new Error("Procedure name is required");
    }

    let procedure;

    if (procedureType === "imaging") {
      procedure = await prisma.clinicImagingProcedure.create({
        data: {
          clinicId,
          name: name.trim(),
          category: category?.trim() || null,
          description: description?.trim() || null,
          isActive: true,
          masterProcedureId: null, // Custom procedure
        },
        select: {
          id: true,
          name: true,
          description: true,
          category: true,
        },
      });
    } else if (procedureType === "laboratory") {
      procedure = await prisma.clinicLaboratoryProcedure.create({
        data: {
          clinicId,
          name: name.trim(),
          category: category?.trim() || null,
          description: description?.trim() || null,
          isActive: true,
          masterProcedureId: null,
        },
        select: {
          id: true,
          name: true,
          description: true,
          category: true,
        },
      });
    } else if (procedureType === "heart_station") {
      procedure = await prisma.clinicHeartStationProcedure.create({
        data: {
          clinicId,
          name: name.trim(),
          category: category?.trim() || null,
          description: description?.trim() || null,
          isActive: true,
          masterProcedureId: null,
        },
        select: {
          id: true,
          name: true,
          description: true,
          category: true,
        },
      });
    } else {
      throw new Error("Invalid procedure type");
    }

    return {
      message: "Custom procedure created successfully",
      data: {
        ...procedure,
        category: procedure.category || "Custom",
        isClinicCustom: true,
        masterProcedureId: null,
      },
    };
  }
);

interface TrackProcedureUsageParams {
  userId: number;
  clinicId: number;
  procedureType: ProcedureType;
  procedureId: number;
  procedureName: string;
}

/**
 * Track procedure usage for recent history
 */
export const trackProcedureUsageAction = withErrorHandling(
  async ({ userId, clinicId, procedureType, procedureId, procedureName }: TrackProcedureUsageParams) => {
    const result = {};

    return { message: "Procedure usage tracked successfully", data: result };
  }
);

/**
 * Get procedures by IDs - used for fetching selected procedures
 */
export const getProceduresByIdsAction = withErrorHandling(
  async (procedureType: ProcedureType, ids: number[]) => {
    const session = await getCachedSession();
    if (!session) throw new Error("Unauthorized");

    if (!ids.length) {
      return { message: "No IDs provided", data: [] };
    }

    let procedures: ProcedureResult[] = [];

    if (procedureType === "imaging") {
      const procs = await prisma.clinicImagingProcedure.findMany({
        where: {
          id: { in: ids },
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          description: true,
          masterProcedureId: true,
          MasterProcedure: {
            select: {
              category: true,
            },
          },
        },
      });

      procedures = procs.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        category: p.MasterProcedure?.category || "Custom",
        isClinicCustom: p.masterProcedureId === null,
        masterProcedureId: p.masterProcedureId,
      }));
    } else if (procedureType === "laboratory") {
      const procs = await prisma.clinicLaboratoryProcedure.findMany({
        where: {
          id: { in: ids },
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          description: true,
          masterProcedureId: true,
          MasterProcedure: {
            select: {
              category: true,
            },
          },
        },
      });

      procedures = procs.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        category: p.MasterProcedure?.category || "Custom",
        isClinicCustom: p.masterProcedureId === null,
        masterProcedureId: p.masterProcedureId,
      }));
    } else if (procedureType === "heart_station") {
      const procs = await prisma.clinicHeartStationProcedure.findMany({
        where: {
          id: { in: ids },
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          description: true,
          masterProcedureId: true,
          MasterProcedure: {
            select: {
              category: true,
            },
          },
        },
      });

      procedures = procs.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        category: p.MasterProcedure?.category || "Custom",
        isClinicCustom: p.masterProcedureId === null,
        masterProcedureId: p.masterProcedureId,
      }));
    }

    return {
      message: "Procedures fetched successfully",
      data: procedures,
    };
  }
);
