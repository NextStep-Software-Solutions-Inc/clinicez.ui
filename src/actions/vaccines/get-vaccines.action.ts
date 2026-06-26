"use server";

import prisma from "@lib/prisma";

export type GetVaccinesResponse = Awaited<ReturnType<typeof getVaccinesAction>>;

export const getVaccinesAction = async (includeInactive: boolean = false) => {
    try {
        const vaccines = await prisma.vaccine.findMany({
            where: includeInactive ? {} : { isActive: true },
            select: {
                id: true,
                name: true,
                type: true,
                description: true,
                isActive: true,
                PhilHealthData: true,
            },
            orderBy: { name: "asc" },
        });

        return {
            success: true,
            data: vaccines,
            error: null,
        };
    } catch (error) {
        return {
            success: false,
            data: [],
            error: error instanceof Error ? error.message : "Failed to fetch vaccines",
        };
    }
};

export const getRoutesAction = async () => {
    try {
        const routes = await prisma.route.findMany({
            where: { isActive: true },
            select: {
                id: true,
                route: true,
                description: true,
            },
            orderBy: { route: "asc" },
        });

        return {
            success: true,
            data: routes,
            error: null,
        };
    } catch (error) {
        return {
            success: false,
            data: [],
            error: error instanceof Error ? error.message : "Failed to fetch routes",
        };
    }
};

export const getDosesAction = async () => {
    try {
        const doses = await prisma.dose.findMany({
            where: { isActive: true },
            select: {
                id: true,
                dose: true,
                description: true,
            },
            orderBy: { dose: "asc" },
        });

        return {
            success: true,
            data: doses,
            error: null,
        };
    } catch (error) {
        return {
            success: false,
            data: [],
            error: error instanceof Error ? error.message : "Failed to fetch doses",
        };
    }
};
