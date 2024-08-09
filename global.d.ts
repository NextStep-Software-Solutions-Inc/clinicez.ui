import { createPrismaCommonClient, createPrismaTenantClient } from '@lib/factory/prisma';
declare global {
  var prismaCommon: ReturnType<typeof createPrismaCommonClient>;
  var prismaTenant: ReturnType<typeof createPrismaTenantClient>;
  
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