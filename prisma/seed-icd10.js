// Use CommonJS for broad Node compatibility when running `node prisma/seed-icd10.js`
const { PrismaClient } = require('../src/generated/prisma/client');

const prisma = new PrismaClient();

const DATA_URL = process.env.ICD10_JSON_URL
  || 'https://raw.githubusercontent.com/smog1210/2022-ICD-10-CM-JSON/refs/heads/main/icd10cm_codes_2022-2.json';

function isNonEmptyArray(value) {
  return Array.isArray(value) && value.length > 0;
}

function chunk(array, size) {
  const result = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

async function seedICD10() {
  console.log('Fetching ICD-10 data from:', DATA_URL);

  const response = await fetch(DATA_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch ICD-10 JSON: ${response.status} ${response.statusText}`);
  }
  const json = await response.json();

  if (!isNonEmptyArray(json)) {
    throw new Error('Unexpected ICD-10 data format: expected a non-empty array.');
  }

  // Inspect keys of first item for visibility
  const sampleKeys = Object.keys(json[0]);
  console.log('Sample keys in ICD-10 items:', sampleKeys);

  // Map to ImagingDiagnostic shape
  const mapped = json
    .filter((item) => item && typeof item.code === 'string' && item.code.trim().length > 0)
    .map(({ code, description }) => ({
      name: String(code),
      description: description ?? null,
      category: 'ICD-10',
      isActive: true,
    }));

  if (!isNonEmptyArray(mapped)) {
    console.log('No valid ICD-10 entries to insert. Exiting.');
    return { total: 0, inserted: 0 };
  }

  console.log(`Preparing to upsert ${mapped.length} ICD-10 entries into ImagingDiagnostic...`);

  // Batch inserts to avoid high memory/statement sizes
  const BATCH_SIZE = Number(process.env.SEED_BATCH_SIZE) || 1000;
  const batches = chunk(mapped, BATCH_SIZE);
  let totalInserted = 0;
  let batchIndex = 0;

  for (const batch of batches) {
    batchIndex += 1;
    const res = await prisma.imagingDiagnostic.createMany({
      data: batch,
      skipDuplicates: true, // relies on @@unique([name, category]) in schema
    });
    totalInserted += res.count || 0;
    console.log(`Batch ${batchIndex}/${batches.length} processed. Inserted: ${res.count}`);
  }

  return { total: mapped.length, inserted: totalInserted };
}

(async () => {
  try {
    const { total, inserted } = await seedICD10();
    console.log(`ICD-10 seeding complete. Total candidates: ${total}. Inserted (new): ${inserted}.`);
  } catch (error) {
    console.error('Error seeding ICD-10 codes:', error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
})();
