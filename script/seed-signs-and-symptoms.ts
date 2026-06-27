import 'dotenv/config';
import prisma from "../src/lib/prisma";

const data = [
  { code: "01", description: "ALTERED MENTAL SENSORIUM", isActive: true },
  { code: "02", description: "ABDOMINAL CRAMP/PAIN", isActive: true },
  { code: "03", description: "ANOREXIA", isActive: true },
  { code: "04", description: "BLEEDING GUMS", isActive: true },
  { code: "05", description: "BODY WEAKNESS", isActive: true },
  { code: "06", description: "BLURRING OF VISION", isActive: true },
  { code: "07", description: "CONSTIPATION", isActive: true },
  { code: "08", description: "CHEST PAIN/DISCOMFORT", isActive: true },
  { code: "09", description: "COUGH", isActive: true },
  { code: "10", description: "DIARRHEA", isActive: true },
  { code: "11", description: "DIZZINESS", isActive: true },
  { code: "12", description: "DYSPHAGIA", isActive: true },
  { code: "13", description: "DYSPNEA", isActive: true },
  { code: "14", description: "DYSURIA", isActive: true },
  { code: "15", description: "EPISTAXIS", isActive: true },
  { code: "16", description: "FLANK OR LOWER BACK", isActive: false },
  { code: "17", description: "FREQUENCY OF URINATION", isActive: true },
  { code: "18", description: "HEADACHE", isActive: true },
  { code: "19", description: "HEMATEMESIS", isActive: true },
  { code: "20", description: "HEMATURIA", isActive: true },
  { code: "21", description: "HEMOPTYSIS", isActive: true },
  { code: "22", description: "IRRITABILITY", isActive: true },
  { code: "23", description: "JAUNDICE", isActive: true },
  { code: "24", description: "LEG CRAMPS OR PAIN", isActive: false },
  { code: "25", description: "LOWER EXTREMITY EDEMA", isActive: true },
  { code: "26", description: "MYALGIA", isActive: true },
  { code: "27", description: "ORTHOPNEA", isActive: true },
  { code: "28", description: "PALPITATIONS", isActive: true },
  { code: "29", description: "SKIN RASHES", isActive: true },
  { code: "30", description: "STOOL, BLOODY/BLACK TARRY/MUCOID", isActive: true },
  { code: "31", description: "SKIN RASHES", isActive: false },
  { code: "32", description: "SWEATING", isActive: true },
  { code: "33", description: "SEIZURES", isActive: true },
  { code: "34", description: "URGENCY", isActive: true },
  { code: "35", description: "VOMITING/NAUSEA", isActive: true },
  { code: "36", description: "WEIGHT LOSS", isActive: true },
  { code: "37", description: "FEVER", isActive: true },
  { code: "38", description: "PAIN", isActive: true },
  { code: "X", description: "OTHERS", isActive: true },
];

async function main() {
  console.log("Seeding PhilHealth Signs and Symptoms...");
  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    await prisma.konsultaSignAndSymptom.upsert({
      where: { code: item.code },
      update: {
        description: item.description,
        isActive: item.isActive,
        sortOrder: i + 1,
      },
      create: {
        code: item.code,
        description: item.description,
        isActive: item.isActive,
        sortOrder: i + 1,
      },
    });
  }
  console.log("Seeding completed successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
