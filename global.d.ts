import { PrismaClient as PrismaCommonClient } from '@prisma/common/client';
import { PrismaClient as PrismaTenantClient } from '@prisma/tenant/client';
declare global {
  var prismaCommon: PrismaCommonClient;
  var prismaTenant: PrismaTenantClient;
  
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