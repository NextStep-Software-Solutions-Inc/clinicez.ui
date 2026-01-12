# PHR Case Number Implementation ✅

## Overview

Each PHR (Personal Health Record = User record) now has its own persistent health assessment case number that remains consistent across all health assessment form generations.

## Changes Made

### 1. Database Schema - User Model ✅

**File**: `prisma/schema.prisma`

Added health assessment case number storage to the `User` model:

```prisma
model User {
  id                                        Int       @id @default(autoincrement())
  userId                                    String    @unique
  email                                     String    @unique
  // ... existing fields ...
  
  // NEW FIELDS FOR PHR CASE NUMBER
  healthAssessmentCaseNumber                String?   @unique
  healthAssessmentCaseNumberGeneratedAt     DateTime?
  
  // ... relations ...
  
  @@index([healthAssessmentCaseNumber])  // For fast lookups
}
```

**Why User Model?**

- `User` = PHR (Personal Health Record)
- Each person has ONE PHR
- Each PHR should have ONE consistent case number for all health assessments
- The case number is tied to the person, not individual physical examinations

### 2. Download HAF Action ✅

**File**: `src/actions/phr/download-haf.action.ts`

**Updated Query** to fetch PHR case number:

```typescript
const phr = await prisma.user.findFirst({
  where: { userId, isActive: true, deletedAt: null },
  select: {
    id: true,  // Need for updating
    firstName: true,
    // ... other fields ...
    healthAssessmentCaseNumber: true,  // NEW: Fetch existing case number
    // ... relations ...
  }
});
```

**Simplified Case Number Generation**:

```typescript
// Get case number for this PHR (lazy generation: generate once, store, reuse)
// Each User (PHR) has its own unique health assessment case number
let caseNumber: string | null = phr.healthAssessmentCaseNumber;

// If not yet assigned, generate once and store it on the User record
if (!caseNumber) {
  caseNumber = await generateTimestampCaseNumber("HEALTH_ASSESSMENT");

  // Store it in the User (PHR) record for future use
  try {
    await prisma.user.update({
      where: { id: phr.id },
      data: {
        healthAssessmentCaseNumber: caseNumber,
        healthAssessmentCaseNumberGeneratedAt: new Date()
      }
    });
  } catch (error) {
    // If update fails, still use the generated number
    console.warn("Failed to store health assessment case number on User, but continuing:", error);
  }
}
```

## Architecture

### Before (REMOVED)

```
PhysicalExamination has caseNumber
  ↓
Problem: Multiple physical exams = potentially different numbers
Problem: What if no physical exam exists yet?
Problem: Case number tied to exam, not the person
```

### After (NEW) ✅

```
User (PHR) has healthAssessmentCaseNumber
  ↓
Solution: ONE case number per person/PHR
Solution: Works even without physical exams
Solution: Case number belongs to the person
```

## Data Flow

### First Download

```
1. User requests health assessment form
     ↓
2. Check User.healthAssessmentCaseNumber → null
     ↓
3. Generate: "HAF-20260112-00015"
     ↓
4. Store in User.healthAssessmentCaseNumber ✅
     ↓
5. Use in PDF: "HAF-20260112-00015"
```

### Subsequent Downloads

```
1. User requests health assessment form again
     ↓
2. Check User.healthAssessmentCaseNumber → "HAF-20260112-00015"
     ↓
3. NO GENERATION - Use existing ✅
     ↓
4. Use in PDF: "HAF-20260112-00015" ✅ SAME!
```

## Benefits

✅ **PHR-Centric**: Case number belongs to the person (User/PHR), not sub-records
✅ **Persistent**: One number per person, forever
✅ **Consistent**: All health assessment downloads show same number
✅ **Simple**: No complex queries across multiple tables
✅ **Reliable**: Works even if no physical examination exists yet
✅ **Audit Trail**: `healthAssessmentCaseNumberGeneratedAt` tracks when assigned
✅ **Unique Constraint**: `@unique` prevents duplicate numbers
✅ **Indexed**: Fast lookups for reporting/searching

