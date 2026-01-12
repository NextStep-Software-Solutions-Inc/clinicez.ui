# Production Deployment Checklist

## Pre-Deployment (1-2 days before)

### Database Preparation

- [ ] Create full database backup
- [ ] Verify backup is restorable
- [ ] Document current migration status
- [ ] Test migration on staging environment
- [ ] Verify all 13 migrations are applied on production

### Code Preparation  

- [ ] Ensure `copilot/add-super-admin-console-features` branch is merged to master
- [ ] All tests pass
- [ ] Build succeeds locally
- [ ] TypeScript compilation has no errors
- [ ] Prisma Client generates successfully

### Documentation

- [ ] Review PRODUCTION_MIGRATION_GUIDE.md
- [ ] Prepare rollback procedure
- [ ] Notify team of deployment window
- [ ] Have DBA on standby

## Deployment Day

### Pre-Deployment (15 mins before)

- [ ] Announce maintenance window to users
- [ ] Set application to maintenance mode (if applicable)
- [ ] Take final database snapshot
- [ ] Document current application version

### Deployment Steps (15 minutes)

**Step 1: Stop Application**

```bash
pm2 stop clinicez-ui  # or equivalent
```

**Status**: [ ] Complete

**Step 2: Pull Latest Code**

```bash
cd /path/to/clinicez.ui
git fetch origin
git checkout master
git pull origin master
```

**Status**: [ ] Complete

**Step 3: Install Dependencies**

```bash
npm install
# or
pnpm install
```

**Status**: [ ] Complete

**Step 4: Run Database Migration**

```bash
npx prisma migrate deploy
```

**Expected Output**: "All migrations have been successfully applied"
**Status**: [ ] Complete

**Step 5: Generate Prisma Client**

```bash
npx prisma generate
```

**Status**: [ ] Complete

**Step 6: Build Application**

```bash
npm run build
```

**Status**: [ ] Complete

**Step 7: Verify Migration**

```bash
npx prisma migrate status
```

**Expected**: "Database schema is up to date!"
**Status**: [ ] Complete

**Step 8: Start Application**

```bash
pm2 start clinicez-ui  # or equivalent
```

**Status**: [ ] Complete

### Post-Deployment Verification (30 minutes)

#### Application Health

- [ ] Application starts without errors
- [ ] Homepage loads correctly
- [ ] User authentication works
- [ ] No 500 errors in logs

#### Database Verification

- [ ] Run verification queries:

```sql
-- Verify SequenceGenerator table exists
SELECT COUNT(*) FROM "SequenceGenerator";

-- Verify caseNumber columns exist
SELECT column_name FROM information_schema.columns 
WHERE table_name IN ('ConsultationTicket', 'PhysicalExamination', 'User')
AND column_name = 'caseNumber';

-- Verify indexes created
SELECT indexname FROM pg_indexes 
WHERE tablename IN ('ConsultationTicket', 'PhysicalExamination')
AND indexname LIKE '%caseNumber%';
```

- [ ] All expected columns present
- [ ] All indexes created
- [ ] No orphaned data

#### Feature Testing

- [ ] Download Health Assessment Form (HAF)
  - First download generates case number
  - Second download reuses same case number
  - Case number persists in database
  
- [ ] Download EKAS form
  - Transaction number generated
  - Transaction number persists
  - Authorization code saved
  
- [ ] View consultation details
  - Case number displays correctly
  - No errors fetching data

- [ ] Create new consultation
  - Application functions normally
  - Data saves correctly

- [ ] Generate prescription (if applicable)
  - Transaction number field ready for future use
  - No errors

#### Performance Check

- [ ] Response times normal (<2s for typical requests)
- [ ] Database query performance acceptable
- [ ] No slow query warnings
- [ ] Memory usage stable

## Post-Deployment (24-48 hours)

### Monitoring

- [ ] Monitor error logs for 24 hours
- [ ] Check database query performance
- [ ] Monitor user feedback/complaints
- [ ] Watch for case number generation issues
- [ ] Verify SequenceGenerator table growth is reasonable

### Data Validation

- [ ] Sample 10-20 records with case numbers
- [ ] Verify numbers are unique and sequential  
- [ ] Check no duplicate case numbers
- [ ] Verify timestamps are accurate

### Optional: Backfill Existing Data

- [ ] Review existing records without case numbers
- [ ] Run backfill script (when ready)
- [ ] Verify backfill completed successfully
- [ ] Update statistics

## Rollback Procedure (If Needed)

### Immediate Rollback

If critical issues detected within first hour:

1. **Stop Application**

   ```bash
   pm2 stop clinicez-ui
   ```

2. **Restore Database**

   ```bash
   psql $DATABASE_URL < backup_pre_migration_YYYYMMDD_HHMMSS.sql
   ```

3. **Revert Code**

   ```bash
   git checkout <previous-release-tag>
   npm install
   npm run build
   ```

4. **Restart Application**

   ```bash
   pm2 start clinicez-ui
   ```

5. **Notify Team**
   - Inform stakeholders of rollback
   - Document issues encountered
   - Schedule post-mortem

### Status**: [ ] Rollback Ready (procedures documented)

## Success Criteria

Deployment is successful when ALL of the following are true:

- ✅ All migrations applied without errors
- ✅ Application builds and starts successfully
- ✅ No errors in application logs  
- ✅ Users can access the application
- ✅ HAF downloads generate consistent case numbers
- ✅ EKAS downloads generate consistent transaction numbers
- ✅ Case/transaction numbers persist in database
- ✅ SequenceGenerator table functions correctly
- ✅ No performance degradation
- ✅ No data loss or corruption

## Sign-Off

**Deployed By**: ___________________ **Date/Time**: ___________________

**Verified By**: ___________________ **Date/Time**: ___________________

**DBA Approval**: ___________________ **Date/Time**: ___________________

**Final Status**: [ ] Success  [ ] Partial Success  [ ] Rollback Required

**Notes/Issues**:
___________________________________________________________________
___________________________________________________________________
___________________________________________________________________

---

**Deployment Version**: master @ commit _______________
**Migration**: 20260112_comprehensive_sync
**Deployment Date**: _________________
