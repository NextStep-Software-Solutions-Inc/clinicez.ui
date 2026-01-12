# Migration Instructions for Medical Procedures Refactoring

## ⚠️ CRITICAL: Conflicting Migrations Removed

All conflicting migration files have been removed from this PR. You **MUST** generate the migration in your environment with database access.

## Why Migrations Were Removed

The previous migrations caused build failures because:
1. SequenceGenerator `year` column handling conflicted across multiple migrations
2. Migration order couldn't be controlled properly with mixed timestamp formats
3. Index names and foreign key constraints varied by environment
4. Schema drift between development and production databases

## Prerequisites

- Direct database access (dev, staging, or production)
- Prisma CLI available: `npx prisma version`
- Database credentials in `.env` file
- **BACKUP YOUR DATABASE** before proceeding

## Step-by-Step Migration Process

### 1. Pull Latest Code

```bash
git pull origin copilot/refactor-medical-procedure-tables
git status  # Verify you're on the correct branch
```

### 2. Generate Migration (Development/Staging First)

In your development or staging environment with database access:

```bash
npx prisma migrate dev --name refactor_procedures_and_add_heart_station
```

**What Prisma will do:**
- Introspect your current database schema
- Compare with `schema.prisma`
- Generate SQL migration file automatically
- Detect table renames (ImagingDiagnostic → ImagingProcedure, etc.)
- Create new tables in correct order with proper dependencies
- Apply migration immediately to your dev/staging database

### 3. Review Generated Migration

Check the generated file:
```
prisma/migrations/<timestamp>_refactor_procedures_and_add_heart_station/migration.sql
```

**Verify it includes:**
- ✅ Renames `ImagingDiagnostic` → `ImagingProcedure`
- ✅ Renames `LaboratoryDiagnostic` → `LaboratoryProcedure`  
- ✅ Renames junction tables with procedures
- ✅ Creates `HeartStationProcedure` table
- ✅ Creates `ClinicImagingProcedure` table
- ✅ Creates `ClinicLaboratoryProcedure` table
- ✅ Creates `ClinicHeartStationProcedure` table
- ✅ Creates `ProcedureUsageHistory` table
- ✅ Creates `ClinicHeartStationRequest` table
- ✅ Creates new junction tables
- ✅ Adds proper foreign keys and indexes

### 4. Test Migration in Dev/Staging

Verify your application still works:
- Existing imaging requests load correctly
- Existing laboratory requests load correctly  
- Can create new imaging requests with procedures
- Can create new laboratory requests with procedures

### 5. Commit Generated Migration

```bash
git add prisma/migrations/
git commit -m "Add Prisma-generated migration for procedures refactoring"
git push origin copilot/refactor-medical-procedure-tables
```

### 6. Deploy to Production

Once tested and committed, deploy to production:

```bash
npx prisma migrate deploy
```

This applies all pending migrations to production.

### 7. Seed Procedure Data

After migration succeeds, populate the procedure tables:

```bash
npx prisma db seed -- --procedures
```

This adds:
- **8 Imaging procedures**: X-RAY, MRI, CT, ULTRASOUND, FLUOROSCOPY, BREAST IMAGING, NUCLEAR MEDICINE, DENSITOMETRY
- **113 Laboratory procedures** across 7 categories:
  - HEMATOLOGY (CBC, Blood Typing, ESR, etc.)
  - CLINICAL MICROSCOPY (Urinalysis, Pregnancy Test, etc.)
  - MICROBIOLOGY (Cultures, GeneXpert, etc.)
  - COVID-19 TEST (Rapid Antigen, RT-PCR, etc.)
  - CARDIAC MARKERS (Troponin, D-DIMER, etc.)
  - BLOOD CHEMISTRY (FBS, Lipid Profile, HbA1c, etc.)
  - SEROLOGY (Anti-HCV, TSH, HIV, etc.)
- **19 Heart Station procedures**: ECG variants, Stress Tests, Echocardiograms, Duplex Scans

## Alternative: Create-Only Mode

If you want to review SQL before applying:

```bash
npx prisma migrate dev --name refactor_procedures_and_add_heart_station --create-only
```

This generates the migration file without applying it. Review, then apply with:

```bash
npx prisma migrate deploy
```

## Expected Migration Behavior

Prisma will automatically:
1. **Detect table renames** - Preserves all existing data
2. **Create new tables** - In dependency order (parent tables first)
3. **Add foreign keys** - Only after referenced tables exist  
4. **Create indexes** - Using your database's naming conventions
5. **Preserve data** - No data loss from existing requests

## Troubleshooting

### Migration fails with "table already exists"
```bash
npx prisma migrate status  # Check migration state
npx prisma migrate resolve --applied <migration-name>  # Mark as applied if already exists
```

### Migration fails with "column already exists"
Your database has drift. Options:
1. Use `npx prisma db pull` to sync schema with database
2. Review differences and update schema.prisma
3. Regenerate migration

### Foreign key constraint fails
- Check data integrity in existing tables
- Ensure referenced records exist before adding foreign keys
- Prisma should handle this automatically; if not, check for orphaned records

### Build fails on Vercel
Vercel will run `prisma migrate deploy` during build. Ensure:
- Migration is committed to git
- DATABASE_URL environment variable is set
- Database is accessible from Vercel

## Rollback Plan

If critical issues occur:

```bash
# Mark migration as rolled back
npx prisma migrate resolve --rolled-back <migration-name>

# Restore from database backup
# (You DID create a backup first, right?)
```

## Post-Migration Verification

Run these checks after migration:

```sql
-- Verify procedure counts
SELECT COUNT(*) FROM "ImagingProcedure";      -- Should be 8
SELECT COUNT(*) FROM "LaboratoryProcedure";   -- Should be 113  
SELECT COUNT(*) FROM "HeartStationProcedure"; -- Should be 19

-- Verify existing requests preserved
SELECT COUNT(*) FROM "ClinicImagingRequest";
SELECT COUNT(*) FROM "ClinicLaboratoryRequest";

-- Check junction tables created
SELECT COUNT(*) FROM "ClinicImagingRequestProcedure";
SELECT COUNT(*) FROM "ClinicLaboratoryRequestProcedure";
```

## Why This Approach is Better

✅ **Environment-aware**: Prisma sees your actual database state  
✅ **Handles drift**: Adapts to schema differences automatically  
✅ **Correct ordering**: Dependencies resolved automatically  
✅ **Proper naming**: Uses your database's index naming conventions  
✅ **Data preservation**: Prisma detects renames vs. drop+create  
✅ **Tested**: Prisma migrations are battle-tested across millions of apps

## Need Help?

Check Prisma migration status and logs:
```bash
npx prisma migrate status      # See pending migrations
npx prisma migrate resolve --help  # Migration management commands
npx prisma migrate diff        # Preview changes before migrating
```