## Comparison: Consultation vs Health Assessment

### Consultation Case Numbers

- Stored in: `ConsultationTicket` model
- Reason: Consultations are clinic-specific events
- One number per consultation ticket

### Health Assessment Case Numbers

- Stored in: `User` model (PHR)
- Reason: Health assessments are personal, not clinic-specific
- One number per person/PHR

This design reflects the different nature of these documents:

- **Consultations** = Clinical encounters (may have many)
- **Health Assessments** = Personal health record (one per person)

## Migration Required

When database is accessible, run:

```bash
npx prisma migrate dev --name add_phr_health_assessment_case_number
```

This will:

1. Add `healthAssessmentCaseNumber` column to `user` table
2. Add `healthAssessmentCaseNumberGeneratedAt` column to `user` table
3. Create unique constraint on `healthAssessmentCaseNumber`
4. Create index for performance

## Backfill Existing Records

Optional script to assign case numbers to existing users:

```typescript
// scripts/backfill-phr-case-numbers.ts
import prisma from "@/lib/prisma";
import { generateTimestampCaseNumber } from "@/services/sequence-generator.service";

async function backfillPHRCaseNumbers() {
  // Get all users without health assessment case numbers
  const users = await prisma.user.findMany({
    where: { 
      healthAssessmentCaseNumber: null,
      isActive: true,
      deletedAt: null
    },
    orderBy: { createdAt: "asc" }
  });

  console.log(`Found ${users.length} users without case numbers`);

  for (const user of users) {
    const caseNumber = await generateTimestampCaseNumber(
      "HEALTH_ASSESSMENT",
      undefined,
      { createdAt: user.createdAt }  // Use original creation date
    );

    await prisma.user.update({
      where: { id: user.id },
      data: {
        healthAssessmentCaseNumber: caseNumber,
        healthAssessmentCaseNumberGeneratedAt: user.createdAt
      }
    });

    console.log(`✓ User ${user.userId}: ${caseNumber}`);
  }

  console.log("Backfill complete!");
}

backfillPHRCaseNumbers().catch(console.error);
```

Run with:

```bash
npx tsx scripts/backfill-phr-case-numbers.ts
```

## Testing Checklist

- [ ] Database migration runs successfully
- [ ] Download health assessment for user without case number → generates and stores
- [ ] Download health assessment again for same user → uses stored number (same)
- [ ] Verify `healthAssessmentCaseNumber` is unique in database
- [ ] Verify `healthAssessmentCaseNumberGeneratedAt` is set correctly
- [ ] Run backfill script (if needed)
- [ ] Deploy to production

## Example Case Numbers

### Format

`HAF-YYYYMMDD-XXXXX`

Example:

- `HAF-20260112-00001` - First health assessment on Jan 12, 2026
- `HAF-20260112-00002` - Second health assessment on Jan 12, 2026
- `HAF-20260113-00001` - First health assessment on Jan 13, 2026 (resets daily)

### Number Sequence

- Resets daily at midnight
- 5-digit counter: 00001-99999
- Each User gets ONE number, reused forever

## Files Modified

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Added `healthAssessmentCaseNumber` & `healthAssessmentCaseNumberGeneratedAt` to User model |
| `src/actions/phr/download-haf.action.ts` | Updated to use User's case number instead of PhysicalExamination |

## Build Status

✅ **Build Successful** - All TypeScript compiled correctly
✅ **No Breaking Changes** - Existing functionality preserved
✅ **Ready for Migration**

## Summary

**Problem Solved**: Health assessment forms now have consistent case numbers that belong to the person (PHR), not individual examinations.

**Key Insight**: Each PHR (User) knows its own health assessment case number, making the system more intuitive and reliable.

**Next Step**: Run database migration when connection is available.

---

**Implementation Date**: January 12, 2026
**Status**: ✅ Complete - Ready for Migration
