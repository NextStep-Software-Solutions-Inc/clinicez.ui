# Case Number Storage - Implementation Guide

## Overview

Current implementation generates fresh numbers every time. We need to store them on first generation and reuse them forever.

---

## Step 1: Update Prisma Schema

**File**: `prisma/schema.prisma`

```prisma
model ConsultationTicket {
  id                        Int                        @id @default(autoincrement())
  appointmentId             Int?
  clinicId                  Int
  subject                   String?
  isActive                  Boolean                    @default(true)
  isArchived                Boolean                    @default(false)
  deletedAt                 DateTime?
  
  // ✅ ADD THESE TWO FIELDS:
  caseNumber                String?                    @unique      // Unique case number (CONS-20260112-00001)
  caseNumberGeneratedAt     DateTime?                  // When case number was assigned

  // ... existing relations ...
  createdAt                 DateTime                   @default(now())
  updatedAt                 DateTime                   @updatedAt

  @@unique([caseNumber])  // Ensure no duplicates
  @@index([caseNumber])   // Fast lookup by case number
}

model HealthAssessment {
  id                        Int                        @id @default(autoincrement())
  userId                    Int
  
  // ✅ ADD THESE TWO FIELDS:
  caseNumber                String?                    @unique      // Unique case number (HAFT-20260112-00001)
  caseNumberGeneratedAt     DateTime?                  // When case number was assigned

  // ... existing fields and relations ...
  createdAt                 DateTime                   @default(now())
  updatedAt                 DateTime                   @updatedAt

  @@unique([caseNumber])
  @@index([caseNumber])
}
```

**Migration Command**:

```bash
npx prisma migrate dev --name add_case_number_storage
```

---

## Step 2: Update Download Consultation Action

**File**: `src/actions/phr/download-consultation.action.ts`

Current code (Line 147):

```typescript
// ❌ WRONG - generates fresh every time
const caseNumber = consultation ? await generateTimestampCaseNumber("CONSULTATION", consultation.clinicId) : null;
```

**Updated code**:

```typescript
"use server"

import { withErrorHandling } from "@/lib/with-error-handling";
import { generatePdf, PdfCheckboxMapping, PdfRadioMapping, PdfTextMapping } from "./utils/philhealth-pdf";
import { generateTimestampCaseNumber } from "@/services/sequence-generator.service";
import prisma from "@/lib/prisma";
// ... other imports ...

export const downloadConsultationAction = withErrorHandling(async (userId?: string, consultationTicketId?: number) => {
  if (!userId) throw new Error("User ID is required to generate Consultation Form");

  // ... existing code to fetch user and consultation ...

  // ✅ NEW: Get case number (storage logic)
  let caseNumber: string | null = null;
  
  if (consultation) {
    // Check if number already exists
    caseNumber = consultation.caseNumber;
    
    // If not, generate once and store
    if (!caseNumber) {
      caseNumber = await generateTimestampCaseNumber(
        "CONSULTATION",
        consultation.clinicId
      );
      
      // Store it in database
      await prisma.consultationTicket.update({
        where: { id: consultation.id },
        data: {
          caseNumber,
          caseNumberGeneratedAt: new Date()
        }
      });
    }
  }

  // Rest of the function stays the same...
  // Use caseNumber in PDF mappings
  const texts: PdfTextMapping[] = [
    { field: "caseNumber", value: caseNumber || "" },
    // ... other fields ...
  ];

  // ... rest of implementation ...
});
```

---

## Step 3: Update Download HAF Action

**File**: `src/actions/phr/download-haf.action.ts`

Current code (Line 106):

```typescript
// ❌ WRONG - generates fresh every time
const caseNumber = await generateTimestampCaseNumber("HEALTH_ASSESSMENT");
```

**Updated code**:

