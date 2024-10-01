"use client";

import { atom } from "jotai";
import { HealthcareProviderType } from '@prisma/common/client';

export type HpApplyForm = Partial<{
    hpType: HealthcareProviderType;
    planId: number;
    planName: string;
    planPrice: number;
    receiptCode: string;
}>;
export const hpApply = atom<HpApplyForm>({});