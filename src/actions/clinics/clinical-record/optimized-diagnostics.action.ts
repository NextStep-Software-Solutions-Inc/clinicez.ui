"use server";

import "server-only";
import prisma from "@/lib/prisma";

import { getCachedSession } from "@/actions/session.action";
import { withErrorHandling } from "@/lib/with-error-handling";

export type GetPaginatedImagingDiagnostics = Awaited<ReturnType<typeof getPaginatedImagingDiagnosticsAction>>;

interface GetDiagnosticsParams {
  search?: string;
  limit?: number;
  offset?: number;
  category?: string;
}

export const getPaginatedImagingDiagnosticsAction = withErrorHandling(
  async ({ search = "", limit = 50, offset = 0, category }: GetDiagnosticsParams = {}) => {
    const session = await getCachedSession();
    if (!session) throw new Error("Unauthorized");

    // Build where clause for filtering
    const whereClause: {
      isActive: boolean;
      OR?: Array<{
        name?: { contains: string; mode: "insensitive" };
        description?: { contains: string; mode: "insensitive" };
      }>;
      category?: string;
    } = {
      isActive: true,
    };

    // Add search filter
    if (search.trim()) {
      whereClause.OR = [
        {
          name: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          description: {
            contains: search,
            mode: "insensitive",
          },
        },
      ];
    }

    // Add category filter
    if (category) {
      whereClause.category = category;
    }

    // Get total count for pagination
    const total = await prisma.imagingDiagnostic.count({
      where: whereClause,
    });

    // Get paginated results
    const diagnostics = await prisma.imagingDiagnostic.findMany({
      where: whereClause,
      orderBy: { name: "asc" },
      take: Math.min(limit, 100), // Cap at 100 to prevent abuse
      skip: offset,
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        isActive: true,
      },
    });

    return {
      message: "Imaging diagnostics fetched successfully",
      data: {
        diagnostics,
        total,
        limit,
        offset,
        hasMore: offset + diagnostics.length < total,
      },
    };
  }
);

export type SearchImagingDiagnostics = Awaited<ReturnType<typeof searchImagingDiagnosticsAction>>;

export const searchImagingDiagnosticsAction = withErrorHandling(
  async (searchTerm: string, limit: number = 20) => {
    const session = await getCachedSession();
    if (!session) throw new Error("Unauthorized");

    if (!searchTerm.trim()) {
      return { message: "Search term required", data: [] };
    }

    const diagnostics = await prisma.imagingDiagnostic.findMany({
      where: {
        isActive: true,
        OR: [
          {
            name: {
              contains: searchTerm,
              mode: "insensitive",
            },
          },
          {
            description: {
              contains: searchTerm,
              mode: "insensitive",
            },
          },
        ],
      },
      orderBy: [
        // Prioritize exact matches
        {
          name: "asc",
        },
      ],
      take: Math.min(limit, 50), // Cap at 50 for search
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        isActive: true,
      },
    });

    return {
      message: "Search results fetched successfully",
      data: diagnostics,
    };
  }
);

export type GetImagingDiagnosticsByIds = Awaited<ReturnType<typeof getImagingDiagnosticsByIdsAction>>;

export const getImagingDiagnosticsByIdsAction = withErrorHandling(
  async (ids: number[]) => {
    const session = await getCachedSession();
    if (!session) throw new Error("Unauthorized");

    if (!ids.length) {
      return { message: "No IDs provided", data: [] };
    }

    const diagnostics = await prisma.imagingDiagnostic.findMany({
      where: {
        id: {
          in: ids,
        },
        isActive: true,
      },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        isActive: true,
      },
    });

    return {
      message: "Imaging diagnostics fetched successfully",
      data: diagnostics,
    };
  }
);
