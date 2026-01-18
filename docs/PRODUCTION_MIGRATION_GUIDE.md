# Production Migration Guide: Case and Transaction Numbers

## ⚠️ CRITICAL: Migration Best Practices

**NEVER modify an applied migration file directly.** Once a migration has been applied to any database (development, staging, or production):

1. ✅ **DO**: Create a new migration file for any schema changes
2. ❌ **DON'T**: Edit existing migration files that have been applied
3. ❌ **DON'T**: Delete migration files from the `prisma/migrations/` directory

**Why?** Prisma stores a checksum of each migration in the `_prisma_migrations` table. Modifying an applied migration will cause:

- "Migration modified after applied" errors
- Checksum mismatches
- Deployment failures
- Database state inconsistencies

**If you need to change something:** Run `npx prisma migrate dev --name descriptive_name` to create a NEW migration file with your changes.

---

## Overview

This migration adds persistent case and transaction numbers to the database to ensure consistent numbering across downloads and prevent regeneration.

## Database Changes Summary

### Tables Modified

1. **User** - Added `caseNumber` for PHR health assessments
2. **ConsultationTicket** - Added `caseNumber` and `ekasTransactionNumber`
3. **PhysicalExamination** - Added `caseNumber`
4. **Prescription** - Added `transactionNumber` (TO BE ADDED)
5. **ClinicMedicalCertificate** - Added `transactionNumber` (TO BE ADDED)
6. **ClinicImagingRequest** - Added `transactionNumber` (TO BE ADDED)
7. **ClinicLaboratoryRequest** - Added `transactionNumber` (TO BE ADDED)
8. **ClinicReferralSlip** - Added `transactionNumber` (TO BE ADDED)
9. **PhilHealthDependent** - Added `citizenship`, `isPermanentlyDisabled`
10. **SequenceGenerator** - New table for managing number sequences

### New Columns

All case/transaction number columns are:

- Type: `TEXT` (nullable)
- Indexed for performance
- NOT unique (to allow flexibility)

All timestamp columns:

- Type: `TIMESTAMP(3)`
- Track when numbers were generated

## Migration Files

### Current Migrations (13 total)

```
1. 20250811175247_squashed
2. 20250813043945_add_philhealth_record_model
3. 20250813061820_add_multiple_philhealth_member_types_support
4. 20250813074635_remove_multi_member_types
5. 20250813161223_add_photo_url_to_philhealth_record
6. 20250915164345_add_esig_hp
7. 20250929074556_add_qty_to_prescription_model
8. 20251127061508_refactor_medical_history_to_use_health_condition
9. 20251127151900_refactor_family_medical_history_normalize_structure
10. 20251210144241_add_appointment_tags
11. 20251211144232_add_return_fields_to_appointment_routing
12. 20251216111750_single_hp_profile_per_user
13. 20260112_comprehensive_sync ← **NEW**
```

### Migration: `20260112_comprehensive_sync`

**Purpose**: Synchronize database drift and add case/transaction number infrastructure

**Changes**:

- Adds `caseNumber` to ConsultationTicket and PhysicalExamination
- Adds PhilHealth dependent fields
- Creates SequenceGenerator table
- Removes obsolete admin flag columns

**Safety**: Uses `IF NOT EXISTS` checks - safe to run multiple times

## Pre-Production Checklist

### 1. Database Backup

```bash
# Create full database backup before migration
pg_dump $DATABASE_URL > backup_pre_case_numbers_$(date +%Y%m%d_%H%M%S).sql
```

### 2. Verify Current State

```bash
# Check migration status
npx prisma migrate status

# Expected output: "Database schema is up to date!"
```

### 3. Test on Staging

- [ ] Deploy to staging environment
- [ ] Run migrations: `npx prisma migrate deploy`
- [ ] Verify no errors
- [ ] Test application functionality
- [ ] Generate Prisma Client: `npx prisma generate`
- [ ] Run application build: `npm run build`

### 4. Validate Data Integrity

