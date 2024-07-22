import { EmployeeRecordType } from './src/app/(activation)/[organization]/join/EmployeeRecordForm';
import { StudentRecordType } from './src/app/(activation)/[organization]/join/StudentRecordForm';
import { Gender, UserEmploymentRecord, UserStudentRecord } from '@prisma/client';
import { labels } from './src/app/(process)/[organization]/consultations/data/data';
declare global {
  var prisma: PrismaClient;
  type Consultation =  {
    id: number
    subject: string
    status: string
    label: string
    priority: string
    appointmentId: string
  }
  type ApplicationRequest = {
    id: number
    role: {
      id: number
      name: string
    }
    status: string
    createdAt: Date,
    User: {
      id: number
      picture: string | null
      userId: string
      firstName: string | null
      lastName: string | null
      gender: Gender | null,
      dob: Date | null,
      StudentRecords: UserStudentRecord[],
      UserEmployments: UserEmploymentRecord[]
    }
    AcceptedBy: {
      id: number
      userId: string
      firstName: string | null
      lastName: string | null
    } | null
  }
  type Intervention = {
    id: string
    action: string
  }
  type VitalSigns = {
    id: string
    temperature: number
    pulse: number
    respiration: number
    bloodPressure: string
    oxygenSaturation: number
    height: number
    weight: number
    bmi: number
  }
}

export default global