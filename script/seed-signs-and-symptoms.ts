import 'dotenv/config';
import prisma from "../src/lib/prisma";
import { PHILHEALTH_SIGNS_AND_SYMPTOMS } from "../src/lib/philhealth-yakap/signs-and-symptoms-library";

async function main() {
  console.log("Seeding PhilHealth Signs and Symptoms...");
  for (const item of PHILHEALTH_SIGNS_AND_SYMPTOMS) {
    await prisma.konsultaSignAndSymptom.upsert({
      where: { code: item.code },
      update: {
        description: item.description,
        isActive: item.isActive,
        sortOrder: item.sortOrder,
      },
      create: {
        code: item.code,
        description: item.description,
        isActive: item.isActive,
        sortOrder: item.sortOrder,
      },
    });
  }
  console.log(`Seeding completed successfully (${PHILHEALTH_SIGNS_AND_SYMPTOMS.length} items).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
