"use server";

import prismaClient from "@/lib/prisma";
import { withErrorHandling } from "@/lib/with-error-handling";

export const searchImagingDiagnosticsAction = withErrorHandling(
    async (searchTerm: string, limit: number = 50) => {
        const result = await prismaClient.imagingProcedure.findMany({
            where: {
                OR: [
                    { name: { contains: searchTerm, mode: "insensitive" } },
                    { description: { contains: searchTerm, mode: "insensitive" } },
                ],
            },
            take: limit,
            select: {
                id: true,
                name: true,
                description: true,
                isActive: true,
            },
        });

        return {
            message: "Imaging diagnostics retrieved successfully",
            data: result,
        };
    }
);

export const getImagingDiagnosticsByIdsAction = withErrorHandling(
    async (ids: (string | number)[]) => {
        const numericIds = ids.map(id => typeof id === 'string' ? parseInt(id, 10) : id);
        const result = await prismaClient.imagingProcedure.findMany({
            where: {
                id: { in: numericIds },
            },
            select: {
                id: true,
                name: true,
                description: true,
                isActive: true,
            },
        });

        return {
            message: "Imaging diagnostics retrieved successfully",
            data: result,
        };
    }
);

export const getPaginatedImagingDiagnosticsAction = withErrorHandling(
    async (options: { search?: string; limit?: number; offset?: number }) => {
        const { search = "", limit = 50, offset = 0 } = options;

        const [result, total] = await Promise.all([
            prismaClient.imagingProcedure.findMany({
                where: search
                    ? {
                        OR: [
                            { name: { contains: search, mode: "insensitive" } },
                            { description: { contains: search, mode: "insensitive" } },
                        ],
                    }
                    : undefined,
                take: limit,
                skip: offset,
                select: {
                    id: true,
                    name: true,
                    description: true,
                    isActive: true,
                },
            }),
            prismaClient.imagingProcedure.count({
                where: search
                    ? {
                        OR: [
                            { name: { contains: search, mode: "insensitive" } },
                            { description: { contains: search, mode: "insensitive" } },
                        ],
                    }
                    : undefined,
            }),
        ]);

        return {
            message: "Paginated imaging diagnostics retrieved successfully",
            data: {
                items: result,
                total,
                hasMore: offset + limit < total,
            },
        };
    }
);
