-- Production Migration Verification Script
-- Run this after migration to verify everything is correct

-- 1. Check migration status
SELECT 
    id as migration_name,
    finished_at,
    rolled_back_at IS NOT NULL as is_rolled_back
FROM "_prisma_migrations"
ORDER BY finished_at DESC
LIMIT 15;

-- 2. Verify SequenceGenerator table exists and structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'SequenceGenerator'
ORDER BY ordinal_position;

-- 3. Verify case number columns added
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE column_name IN ('caseNumber', 'ekasTransactionNumber', 'ekasAuthorizationCode')
ORDER BY table_name, column_name;

-- 4. Verify indexes created
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE indexname LIKE '%case%' OR indexname LIKE '%transaction%'
ORDER BY tablename, indexname;

-- 5. Check PhilHealthDependent new columns
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'PhilHealthDependent'
AND column_name IN ('citizenship', 'isPermanentlyDisabled')
ORDER BY column_name;

-- 6. Sample existing data (should have NULL case numbers initially)
SELECT 
    COUNT(*) as total_consultations,
    COUNT(\"caseNumber\") as with_case_number,
    COUNT(*) - COUNT(\"caseNumber\") as without_case_number
FROM "ConsultationTicket";

SELECT 
    COUNT(*) as total_physical_exams,
    COUNT(\"caseNumber\") as with_case_number,
    COUNT(*) - COUNT(\"caseNumber\") as without_case_number
FROM "PhysicalExamination";

-- 7. Check SequenceGenerator initial state
SELECT 
    id,
    \"entityType\",
    \"clinicId\",
    year,
    \"currentValue\",
    \"createdAt\"
FROM "SequenceGenerator"
ORDER BY \"createdAt\" DESC
LIMIT 10;

-- 8. Verify foreign key constraints
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'SequenceGenerator';

-- 9. Check for any errors or warnings
SELECT 
    schemaname,
    tablename,
    last_vacuum,
    last_autovacuum,
    last_analyze,
    last_autoanalyze
FROM pg_stat_user_tables
WHERE tablename IN ('ConsultationTicket', 'PhysicalExamination', 'SequenceGenerator', 'User')
ORDER BY tablename;

-- 10. Verify removed columns are gone
SELECT 
    table_name,
    column_name
FROM information_schema.columns
WHERE column_name IN ('isSuperAdmin', 'isSystemAdmin', 'forTaggedOnly')
AND table_schema = 'public';
-- Expected: 0 rows (columns should be removed)

-- Success Criteria:
-- ✅ SequenceGenerator table exists with 8 columns
-- ✅ caseNumber exists in ConsultationTicket, PhysicalExamination, User  
-- ✅ ekasTransactionNumber exists in ConsultationTicket
-- ✅ Indexes created on all case/transaction number columns
-- ✅ citizenship and isPermanentlyDisabled exist in PhilHealthDependent
-- ✅ SequenceGenerator foreign key to Clinic exists
-- ✅ Old admin flag columns are removed (0 rows in query 10)
-- ✅ No rolled back migrations
