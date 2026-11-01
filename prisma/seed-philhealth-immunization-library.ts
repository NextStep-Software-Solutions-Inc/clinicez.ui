import 'dotenv/config';
import { PrismaClient, ImmunizationCategory } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const databaseUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
const pool = new Pool({ connectionString: databaseUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export const IMMUNIZATION_LIBRARY_DATA: Array<{
  category: ImmunizationCategory;
  code: string;
  name: string;
  description: string;
  doseNumber: number | null;
  defaultDoseLabel: string | null;
  targetGender: string | null;
  minAgeMonths: number | null;
  maxAgeMonths: number | null;
  defaultRoute: string | null;
  isActive: boolean;
  sortOrder: number;
}> = [
  // CHILD (lib_immchild.xlsx) - Age < 5 years (0 - 59 months)
  {
    category: ImmunizationCategory.CHILD,
    code: 'C01',
    name: 'BCG',
    description: 'Bacillus Calmette-Guérin Vaccine',
    doseNumber: 1,
    defaultDoseLabel: '1st Dose',
    targetGender: null,
    minAgeMonths: 0,
    maxAgeMonths: 59,
    defaultRoute: 'Intradermal',
    isActive: true,
    sortOrder: 1,
  },
  {
    category: ImmunizationCategory.CHILD,
    code: 'C02',
    name: 'OPV',
    description: 'Oral Polio Vaccine 1',
    doseNumber: 1,
    defaultDoseLabel: '1st Dose',
    targetGender: null,
    minAgeMonths: 0,
    maxAgeMonths: 59,
    defaultRoute: 'Oral',
    isActive: true,
    sortOrder: 2,
  },
  {
    category: ImmunizationCategory.CHILD,
    code: 'C03',
    name: 'OPV',
    description: 'Oral Polio Vaccine 2',
    doseNumber: 2,
    defaultDoseLabel: '2nd Dose',
    targetGender: null,
    minAgeMonths: 0,
    maxAgeMonths: 59,
    defaultRoute: 'Oral',
    isActive: true,
    sortOrder: 3,
  },
  {
    category: ImmunizationCategory.CHILD,
    code: 'C04',
    name: 'OPV',
    description: 'Oral Polio Vaccine 3',
    doseNumber: 3,
    defaultDoseLabel: '3rd Dose',
    targetGender: null,
    minAgeMonths: 0,
    maxAgeMonths: 59,
    defaultRoute: 'Oral',
    isActive: true,
    sortOrder: 4,
  },
  {
    category: ImmunizationCategory.CHILD,
    code: 'C05',
    name: 'DPT',
    description: 'Diphtheria, Pertussis, Tetanus Vaccine 1',
    doseNumber: 1,
    defaultDoseLabel: '1st Dose',
    targetGender: null,
    minAgeMonths: 0,
    maxAgeMonths: 59,
    defaultRoute: 'Intramuscular',
    isActive: true,
    sortOrder: 5,
  },
  {
    category: ImmunizationCategory.CHILD,
    code: 'C06',
    name: 'DPT',
    description: 'Diphtheria, Pertussis, Tetanus Vaccine 2',
    doseNumber: 2,
    defaultDoseLabel: '2nd Dose',
    targetGender: null,
    minAgeMonths: 0,
    maxAgeMonths: 59,
    defaultRoute: 'Intramuscular',
    isActive: true,
    sortOrder: 6,
  },
  {
    category: ImmunizationCategory.CHILD,
    code: 'C07',
    name: 'DPT',
    description: 'Diphtheria, Pertussis, Tetanus Vaccine 3',
    doseNumber: 3,
    defaultDoseLabel: '3rd Dose',
    targetGender: null,
    minAgeMonths: 0,
    maxAgeMonths: 59,
    defaultRoute: 'Intramuscular',
    isActive: true,
    sortOrder: 7,
  },
  {
    category: ImmunizationCategory.CHILD,
    code: 'C08',
    name: 'Measles',
    description: 'Measles Vaccine',
    doseNumber: 1,
    defaultDoseLabel: '1st Dose',
    targetGender: null,
    minAgeMonths: 0,
    maxAgeMonths: 59,
    defaultRoute: 'Subcutaneous',
    isActive: true,
    sortOrder: 8,
  },
  {
    category: ImmunizationCategory.CHILD,
    code: 'C09',
    name: 'Hepatitis B',
    description: 'Hepatitis B Vaccine 1',
    doseNumber: 1,
    defaultDoseLabel: '1st Dose',
    targetGender: null,
    minAgeMonths: 0,
    maxAgeMonths: 59,
    defaultRoute: 'Intramuscular',
    isActive: true,
    sortOrder: 9,
  },
  {
    category: ImmunizationCategory.CHILD,
    code: 'C10',
    name: 'Hepatitis B',
    description: 'Hepatitis B Vaccine 2',
    doseNumber: 2,
    defaultDoseLabel: '2nd Dose',
    targetGender: null,
    minAgeMonths: 0,
    maxAgeMonths: 59,
    defaultRoute: 'Intramuscular',
    isActive: true,
    sortOrder: 10,
  },
  {
    category: ImmunizationCategory.CHILD,
    code: 'C11',
    name: 'Hepatitis B',
    description: 'Hepatitis B Vaccine 3',
    doseNumber: 3,
    defaultDoseLabel: '3rd Dose',
    targetGender: null,
    minAgeMonths: 0,
    maxAgeMonths: 59,
    defaultRoute: 'Intramuscular',
    isActive: true,
    sortOrder: 11,
  },
  {
    category: ImmunizationCategory.CHILD,
    code: 'C12',
    name: 'Hepatitis A',
    description: 'Hepatitis A Vaccine',
    doseNumber: 1,
    defaultDoseLabel: '1st Dose',
    targetGender: null,
    minAgeMonths: 0,
    maxAgeMonths: 59,
    defaultRoute: 'Intramuscular',
    isActive: true,
    sortOrder: 12,
  },
  {
    category: ImmunizationCategory.CHILD,
    code: 'C13',
    name: 'Varicella',
    description: 'Varicella (Chicken Pox) Vaccine',
    doseNumber: 1,
    defaultDoseLabel: '1st Dose',
    targetGender: null,
    minAgeMonths: 0,
    maxAgeMonths: 59,
    defaultRoute: 'Subcutaneous',
    isActive: true,
    sortOrder: 13,
  },
  {
    category: ImmunizationCategory.CHILD,
    code: '999',
    name: 'None',
    description: 'No Child Immunizations Given',
    doseNumber: null,
    defaultDoseLabel: null,
    targetGender: null,
    minAgeMonths: 0,
    maxAgeMonths: 59,
    defaultRoute: null,
    isActive: true,
    sortOrder: 99,
  },

  // YOUNG_WOMAN (lib_immyoungw.xlsx) - Female, Age 10 - 49 years (120 - 588 months)
  {
    category: ImmunizationCategory.YOUNG_WOMAN,
    code: 'Y01',
    name: 'HPV',
    description: 'Human Papillomavirus Vaccine',
    doseNumber: null,
    defaultDoseLabel: '1st Dose',
    targetGender: 'F',
    minAgeMonths: 120,
    maxAgeMonths: 588,
    defaultRoute: 'Intramuscular',
    isActive: true,
    sortOrder: 1,
  },
  {
    category: ImmunizationCategory.YOUNG_WOMAN,
    code: 'Y02',
    name: 'MMR',
    description: 'Measles, Mumps, Rubella Vaccine',
    doseNumber: null,
    defaultDoseLabel: '1st Dose',
    targetGender: 'F',
    minAgeMonths: 120,
    maxAgeMonths: 588,
    defaultRoute: 'Subcutaneous',
    isActive: true,
    sortOrder: 2,
  },
  {
    category: ImmunizationCategory.YOUNG_WOMAN,
    code: '999',
    name: 'None',
    description: 'No Young Woman Immunizations Given',
    doseNumber: null,
    defaultDoseLabel: null,
    targetGender: 'F',
    minAgeMonths: 120,
    maxAgeMonths: 588,
    defaultRoute: null,
    isActive: true,
    sortOrder: 99,
  },

  // PREGNANT (lib_immpregw.xlsx) - Female, Pregnant
  {
    category: ImmunizationCategory.PREGNANT,
    code: 'P01',
    name: 'Tetanus Toxoid',
    description: 'Tetanus Toxoid Vaccine',
    doseNumber: null,
    defaultDoseLabel: '1st Dose',
    targetGender: 'F',
    minAgeMonths: null,
    maxAgeMonths: null,
    defaultRoute: 'Intramuscular',
    isActive: true,
    sortOrder: 1,
  },
  {
    category: ImmunizationCategory.PREGNANT,
    code: '999',
    name: 'None',
    description: 'No Pregnant Woman Immunizations Given',
    doseNumber: null,
    defaultDoseLabel: null,
    targetGender: 'F',
    minAgeMonths: null,
    maxAgeMonths: null,
    defaultRoute: null,
    isActive: true,
    sortOrder: 99,
  },

  // ELDERLY (lib_immelderly.xlsx) - Age >= 60 years (720+ months)
  {
    category: ImmunizationCategory.ELDERLY,
    code: 'E01',
    name: 'Pneumococcal Vaccine',
    description: 'Pneumococcal Polysaccharide Vaccine',
    doseNumber: null,
    defaultDoseLabel: '1st Dose',
    targetGender: null,
    minAgeMonths: 720,
    maxAgeMonths: null,
    defaultRoute: 'Intramuscular',
    isActive: true,
    sortOrder: 1,
  },
  {
    category: ImmunizationCategory.ELDERLY,
    code: 'E02',
    name: 'Flu Vaccine',
    description: 'Influenza Vaccine',
    doseNumber: null,
    defaultDoseLabel: 'Annual Dose',
    targetGender: null,
    minAgeMonths: 720,
    maxAgeMonths: null,
    defaultRoute: 'Intramuscular',
    isActive: true,
    sortOrder: 2,
  },
  {
    category: ImmunizationCategory.ELDERLY,
    code: '999',
    name: 'None',
    description: 'No Elderly Immunizations Given',
    doseNumber: null,
    defaultDoseLabel: null,
    targetGender: null,
    minAgeMonths: 720,
    maxAgeMonths: null,
    defaultRoute: null,
    isActive: true,
    sortOrder: 99,
  },
];

async function main() {
  console.log('Seeding PhilHealth Immunization Library...');
  let immCount = 0;
  for (const item of IMMUNIZATION_LIBRARY_DATA) {
    await prisma.philHealthImmunizationLibrary.upsert({
      where: {
        unique_category_code: {
          category: item.category,
          code: item.code,
        },
      },
      update: {
        name: item.name,
        description: item.description,
        doseNumber: item.doseNumber,
        defaultDoseLabel: item.defaultDoseLabel,
        targetGender: item.targetGender,
        minAgeMonths: item.minAgeMonths,
        maxAgeMonths: item.maxAgeMonths,
        defaultRoute: item.defaultRoute,
        isActive: item.isActive,
        sortOrder: item.sortOrder,
      },
      create: item,
    });
    immCount++;
  }
  console.log(`Seeded ${immCount} PhilHealth Immunization records successfully.`);

  // Update PhysicalExamLibrary for GENSURVEY
  console.log('Updating PhysicalExamLibrary GENSURVEY labels...');
  await prisma.physicalExamLibrary.updateMany({
    where: { category: 'GENSURVEY', code: '1' },
    data: { description: 'Awake and Alert' },
  });
  await prisma.physicalExamLibrary.updateMany({
    where: { category: 'GENSURVEY', code: '2' },
    data: { description: 'Altered Sensorium' },
  });
  console.log('Updated GENSURVEY labels in PhysicalExamLibrary.');

  // Deactivate deprecated diagnostics: PPDTest (17) and RBS (19)
  console.log('Deactivating deprecated diagnostics PPDTest (17) and RBS (19)...');
  const deactivatedPPD = await prisma.diagnosticProcedure.updateMany({
    where: {
      OR: [
        { philhealthDiagnosticId: '17' },
        { name: { contains: 'PPD', mode: 'insensitive' } },
        { name: { contains: 'Mantoux', mode: 'insensitive' } },
      ],
    },
    data: { isActive: false },
  });
  const deactivatedRBS = await prisma.diagnosticProcedure.updateMany({
    where: {
      OR: [
        { philhealthDiagnosticId: '19' },
        { name: { equals: 'RBS', mode: 'insensitive' } },
        { name: { contains: 'Random Blood Sugar', mode: 'insensitive' } },
      ],
    },
    data: { isActive: false },
  });
  console.log(`Deactivated PPD (${deactivatedPPD.count}) and RBS (${deactivatedRBS.count}) procedures.`);
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
