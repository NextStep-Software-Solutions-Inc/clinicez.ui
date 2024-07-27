import { User } from '@prisma/client';
import { EmployeeRecordType } from './src/app/(activation)/[organization]/join/EmployeeRecordForm';
import { StudentRecordType } from './src/app/(activation)/[organization]/join/StudentRecordForm';
import { Gender, UserEmploymentRecord, UserStudentRecord } from '@prisma/client';
import { labels } from './src/app/(process)/[organization]/consultations/data/data';
import { GetUserOrganizations } from '@actions/user-organization.action';
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