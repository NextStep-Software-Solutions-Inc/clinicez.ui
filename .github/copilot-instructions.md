# GitHub Copilot Instructions for ClinicEZ.UI

## TypeScript & Code Quality

### ⚠️ CRITICAL: No `any` Types Allowed

**Never use `any` type in this codebase.**

For accurate typing:
1. ✅ **DO**: Always refer to [prisma/schema.prisma](prisma/schema.prisma) for data model definitions
2. ✅ **DO**: Generate types from Prisma schema using `npx prisma generate`
3. ✅ **DO**: Use explicit interfaces for component props, function parameters, and return types
4. ✅ **DO**: Leverage existing types from server actions and API responses

**Why?** 
- Prevents runtime errors and type-related bugs
- Makes code more maintainable and self-documenting
- Enables better IDE autocomplete and refactoring support
- Catches errors at compile-time instead of runtime

**Example:**
```tsx
// ❌ WRONG
const handleData = (data: any) => { ... }

// ✅ RIGHT - Use actual type from schema
import type { GetClinicPatients } from '@/actions/clinics/clinic-patient.action';
const handleData = (data: GetClinicPatients['data']) => { ... }
```

## Build & Compilation

### Fast Type-Checking Strategy

**Building takes significant time, so optimize the development workflow:**

1. ✅ **DO**: Run TypeScript compilation first to catch type errors quickly
   ```bash
   npx tsc --noEmit
   ```
2. ✅ **DO**: Fix type errors before running full build
3. ✅ **DO**: Use `npm run build` only when type checking passes

**Why?** 
- TypeScript compilation is 10x faster than full build
- Catches 90% of issues immediately
- Saves time during iterative development
- Full builds should be reserved for final testing/deployment

**Workflow:**
```bash
# Step 1: Quick type check
npx tsc --noEmit

# Step 2: Fix any type errors
# (edit files)

# Step 3: Full build only when types pass
npm run build
```

## Database Migration Guidelines

### ⚠️ CRITICAL: Never Modify Applied Migrations

**Applied migration files must NEVER be edited or deleted.**

When working with Prisma migrations:

1. ✅ **DO**: Create new migrations with `npx prisma migrate dev --name descriptive_name`
2. ✅ **DO**: Use idempotent SQL (IF NOT EXISTS, IF EXISTS) in migration files
3. ✅ **DO**: Test migrations thoroughly in development before production

4. ❌ **DON'T**: Edit files in `prisma/migrations/` that have been applied
5. ❌ **DON'T**: Delete migration files from the migrations directory
6. ❌ **DON'T**: Manually modify the `_prisma_migrations` table

**Why?** Prisma stores a SHA-256 checksum of each migration file in the `_prisma_migrations` table. When you modify an applied migration:
- The checksum won't match
- Prisma will report "migration modified after applied" errors
- `prisma migrate dev` will fail
- Deployment pipelines will break
- Database state becomes inconsistent

**If schema changes are needed:**
```bash
# Make changes in prisma/schema.prisma first
# Then generate a NEW migration
npx prisma migrate dev --name your_change_description
```

**If you accidentally modified an applied migration:**
1. Revert the changes to the migration file
2. If checksum errors persist, manually update checksums:
   ```bash
   # Calculate correct checksum
   node -e "const crypto = require('crypto'); const fs = require('fs'); const file = fs.readFileSync('prisma/migrations/MIGRATION_NAME/migration.sql', 'utf8'); console.log(crypto.createHash('sha256').update(file).digest('hex'));"
   
   # Update in database (DO THIS CAREFULLY)
   # UPDATE "_prisma_migrations" SET checksum = 'NEW_CHECKSUM' WHERE migration_name = 'MIGRATION_NAME';
   ```

## Schema Best Practices

### Nullable Fields for Non-Breaking Changes
When adding new fields to existing tables, make them nullable to avoid breaking existing data:
```prisma
model User {
  newField String?  // nullable - safe for existing records
}
```

### Indexing Strategy
Add indexes for fields used in WHERE clauses or JOINs:
```prisma
model User {
  caseNumber String?
  
  @@index([caseNumber])  // Add index for performance
}
```

### Avoid UNIQUE Constraints Initially
For fields that might need backfill or have complex generation logic, avoid UNIQUE constraints:
```prisma
caseNumber String?  // No @unique - allows flexibility
```

## Code Generation After Schema Changes

Always regenerate Prisma Client after schema changes:
```bash
npx prisma generate
```

In production deployments, this happens automatically during build, but verify locally.

## Relation Naming

Be consistent with Prisma's singular/plural conventions:
- One-to-one: singular (`HealthcareProvider`)
- One-to-many: plural (`HealthcareProviders`)

Update TypeScript types to match the actual schema relations.
