"use server";

import prisma from "@lib/prisma";

import { Prisma } from "@prisma/client";
import { cache } from "react";

// Get total healthcare provider job titles
export const getHPTypeCounts = async () => {
  const types = await prisma.healthcareProviderType.findMany({
    select: {
      id: true,
      name: true,
      description: true,
      HealthcareProviders: {
        where: {
          isActive: true,
        },
        select: {
          id: true,
        },
      },
    },
  });

  return types.map((type) => ({
    id: type.id,
    name: type.name,
    description: type.description,
    count: type.HealthcareProviders.length,
  })).filter(type => type.count > 0).sort((a, b) => b.count - a.count);
};

export type GetHPTypeCountsType = Awaited<ReturnType<typeof getHPTypeCounts>>;

const DEFAULT_HP_PAGE_SIZE = 9;

export type HPSortOption = "name-asc" | "name-desc" | "experience-asc" | "experience-desc";
export const VALID_HP_SORT_OPTIONS: readonly HPSortOption[] = ["name-asc", "name-desc", "experience-asc", "experience-desc"];

export function parseHPSortOption(raw: string | null | undefined): HPSortOption {
  if (raw && (VALID_HP_SORT_OPTIONS as readonly string[]).includes(raw)) {
    return raw as HPSortOption;
  }
  return "name-asc";
}

