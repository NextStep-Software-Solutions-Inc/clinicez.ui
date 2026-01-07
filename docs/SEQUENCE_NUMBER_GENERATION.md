# Sequence Number Generation Documentation

## Table of Contents
1. [Overview](#overview)
2. [Case Number Generation](#case-number-generation)
3. [Transaction Number Generation](#transaction-number-generation)
4. [Database Schema](#database-schema)
5. [Implementation Details](#implementation-details)
6. [Production Readiness Recommendations](#production-readiness-recommendations)
7. [Testing Strategy](#testing-strategy)
8. [Monitoring and Maintenance](#monitoring-and-maintenance)

---

## Overview

The system implements a robust sequence generation mechanism for tracking various entities across the platform. Two primary types of sequences are managed:

1. **Case Numbers**: Used for Consultation Notes and Health Assessment Forms
2. **Transaction Numbers**: Used for EKAS (Electronic Konsulta Availment Slip) forms

### Key Features
- **Year-based sequences**: Automatically reset at the start of each year
- **Clinic-specific sequences**: Optional clinic isolation for multi-tenant support
- **Atomic operations**: Transaction-based generation prevents race conditions
- **Formatted output**: Human-readable, standardized number formats

---

## Case Number Generation

### Purpose
Case numbers uniquely identify clinical encounters and health assessments, ensuring traceability and proper record-keeping.

### Format
- **Consultations**: `YYYY-CONS-####` (e.g., `2025-CONS-0001`)
- **Health Assessments**: `YYYY-HAF-####` (e.g., `2025-HAF-0023`)

Where:
- `YYYY` = Current year
- `CONS` = Consultation prefix
- `HAF` = Health Assessment Form prefix
- `####` = 4-digit zero-padded sequence number

### Implementation Location
**File**: `src/services/sequence-generator.service.ts`

**Function**: `generateCaseNumber(entityType, clinicId?)`

```typescript
export type EntityType = "HEALTH_ASSESSMENT" | "CONSULTATION";

export async function generateCaseNumber(
  entityType: EntityType,
  clinicId?: number
): Promise<string>
```

### Usage Examples

#### 1. Health Assessment Form (HAF)
**File**: `src/actions/phr/download-haf.action.ts`

```typescript
// Generate case number for health assessment
caseNumber = await generateCaseNumber("HEALTH_ASSESSMENT");

// Store it in PhysicalExamination record
await prisma.physicalExamination.update({
  where: { id: physicalExaminationId },
  data: { caseNumber }
});
```

**Context**: When a user downloads their Health Assessment Form, the system:
1. Checks if a case number already exists in the most recent PhysicalExamination record
2. If not present, generates a new case number (user-level, no clinic association)
3. Stores the case number for future reference

#### 2. Consultation Notes
**File**: `src/actions/phr/download-consultation.action.ts`

```typescript
// Generate case number for consultation (clinic-specific)
caseNumber = await generateCaseNumber("CONSULTATION", consultation.clinicId);

// Store it in ConsultationTicket record
await prisma.consultationTicket.update({
  where: { id: consultation.id },
  data: { caseNumber }
});
```

**Context**: When generating consultation documentation:
1. Checks if the ConsultationTicket already has a case number
2. If not, generates a clinic-specific case number
3. Associates it with the consultation ticket for future use

### How It Works

1. **Retrieve Current Year**: Gets the current year from system time
2. **Transaction Start**: Wraps all operations in a database transaction
3. **Find or Create Sequence**:
   - Searches for existing sequence by `entityType`, `clinicId`, and `year`
   - If not found, creates a new sequence starting at 1
4. **Increment**: Atomically increments the `currentValue` field
5. **Format**: Constructs the formatted string with appropriate prefix
6. **Return**: Returns the formatted case number

### Key Characteristics
- **Atomic**: Uses `$transaction` to prevent concurrent access issues
- **Lazy Creation**: Sequences are created on first use
- **Year Reset**: Each year gets a fresh sequence (automatic via year-based lookup)
- **Clinic Isolation**: Optional `clinicId` parameter for multi-tenant separation

---

## Transaction Number Generation

### Purpose
Transaction numbers provide unique identifiers for EKAS forms and authorization codes, critical for PhilHealth integration and claims processing.

### Format

#### Transaction Number
- **With Clinic**: `EKAS-C###-YYYY-######` (e.g., `EKAS-C123-2025-000456`)
- **Without Clinic**: `EKAS-YYYY-######` (e.g., `EKAS-2025-000123`)

#### Authorization Code
- **With Clinic**: `PHK-C###-YYYY-######` (e.g., `PHK-C123-2025-000456`)
- **Without Clinic**: `PHK-YYYY-######` (e.g., `PHK-2025-000123`)

Where:
- `EKAS` = Electronic Konsulta Availment Slip prefix
- `PHK` = PhilHealth Konsulta prefix
- `C###` = Clinic ID (when applicable)
- `YYYY` = Current year
- `######` = 6-digit zero-padded sequence number

### Implementation Locations

#### Sequence Generation
**File**: `src/lib/sequence-generator.ts`

```typescript
export async function getNextSequenceNumber(
  entityType: string,
  clinicId: number | null,
  year: number
): Promise<number>
```

**Supported Entity Types**:
- `EKAS_TRANSACTION`: For transaction numbers
- `EKAS_AUTH_CODE`: For authorization codes

#### Formatting
**File**: `src/lib/format-sequence.ts`

```typescript
export function formatTransactionNumber(
  clinicId: number | null,
  sequenceNumber: number,
  year: number
): string

export function formatAuthorizationCode(
  clinicId: number | null,
  sequenceNumber: number,
  year: number
): string
```

### Usage Example

**File**: `src/actions/phr/download-ekas.action.ts`

```typescript
// Get current year
const currentYear = new Date().getFullYear();

// Generate sequence numbers
const transactionSeq = await getNextSequenceNumber(
  'EKAS_TRANSACTION', 
  clinicId || null, 
  currentYear
);
const authSeq = await getNextSequenceNumber(
  'EKAS_AUTH_CODE', 
  clinicId || null, 
  currentYear
);

// Format the numbers
const finalTransactionNumber = formatTransactionNumber(
  clinicId || null, 
  transactionSeq, 
  currentYear
);
const finalAuthCode = formatAuthorizationCode(
  clinicId || null, 
  authSeq, 
  currentYear
);
```

**Context**: Every time an EKAS form is generated:
1. Two separate sequences are used (transaction and authorization)
2. Sequences are clinic-specific or global based on context
3. Numbers are generated atomically and formatted consistently
4. These numbers are embedded in the PDF but NOT stored in the database (stateless)

### How It Works

1. **Transaction Scope**: All operations wrapped in database transaction
2. **Lookup**: Find existing sequence by `entityType`, `clinicId`, and `year`
3. **Create or Increment**:
   - If not found: Create new sequence with `currentValue = 1`, return 1
   - If found: Increment `currentValue` by 1, return new value
4. **Format**: Apply appropriate formatting based on presence of `clinicId`

### Key Characteristics
- **Separate Sequences**: Transaction and authorization codes use different sequences
- **Not Stored**: Generated numbers are not persisted to ConsultationTicket or other entities
- **Generated On-Demand**: Created fresh each time EKAS form is downloaded
- **Clinic-Aware**: Format includes clinic identifier when applicable

---

## Database Schema

### SequenceGenerator Table

**File**: `prisma/schema.prisma`

```prisma
model SequenceGenerator {
  id           Int      @id @default(autoincrement())
  entityType   String   // "HEALTH_ASSESSMENT" | "CONSULTATION" | "EKAS_TRANSACTION" | "EKAS_AUTH_CODE"
  clinicId     Int?     // null for personal health records (HAF)
  year         Int      // 2025, 2026, etc.
  currentValue Int      @default(0)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  Clinic       Clinic?  @relation(fields: [clinicId], references: [id], onDelete: Cascade)

  @@unique([entityType, clinicId, year], name: "unique_sequence")
  @@index([clinicId, year])
}
```

### Key Constraints

1. **Unique Constraint**: `@@unique([entityType, clinicId, year])`
   - Ensures only one sequence per entity type, clinic, and year
   - Prevents duplicate sequence generators
   - Critical for maintaining sequence integrity

2. **Index**: `@@index([clinicId, year])`
   - Optimizes queries filtering by clinic and year
   - Improves performance for clinic-specific lookups

3. **Foreign Key**: `clinicId` references `Clinic(id)` with `CASCADE` delete
   - Automatically cleans up sequences when a clinic is deleted
   - Maintains referential integrity

### Migration

**File**: `migrations/add_case_number_sequence.sql`

The migration adds:
1. `caseNumber` field to `ConsultationTicket` table
2. `caseNumber` field to `PhysicalExamination` table
3. `SequenceGenerator` table with appropriate indexes and constraints

```sql
-- Add caseNumber to ConsultationTicket
ALTER TABLE "ConsultationTicket" ADD COLUMN "caseNumber" TEXT;
CREATE INDEX "ConsultationTicket_caseNumber_idx" ON "ConsultationTicket"("caseNumber");

-- Add caseNumber to PhysicalExamination
ALTER TABLE "PhysicalExamination" ADD COLUMN "caseNumber" TEXT;
CREATE INDEX "PhysicalExamination_caseNumber_idx" ON "PhysicalExamination"("caseNumber");

-- Create SequenceGenerator table
CREATE TABLE "SequenceGenerator" (
    "id" SERIAL NOT NULL,
    "entityType" TEXT NOT NULL,
    "clinicId" INTEGER,
    "year" INTEGER NOT NULL,
    "currentValue" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SequenceGenerator_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SequenceGenerator_entityType_clinicId_year_key" 
  ON "SequenceGenerator"("entityType", "clinicId", "year");

CREATE INDEX "SequenceGenerator_clinicId_year_idx" 
  ON "SequenceGenerator"("clinicId", "year");

ALTER TABLE "SequenceGenerator" 
  ADD CONSTRAINT "SequenceGenerator_clinicId_fkey" 
  FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") 
  ON DELETE CASCADE ON UPDATE CASCADE;
```

### Related Tables

#### ConsultationTicket
```prisma
model ConsultationTicket {
  id         Int       @id @default(autoincrement())
  caseNumber String?
  // ... other fields
  
  @@index([caseNumber])
}
```
- Stores case number for consultations
- Indexed for fast lookups
- Nullable (legacy records may not have case numbers)

#### PhysicalExamination
```prisma
model PhysicalExamination {
  id         Int       @id @default(autoincrement())
  caseNumber String?
  // ... other fields
  
  @@index([caseNumber])
}
```
- Stores case number for health assessments
- Indexed for fast lookups
- Nullable (legacy records may not have case numbers)

---

## Implementation Details

### Concurrency Handling

Both implementations use Prisma's `$transaction` to ensure atomic operations:

```typescript
const sequence = await prisma.$transaction(async (tx) => {
  // Find existing sequence
  let seq = await tx.sequenceGenerator.findFirst({ where: {...} });
  
  // Create if doesn't exist
  if (!seq) {
    seq = await tx.sequenceGenerator.create({ data: {...} });
    return seq;
  }
  
  // Increment and return
  return await tx.sequenceGenerator.update({
    where: { id: seq.id },
    data: { currentValue: { increment: 1 } }
  });
});
```

**Benefits**:
- **Atomic**: All operations succeed or fail together
- **Isolated**: Other transactions see consistent state
- **Serializable**: Prevents lost updates and race conditions

### Error Handling

Current implementation relies on Prisma's built-in error handling:
- Unique constraint violations throw `PrismaClientKnownRequestError`
- Transaction failures roll back automatically
- Database errors propagate to calling code

### Utility Functions

#### getCurrentSequenceValue
**File**: `src/services/sequence-generator.service.ts`

```typescript
export async function getCurrentSequenceValue(
  entityType: EntityType,
  clinicId?: number
): Promise<number>
```
- Returns current sequence value WITHOUT incrementing
- Useful for previews or diagnostics
- Returns 0 if sequence doesn't exist yet

#### resetSequence
**File**: `src/services/sequence-generator.service.ts`

```typescript
export async function resetSequence(
  entityType: EntityType,
  clinicId?: number
): Promise<void>
```
- Deletes sequence records for testing purposes
- **Caution**: Only use in development/testing environments
- Production use could cause duplicate case numbers

---

## Production Readiness Recommendations

### 1. Database Optimizations

#### ✅ Current Strengths
- Unique constraint prevents duplicate sequences
- Indexes support efficient lookups
- Foreign key maintains data integrity

#### 🚀 Recommended Improvements

**A. Add Read Replicas Support**
```typescript
// Consider implementing read/write splitting
const sequence = await prisma.$transaction(async (tx) => {
  // Read operations can use replica
  // Write operations must use primary
}, {
  isolationLevel: 'Serializable' // Highest isolation level
});
```

**B. Implement Connection Pooling Optimization**
```typescript
// In prisma/schema.prisma datasource config
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // Recommended pool settings for high concurrency
  // connection_limit = 20
  // pool_timeout = 10
}
```

**C. Add Database-Level Sequence (Alternative Approach)**
```sql
-- For extremely high throughput scenarios, consider PostgreSQL sequences
CREATE SEQUENCE consultation_case_number_seq_2025 START 1;
CREATE SEQUENCE haf_case_number_seq_2025 START 1;

-- Usage:
SELECT nextval('consultation_case_number_seq_2025');
```
**Trade-offs**: Sequences are faster but harder to manage across years/clinics

### 2. Concurrency and Performance

#### ✅ Current Strengths
- Transaction isolation prevents race conditions
- Atomic increment operations

#### 🚀 Recommended Improvements

**A. Add Retry Logic with Exponential Backoff**
```typescript
async function generateCaseNumberWithRetry(
  entityType: EntityType,
  clinicId?: number,
  maxRetries: number = 3
): Promise<string> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await generateCaseNumber(entityType, clinicId);
    } catch (error) {
      lastError = error as Error;
      
      // Check if it's a retryable error (lock timeout, deadlock)
      if (isRetryableError(error)) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      throw error; // Non-retryable error
    }
  }
  
  throw new Error(`Failed after ${maxRetries} attempts: ${lastError?.message}`);
}

function isRetryableError(error: any): boolean {
  // Prisma error codes for lock timeouts and deadlocks
  return error?.code === 'P2034' || // Transaction failed
         error?.code === 'P2028';   // Transaction API error
}
```

**B. Implement Caching for Read Operations**
```typescript
import { LRUCache } from 'lru-cache';

const sequenceCache = new LRUCache<string, number>({
  max: 1000,
  ttl: 1000 * 60 * 5, // 5 minutes
});

export async function getCurrentSequenceValueCached(
  entityType: EntityType,
  clinicId?: number
): Promise<number> {
  const cacheKey = `${entityType}-${clinicId}-${new Date().getFullYear()}`;
  
  const cached = sequenceCache.get(cacheKey);
  if (cached !== undefined) return cached;
  
  const value = await getCurrentSequenceValue(entityType, clinicId);
  sequenceCache.set(cacheKey, value);
  
  return value;
}
```
**Note**: Only use caching for read operations, NEVER for writes

**C. Add Performance Monitoring**
```typescript
import { logger } from '@/lib/logger';

export async function generateCaseNumber(
  entityType: EntityType,
  clinicId?: number
): Promise<string> {
  const startTime = Date.now();
  
  try {
    // Existing implementation
    const year = new Date().getFullYear();
    const sequence = await prisma.$transaction(async (tx) => {
      // ... existing logic
    });
    
    const prefix = entityType === "HEALTH_ASSESSMENT" ? "HAF" : "CONS";
    const paddedNumber = String(sequence.currentValue).padStart(4, "0");
    const caseNumber = `${year}-${prefix}-${paddedNumber}`;
    
    // Log performance metrics
    const duration = Date.now() - startTime;
    if (duration > 1000) {
      logger.warn('Slow case number generation', {
        entityType,
        clinicId,
        duration,
        caseNumber
      });
    }
    
    return caseNumber;
  } catch (error) {
    logger.error('Case number generation failed', {
      entityType,
      clinicId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}
```

### 3. Error Handling and Validation

#### 🚀 Recommended Improvements

**A. Add Input Validation**
```typescript
export async function generateCaseNumber(
  entityType: EntityType,
  clinicId?: number
): Promise<string> {
  // Validate entity type
  const validEntityTypes: EntityType[] = ["HEALTH_ASSESSMENT", "CONSULTATION"];
  if (!validEntityTypes.includes(entityType)) {
    throw new Error(`Invalid entity type: ${entityType}`);
  }
  
  // Validate clinicId if provided
  if (clinicId !== undefined && clinicId !== null) {
    if (clinicId <= 0 || !Number.isInteger(clinicId)) {
      throw new Error(`Invalid clinic ID: ${clinicId}`);
    }
  }
  
  // Existing implementation...
}
```

**B. Add Custom Error Types**
```typescript
// src/lib/errors/sequence-errors.ts
export class SequenceGenerationError extends Error {
  constructor(
    message: string,
    public entityType: string,
    public clinicId?: number,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'SequenceGenerationError';
  }
}

export class SequenceNotFoundError extends SequenceGenerationError {
  constructor(entityType: string, clinicId?: number) {
    super(
      `Sequence not found for ${entityType} in clinic ${clinicId}`,
      entityType,
      clinicId
    );
    this.name = 'SequenceNotFoundError';
  }
}

export class SequenceLimitExceededError extends SequenceGenerationError {
  constructor(entityType: string, currentValue: number, limit: number) {
    super(
      `Sequence limit exceeded: ${currentValue} >= ${limit}`,
      entityType
    );
    this.name = 'SequenceLimitExceededError';
  }
}
```

**C. Add Sequence Limit Checks**
```typescript
export async function generateCaseNumber(
  entityType: EntityType,
  clinicId?: number
): Promise<string> {
  const MAX_SEQUENCE_VALUE = 9999; // For 4-digit format
  const year = new Date().getFullYear();
  
  const sequence = await prisma.$transaction(async (tx) => {
    let seq = await tx.sequenceGenerator.findFirst({
      where: { entityType, clinicId: clinicId ?? null, year }
    });
    
    if (!seq) {
      seq = await tx.sequenceGenerator.create({
        data: { entityType, clinicId: clinicId ?? null, year, currentValue: 1 }
      });
      return seq;
    }
    
    // Check if we've exceeded the limit
    if (seq.currentValue >= MAX_SEQUENCE_VALUE) {
      throw new SequenceLimitExceededError(
        entityType,
        seq.currentValue,
        MAX_SEQUENCE_VALUE
      );
    }
    
    return await tx.sequenceGenerator.update({
      where: { id: seq.id },
      data: { currentValue: { increment: 1 } }
    });
  });
  
  // Format and return...
}
```

### 4. Monitoring and Observability

#### 🚀 Recommended Implementations

**A. Add Metrics Tracking**
```typescript
// Using a metrics library like prom-client
import { Counter, Histogram } from 'prom-client';

const sequenceGenerationCounter = new Counter({
  name: 'sequence_generation_total',
  help: 'Total number of sequences generated',
  labelNames: ['entity_type', 'clinic_id', 'status']
});

const sequenceGenerationDuration = new Histogram({
  name: 'sequence_generation_duration_seconds',
  help: 'Duration of sequence generation',
  labelNames: ['entity_type', 'clinic_id']
});

export async function generateCaseNumber(
  entityType: EntityType,
  clinicId?: number
): Promise<string> {
  const end = sequenceGenerationDuration.startTimer({
    entity_type: entityType,
    clinic_id: clinicId?.toString() || 'null'
  });
  
  try {
    const result = await generateCaseNumberImplementation(entityType, clinicId);
    
    sequenceGenerationCounter.inc({
      entity_type: entityType,
      clinic_id: clinicId?.toString() || 'null',
      status: 'success'
    });
    
    return result;
  } catch (error) {
    sequenceGenerationCounter.inc({
      entity_type: entityType,
      clinic_id: clinicId?.toString() || 'null',
      status: 'error'
    });
    throw error;
  } finally {
    end();
  }
}
```

**B. Add Health Check Endpoint**
```typescript
// src/app/api/health/sequences/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const year = new Date().getFullYear();
    
    // Check sequence status for all types
    const sequences = await prisma.sequenceGenerator.findMany({
      where: { year },
      select: {
        entityType: true,
        clinicId: true,
        currentValue: true,
        updatedAt: true
      }
    });
    
    // Analyze for potential issues
    const issues: string[] = [];
    sequences.forEach(seq => {
      // Check if approaching limit
      if (seq.currentValue > 9000) {
        issues.push(`${seq.entityType} (clinic: ${seq.clinicId}) approaching limit: ${seq.currentValue}/9999`);
      }
      
      // Check for stale sequences (not updated in 30 days)
      const daysSinceUpdate = (Date.now() - seq.updatedAt.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceUpdate > 30) {
        issues.push(`${seq.entityType} (clinic: ${seq.clinicId}) hasn't been updated in ${Math.floor(daysSinceUpdate)} days`);
      }
    });
    
    return NextResponse.json({
      status: issues.length === 0 ? 'healthy' : 'warning',
      timestamp: new Date().toISOString(),
      sequences: sequences.length,
      issues
    });
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
```

**C. Add Alerting Rules**
```typescript
// Pseudo-code for alerting configuration
const alertingRules = {
  sequenceGenerationRate: {
    condition: 'rate > 100/second',
    severity: 'warning',
    action: 'notify_ops_team'
  },
  sequenceGenerationErrors: {
    condition: 'error_rate > 5%',
    severity: 'critical',
    action: 'page_on_call'
  },
  sequenceApproachingLimit: {
    condition: 'current_value > 9500',
    severity: 'warning',
    action: 'notify_admin'
  },
  slowSequenceGeneration: {
    condition: 'p95_duration > 2s',
    severity: 'warning',
    action: 'investigate_performance'
  }
};
```

### 5. Data Integrity and Backup

#### 🚀 Recommended Implementations

**A. Add Audit Trail**
```typescript
// Create a separate audit table
model SequenceGenerationAudit {
  id           Int      @id @default(autoincrement())
  entityType   String
  clinicId     Int?
  year         Int
  oldValue     Int
  newValue     Int
  generatedBy  String   // User ID or system
  generatedAt  DateTime @default(now())
  ipAddress    String?
  userAgent    String?
  
  @@index([entityType, clinicId, year])
  @@index([generatedAt])
}

// Modify generateCaseNumber to log
export async function generateCaseNumber(
  entityType: EntityType,
  clinicId?: number,
  auditInfo?: { userId?: string; ipAddress?: string }
): Promise<string> {
  const sequence = await prisma.$transaction(async (tx) => {
    // ... existing sequence generation logic
    
    // Log to audit trail
    await tx.sequenceGenerationAudit.create({
      data: {
        entityType,
        clinicId: clinicId ?? null,
        year,
        oldValue: seq.currentValue,
        newValue: seq.currentValue + 1,
        generatedBy: auditInfo?.userId || 'system',
        ipAddress: auditInfo?.ipAddress
      }
    });
    
    return updatedSeq;
  });
  
  return formatCaseNumber(sequence);
}
```

**B. Add Data Consistency Checks**
```typescript
// Scheduled job to verify sequence integrity
export async function verifySequenceIntegrity(): Promise<{
  status: 'ok' | 'issues_found';
  issues: string[];
}> {
  const issues: string[] = [];
  
  // Check 1: Verify unique constraint
  const duplicates = await prisma.$queryRaw`
    SELECT entityType, clinicId, year, COUNT(*) as count
    FROM "SequenceGenerator"
    GROUP BY entityType, clinicId, year
    HAVING COUNT(*) > 1
  `;
  if (Array.isArray(duplicates) && duplicates.length > 0) {
    issues.push(`Found ${duplicates.length} duplicate sequences`);
  }
  
  // Check 2: Verify sequence continuity
  const consultations = await prisma.consultationTicket.groupBy({
    by: ['caseNumber'],
    where: { caseNumber: { not: null } },
    _count: true
  });
  // Analyze for gaps or duplicates in case numbers
  
  // Check 3: Verify currentValue matches actual usage
  for (const entityType of ['CONSULTATION', 'HEALTH_ASSESSMENT'] as const) {
    const sequences = await prisma.sequenceGenerator.findMany({
      where: { entityType, year: new Date().getFullYear() }
    });
    
    for (const seq of sequences) {
      const actualCount = await getActualUsageCount(entityType, seq.clinicId, seq.year);
      if (Math.abs(actualCount - seq.currentValue) > 10) {
        issues.push(
          `Sequence mismatch for ${entityType} (clinic: ${seq.clinicId}): ` +
          `recorded=${seq.currentValue}, actual=${actualCount}`
        );
      }
    }
  }
  
  return {
    status: issues.length === 0 ? 'ok' : 'issues_found',
    issues
  };
}
```

**C. Implement Backup and Recovery**
```typescript
// Backup current sequences before year rollover
export async function backupSequences(year: number): Promise<string> {
  const sequences = await prisma.sequenceGenerator.findMany({
    where: { year }
  });
  
  const backup = {
    timestamp: new Date().toISOString(),
    year,
    sequences
  };
  
  // Save to backup storage
  const backupPath = `backups/sequences-${year}-${Date.now()}.json`;
  await saveToStorage(backupPath, JSON.stringify(backup, null, 2));
  
  return backupPath;
}

// Restore from backup (emergency use only)
export async function restoreSequences(backupPath: string): Promise<void> {
  const backupData = await loadFromStorage(backupPath);
  const backup = JSON.parse(backupData);
  
  await prisma.$transaction(async (tx) => {
    for (const seq of backup.sequences) {
      await tx.sequenceGenerator.upsert({
        where: {
          unique_sequence: {
            entityType: seq.entityType,
            clinicId: seq.clinicId,
            year: seq.year
          }
        },
        update: { currentValue: seq.currentValue },
        create: seq
      });
    }
  });
}
```

### 6. Year Rollover Management

#### 🚀 Recommended Implementation

**A. Automated Year Rollover**
```typescript
// Scheduled job to run on January 1st
export async function performYearRollover(): Promise<void> {
  const currentYear = new Date().getFullYear();
  const previousYear = currentYear - 1;
  
  logger.info('Starting year rollover', { previousYear, currentYear });
  
  try {
    // 1. Backup previous year's sequences
    const backupPath = await backupSequences(previousYear);
    logger.info('Previous year backed up', { backupPath });
    
    // 2. Verify no sequences exist for current year
    const existingSequences = await prisma.sequenceGenerator.count({
      where: { year: currentYear }
    });
    if (existingSequences > 0) {
      logger.warn('Sequences already exist for current year', {
        count: existingSequences
      });
    }
    
    // 3. Archive old sequences (optional - keep for audit)
    // Note: Don't delete, just mark as archived if needed
    
    // 4. Send summary report
    const summary = await generateYearRolloverReport(previousYear, currentYear);
    await sendRolloverNotification(summary);
    
    logger.info('Year rollover completed successfully');
  } catch (error) {
    logger.error('Year rollover failed', { error });
    throw error;
  }
}

async function generateYearRolloverReport(
  previousYear: number,
  currentYear: number
): Promise<string> {
  const prevYearSequences = await prisma.sequenceGenerator.findMany({
    where: { year: previousYear }
  });
  
  let report = `Year Rollover Report: ${previousYear} → ${currentYear}\n\n`;
  report += `Total sequences in ${previousYear}: ${prevYearSequences.length}\n\n`;
  
  for (const seq of prevYearSequences) {
    report += `${seq.entityType} (Clinic: ${seq.clinicId || 'N/A'}): ${seq.currentValue}\n`;
  }
  
  return report;
}
```

**B. Add Warnings for Approaching Limit**
```typescript
export async function checkSequenceLimits(): Promise<void> {
  const year = new Date().getFullYear();
  const WARNING_THRESHOLD = 9500; // 95% of 9999
  
  const sequences = await prisma.sequenceGenerator.findMany({
    where: {
      year,
      currentValue: { gte: WARNING_THRESHOLD }
    }
  });
  
  if (sequences.length > 0) {
    for (const seq of sequences) {
      logger.warn('Sequence approaching limit', {
        entityType: seq.entityType,
        clinicId: seq.clinicId,
        currentValue: seq.currentValue,
        remaining: 9999 - seq.currentValue
      });
      
      // Send alert to administrators
      await sendAdminAlert({
        type: 'sequence_limit_warning',
        entityType: seq.entityType,
        clinicId: seq.clinicId,
        currentValue: seq.currentValue
      });
    }
  }
}
```

### 7. Security Considerations

#### 🚀 Recommended Implementations

**A. Add Authorization Checks**
```typescript
export async function generateCaseNumber(
  entityType: EntityType,
  clinicId?: number,
  userId?: string
): Promise<string> {
  // Verify user has permission to generate case numbers
  if (userId && clinicId) {
    const hasPermission = await checkUserPermission(
      userId,
      clinicId,
      'GENERATE_CASE_NUMBER'
    );
    if (!hasPermission) {
      throw new Error('Unauthorized: Cannot generate case numbers for this clinic');
    }
  }
  
  // Continue with existing implementation...
}
```

**B. Add Rate Limiting**
```typescript
import { RateLimiter } from 'rate-limiter-flexible';

const rateLimiter = new RateLimiter({
  points: 100, // Number of requests
  duration: 60, // Per 60 seconds
  blockDuration: 60 // Block for 60 seconds if exceeded
});

export async function generateCaseNumber(
  entityType: EntityType,
  clinicId?: number,
  userId?: string
): Promise<string> {
  if (userId) {
    try {
      await rateLimiter.consume(userId);
    } catch (error) {
      throw new Error('Rate limit exceeded: Too many sequence generation requests');
    }
  }
  
  // Continue with existing implementation...
}
```

---

## Testing Strategy

### Unit Tests

**File**: `src/services/__tests__/sequence-generator.service.test.ts`

```typescript
import { generateCaseNumber, resetSequence, getCurrentSequenceValue } from '../sequence-generator.service';
import prisma from '@/lib/prisma';

describe('Sequence Generator Service', () => {
  beforeEach(async () => {
    // Clean up test data
    await prisma.sequenceGenerator.deleteMany({
      where: { entityType: { in: ['CONSULTATION', 'HEALTH_ASSESSMENT'] } }
    });
  });

  describe('generateCaseNumber', () => {
    it('should generate first case number for consultation', async () => {
      const caseNumber = await generateCaseNumber('CONSULTATION', 1);
      const year = new Date().getFullYear();
      expect(caseNumber).toBe(`${year}-CONS-0001`);
    });

    it('should generate first case number for health assessment', async () => {
      const caseNumber = await generateCaseNumber('HEALTH_ASSESSMENT');
      const year = new Date().getFullYear();
      expect(caseNumber).toBe(`${year}-HAF-0001`);
    });

    it('should increment case number sequentially', async () => {
      const first = await generateCaseNumber('CONSULTATION', 1);
      const second = await generateCaseNumber('CONSULTATION', 1);
      const third = await generateCaseNumber('CONSULTATION', 1);
      
      const year = new Date().getFullYear();
      expect(first).toBe(`${year}-CONS-0001`);
      expect(second).toBe(`${year}-CONS-0002`);
      expect(third).toBe(`${year}-CONS-0003`);
    });

    it('should handle different clinics separately', async () => {
      const clinic1 = await generateCaseNumber('CONSULTATION', 1);
      const clinic2 = await generateCaseNumber('CONSULTATION', 2);
      const clinic1Again = await generateCaseNumber('CONSULTATION', 1);
      
      const year = new Date().getFullYear();
      expect(clinic1).toBe(`${year}-CONS-0001`);
      expect(clinic2).toBe(`${year}-CONS-0001`);
      expect(clinic1Again).toBe(`${year}-CONS-0002`);
    });

    it('should handle concurrent requests', async () => {
      const promises = Array.from({ length: 10 }, () =>
        generateCaseNumber('CONSULTATION', 1)
      );
      
      const results = await Promise.all(promises);
      const uniqueResults = new Set(results);
      
      // All case numbers should be unique
      expect(uniqueResults.size).toBe(10);
    });
  });

  describe('getCurrentSequenceValue', () => {
    it('should return 0 for non-existent sequence', async () => {
      const value = await getCurrentSequenceValue('CONSULTATION', 999);
      expect(value).toBe(0);
    });

    it('should return current value after generation', async () => {
      await generateCaseNumber('CONSULTATION', 1);
      await generateCaseNumber('CONSULTATION', 1);
      
      const value = await getCurrentSequenceValue('CONSULTATION', 1);
      expect(value).toBe(2);
    });
  });

  describe('resetSequence', () => {
    it('should reset sequence for testing', async () => {
      await generateCaseNumber('CONSULTATION', 1);
      await generateCaseNumber('CONSULTATION', 1);
      
      await resetSequence('CONSULTATION', 1);
      
      const value = await getCurrentSequenceValue('CONSULTATION', 1);
      expect(value).toBe(0);
    });
  });
});
```

### Integration Tests

```typescript
describe('Sequence Generator Integration', () => {
  it('should generate case number and store in consultation ticket', async () => {
    // Create consultation ticket
    const ticket = await prisma.consultationTicket.create({
      data: {
        systemId: 1,
        clinicId: 1,
        // ... other required fields
      }
    });
    
    // Generate and store case number
    const caseNumber = await generateCaseNumber('CONSULTATION', 1);
    await prisma.consultationTicket.update({
      where: { id: ticket.id },
      data: { caseNumber }
    });
    
    // Verify storage
    const updated = await prisma.consultationTicket.findUnique({
      where: { id: ticket.id }
    });
    
    expect(updated?.caseNumber).toBe(caseNumber);
  });

  it('should handle EKAS transaction number generation', async () => {
    const year = new Date().getFullYear();
    const clinicId = 123;
    
    const seq1 = await getNextSequenceNumber('EKAS_TRANSACTION', clinicId, year);
    const seq2 = await getNextSequenceNumber('EKAS_TRANSACTION', clinicId, year);
    
    expect(seq1).toBe(1);
    expect(seq2).toBe(2);
    
    const formatted1 = formatTransactionNumber(clinicId, seq1, year);
    const formatted2 = formatTransactionNumber(clinicId, seq2, year);
    
    expect(formatted1).toBe(`EKAS-C${clinicId}-${year}-000001`);
    expect(formatted2).toBe(`EKAS-C${clinicId}-${year}-000002`);
  });
});
```

### Load Tests

```typescript
import { performance } from 'perf_hooks';

describe('Sequence Generator Performance', () => {
  it('should handle high concurrency', async () => {
    const concurrentRequests = 100;
    const startTime = performance.now();
    
    const promises = Array.from({ length: concurrentRequests }, (_, i) =>
      generateCaseNumber('CONSULTATION', 1)
    );
    
    const results = await Promise.all(promises);
    const endTime = performance.now();
    
    // Verify uniqueness
    const uniqueResults = new Set(results);
    expect(uniqueResults.size).toBe(concurrentRequests);
    
    // Performance assertion
    const duration = endTime - startTime;
    console.log(`Generated ${concurrentRequests} sequences in ${duration}ms`);
    expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
  });

  it('should maintain performance under load', async () => {
    const rounds = 10;
    const requestsPerRound = 50;
    const durations: number[] = [];
    
    for (let round = 0; round < rounds; round++) {
      const startTime = performance.now();
      
      const promises = Array.from({ length: requestsPerRound }, () =>
        generateCaseNumber('CONSULTATION', 1)
      );
      
      await Promise.all(promises);
      
      const duration = performance.now() - startTime;
      durations.push(duration);
    }
    
    // Calculate average duration
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    console.log(`Average duration: ${avgDuration}ms`);
    
    // Verify performance doesn't degrade significantly
    const maxDuration = Math.max(...durations);
    const minDuration = Math.min(...durations);
    const degradation = (maxDuration - minDuration) / minDuration;
    
    expect(degradation).toBeLessThan(0.5); // Less than 50% degradation
  });
});
```

---

## Monitoring and Maintenance

### Daily Monitoring Checklist

1. **Sequence Health Check**
   - Run health endpoint: `GET /api/health/sequences`
   - Verify all sequences are functioning
   - Check for approaching limits

2. **Performance Metrics**
   - Review generation duration (P50, P95, P99)
   - Check error rates
   - Monitor transaction failures

3. **Database Health**
   - Verify no duplicate sequences
   - Check index performance
   - Monitor connection pool usage

### Weekly Maintenance

1. **Audit Review**
   - Review sequence generation audit logs
   - Identify unusual patterns
   - Verify data consistency

2. **Performance Analysis**
   - Analyze slow queries
   - Review transaction durations
   - Check for database locks

3. **Backup Verification**
   - Verify backups are being created
   - Test backup restoration (in staging)

### Monthly Maintenance

1. **Sequence Limit Analysis**
   - Review sequences approaching limits
   - Plan for limit increases if needed
   - Notify administrators of high-usage clinics

2. **Data Integrity Check**
   - Run `verifySequenceIntegrity()`
   - Investigate and resolve any issues
   - Document findings

3. **Performance Optimization**
   - Review slow query logs
   - Update indexes if needed
   - Optimize transaction patterns

### Annual Maintenance

1. **Year Rollover Preparation** (December)
   - Review year rollover procedures
   - Test rollover in staging
   - Notify stakeholders
   - Schedule maintenance window

2. **Year Rollover Execution** (January 1st)
   - Run `performYearRollover()`
   - Verify new sequences are created
   - Monitor for issues
   - Generate rollover report

3. **Post-Rollover Verification** (January)
   - Verify all systems using new year sequences
   - Check for any rollover issues
   - Update documentation if needed

### Alerting Rules

Set up alerts for:

1. **Critical Alerts** (Page on-call)
   - Sequence generation error rate > 5%
   - Sequence generation failing for > 5 minutes
   - Database transaction errors
   - Sequence limit exceeded

2. **Warning Alerts** (Email/Slack)
   - Sequence generation duration > 2s (P95)
   - Sequence value > 9500 (95% of limit)
   - Unusual spike in sequence generation
   - Year rollover approaching (December 15th)

3. **Info Alerts** (Dashboard)
   - Daily sequence generation summary
   - Performance metrics summary
   - Weekly integrity check results

### Troubleshooting Guide

#### Issue: Duplicate Case Numbers

**Symptoms**:
- Multiple records with same case number
- Unique constraint violations

**Diagnosis**:
```typescript
// Check for duplicates
const duplicates = await prisma.consultationTicket.groupBy({
  by: ['caseNumber'],
  where: { caseNumber: { not: null } },
  having: { caseNumber: { _count: { gt: 1 } } }
});
```

**Resolution**:
1. Identify affected records
2. Manually reassign case numbers
3. Investigate root cause (race condition?)
4. Apply recommended concurrency improvements

#### Issue: Sequence Generation Slow

**Symptoms**:
- High latency in case number generation
- Timeout errors

**Diagnosis**:
```sql
-- Check for blocking transactions
SELECT * FROM pg_stat_activity 
WHERE state = 'active' 
  AND query LIKE '%SequenceGenerator%';

-- Check for lock waits
SELECT * FROM pg_locks 
WHERE relation = 'SequenceGenerator'::regclass;
```

**Resolution**:
1. Terminate long-running transactions
2. Review recent code changes
3. Check database connection pool
4. Apply recommended performance improvements

#### Issue: Missing Case Numbers

**Symptoms**:
- Records without case numbers
- Gaps in sequence

**Diagnosis**:
```typescript
// Find records without case numbers
const missing = await prisma.consultationTicket.findMany({
  where: { caseNumber: null, createdAt: { gte: new Date('2025-01-01') } },
  select: { id: true, createdAt: true }
});
```

**Resolution**:
1. Generate case numbers for missing records
2. Verify sequence continuity
3. Investigate why case numbers weren't generated
4. Add validation to prevent future occurrences

---

## Summary

The sequence generation system provides a robust foundation for managing case numbers and transaction numbers across the platform. The current implementation handles:

✅ **Strengths**:
- Atomic generation with transaction isolation
- Year-based automatic reset
- Clinic-specific sequences
- Formatted, human-readable numbers
- Database-level uniqueness constraints

🚀 **Production Readiness Enhancements**:
- Add retry logic with exponential backoff
- Implement comprehensive error handling
- Add performance monitoring and alerting
- Create audit trail for compliance
- Implement data consistency checks
- Add rate limiting and authorization
- Develop automated year rollover procedures
- Enhance testing coverage (unit, integration, load)

By implementing these recommendations, the system will be highly robust, scalable, and production-ready for high-volume healthcare operations.

---

## Quick Reference

### Generate Case Number
```typescript
import { generateCaseNumber } from '@/services/sequence-generator.service';

// For consultation
const caseNumber = await generateCaseNumber('CONSULTATION', clinicId);
// Result: "2025-CONS-0123"

// For health assessment
const caseNumber = await generateCaseNumber('HEALTH_ASSESSMENT');
// Result: "2025-HAF-0045"
```

### Generate Transaction Number
```typescript
import { getNextSequenceNumber } from '@/lib/sequence-generator';
import { formatTransactionNumber } from '@/lib/format-sequence';

const year = new Date().getFullYear();
const seq = await getNextSequenceNumber('EKAS_TRANSACTION', clinicId, year);
const transactionNumber = formatTransactionNumber(clinicId, seq, year);
// Result: "EKAS-C123-2025-000456"
```

### Check Current Sequence
```typescript
import { getCurrentSequenceValue } from '@/services/sequence-generator.service';

const current = await getCurrentSequenceValue('CONSULTATION', clinicId);
console.log(`Current sequence: ${current}`);
```

### Reset Sequence (Testing Only)
```typescript
import { resetSequence } from '@/services/sequence-generator.service';

await resetSequence('CONSULTATION', clinicId);
```

---

**Document Version**: 1.0  
**Last Updated**: January 7, 2026  
**Author**: Senior Full-Stack Development Team  
**Next Review**: July 2026
