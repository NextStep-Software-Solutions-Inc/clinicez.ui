import { getHealthHistoryAction } from "@actions/family-and-personal-history.action";
import { self } from "@services/request";
import useSWR from "swr";
import type { Prisma } from "@prisma/client";

// Serialized version of HealthHistoryData with Decimal fields converted to numbers
export type SerializedHealthHistoryData = Prisma.UserGetPayload<{
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
        VitalSigns: true;
    };
}> & {
    VitalSigns: Array<{
        id: number;
        userId: number;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        dateTaken: Date;
        notes: string | null;
        length: number | null;
        headCircumference: number | null;
        skinfoldThickness: number | null;
        waistCircumference: number | null;
        hipCircumference: number | null;
        limbCircumference: number | null;
        midUpperArmCircumference: number | null;
    }>;
};

export const useHealthHistory = (userId: string) => {
    const fetcher = async () => {
        if (!userId) return null;
        const result = await getHealthHistoryAction(userId);
        return result.data as SerializedHealthHistoryData;
    };

    return useSWR(userId ? `/api/health-history/${userId}` : null, fetcher);
};