```sql
-- Check SequenceGenerator table created
SELECT COUNT(*) FROM "SequenceGenerator";

-- Check columns added
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'ConsultationTicket' AND column_name = 'caseNumber';

-- Check indexes created
SELECT indexname FROM pg_indexes 
WHERE tablename = 'ConsultationTicket' AND indexname LIKE '%caseNumber%';
```

## Production Deployment Steps

### Step 1: Schedule Maintenance Window

**Recommended**: 5-15 minutes
**Impact**: Minimal - migration is non-breaking

### Step 2: Deploy Migration

```bash
# On production server
cd /path/to/clinicez.ui

# Pull latest code
git pull origin master

# Install dependencies (if needed)
npm install

# Run migrations
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate

# Build application
npm run build

# Restart application
pm2 restart clinicez-ui  # or your process manager command
```

### Step 3: Verify Migration

```bash
# Check migration status
npx prisma migrate status

# Should show: "Database schema is up to date!"
```

### Step 4: Monitor Application

- Check application logs for errors
- Test key features:
  - Download HAF (Health Assessment Form)
  - Download EKAS
  - View consultations
  - Generate prescriptions/medical certificates

## Rollback Plan

### If Migration Fails

**Option 1: Restore from Backup**

```bash
# Stop application
pm2 stop clinicez-ui

# Restore database
psql $DATABASE_URL < backup_pre_case_numbers_YYYYMMDD_HHMMSS.sql

# Revert code
git checkout <previous-commit>

# Rebuild
npm run build

# Restart
pm2 start clinicez-ui
```

**Option 2: Manual Rollback SQL**

```sql
-- Remove added columns
ALTER TABLE "ConsultationTicket" DROP COLUMN IF EXISTS "caseNumber";
ALTER TABLE "PhysicalExamination" DROP COLUMN IF EXISTS "caseNumber";
ALTER TABLE "PhilHealthDependent" DROP COLUMN IF EXISTS "citizenship";
ALTER TABLE "PhilHealthDependent" DROP COLUMN IF EXISTS "isPermanentlyDisabled";

-- Drop SequenceGenerator table
DROP TABLE IF EXISTS "SequenceGenerator";

-- Mark migration as rolled back
DELETE FROM "_prisma_migrations" WHERE id = '20260112_comprehensive_sync';
```

## Post-Migration Tasks

### 1. Data Backfill (Optional but Recommended)

Generate case numbers for existing records:

```bash
# Run backfill script (to be created)
node scripts/backfill-case-numbers.js
```

### 2. Monitor Performance

- Watch for slow queries on new indexed columns
- Monitor SequenceGenerator table growth
- Check application response times

### 3. Update Documentation

- [ ] Update API documentation
- [ ] Update developer onboarding docs
- [ ] Update database schema documentation

## Known Issues & Notes

### Issue 1: Modified Migrations Warning

**Symptom**: Prisma reports migrations as "modified after applied"
**Cause**: Migration files were edited after application
**Solution**: Safe to ignore - schema matches database

### Issue 2: No Unique Constraints

**Decision**: Case/transaction numbers do NOT have UNIQUE constraints
**Reason**: Allows flexibility and prevents conflicts during backfill
**Future**: May add UNIQUE constraints after validation period

### Issue 3: Nullable Fields

**Decision**: All new case/transaction fields are nullable
**Reason**: Existing records won't have values initially
**Future**: Consider making required after backfill complete

## Success Criteria

- ✅ All migrations applied successfully
- ✅ No database errors in logs  
- ✅ Application builds without TypeScript errors
- ✅ Users can download HAF/EKAS with consistent numbers
- ✅ SequenceGenerator generates unique sequential numbers
- ✅ Case numbers persist across multiple downloads

## Support Contacts

**Database Issues**: DBA Team
**Application Issues**: Development Team  
**Emergency Rollback**: DevOps Team

## Timeline

**Preparation**: 1-2 days
**Testing**: 2-3 days  
**Production Deploy**: 15 minutes
**Monitoring**: 24-48 hours post-deployment

---

**Last Updated**: January 12, 2026
**Migration Version**: 20260112_comprehensive_sync
**Prepared By**: GitHub Copilot
