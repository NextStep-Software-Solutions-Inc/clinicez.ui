/* Seed PhilHealth Member Types (idempotent) */
/* eslint-disable */
require('dotenv').config();
const { PrismaClient, PhilHealthMemberCategory } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter, transactionOptions: { timeout: 30000, maxWait: 10000 } });

const DIRECT = PhilHealthMemberCategory.DIRECT;
const INDIRECT = PhilHealthMemberCategory.INDIRECT;

async function seed() {
  const before = await prisma.philHealthMemberType.count();
  await prisma.$transaction(async (tx) => {
    const directParent = await tx.philHealthMemberType.upsert({
      where: { name: 'Direct Contributor' },
      update: { category: DIRECT },
      create: { name: 'Direct Contributor', category: DIRECT }
    });
    const indirectParent = await tx.philHealthMemberType.upsert({
      where: { name: 'Indirect Contributor' },
      update: { category: INDIRECT },
      create: { name: 'Indirect Contributor', category: INDIRECT }
    });

    const directChildren = [
      'Employed Private',
      'Employed Government',
      'Professional Practitioner',
      'Self-Earning Individual',
      'Individual',
      'Sole Proprietor',
      'Group Enrollment Scheme',
      'Kasambahay',
      'Family Driver',
      'Migrant Worker - Land-Based',
      'Migrant Worker - Sea-Based',
      'Lifetime Member',
      'Filipinos with Dual Citizenship / Living Abroad',
      'Foreign National',
    ];
    const indirectChildren = [
      'Listahanan',
      '4Ps/MCCT',
      'Senior Citizen',
      'PAMANA',
      'KIA/KIPO',
      'Bangsamoro/Normalization',
      'LGU-sponsored',
      'NGA-sponsored',
      'Private-sponsored',
      'Person with Disability',
    ];

    for (const name of directChildren) {
      await tx.philHealthMemberType.upsert({
        where: { name },
        update: { parentId: directParent.id, category: DIRECT },
        create: { name, parentId: directParent.id, category: DIRECT }
      });
    }
    for (const name of indirectChildren) {
      await tx.philHealthMemberType.upsert({
        where: { name },
        update: { parentId: indirectParent.id, category: INDIRECT },
        create: { name, parentId: indirectParent.id, category: INDIRECT }
      });
    }
  });
  const after = await prisma.philHealthMemberType.count();
  console.log(`✅ PhilHealth member types seeded. Total: ${after} (added ${after - before} new)`);
}

seed()
  .catch(e => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
