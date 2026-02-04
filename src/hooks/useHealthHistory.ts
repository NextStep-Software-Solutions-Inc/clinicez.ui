import { getHealthHistoryAction } from "@actions/family-and-personal-history.action";
import { self } from "@services/request";
import useSWR from "swr";
import type { Prisma } from "@prisma/client";

// Type for comprehensive health history
export type HealthHistoryData = Prisma.UserGetPayload<{
    select: {
        id: true;
        dob: true;
        MedicalHistories: {
            include: {
                Condition: true;
            };
        };
        FamilyMedicalHistories: {
            include: {
                Condition: true;
            };
        };
        SurgicalHistories: true;
        PersonalHistory: true;
        ObGyneHistory: true;
        PhysicalExaminations: true;
        PediatricMeasurements: true;
    };
}>;

export const useHealthHistory = (userId: string) => {
    const fetcher = async () => {
        if (!userId) return null;
        const result = await getHealthHistoryAction(userId);
        return result.data;
    };

    return useSWR(userId ? `/api/health-history/${userId}` : null, fetcher);
};
