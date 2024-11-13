import { atom } from "jotai"
import { EmployeeRecordType } from "@/app/(activation)/[organization]/join/EmployeeRecordForm"
import { StudentRecordType } from "@/app/(activation)/[organization]/join/StudentRecordForm"

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