const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function seedMasterlists() {
  console.log("Seeding Masterlists...");

  // Seed Diagnostic Categories
  await prisma.konsultaDiagnosticCategory.upsert({
    where: { code: 'CBC' },
    update: {},
    create: { code: 'CBC', name: 'Complete Blood Count', isActive: true, sortOrder: 1, fields: [] }
  });
  await prisma.konsultaDiagnosticCategory.upsert({
    where: { code: 'URINALYSIS' },
    update: {},
    create: { code: 'URINALYSIS', name: 'Urinalysis', isActive: true, sortOrder: 2, fields: [] }
  });

  // Seed Medicine
  await prisma.konsultaMedicine.upsert({
    where: { yakapCode: 'AMOX500' },
    update: {},
    create: { yakapCode: 'AMOX500', name: 'Amoxicillin 500mg', isActive: true }
  });

  // Seed Medicine Form
  await prisma.konsultaMedicineForm.upsert({
    where: { code: 'CAP' },
    update: {},
    create: { code: 'CAP', name: 'Capsule', isActive: true }
  });

  // Seed Medicine Strength
  await prisma.konsultaMedicineStrength.upsert({
    where: { code: '500MG' },
    update: {},
    create: { code: '500MG', name: '500 mg', isActive: true }
  });

  // Seed ICD
  await prisma.konsultaIcd.upsert({
    where: { code: 'J00' },
    update: {},
    create: { code: 'J00', name: 'Acute nasopharyngitis [common cold]', category: 'Respiratory', isActive: true }
  });

  // Seed NCDQ
  await prisma.konsultaNcdq.upsert({
    where: { code: 'NCDQ1' },
    update: {},
    create: { code: 'NCDQ1', name: 'Standard NCD Questionnaire', description: 'Base NCD form', isActive: true }
  });

  console.log("Masterlists seeded.");
}

seedMasterlists()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
