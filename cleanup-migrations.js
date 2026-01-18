const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function cleanupMigrations() {
  try {
    // Get all migrations from the database
    const dbMigrations = await prisma.$queryRaw`
      SELECT migration_name FROM "_prisma_migrations"
      ORDER BY migration_name;
    `;

    console.log(`Found ${dbMigrations.length} migrations in database`);

    // Get all local migration directories
    const migrationsDir = path.join(__dirname, 'prisma', 'migrations');
    const localMigrations = fs.readdirSync(migrationsDir)
      .filter(name => name.match(/^\d{14}_/))
      .filter(name => {
        const migrationFile = path.join(migrationsDir, name, 'migration.sql');
        return fs.existsSync(migrationFile);
      });

    console.log(`Found ${localMigrations.length} local migration files`);

    // Find migrations in DB that don't have local files
    const migrationsToDelete = [];
    for (const dbMigration of dbMigrations) {
      const migrationName = dbMigration.migration_name;
      if (!localMigrations.includes(migrationName)) {
        migrationsToDelete.push(migrationName);
      }
    }

    if (migrationsToDelete.length === 0) {
      console.log('✅ No orphaned migrations found. Database is in sync with local files.');
      return;
    }

    console.log(`\n⚠️  Found ${migrationsToDelete.length} orphaned migrations in database:`);
    migrationsToDelete.forEach(name => console.log(`  - ${name}`));

    // Delete orphaned migrations from database
    console.log('\n🗑️  Deleting orphaned migrations from database...');
    for (const migrationName of migrationsToDelete) {
      await prisma.$executeRaw`
        DELETE FROM "_prisma_migrations"
        WHERE migration_name = ${migrationName};
      `;
      console.log(`  ✓ Deleted: ${migrationName}`);
    }

    console.log('\n✅ Successfully cleaned up migration history!');
    console.log('\nYou can now run: npx prisma migrate dev --name refactor_diagnostics_to_procedures');

  } catch (error) {
    console.error('❌ Error cleaning up migrations:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupMigrations();
