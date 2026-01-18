"use server";

import prismaClient from "@/lib/prisma";
import { withErrorHandling } from "@/lib/with-error-handling";

export const getLaboratoryDiagnosticsAction = withErrorHandling(
    async (searchTerm: string, limit: number = 50) => {
        const result = await prismaClient.laboratoryProcedure.findMany({
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
            },
        });

        return {
            message: "Laboratory diagnostics retrieved successfully",
            data: result,
        };
    }
);

export const getPaginatedLaboratoryDiagnosticsAction = withErrorHandling(
    async (options: { search?: string; limit?: number; offset?: number }) => {
        const { search = "", limit = 50, offset = 0 } = options;

        const [result, total] = await Promise.all([
            prismaClient.laboratoryProcedure.findMany({
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
                },
            }),
            prismaClient.laboratoryProcedure.count({
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
            message: "Paginated laboratory diagnostics retrieved successfully",
            data: {
                items: result,
                total,
                hasMore: offset + limit < total,
            },
        };
    }
);
