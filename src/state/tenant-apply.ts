"use client";

import { atom } from "jotai";

export type TenantApplyForm = Partial<{
    receiptCode: string;
    tenantUid: string;
    name: string;
    description?: string;
    planId: number;
}>;
export const tenantApplyAtom = atom<TenantApplyForm>({});