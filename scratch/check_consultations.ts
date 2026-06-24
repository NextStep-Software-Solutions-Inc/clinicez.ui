import "dotenv/config";
import { createPrismaClient } from "../src/lib/factory/prisma";

const prisma = createPrismaClient();

async function main() {
  const clinics = await prisma.clinic.findMany({
    select: {
      id: true,
      name: true,
      clinicUid: true,
      ClinicSetting: {
        select: {
          philhealthAccreditationNumber: true,
        }
      }
    }
  });

  console.log("Clinics and their Accreditation Numbers:");
  console.log(JSON.stringify(clinics, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
