"use client";

import { atom } from "jotai";

export type HpApplyForm = Partial<{
    hpTypeId: number;
    planId: number;
    planName: string;
    planPrice: number;
    receiptCode: string;
}>;
export const hpApply = atom<HpApplyForm>({});