import { atom } from "jotai"
import type { EmployeeRecordType, StudentRecordType } from "@app/(v1)/(activation)/organizations/[orgUid]/join";

export type JoinOrgApplicationForm = Partial<{
  orgUid: string
  roleId: number
  userId: string
  roleRequirements: string[]
  employee_record: EmployeeRecordType
  student_record: StudentRecordType
  complete: boolean
}>

export const joinOrgApplicationAtom = atom<JoinOrgApplicationForm>({});