"use server";

import "server-only";
import prisma from "@lib/prisma";

// MASTER IMAGING PROCEDURES
export type GetAllMasterImagingProcedures = Awaited<
  ReturnType<typeof getAllMasterImagingProceduresAction>
>;
export async function getAllMasterImagingProceduresAction({
  search,
  pageSize = 10,
  pageNumber = 1,
  includeInactive = false,
}: {
  search?: string;
  pageSize?: number;
  pageNumber?: number;
  includeInactive?: boolean;
}) {
  const where = {
    ...(!includeInactive ? { isActive: true } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { description: { contains: search, mode: "insensitive" as const } },
            { category: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [procedures, total] = await Promise.all([
    prisma.imagingProcedure.findMany({
      where,
      orderBy: [{ category: "asc" }, { name: "asc" }],
      skip: (pageNumber - 1) * pageSize,
      take: pageSize,
    }),
    prisma.imagingProcedure.count({ where }),
  ]);

  return {
    data: procedures,
    total,
    pageSize,
    pageNumber,
    totalPages: Math.ceil(total / pageSize),
  };
}

export type CreateMasterImagingProcedure = Awaited<
  ReturnType<typeof createMasterImagingProcedureAction>
>;
export async function createMasterImagingProcedureAction({
  name,
  description,
  category,
  rvsCode,
}: {
  name: string;
  description?: string;
  category: string;
  rvsCode?: string;
}) {
  const procedure = await prisma.imagingProcedure.create({
    data: {
      name,
      description,
      category,
      rvsCode,
      isActive: true,
    },
  });

  return { data: procedure };
}

export type UpdateMasterImagingProcedure = Awaited<
  ReturnType<typeof updateMasterImagingProcedureAction>
>;
export async function updateMasterImagingProcedureAction({
  id,
  name,
  description,
  category,
  isActive,
  rvsCode,
}: {
  id: number;
  name?: string;
  description?: string;
  category?: string;
  isActive?: boolean;
  rvsCode?: string;
}) {
  const procedure = await prisma.imagingProcedure.update({
    where: { id },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(category !== undefined ? { category } : {}),
      ...(isActive !== undefined ? { isActive } : {}),
      ...(rvsCode !== undefined ? { rvsCode } : {}),
    },
  });

  return { data: procedure };
}

export type DeleteMasterImagingProcedure = Awaited<
  ReturnType<typeof deleteMasterImagingProcedureAction>
>;
export async function deleteMasterImagingProcedureAction({
  id,
}: {
  id: number;
}) {
  // Check if in use by clinic procedures
  const clinicUsage = await prisma.clinicImagingProcedure.count({
    where: { masterProcedureId: id },
  });

  if (clinicUsage > 0) {
    throw new Error(
      `Cannot delete procedure in use by ${clinicUsage} clinic procedure(s)`
    );
  }

  await prisma.imagingProcedure.delete({
    where: { id },
  });

  return { success: true };
}

// MASTER LABORATORY PROCEDURES
export type GetAllMasterLaboratoryProcedures = Awaited<
  ReturnType<typeof getAllMasterLaboratoryProceduresAction>
>;
export async function getAllMasterLaboratoryProceduresAction({
  search,
  pageSize = 10,
  pageNumber = 1,
  includeInactive = false,
}: {
  search?: string;
  pageSize?: number;
  pageNumber?: number;
  includeInactive?: boolean;
}) {
  const where = {
    ...(!includeInactive ? { isActive: true } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { description: { contains: search, mode: "insensitive" as const } },
            { category: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [procedures, total] = await Promise.all([
    prisma.laboratoryProcedure.findMany({
      where,
      orderBy: [{ category: "asc" }, { name: "asc" }],
      skip: (pageNumber - 1) * pageSize,
      take: pageSize,
    }),
    prisma.laboratoryProcedure.count({ where }),
  ]);

  return {
    data: procedures,
    total,
    pageSize,
    pageNumber,
    totalPages: Math.ceil(total / pageSize),
  };
}

export type CreateMasterLaboratoryProcedure = Awaited<
  ReturnType<typeof createMasterLaboratoryProcedureAction>
>;
export async function createMasterLaboratoryProcedureAction({
  name,
  description,
  category,
  rvsCode,
}: {
  name: string;
  description?: string;
  category: string;
  rvsCode?: string;
}) {
  const procedure = await prisma.laboratoryProcedure.create({
    data: {
      name,
      description,
      category,
      rvsCode,
      isActive: true,
    },
  });

  return { data: procedure };
}

export type UpdateMasterLaboratoryProcedure = Awaited<
  ReturnType<typeof updateMasterLaboratoryProcedureAction>
>;
export async function updateMasterLaboratoryProcedureAction({
  id,
  name,
  description,
  category,
  isActive,
  rvsCode,
}: {
  id: number;
  name?: string;
  description?: string;
  category?: string;
  isActive?: boolean;
  rvsCode?: string;
}) {
  const procedure = await prisma.laboratoryProcedure.update({
    where: { id },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(category !== undefined ? { category } : {}),
      ...(isActive !== undefined ? { isActive } : {}),
      ...(rvsCode !== undefined ? { rvsCode } : {}),
    },
  });

  return { data: procedure };
}

export type DeleteMasterLaboratoryProcedure = Awaited<
  ReturnType<typeof deleteMasterLaboratoryProcedureAction>
>;
export async function deleteMasterLaboratoryProcedureAction({
  id,
}: {
  id: number;
}) {
  // Check if in use by clinic procedures
  const clinicUsage = await prisma.clinicLaboratoryProcedure.count({
    where: { masterProcedureId: id },
  });

  if (clinicUsage > 0) {
    throw new Error(
      `Cannot delete procedure in use by ${clinicUsage} clinic procedure(s)`
    );
  }

  await prisma.laboratoryProcedure.delete({
    where: { id },
  });

  return { success: true };
}

// MASTER HEART STATION PROCEDURES
export type GetAllMasterHeartStationProcedures = Awaited<
  ReturnType<typeof getAllMasterHeartStationProceduresAction>
>;
export async function getAllMasterHeartStationProceduresAction({
  search,
  pageSize = 10,
  pageNumber = 1,
  includeInactive = false,
}: {
  search?: string;
  pageSize?: number;
  pageNumber?: number;
  includeInactive?: boolean;
}) {
  const where = {
    ...(!includeInactive ? { isActive: true } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { description: { contains: search, mode: "insensitive" as const } },
            { category: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [procedures, total] = await Promise.all([
    prisma.heartStationProcedure.findMany({
      where,
      orderBy: [{ category: "asc" }, { name: "asc" }],
      skip: (pageNumber - 1) * pageSize,
      take: pageSize,
    }),
    prisma.heartStationProcedure.count({ where }),
  ]);

  return {
    data: procedures,
    total,
    pageSize,
    pageNumber,
    totalPages: Math.ceil(total / pageSize),
  };
}

export type CreateMasterHeartStationProcedure = Awaited<
  ReturnType<typeof createMasterHeartStationProcedureAction>
>;
export async function createMasterHeartStationProcedureAction({
  name,
  description,
  category,
  rvsCode,
}: {
  name: string;
  description?: string;
  category: string;
  rvsCode?: string;
}) {
  const procedure = await prisma.heartStationProcedure.create({
    data: {
      name,
      description,
      category,
      rvsCode,
      isActive: true,
    },
  });

  return { data: procedure };
}

export type UpdateMasterHeartStationProcedure = Awaited<
  ReturnType<typeof updateMasterHeartStationProcedureAction>
>;
export async function updateMasterHeartStationProcedureAction({
  id,
  name,
  description,
  category,
  isActive,
  rvsCode,
}: {
  id: number;
  name?: string;
  description?: string;
  category?: string;
  isActive?: boolean;
  rvsCode?: string;
}) {
  const procedure = await prisma.heartStationProcedure.update({
    where: { id },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(category !== undefined ? { category } : {}),
      ...(isActive !== undefined ? { isActive } : {}),
      ...(rvsCode !== undefined ? { rvsCode } : {}),
    },
  });

  return { data: procedure };
}

export type DeleteMasterHeartStationProcedure = Awaited<
  ReturnType<typeof deleteMasterHeartStationProcedureAction>
>;
export async function deleteMasterHeartStationProcedureAction({
  id,
}: {
  id: number;
}) {
  // Check if in use by clinic procedures
  const clinicUsage = await prisma.clinicHeartStationProcedure.count({
    where: { masterProcedureId: id },
  });

  if (clinicUsage > 0) {
    throw new Error(
      `Cannot delete procedure in use by ${clinicUsage} clinic procedure(s)`
    );
  }

  await prisma.heartStationProcedure.delete({
    where: { id },
  });

  return { success: true };
}

// CLINIC PROCEDURES
export type GetClinicProceduresByType = Awaited<
  ReturnType<typeof getClinicProceduresByTypeAction>
>;
export async function getClinicProceduresByTypeAction({
  clinicId,
  type, // 'imaging' | 'laboratory' | 'heart_station'
  search,
  pageSize = 10,
  pageNumber = 1,
  includeInactive = false,
}: {
  clinicId: number;
  type: "imaging" | "laboratory" | "heart_station";
  search?: string;
  pageSize?: number;
  pageNumber?: number;
  includeInactive?: boolean;
}) {
  const where = {
    clinicId,
    ...(!includeInactive ? { isActive: true } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { description: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  let procedures: any[] = [];
  let total = 0;

  if (type === "imaging") {
    [procedures, total] = await Promise.all([
      prisma.clinicImagingProcedure.findMany({
        where,
        include: {
          MasterProcedure: true,
        },
        orderBy: { name: "asc" },
        skip: (pageNumber - 1) * pageSize,
        take: pageSize,
      }),
      prisma.clinicImagingProcedure.count({ where }),
    ]);
  } else if (type === "laboratory") {
    [procedures, total] = await Promise.all([
      prisma.clinicLaboratoryProcedure.findMany({
        where,
        include: {
          MasterProcedure: true,
        },
        orderBy: { name: "asc" },
        skip: (pageNumber - 1) * pageSize,
        take: pageSize,
      }),
      prisma.clinicLaboratoryProcedure.count({ where }),
    ]);
  } else if (type === "heart_station") {
    [procedures, total] = await Promise.all([
      prisma.clinicHeartStationProcedure.findMany({
        where,
        include: {
          MasterProcedure: true,
        },
        orderBy: { name: "asc" },
        skip: (pageNumber - 1) * pageSize,
        take: pageSize,
      }),
      prisma.clinicHeartStationProcedure.count({ where }),
    ]);
  }

  return {
    data: procedures,
    total,
    pageSize,
    pageNumber,
    totalPages: Math.ceil(total / pageSize),
  };
}

export type CreateClinicImagingProcedure = Awaited<
  ReturnType<typeof createClinicImagingProcedureAction>
>;
export async function createClinicImagingProcedureAction({
  clinicId,
  name,
  category,
  description,
  masterProcedureId,
}: {
  clinicId: number;
  name: string;
  category?: string;
  description?: string;
  masterProcedureId?: number;
}) {
  const procedure = await prisma.clinicImagingProcedure.create({
    data: {
      clinicId,
      name,
      category,
      description,
      masterProcedureId,
      isActive: true,
    },
    include: {
      MasterProcedure: true,
    },
  });

  return { data: procedure };
}

export type CreateClinicLaboratoryProcedure = Awaited<
  ReturnType<typeof createClinicLaboratoryProcedureAction>
>;
export async function createClinicLaboratoryProcedureAction({
  clinicId,
  name,
  category,
  description,
  masterProcedureId,
}: {
  clinicId: number;
  name: string;
  category?: string;
  description?: string;
  masterProcedureId?: number;
}) {
  const procedure = await prisma.clinicLaboratoryProcedure.create({
    data: {
      clinicId,
      name,
      category,
      description,
      masterProcedureId,
      isActive: true,
    },
    include: {
      MasterProcedure: true,
    },
  });

  return { data: procedure };
}

export type CreateClinicHeartStationProcedure = Awaited<
  ReturnType<typeof createClinicHeartStationProcedureAction>
>;
export async function createClinicHeartStationProcedureAction({
  clinicId,
  name,
  category,
  description,
  masterProcedureId,
}: {
  clinicId: number;
  name: string;
  category?: string;
  description?: string;
  masterProcedureId?: number;
}) {
  const procedure = await prisma.clinicHeartStationProcedure.create({
    data: {
      clinicId,
      name,
      category,
      description,
      masterProcedureId,
      isActive: true,
    },
    include: {
      MasterProcedure: true,
    },
  });

  return { data: procedure };
}

export type UpdateClinicProcedure = Awaited<
  ReturnType<typeof updateClinicProcedureAction>
>;
export async function updateClinicProcedureAction({
  type,
  id,
  name,
  category,
  description,
  masterProcedureId,
  isActive,
}: {
  type: "imaging" | "laboratory" | "heart_station";
  id: number;
  name?: string;
  category?: string;
  description?: string;
  masterProcedureId?: number | null;
  isActive?: boolean;
}) {
  const data = {
    ...(name !== undefined ? { name } : {}),
    ...(category !== undefined ? { category } : {}),
    ...(description !== undefined ? { description } : {}),
    ...(masterProcedureId !== undefined ? { masterProcedureId } : {}),
    ...(isActive !== undefined ? { isActive } : {}),
  };

  let procedure: any;

  if (type === "imaging") {
    procedure = await prisma.clinicImagingProcedure.update({
      where: { id },
      data,
      include: {
        MasterProcedure: true,
      },
    });
  } else if (type === "laboratory") {
    procedure = await prisma.clinicLaboratoryProcedure.update({
      where: { id },
      data,
      include: {
        MasterProcedure: true,
      },
    });
  } else if (type === "heart_station") {
    procedure = await prisma.clinicHeartStationProcedure.update({
      where: { id },
      data,
      include: {
        MasterProcedure: true,
      },
    });
  }

  return { data: procedure };
}

export type DeleteClinicProcedure = Awaited<
  ReturnType<typeof deleteClinicProcedureAction>
>;
export async function deleteClinicProcedureAction({
  type,
  id,
}: {
  type: "imaging" | "laboratory" | "heart_station";
  id: number;
}) {
  if (type === "imaging") {
    await prisma.clinicImagingProcedure.delete({
      where: { id },
    });
  } else if (type === "laboratory") {
    await prisma.clinicLaboratoryProcedure.delete({
      where: { id },
    });
  } else if (type === "heart_station") {
    await prisma.clinicHeartStationProcedure.delete({
      where: { id },
    });
  }

  return { success: true };
}

// Get all clinics for selection
export type GetAllClinicsForSelection = Awaited<
  ReturnType<typeof getAllClinicsForSelectionAction>
>;
export async function getAllClinicsForSelectionAction() {
  const clinics = await prisma.clinic.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
    },
    orderBy: { name: "asc" },
  });

  return { data: clinics };
}


// ICD-10 CODE MANAGEMENT
export type GetAllICD10Codes = Awaited<ReturnType<typeof getAllICD10CodesAction>>;
export async function getAllICD10CodesAction({
  search,
  pageSize = 20,
  pageNumber = 1,
  includeInactive = false,
}: {
  search?: string;
  pageSize?: number;
  pageNumber?: number;
  includeInactive?: boolean;
}) {
  const where = {
    ...(!includeInactive ? { isActive: true } : {}),
    ...(search
      ? {
          OR: [
            { code: { contains: search, mode: "insensitive" as const } },
            { description: { contains: search, mode: "insensitive" as const } },
            { shortDescription: { contains: search, mode: "insensitive" as const } },
            { category: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [codes, total] = await Promise.all([
    prisma.iCD10Code.findMany({
      where,
      orderBy: [{ code: "asc" }],
      skip: (pageNumber - 1) * pageSize,
      take: pageSize,
    }),
    prisma.iCD10Code.count({ where }),
  ]);

  return {
    data: codes,
    total,
    pageSize,
    pageNumber,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function deleteICD10CodeAction({ id }: { id: number }) {
  await prisma.iCD10Code.delete({ where: { id } });
}
