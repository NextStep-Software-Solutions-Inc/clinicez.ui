import { atom } from "jotai"
import type { EmployeeRecordType, StudentRecordType } from "@app/(v1)/(activation)/organizations/[orgUid]/join";
import type { StagedRequirementFile } from "@/lib/requirement-types";

export type JoinOrgApplicationForm = Partial<{
  orgUid: string
  roleId: number
  userId: string
  roleRequirements: string[]
  roleRequirementSettings: Record<string, { isRequired: boolean }>
  employee_record: EmployeeRecordType
  student_record: StudentRecordType
  stagedRequirementFiles: StagedRequirementFile[]
  complete: boolean
}>

export const joinOrgApplicationAtom = atom<JoinOrgApplicationForm>({});