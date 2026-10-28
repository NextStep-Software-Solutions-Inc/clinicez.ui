import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export const PHYSICAL_EXAM_LIBRARY_DATA = [
  // GENSURVEY
  { category: "GENSURVEY", code: "1", description: "Awake and Alert", libraryStatus: 1, isActive: true },
  { category: "GENSURVEY", code: "2", description: "Altered Sensorium", libraryStatus: 1, isActive: true },
  { category: "GENSURVEY", code: "99", description: "Others", libraryStatus: 1, isActive: true },

  // SKIN
  { category: "SKIN", code: "1", description: "Essentially normal", libraryStatus: 1, isActive: true },
  { category: "SKIN", code: "2", description: "Clubbing", libraryStatus: 1, isActive: true },
  { category: "SKIN", code: "3", description: "Cold clammy", libraryStatus: 1, isActive: true },
  { category: "SKIN", code: "4", description: "Cyanosis/mottled skin", libraryStatus: 1, isActive: true },
  { category: "SKIN", code: "5", description: "Edema/swelling", libraryStatus: 1, isActive: true },
  { category: "SKIN", code: "6", description: "Decreased mobility", libraryStatus: 1, isActive: true },
  { category: "SKIN", code: "7", description: "Pale nailbeds", libraryStatus: 1, isActive: true },
  { category: "SKIN", code: "8", description: "Poor skin turgor", libraryStatus: 1, isActive: true },
  { category: "SKIN", code: "9", description: "Rashes/Petechiae", libraryStatus: 1, isActive: true },
  { category: "SKIN", code: "10", description: "Weak pulses", libraryStatus: 1, isActive: true },
  { category: "SKIN", code: "99", description: "Others", libraryStatus: 1, isActive: true },

  // HEENT
  { category: "HEENT", code: "1", description: "Anicteric sclerae", libraryStatus: 0, isActive: false },
  { category: "HEENT", code: "2", description: "Intact tympanic membrane", libraryStatus: 0, isActive: false },
  { category: "HEENT", code: "3", description: "Pupils briskly reactive to light", libraryStatus: 0, isActive: false },
  { category: "HEENT", code: "4", description: "Tonsillopharyngeal congestion", libraryStatus: 0, isActive: false },
  { category: "HEENT", code: "5", description: "Hypertrophic tonsils", libraryStatus: 0, isActive: false },
  { category: "HEENT", code: "6", description: "Alar flaring", libraryStatus: 0, isActive: false },
  { category: "HEENT", code: "7", description: "Nasal discharge", libraryStatus: 0, isActive: false },
  { category: "HEENT", code: "8", description: "Aural discharge", libraryStatus: 0, isActive: false },
  { category: "HEENT", code: "9", description: "Palpable mass", libraryStatus: 0, isActive: false },
  { category: "HEENT", code: "10", description: "Exudates", libraryStatus: 0, isActive: false },
  { category: "HEENT", code: "11", description: "Essentially Normal", libraryStatus: 1, isActive: true },
  { category: "HEENT", code: "12", description: "Abnormal pupillary reaction", libraryStatus: 1, isActive: true },
  { category: "HEENT", code: "13", description: "Cervical lymphadenopathy", libraryStatus: 1, isActive: true },
  { category: "HEENT", code: "14", description: "Dry mucous membrane", libraryStatus: 1, isActive: true },
  { category: "HEENT", code: "15", description: "Icteric sclerae", libraryStatus: 1, isActive: true },
  { category: "HEENT", code: "16", description: "Pale conjunctivae", libraryStatus: 1, isActive: true },
  { category: "HEENT", code: "17", description: "Sunken eyeballs", libraryStatus: 1, isActive: true },
  { category: "HEENT", code: "18", description: "Sunken fontanelle", libraryStatus: 1, isActive: true },
  { category: "HEENT", code: "99", description: "Others", libraryStatus: 1, isActive: true },

  // CHEST
  { category: "CHEST", code: "1", description: "Symmetrical chest expansion", libraryStatus: 0, isActive: false },
  { category: "CHEST", code: "2", description: "Clear breath sounds", libraryStatus: 0, isActive: false },
  { category: "CHEST", code: "3", description: "Retractions", libraryStatus: 1, isActive: true },
  { category: "CHEST", code: "4", description: "Crackles/rales", libraryStatus: 1, isActive: true },
  { category: "CHEST", code: "5", description: "Wheezes", libraryStatus: 1, isActive: true },
  { category: "CHEST", code: "6", description: "Essentially normal", libraryStatus: 1, isActive: true },
  { category: "CHEST", code: "7", description: "Asymmetrical chest expansion", libraryStatus: 1, isActive: true },
  { category: "CHEST", code: "8", description: "Decreased breath sounds", libraryStatus: 1, isActive: true },
  { category: "CHEST", code: "9", description: "Enlarged Axillary Lymph Nodes", libraryStatus: 0, isActive: false },
  { category: "CHEST", code: "10", description: "Lumps over breast(s)", libraryStatus: 1, isActive: true },
  { category: "CHEST", code: "99", description: "Others", libraryStatus: 1, isActive: true },

  // HEART
  { category: "HEART", code: "1", description: "Adynamic precordium", libraryStatus: 0, isActive: false },
  { category: "HEART", code: "2", description: "Normal rate regular rhythm", libraryStatus: 0, isActive: false },
  { category: "HEART", code: "3", description: "Heaves/thrills", libraryStatus: 1, isActive: true },
  { category: "HEART", code: "4", description: "Murmurs", libraryStatus: 1, isActive: true },
  { category: "HEART", code: "5", description: "Essentially normal", libraryStatus: 1, isActive: true },
  { category: "HEART", code: "6", description: "Displaced apex beat", libraryStatus: 1, isActive: true },
  { category: "HEART", code: "7", description: "Irregular rhythm", libraryStatus: 1, isActive: true },
  { category: "HEART", code: "8", description: "Muffled heart sounds", libraryStatus: 1, isActive: true },
  { category: "HEART", code: "9", description: "Pericardial bulge", libraryStatus: 1, isActive: true },
  { category: "HEART", code: "99", description: "Others", libraryStatus: 1, isActive: true },

  // ABDOMEN
  { category: "ABDOMEN", code: "1", description: "Flat", libraryStatus: 0, isActive: false },
  { category: "ABDOMEN", code: "2", description: "Flabby", libraryStatus: 0, isActive: false },
  { category: "ABDOMEN", code: "3", description: "Globular", libraryStatus: 0, isActive: false },
  { category: "ABDOMEN", code: "4", description: "Muscle guarding", libraryStatus: 0, isActive: false },
  { category: "ABDOMEN", code: "5", description: "Tenderness", libraryStatus: 0, isActive: false },
  { category: "ABDOMEN", code: "6", description: "Palpable mass", libraryStatus: 0, isActive: false },
  { category: "ABDOMEN", code: "7", description: "Essentially normal", libraryStatus: 1, isActive: true },
  { category: "ABDOMEN", code: "8", description: "Abdominal rigidity", libraryStatus: 1, isActive: true },
  { category: "ABDOMEN", code: "9", description: "Abdominal tenderness", libraryStatus: 1, isActive: true },
  { category: "ABDOMEN", code: "10", description: "Hyperactive bowel sounds", libraryStatus: 1, isActive: true },
  { category: "ABDOMEN", code: "11", description: "Palpable mass(es)", libraryStatus: 1, isActive: true },
  { category: "ABDOMEN", code: "12", description: "Tympanitic/dull abdomen", libraryStatus: 1, isActive: true },
  { category: "ABDOMEN", code: "13", description: "Uterine contraction", libraryStatus: 1, isActive: true },
  { category: "ABDOMEN", code: "99", description: "Others", libraryStatus: 1, isActive: true },

  // NEURO
  { category: "NEURO", code: "1", description: "Developmental delay", libraryStatus: 0, isActive: false },
  { category: "NEURO", code: "2", description: "Seizures", libraryStatus: 0, isActive: false },
  { category: "NEURO", code: "3", description: "Normal", libraryStatus: 0, isActive: false },
  { category: "NEURO", code: "4", description: "Motor Deficit", libraryStatus: 0, isActive: false },
  { category: "NEURO", code: "5", description: "Sensory Deficit", libraryStatus: 0, isActive: false },
  { category: "NEURO", code: "6", description: "Essentially normal", libraryStatus: 1, isActive: true },
  { category: "NEURO", code: "7", description: "Abnormal gait", libraryStatus: 1, isActive: true },
  { category: "NEURO", code: "8", description: "Abnormal position sense", libraryStatus: 1, isActive: true },
  { category: "NEURO", code: "9", description: "Abnormal sensation", libraryStatus: 1, isActive: true },
  { category: "NEURO", code: "10", description: "Abnormal reflex(es)", libraryStatus: 1, isActive: true },
  { category: "NEURO", code: "11", description: "Poor/altered memory", libraryStatus: 1, isActive: true },
  { category: "NEURO", code: "12", description: "Poor muscle tone/strength", libraryStatus: 1, isActive: true },
  { category: "NEURO", code: "13", description: "Poor coordination", libraryStatus: 1, isActive: true },
  { category: "NEURO", code: "99", description: "Others", libraryStatus: 1, isActive: true },

  // RECTAL
  { category: "RECTAL", code: "0", description: "Not Applicable", libraryStatus: 1, isActive: true },
  { category: "RECTAL", code: "1", description: "Essentially normal", libraryStatus: 1, isActive: true },
  { category: "RECTAL", code: "2", description: "Enlarged Prostate", libraryStatus: 1, isActive: true },
  { category: "RECTAL", code: "3", description: "Mass", libraryStatus: 1, isActive: true },
  { category: "RECTAL", code: "4", description: "Hemorrhoids", libraryStatus: 1, isActive: true },
  { category: "RECTAL", code: "5", description: "Pus", libraryStatus: 1, isActive: true },
  { category: "RECTAL", code: "99", description: "Others", libraryStatus: 1, isActive: true },

  // GU
  { category: "GU", code: "1", description: "Essentially normal", libraryStatus: 1, isActive: true },
  { category: "GU", code: "2", description: "Blood stained in exam finger", libraryStatus: 1, isActive: true },
  { category: "GU", code: "3", description: "Cervical dilatation", libraryStatus: 1, isActive: true },
  { category: "GU", code: "4", description: "Presence of abnormal discharge", libraryStatus: 1, isActive: true },
  { category: "GU", code: "99", description: "Others", libraryStatus: 1, isActive: true },
];

export async function seedPhysicalExamLibrary() {
  console.log("Seeding PhysicalExamLibrary...");
  let seededCount = 0;

  for (const item of PHYSICAL_EXAM_LIBRARY_DATA) {
    await prisma.physicalExamLibrary.upsert({
      where: {
        category_code: {
          category: item.category,
          code: item.code,
        },
      },
      update: {
        description: item.description,
        libraryStatus: item.libraryStatus,
        isActive: item.isActive,
      },
      create: {
        category: item.category,
        code: item.code,
        description: item.description,
        libraryStatus: item.libraryStatus,
        isActive: item.isActive,
      },
    });
    seededCount++;
  }

  console.log(`Successfully seeded ${seededCount} PhysicalExamLibrary entries.`);
}

if (require.main === module) {
  seedPhysicalExamLibrary()
    .then(async () => {
      await pool.end();
      await prisma.$disconnect();
    })
    .catch(async (e) => {
      console.error(e);
      await pool.end();
      await prisma.$disconnect();
      process.exit(1);
    });
}
