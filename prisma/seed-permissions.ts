import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PERMISSIONS } from '../src/lib/permissions';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter, transactionOptions: { timeout: 30000, maxWait: 10000 } });

// Convert the PERMISSIONS object to the format needed for seeding
function getPermissionsArray() {
    const permissions: Array<{ name: string; description: string; type: string }> = [];

    // Add USER permissions
    Object.values(PERMISSIONS.USER).forEach((permission) => {
        permissions.push({
            name: permission.name,
            description: permission.description,
            type: 'USER',
        });
    });

    // Add CLINIC permissions
    Object.values(PERMISSIONS.CLINIC).forEach((permission) => {
        permissions.push({
            name: permission.name,
            description: permission.description,
            type: 'CLINIC',
        });
    });

    // Add ORGANIZATION permissions
    Object.values(PERMISSIONS.ORGANIZATION).forEach((permission) => {
        permissions.push({
            name: permission.name,
            description: permission.description,
            type: 'ORGANIZATION',
        });
    });

    return permissions;
}

async function seed() {
    try {
        console.log('Starting permission seeding...');

        const permissions = getPermissionsArray();
        let createdCount = 0;
        let skippedCount = 0;

        for (const permission of permissions) {
            const existing = await prisma.permission.findUnique({
                where: { name: permission.name },
            });

            if (existing) {
                console.log(`⏭️  Permission already exists: ${permission.name}`);
                skippedCount++;
            } else {
                const created = await prisma.permission.create({
                    data: permission,
                });
                console.log(`✅ Created permission: ${created.name}`);
                createdCount++;
            }
        }

        console.log(`\n📊 Seeding completed!`);
        console.log(`✅ Created: ${createdCount} permissions`);
        console.log(`⏭️  Skipped: ${skippedCount} permissions (already existed)`);
    } catch (error) {
        console.error('❌ Error seeding permissions:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

seed();
