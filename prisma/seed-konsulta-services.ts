import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const services = [
  {
    minAgeMonths: 0,
    maxAgeMonths: 12,
    gender: null,
    consultationDescription: 'History and physical examination (vitals, anthropometrics)',
    philhealthDiagnosticIds: ['CBC'],
  },
  {
    minAgeMonths: 13,
    maxAgeMonths: 59, // > 1 - 4 years old (1-4 means up to end of 4th year, so < 5 years, or 13-59 months)
    gender: null,
    consultationDescription: 'History and physical examination (vitals, anthropometrics)',
    philhealthDiagnosticIds: ['CBC', 'FECALYSIS', 'URINALYSIS'],
  },
  {
    minAgeMonths: 60,
    maxAgeMonths: 119, // 5 - 9 years old (60 - 119 months)
    gender: null,
    consultationDescription: 'History and physical examination (vitals, anthropometrics, BMI)',
    philhealthDiagnosticIds: ['CBC', 'FECALYSIS', 'URINALYSIS', 'PPD_TEST'],
  },
  {
    minAgeMonths: 120,
    maxAgeMonths: 239, // 10 - 19 years old (120 - 239 months)
    gender: null,
    consultationDescription: 'History and physical examination (anthropometrics, BMI, BP)',
    philhealthDiagnosticIds: ['CBC', 'FECALYSIS', 'URINALYSIS', 'PAP_SMEAR', 'CHEST_XRAY'],
  },
  {
    minAgeMonths: 240,
    maxAgeMonths: 719, // 20 - 59 years old
    gender: 'FEMALE',
    consultationDescription: 'History and physical examination (vital signs, BMI)',
    philhealthDiagnosticIds: ['CBC', 'URINALYSIS', 'PAP_SMEAR', 'CHEST_XRAY', 'SPUTUM', 'OGTT', 'ECG', 'LIPID_PROFILE', 'FBS', 'CREATININE', 'FOBT'],
  },
  {
    minAgeMonths: 240,
    maxAgeMonths: 719, // 20 - 59 years old
    gender: 'MALE',
    consultationDescription: 'History and physical examination (vital signs, BMI)',
    philhealthDiagnosticIds: ['CBC', 'URINALYSIS', 'CHEST_XRAY', 'SPUTUM', 'OGTT', 'ECG', 'LIPID_PROFILE', 'FBS', 'CREATININE', 'FOBT'],
  },
  {
    minAgeMonths: 720,
    maxAgeMonths: null, // > 60 years old
    gender: 'FEMALE',
    consultationDescription: 'History and physical examination (vital signs, BMI)',
    philhealthDiagnosticIds: ['URINALYSIS', 'CHEST_XRAY', 'SPUTUM', 'OGTT', 'ECG', 'LIPID_PROFILE', 'FBS', 'CREATININE', 'FOBT'],
  },
  {
    minAgeMonths: 720,
    maxAgeMonths: null, // > 60 years old
    gender: 'MALE',
    consultationDescription: 'History and physical examination (vital signs, BMI)',
    philhealthDiagnosticIds: ['URINALYSIS', 'CHEST_XRAY', 'SPUTUM', 'OGTT', 'ECG', 'LIPID_PROFILE', 'FBS', 'CREATININE', 'FOBT'],
  },
];

async function main() {
  console.log('Seeding KonsultaRecommendedService...');
  
  // Clear existing to avoid duplicates if re-run
  await prisma.konsultaRecommendedService.deleteMany();

  for (const service of services) {
    await prisma.konsultaRecommendedService.create({
      data: {
        minAgeMonths: service.minAgeMonths,
        maxAgeMonths: service.maxAgeMonths,
        gender: service.gender as any,
        consultationDescription: service.consultationDescription,
        philhealthDiagnosticIds: service.philhealthDiagnosticIds,
      },
    });
  }

  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
