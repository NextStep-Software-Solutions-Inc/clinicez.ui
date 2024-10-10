"use client";

import { atom } from "jotai";

export type TenantApplyForm = Partial<{
    receiptCode: string;
}>;
export const tenantApplyAtom = atom<TenantApplyForm>({});