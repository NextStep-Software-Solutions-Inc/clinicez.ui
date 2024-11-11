import { atom } from "jotai";

export const userDefaultOrganizationRoleAtom = atom<{
  [key: string]: {
    roleId?: number
    roleName?: string
  }
}>({});