export type GetAllHPByType = Awaited<ReturnType<typeof getAllHPByTypeAction>>;
export const getAllHPByTypeAction = cache(async (
  hpTypeName: string,
  page = 1,
  pageSize?: number,
  search = "",
  sort: HPSortOption = "name-asc",
) => {
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const computedPageSize = Number.isFinite(pageSize) && pageSize && pageSize > 0 ? Math.min(Math.floor(pageSize), 50) : DEFAULT_HP_PAGE_SIZE;
  const normalizedSearch = search.trim();
  const normalizedTypeName = hpTypeName.trim();

  const buildEmptyResult = () => ({
    items: [],
    pagination: {
      page: safePage,
      pageSize: computedPageSize,
      totalCount: 0,
      totalPages: 1,
    },
    search: normalizedSearch,
    sort,
    hpType: null as null,
  });

  if (!normalizedTypeName) {
    return buildEmptyResult();
  }

  const hpType = await prisma.healthcareProviderType.findFirst({
    where: {
      name: {
        equals: normalizedTypeName,
        mode: "insensitive",
      },
    },
    select: {
      id: true,
      name: true,
      description: true,
    },
  });

  if (!hpType) {
    return buildEmptyResult();
  }

  const whereClause: Prisma.HealthcareProviderWhereInput = {
    isActive: true,
    isPublished: true,
    applicationStatus: "APPROVED",
    hpTypeId: hpType.id,
  };

  if (normalizedSearch) {
    whereClause.OR = [
      {
        HPProfile: {
          is: {
            name: {
              contains: normalizedSearch,
              mode: "insensitive",
            },
          },
        },
      },
      {
        HPProfile: {
          is: {
            title: {
              contains: normalizedSearch,
              mode: "insensitive",
            },
          },
        },
      },
      {
        HPProfile: {
          is: {
            suffix: {
              contains: normalizedSearch,
              mode: "insensitive",
            },
          },
        },
      },
      {
        User: {
          is: {
            OrganizationMembers: {
              some: {
                Organization: {
                  name: {
                    contains: normalizedSearch,
                    mode: "insensitive",
                  },
                },
              },
            },
          },
        },
      },
    ];
  }

  const orderBy: Prisma.HealthcareProviderOrderByWithRelationInput =
    sort === "name-desc"
      ? { HPProfile: { name: "desc" } }
      : sort === "experience-asc"
        ? { HPProfile: { experience: { sort: "asc", nulls: "last" } } }
        : sort === "experience-desc"
          ? { HPProfile: { experience: { sort: "desc", nulls: "last" } } }
          : { HPProfile: { name: "asc" } };

  const [items, totalCount] = await prisma.$transaction([
    prisma.healthcareProvider.findMany({
      where: whereClause,
      orderBy,
      skip: (safePage - 1) * computedPageSize,
      take: computedPageSize,
      select: {
        id: true,
        HPProfile: {
          select: {
            id: true,
            name: true,
            picture: true,
            title: true,
            suffix: true,
            experience: true,
            specialties: true,
            educations: true,
            languages: true,
            philosophy: true,
            workEmail: true,
            workPhone: true,
          },
        },
        HPType: {
          select: {
            id: true,
            name: true,
          },
        },
        User: {
          select: {
            OrganizationMembers: {
              select: {
                Organization: {
                  select: {
                    name: true,
                  },
                },
              },
              take: 1,
            },
          },
        },
      },
    }),
    prisma.healthcareProvider.count({ where: whereClause }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / computedPageSize));

  return {
    items,
    pagination: {
      page: safePage,
      pageSize: computedPageSize,
      totalCount,
      totalPages,
    },
    search: normalizedSearch,
    sort,
    hpType,
  };
});


export type HPSFilters = {
  hpTypeId?: number,
  userId?: string
  isPublished?: boolean
  clinicUid?: string
}

export type GetHPsType = Awaited<ReturnType<typeof getHPsAction>>
export const getHPsAction = cache(async (filters?: HPSFilters) => {

  const { hpTypeId, userId, isPublished, clinicUid } = filters || {};
  const hps = await prisma.healthcareProvider.findMany({
    orderBy: {
      HPProfile: { name: "asc" }
    },
    where: {
      isActive: true,
      ...(hpTypeId ? { hpTypeId } : {}),
      ...(userId ? { User: { userId } } : {}),
      ...(isPublished ? { isPublished } : {}),
      ...(clinicUid ? {
        User: {
          ClinicMembers: {
            some: {
              Clinic: {
                clinicUid: clinicUid,
              },
              isActive: true
            }
          }
        }
      } : {})
    },
    include: {
      HPType: {
        select: { id: true, name: true }
      },
      User: {
        select: {
          userId: true,
          email: true,
          gender: true,
          firstName: true,
          lastName: true,
          suffix: true,
        }
      },
      HPProfile: {
        select: {
          picture: true,
          name: true,
          title: true,
          suffix: true,
          specialties: true,
          fields: true,
        }
      }
    }
  })

  return hps;
})

export type HPFilters = {
  id?: number,
  hpTypeId?: number,
  userId?: string
  isPublished?: boolean
}
export type GetHP = Awaited<ReturnType<typeof getHPAction>>
export const getHPAction = async ({ userId, hpTypeId, isPublished, id }: HPFilters) => {

  const hp = await prisma.healthcareProvider.findFirst({
    where: {
      isActive: true,
      ...(hpTypeId ? { hpTypeId } : {}),
      ...(isPublished ? { isPublished } : {}),
      OR: [
        { User: { userId } },
        { id }
      ]
    },
    include: {
      HPProfile: true,
      HPType: {
        select: {
          id: true,
          name: true
        }
      },
      User: {
        include: {
          SocialLink: true
        }
      }
    }
  })

  return hp;
}

/**
 * Extracts the user ID from a Prisma HealthcareProvider create input.
 * Handles both direct connection and nested connection patterns.
 */
function extractUserIdFromInput(hp: Prisma.HealthcareProviderCreateArgs["data"]): number | undefined {
  if (!hp.User || typeof hp.User !== 'object') {
    return undefined;
  }

  // Handle User.connect pattern (e.g., { User: { connect: { id: 123 } } })
  if ('connect' in hp.User && hp.User.connect && typeof hp.User.connect === 'object') {
    const connect = hp.User.connect;
    if ('id' in connect && typeof connect.id === 'number') {
      return connect.id;
    }
  }

  return undefined;
}

export const createHpAction = async (hp: Prisma.HealthcareProviderCreateArgs["data"]) => {
  // Check if user already has an HP profile before creating
  const userId = extractUserIdFromInput(hp);

  if (userId) {
    const existingHP = await prisma.healthcareProvider.findFirst({
      where: {
        userId,
        isActive: true,
      },
    });

    if (existingHP) {
      throw new Error("User already has a Healthcare Provider profile. Only one HP profile is allowed per user.");
    }
  }

  const newHp = await prisma.healthcareProvider.create({
    data: {
      ...hp
    }
  })

  return newHp;
}

export const getProfessionalDetailsAction = async (hpId: number) => {
  const hp = await prisma.professionalDetails.findFirst({
    where: {
      healthcareProverId: hpId
    }
  })
  return hp;

}

export const upsertProfessionalDetailsAction = async (payload: Prisma.ProfessionalDetailsUpsertArgs) => {
  const hp = await prisma.professionalDetails.upsert(payload)
  return hp;
}

export const upsertHPAction = async (payload: Prisma.HPProfileUpsertArgs) => {
  const hpProfile = await prisma.hPProfile.upsert(payload)
  return hpProfile;
}

export const setIsPublishAction = async (hpId: number, isPublished: boolean) => {
  const hp = await prisma.healthcareProvider.update({
    where: { id: hpId },
    data: { isPublished }
  })
  return hp;
}

export type GetHpsByIds = Awaited<ReturnType<typeof getHpsByIdsAction>>
export const getHpsByIdsAction = async (ids: number[]) => {
  const hps = await prisma.healthcareProvider.findMany({
    where: {
      id: {
        in: ids
      },
      isActive: true
    },
    orderBy: {
      HPProfile: { name: "asc" }
    },
    select: {
      id: true,
      HPType: {
        select: {
          id: true,
          name: true
        }
      },
      User: {
        select: {
          userId: true,
          email: true,
          firstName: true,
          lastName: true,
          suffix: true,
        }
      },
      HPProfile: {
        select: {
          picture: true,
          name: true,
          title: true,
          suffix: true,
          specialties: true,
        }
      }
    }
  })
  return hps;
}