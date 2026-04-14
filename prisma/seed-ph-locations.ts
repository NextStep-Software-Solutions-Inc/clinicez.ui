/**
 * Seed Philippine PSGC location data (PhRegion, PhProvince, PhMunicipality, PhBarangay).
 *
 * Idempotent — uses INSERT … ON CONFLICT (code) DO UPDATE so it is safe to re-run
 * after the tables already contain data (e.g. to pick up PSGC file updates).
 *
 * Usage:
 *   pnpm run seed:locations          # development (.env)
 *   pnpm run seed:locations:prod     # production  (.env.production.local)
 */
import 'dotenv/config';
import path from 'path';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ─── Types mirroring philippines-locations.json ───────────────────────────────

interface BarangayJson { code: string; name: string; }
interface CityJson     { code: string; name: string; isCapital?: boolean; barangays?: BarangayJson[]; }
interface ProvinceJson { code: string; name: string; cities?: CityJson[]; municipalities?: CityJson[]; }
interface RegionJson   { code: string; name: string; regionName: string; provinces: ProvinceJson[]; }

// ─── Chunk size ───────────────────────────────────────────────────────────────
// 1 000 rows × max 5 columns = 5 000 bind params — well under PostgreSQL's 65 535 limit.
const CHUNK_SIZE = 1000;

// ─── Raw-SQL upsert helpers ───────────────────────────────────────────────────

async function upsertRegions(records: { code: string; name: string; regionName: string }[]) {
    for (let i = 0; i < records.length; i += CHUNK_SIZE) {
        const chunk = records.slice(i, i + CHUNK_SIZE);
        const ph = chunk.map((_, j) => `($${j * 3 + 1}, $${j * 3 + 2}, $${j * 3 + 3})`).join(', ');
        const vals = chunk.flatMap((r) => [r.code, r.name, r.regionName]);
        await prisma.$executeRawUnsafe(
            `INSERT INTO "PhRegion" (code, name, "regionName")
             VALUES ${ph}
             ON CONFLICT (code) DO UPDATE SET
               name         = EXCLUDED.name,
               "regionName" = EXCLUDED."regionName",
               "updatedAt"  = NOW()`,
            ...vals,
        );
    }
}

async function upsertProvinces(records: { code: string; name: string; regionCode: string }[]) {
    for (let i = 0; i < records.length; i += CHUNK_SIZE) {
        const chunk = records.slice(i, i + CHUNK_SIZE);
        const ph = chunk.map((_, j) => `($${j * 3 + 1}, $${j * 3 + 2}, $${j * 3 + 3})`).join(', ');
        const vals = chunk.flatMap((p) => [p.code, p.name, p.regionCode]);
        await prisma.$executeRawUnsafe(
            `INSERT INTO "PhProvince" (code, name, "regionCode")
             VALUES ${ph}
             ON CONFLICT (code) DO UPDATE SET
               name         = EXCLUDED.name,
               "regionCode" = EXCLUDED."regionCode",
               "updatedAt"  = NOW()`,
            ...vals,
        );
    }
}

async function upsertMunicipalities(
    records: { code: string; name: string; provinceCode: string; isCity: boolean; isCapital: boolean }[],
) {
    for (let i = 0; i < records.length; i += CHUNK_SIZE) {
        const chunk = records.slice(i, i + CHUNK_SIZE);
        const ph = chunk
            .map((_, j) => `($${j * 5 + 1}, $${j * 5 + 2}, $${j * 5 + 3}, $${j * 5 + 4}, $${j * 5 + 5})`)
            .join(', ');
        const vals = chunk.flatMap((m) => [m.code, m.name, m.provinceCode, m.isCity, m.isCapital]);
        await prisma.$executeRawUnsafe(
            `INSERT INTO "PhMunicipality" (code, name, "provinceCode", "isCity", "isCapital")
             VALUES ${ph}
             ON CONFLICT (code) DO UPDATE SET
               name           = EXCLUDED.name,
               "provinceCode" = EXCLUDED."provinceCode",
               "isCity"       = EXCLUDED."isCity",
               "isCapital"    = EXCLUDED."isCapital",
               "updatedAt"    = NOW()`,
            ...vals,
        );
    }
}