```typescript
"use server"

import { generateTimestampCaseNumber } from "@/services/sequence-generator.service";
import prisma from "@/lib/prisma";
// ... other imports ...

export const downloadHAFAction = withErrorHandling(async (userId: string, healthAssessmentId?: number) => {
  // ... existing code to fetch user ...

  // ✅ NEW: Get case number (storage logic)
  let caseNumber: string | null = null;
  
  if (healthAssessmentId) {
    // Fetch the health assessment
    const healthAssessment = await prisma.healthAssessment.findUnique({
      where: { id: healthAssessmentId }
    });
    
    if (healthAssessment) {
      // Check if number already exists
      caseNumber = healthAssessment.caseNumber;
      
      // If not, generate once and store
      if (!caseNumber) {
        caseNumber = await generateTimestampCaseNumber("HEALTH_ASSESSMENT");
        
        // Store it in database
        await prisma.healthAssessment.update({
          where: { id: healthAssessmentId },
          data: {
            caseNumber,
            caseNumberGeneratedAt: new Date()
          }
        });
      }
    }
  } else {
    // No specific assessment, generate new number for this session
    caseNumber = await generateTimestampCaseNumber("HEALTH_ASSESSMENT");
  }

  // Rest of the function stays the same...
  // Use caseNumber in PDF mappings
  const textMappings = [
    { field: "caseNumber", value: caseNumber || "" },
    // ... other fields ...
  ];

  // ... rest of implementation ...
});
```

---

## Step 4: Update Download EKAS Action

**File**: `src/actions/phr/download-ekas.action.ts`

Current code (Line 54):

```typescript
// ❌ WRONG - generates fresh every time
finalCaseNumber = await generateTimestampCaseNumber("HEALTH_ASSESSMENT", clinicId || undefined);
```

**Updated code**:

```typescript
"use server"

import { generateTimestampCaseNumber } from "@/services/sequence-generator.service";
import prisma from "@/lib/prisma";
// ... other imports ...

export const downloadEKASAction = withErrorHandling(async (
  userId: string,
  consultationTicketId?: number | null,
  clinicId?: number | null
) => {
  // ... existing code ...

  // ✅ NEW: Get case number (storage logic)
  let finalCaseNumber: string | null = null;
  let consultationTicket = null;

  if (consultationTicketId) {
    consultationTicket = await prisma.consultationTicket.findUnique({
      where: { id: consultationTicketId },
      select: { clinicId: true, caseNumber: true }  // ← Fetch caseNumber
    });
    
    if (consultationTicket) {
      // Use consultation's case number if it has one
      finalCaseNumber = consultationTicket.caseNumber || null;
      
      // Use clinic from consultation if not provided
      if (!clinicId && consultationTicket.clinicId) {
        clinicId = consultationTicket.clinicId;
      }
    }
  }

  // If no case number yet, generate one
  if (!finalCaseNumber) {
    finalCaseNumber = await generateTimestampCaseNumber(
      "HEALTH_ASSESSMENT",
      clinicId || undefined
    );
    
    // If this is linked to a consultation, store it there
    if (consultationTicketId && consultationTicket) {
      await prisma.consultationTicket.update({
        where: { id: consultationTicketId },
        data: {
          caseNumber: finalCaseNumber,
          caseNumberGeneratedAt: new Date()
        }
      });
    }
  }

  // Rest of the function stays the same...
  const textMappings = [
    { field: "caseNumber", value: finalCaseNumber || "" },
    // ... other fields ...
  ];

  // ... rest of implementation ...
});
```

---

## Step 5: Update Consultation Creation

**File**: `src/actions/consultation/create-consultation.action.ts` (if exists)

When creating a new consultation ticket, generate the case number immediately:

```typescript
"use server"

import { generateTimestampCaseNumber } from "@/services/sequence-generator.service";
import prisma from "@/lib/prisma";

export const createConsultationTicket = withErrorHandling(async (data: CreateTicketInput) => {
  // Validate input
  if (!data.clinicId) throw new Error("Clinic ID required");
  
  // ✅ Generate case number upfront
  const caseNumber = await generateTimestampCaseNumber(
    "CONSULTATION",
    data.clinicId
  );
  
  // Create ticket with case number
  const ticket = await prisma.consultationTicket.create({
    data: {
      ...data,
      caseNumber,  // Store immediately
      caseNumberGeneratedAt: new Date(),
      isActive: true
    }
  });
  
  return { 
    message: "Consultation ticket created successfully",
    data: ticket 
  };
});
```

---

## Step 6: Backfill Existing Records

**File**: `scripts/backfill-case-numbers.ts`

