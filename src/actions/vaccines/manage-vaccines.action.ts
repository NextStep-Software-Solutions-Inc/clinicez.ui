"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export type ManageVaccineInput = {
    name: string;
    type: string;
    description?: string;
    childImmcode?: string;
    youngwImmcode?: string;
    pregwImmcode?: string;
    elderlyImmcode?: string;
    otherImm?: string;
};

export const createVaccineAction = async (input: ManageVaccineInput) => {
    try {
        const vaccine = await prisma.vaccine.create({
            data: {
                name: input.name,
                type: input.type,
                description: input.description,
                isActive: true,
                PhilHealthData: {
                    create: {
                        childImmcode: input.childImmcode,
                        youngwImmcode: input.youngwImmcode,
                        pregwImmcode: input.pregwImmcode,
                        elderlyImmcode: input.elderlyImmcode,
                        otherImm: input.otherImm,
                    }
                }
            },
        });

        revalidatePath('/super-admin/vaccines');
        return { success: true, data: vaccine, error: null };
    } catch (error) {
        return { success: false, data: null, error: error instanceof Error ? error.message : "Failed to create vaccine" };
    }
};

export const updateVaccineAction = async (id: number, input: ManageVaccineInput) => {
    try {
        const vaccine = await prisma.vaccine.update({
            where: { id },
            data: {
                name: input.name,
                type: input.type,
                description: input.description,
                PhilHealthData: {
                    upsert: {
                        create: {
                            childImmcode: input.childImmcode,
                            youngwImmcode: input.youngwImmcode,
                            pregwImmcode: input.pregwImmcode,
                            elderlyImmcode: input.elderlyImmcode,
                            otherImm: input.otherImm,
                        },
                        update: {
                            childImmcode: input.childImmcode,
                            youngwImmcode: input.youngwImmcode,
                            pregwImmcode: input.pregwImmcode,
                            elderlyImmcode: input.elderlyImmcode,
                            otherImm: input.otherImm,
                        }
                    }
                }
            },
        });

        revalidatePath('/super-admin/vaccines');
        return { success: true, data: vaccine, error: null };
    } catch (error) {
        return { success: false, data: null, error: error instanceof Error ? error.message : "Failed to update vaccine" };
    }
};

export const deleteVaccineAction = async (id: number) => {
    try {
        // Soft delete
        const vaccine = await prisma.vaccine.update({
            where: { id },
            data: {
                isActive: false,
                deletedAt: new Date(),
            },
        });

        revalidatePath('/super-admin/vaccines');
        return { success: true, data: vaccine, error: null };
    } catch (error) {
        return { success: false, data: null, error: error instanceof Error ? error.message : "Failed to delete vaccine" };
    }
};

export const toggleVaccineStatusAction = async (id: number, isActive: boolean) => {
    try {
        const vaccine = await prisma.vaccine.update({
            where: { id },
            data: { isActive },
        });

        revalidatePath('/super-admin/vaccines');
        return { success: true, data: vaccine, error: null };
    } catch (error) {
        return { success: false, data: null, error: error instanceof Error ? error.message : "Failed to toggle status" };
    }
};