async function upsertBarangays(records: { code: string; name: string; municipalityCode: string }[]) {
    for (let i = 0; i < records.length; i += CHUNK_SIZE) {
        const chunk = records.slice(i, i + CHUNK_SIZE);
        const ph = chunk.map((_, j) => `($${j * 3 + 1}, $${j * 3 + 2}, $${j * 3 + 3})`).join(', ');
        const vals = chunk.flatMap((b) => [b.code, b.name, b.municipalityCode]);
        await prisma.$executeRawUnsafe(
            `INSERT INTO "PhBarangay" (code, name, "municipalityCode")
             VALUES ${ph}
             ON CONFLICT (code) DO UPDATE SET
               name               = EXCLUDED.name,
               "municipalityCode" = EXCLUDED."municipalityCode",
               "updatedAt"        = NOW()`,
            ...vals,
        );
    }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function seed() {
    console.log('🌱 Starting Philippine location seeding…\n');

    const jsonPath = path.resolve(__dirname, '../src/data/philippines-locations.json');
    const raw = fs.readFileSync(jsonPath, 'utf-8');
    const { regions }: { regions: RegionJson[] } = JSON.parse(raw) as { regions: RegionJson[] };

    // ── Flatten ────────────────────────────────────────────────────────────

    const regionRecords     = regions.map((r) => ({ code: r.code, name: r.name, regionName: r.regionName }));
    const provinceRecords:  { code: string; name: string; regionCode: string }[] = [];
    const municipalityRecords: { code: string; name: string; provinceCode: string; isCity: boolean; isCapital: boolean }[] = [];
    const barangayRecords:  { code: string; name: string; municipalityCode: string }[] = [];

    for (const region of regions) {
        for (const province of region.provinces) {
            provinceRecords.push({ code: province.code, name: province.name, regionCode: region.code });

            const cityCodes = new Set((province.cities ?? []).map((c) => c.code));
            const allCities = [...(province.cities ?? []), ...(province.municipalities ?? [])];

            for (const city of allCities) {
                municipalityRecords.push({
                    code:         city.code,
                    name:         city.name,
                    provinceCode: province.code,
                    isCity:       cityCodes.has(city.code),
                    isCapital:    city.isCapital ?? false,
                });
                for (const barangay of city.barangays ?? []) {
                    barangayRecords.push({ code: barangay.code, name: barangay.name, municipalityCode: city.code });
                }
            }
        }
    }

    // ── Upsert in FK dependency order ──────────────────────────────────────

    console.log(`📍 Upserting ${regionRecords.length} regions…`);
    await upsertRegions(regionRecords);
    console.log(`✅ Regions done`);

    console.log(`📍 Upserting ${provinceRecords.length} provinces…`);
    await upsertProvinces(provinceRecords);
    console.log(`✅ Provinces done`);

    console.log(`📍 Upserting ${municipalityRecords.length} municipalities / cities…`);
    await upsertMunicipalities(municipalityRecords);
    console.log(`✅ Municipalities done`);

    console.log(`📍 Upserting ${barangayRecords.length} barangays…`);
    await upsertBarangays(barangayRecords);
    console.log(`✅ Barangays done`);

    console.log(`\n📊 Seeding completed!`);
    console.log(`   Regions:        ${regionRecords.length}`);
    console.log(`   Provinces:      ${provinceRecords.length}`);
    console.log(`   Municipalities: ${municipalityRecords.length}`);
    console.log(`   Barangays:      ${barangayRecords.length}`);
}

seed()
    .catch((err) => {
        console.error('❌ Seeding failed:', err);
        process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
