import { labels } from './src/app/(process)/[organization]/consultations/data/data';
declare global {
  var prisma: PrismaClient;
  type Consultation =  {
    id: string
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