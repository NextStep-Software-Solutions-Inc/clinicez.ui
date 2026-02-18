require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter, transactionOptions: { timeout: 30000, maxWait: 10000 } });

async function main() {
  console.log('Seeding vaccines, routes, and doses...');

  // Seed Routes
  const routes = [
    { route: 'Intramuscular', description: 'Injection into muscle tissue' },
    { route: 'Subcutaneous', description: 'Injection under the skin' },
    { route: 'Oral', description: 'By mouth' },
    { route: 'Intranasal', description: 'Into the nose' },
    { route: 'Intradermal', description: 'Into the skin' },
  ];

  for (const routeData of routes) {
    const existing = await prisma.route.findFirst({
      where: { 
        route: { equals: routeData.route, mode: 'insensitive' }
      },
    });
    if (!existing) {
      await prisma.route.create({ data: routeData });
    }
  }
  console.log('✓ Routes seeded');

  // Seed Doses
  const doses = [
    { dose: '1st dose', description: 'First dose of vaccine series' },
    { dose: '2nd dose', description: 'Second dose of vaccine series' },
    { dose: '3rd dose', description: 'Third dose of vaccine series' },
    { dose: 'Booster', description: 'Booster dose' },
    { dose: 'Single dose', description: 'Single dose vaccine' },
  ];

  for (const doseData of doses) {
    const existing = await prisma.dose.findFirst({
      where: { 
        dose: { equals: doseData.dose, mode: 'insensitive' }
      },
    });
    if (!existing) {
      await prisma.dose.create({ data: doseData });
    }
  }
  console.log('✓ Doses seeded');

  // Seed Vaccines
  const vaccines = [
    { name: 'COVID-19 (Pfizer)', type: 'mRNA', description: 'Pfizer-BioNTech COVID-19 vaccine' },
    { name: 'COVID-19 (Moderna)', type: 'mRNA', description: 'Moderna COVID-19 vaccine' },
    { name: 'COVID-19 (AstraZeneca)', type: 'Viral vector', description: 'AstraZeneca COVID-19 vaccine' },
    { name: 'COVID-19 (Janssen)', type: 'Viral vector', description: 'Janssen COVID-19 vaccine' },
    { name: 'Influenza (Flu)', type: 'Inactivated', description: 'Seasonal influenza vaccine' },
    { name: 'MMR (Measles, Mumps, Rubella)', type: 'Live attenuated', description: 'Combined measles, mumps, and rubella vaccine' },
    { name: 'DPT (Diphtheria, Pertussis, Tetanus)', type: 'Inactivated', description: 'Diphtheria, pertussis, and tetanus vaccine' },
    { name: 'Hepatitis B', type: 'Inactivated', description: 'Hepatitis B vaccine' },
    { name: 'Hepatitis A', type: 'Inactivated', description: 'Hepatitis A vaccine' },
    { name: 'Polio', type: 'Inactivated', description: 'Poliomyelitis vaccine' },
    { name: 'Tetanus', type: 'Inactivated', description: 'Tetanus toxoid vaccine' },
    { name: 'Varicella (Chickenpox)', type: 'Live attenuated', description: 'Varicella-zoster vaccine' },
    { name: 'Pneumococcal', type: 'Inactivated', description: 'Pneumococcal polysaccharide vaccine' },
    { name: 'Meningococcal', type: 'Conjugate', description: 'Meningococcal vaccine' },
    { name: 'HPV (Human Papillomavirus)', type: 'Recombinant', description: 'Human papillomavirus vaccine' },
    { name: 'Shingles (Zoster)', type: 'Recombinant', description: 'Herpes zoster vaccine' },
    { name: 'Yellow Fever', type: 'Live attenuated', description: 'Yellow fever vaccine' },
    { name: 'Typhoid', type: 'Inactivated', description: 'Typhoid fever vaccine' },
    { name: 'Rabies', type: 'Inactivated', description: 'Rabies vaccine' },
    { name: 'Tuberculosis (BCG)', type: 'Live attenuated', description: 'Bacille Calmette-Guérin vaccine' },
  ];

  let createdCount = 0;
  for (const vaccineData of vaccines) {
    const existing = await prisma.vaccine.findFirst({
      where: { 
        name: { equals: vaccineData.name, mode: 'insensitive' }
      },
    });
    if (!existing) {
      await prisma.vaccine.create({ data: vaccineData });
      createdCount++;
    }
  }
  console.log(`✓ Vaccines seeded (created ${createdCount} new vaccines)`);

  console.log('✅ Seeding completed successfully');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