```typescript
import prisma from "@/lib/prisma";
import { generateTimestampCaseNumber } from "@/services/sequence-generator.service";

async function backfillCaseNumbers() {
  console.log("Starting backfill of case numbers...");

  // Backfill consultations
  const consultationsWithoutNumbers = await prisma.consultationTicket.findMany({
    where: { caseNumber: null },
    orderBy: { createdAt: "asc" }
  });

  console.log(`Found ${consultationsWithoutNumbers.length} consultations without case numbers`);

  for (const ticket of consultationsWithoutNumbers) {
    const caseNumber = await generateTimestampCaseNumber(
      "CONSULTATION",
      ticket.clinicId,
      { createdAt: ticket.createdAt }  // Generate using original date
    );

    await prisma.consultationTicket.update({
      where: { id: ticket.id },
      data: {
        caseNumber,
        caseNumberGeneratedAt: ticket.createdAt
      }
    });

    console.log(`✓ Ticket #${ticket.id}: ${caseNumber}`);
  }

  // Backfill health assessments
  const assessmentsWithoutNumbers = await prisma.healthAssessment.findMany({
    where: { caseNumber: null },
    orderBy: { createdAt: "asc" }
  });

  console.log(`Found ${assessmentsWithoutNumbers.length} health assessments without case numbers`);

  for (const assessment of assessmentsWithoutNumbers) {
    const caseNumber = await generateTimestampCaseNumber(
      "HEALTH_ASSESSMENT",
      undefined,
      { createdAt: assessment.createdAt }
    );

    await prisma.healthAssessment.update({
      where: { id: assessment.id },
      data: {
        caseNumber,
        caseNumberGeneratedAt: assessment.createdAt
      }
    });

    console.log(`✓ Assessment #${assessment.id}: ${caseNumber}`);
  }

  console.log("Backfill complete!");
}

backfillCaseNumbers().catch(console.error);
```

**Run after deployment**:

```bash
npx ts-node scripts/backfill-case-numbers.ts
```

---

## Step 7: Testing

### Test 1: Same Consultation, Multiple Downloads

```typescript
// Test scenario
const consultationId = 123;

// First download
const result1 = await downloadConsultationAction(userId, consultationId);
// result1.pdf contains: "CONS-20260112-00048"

// Verify it's stored
const stored = await prisma.consultationTicket.findUnique({
  where: { id: consultationId },
  select: { caseNumber: true }
});
// stored.caseNumber === "CONS-20260112-00048" ✅

// Second download (should use same number)
const result2 = await downloadConsultationAction(userId, consultationId);
// result2.pdf contains: "CONS-20260112-00048" ✅ SAME!

// Verify no new entry created
const count = await prisma.sequenceGenerator.findMany({
  where: { 
    entityType: "CONSULTATION",
    date: "20260112"
  }
});
// currentValue should not have increased for same consultation
```

### Test 2: Unique Constraint

```typescript
// Try to create two tickets with same case number (should fail)
try {
  await prisma.consultationTicket.create({
    data: {
      clinicId: 5,
      subject: "Test 1",
      caseNumber: "CONS-20260112-00048"
    }
  });
  
  await prisma.consultationTicket.create({
    data: {
      clinicId: 5,
      subject: "Test 2",
      caseNumber: "CONS-20260112-00048"  // ← Duplicate
    }
  });
  // Should throw: Unique constraint violation ✅
} catch (error) {
  console.log("✓ Unique constraint working correctly");
}
```

### Test 3: Concurrent Downloads

```typescript
// Simulate concurrent downloads
const downloads = await Promise.all([
  downloadConsultationAction(userId, 123),
  downloadConsultationAction(userId, 123),
  downloadConsultationAction(userId, 123)
]);

// All should have same case number
const caseNumbers = downloads.map(d => extractCaseNumber(d.pdf));
// caseNumbers === ["CONS-20260112-00048", "CONS-20260112-00048", "CONS-20260112-00048"]
console.log("✓ Concurrent downloads return same number");
```

---

## Summary of Changes

| File | Changes | Purpose |
|------|---------|---------|
| `prisma/schema.prisma` | Add `caseNumber`, `caseNumberGeneratedAt` | Store numbers persistently |
| `download-consultation.action.ts` | Add retrieval + storage logic | Generate once, reuse |
| `download-haf.action.ts` | Add retrieval + storage logic | Generate once, reuse |
| `download-ekas.action.ts` | Link to consultation case number | Consistent reference |
| `create-consultation.action.ts` | Generate on creation | Assign immediately |
| `backfill-case-numbers.ts` | Backfill script | Populate existing records |

---

## Deployment Order

1. ✅ Deploy schema migration
2. ✅ Deploy action code changes
3. ✅ Run backfill script for existing records
4. ✅ Test: Download same form multiple times
5. ✅ Verify numbers are consistent
6. ✅ Monitor for any errors
7. ✅ Done!
