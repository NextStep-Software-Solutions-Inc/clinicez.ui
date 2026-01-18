# Case & Transaction Number Consistency: Current vs Recommended

## Current Implementation (After Migration)

### ❌ Problem: Numbers Are Generated Fresh Every Time

```
User Downloads Consultation Form
        ↓
generateTimestampCaseNumber("CONSULTATION", clinicId=5)
        ↓
Query SequenceGenerator for today
        ↓
Increment counter: 47 → 48
        ↓
Return: "CONS-20260112-00048"
        ↓
PDF generated with: CONS-20260112-00048
        ↓
        
2 hours later...
        ↓
User Downloads SAME Consultation Form Again
        ↓
generateTimestampCaseNumber("CONSULTATION", clinicId=5)
        ↓
Query SequenceGenerator for today
        ↓
Increment counter: 48 → 49  ← DIFFERENT NUMBER!
        ↓
Return: "CONS-20260112-00049"
        ↓
PDF generated with: CONS-20260112-00049  ← NOT THE SAME!
```

**Why This Is A Problem:**

- ❌ Same document gets different reference numbers
- ❌ Medical records inconsistent
- ❌ PhilHealth claim tracking breaks (EKAS number changes)
- ❌ Audit trail confused (same consultation, multiple case numbers)

### Current Code Flow

```typescript
// In download-consultation.action.ts (Line 147)
const caseNumber = consultation ? 
  await generateTimestampCaseNumber("CONSULTATION", consultation.clinicId) 
  : null;

// PROBLEM: This generates a NEW number every time
// Not stored anywhere, lost after PDF is downloaded

// In download-haf.action.ts (Line 106)
const caseNumber = await generateTimestampCaseNumber("HEALTH_ASSESSMENT");

// Same issue: Fresh number every time HAF is downloaded
```

---

## ✅ Recommended Solution: Store Numbers on Creation

### Architecture: One-Time Generation, Persistent Storage

```
First Time: Create Consultation
        ↓
generateTimestampCaseNumber("CONSULTATION", clinicId)
        ↓
Store in database: consultation.caseNumber = "CONS-20260112-00048"
        ↓
Save to ConsultationTicket record
        ↓
        
Subsequent Times: Download PDF
        ↓
Fetch existing: consultation.caseNumber (database lookup)
        ↓
If exists: Use stored number
If missing: Generate once and store
        ↓
Always returns: "CONS-20260112-00048"  ← CONSISTENT
```

### Database Schema Changes Required

```prisma
model ConsultationTicket {
  id           Int
  // ... existing fields ...
  
  // ADD BACK (with constraints):
  caseNumber   String?   @unique  // Unique across system
  caseNumberGeneratedAt DateTime?  // When it was generated
  
  @@index([caseNumber])
}

model HealthAssessment {
  // Same structure
  caseNumber   String?   @unique
  caseNumberGeneratedAt DateTime?
}
```

### Implementation Pattern

```typescript
// Option A: Generate on Consultation Creation
export const createConsultationTicket = async (data: CreateTicketInput) => {
  // 1. Generate case number
  const caseNumber = await generateTimestampCaseNumber("CONSULTATION", clinicId);
  
  // 2. Store it in database
  const ticket = await prisma.consultationTicket.create({
    data: {
      ...data,
      caseNumber,  // ← PERSISTED
      caseNumberGeneratedAt: new Date()
    }
  });
  
  return ticket;
};

// Option B: Generate on First Download (Lazy)
export const downloadConsultationAction = async (consultationId: number) => {
  let consultation = await prisma.consultationTicket.findUnique({
    where: { id: consultationId }
  });
  
  // If no case number yet, generate and store
  if (!consultation.caseNumber) {
    const caseNumber = await generateTimestampCaseNumber("CONSULTATION", consultation.clinicId);
    
    consultation = await prisma.consultationTicket.update({
      where: { id: consultationId },
      data: {
        caseNumber,
        caseNumberGeneratedAt: new Date()
      }
    });
  }
  
  // Always use the stored number
  const pdfData = generatePdf(..., { caseNumber: consultation.caseNumber });
  
  return pdfData;
};
```

---

## Comparison: Current vs Recommended

| Aspect | Current (Fresh) | Recommended (Stored) |
|--------|-----------------|----------------------|
| **First Download** | Generate & use | Generate & store |
| **Second Download** | Generate AGAIN ❌ | Use stored ✅ |
| **Number Consistency** | ❌ Different each time | ✅ Always same |
| **DB Storage** | ❌ No | ✅ Yes |
| **Unique Constraint** | ❌ No | ✅ Prevents duplicates |
| **Audit Trail** | ❌ Confused | ✅ Single number |
| **PhilHealth Tracking** | ❌ Breaks on re-download | ✅ Consistent |
| **Query Performance** | N/A | ✅ O(1) lookup |
| **Migration Effort** | None | Medium |

---

## Implementation Roadmap

### Phase 1: Schema Changes

```prisma
// Add to ConsultationTicket
caseNumber   String?   @unique
caseNumberGeneratedAt DateTime?

// Add to HealthAssessment  
caseNumber   String?   @unique
caseNumberGeneratedAt DateTime?

// Create migration
npx prisma migrate dev --name add_case_number_persistent_storage
```

### Phase 2: Update Action Files

```typescript
// download-consultation.action.ts
export const downloadConsultationAction = async (...) => {
  const consultation = await prisma.consultationTicket.findUnique({...});
  
  let caseNumber = consultation.caseNumber;
  
  if (!caseNumber) {
    caseNumber = await generateTimestampCaseNumber("CONSULTATION", consultation.clinicId);
    await prisma.consultationTicket.update({
      where: { id: consultation.id },
      data: { caseNumber, caseNumberGeneratedAt: new Date() }
    });
  }
  
  // ... rest of code ...
};
```

### Phase 3: Update Creation Flows

```typescript
// When creating new consultation
const ticket = await prisma.consultationTicket.create({
  data: {
    ...ticketData,
    caseNumber: await generateTimestampCaseNumber("CONSULTATION", clinicId),
    caseNumberGeneratedAt: new Date()
  }
});
```

### Phase 4: Handle Existing Records

```typescript
// Migration script to assign numbers to existing consultations
const ticketsWithoutCaseNumber = await prisma.consultationTicket.findMany({
  where: { caseNumber: null }
});

for (const ticket of ticketsWithoutCaseNumber) {
  // Generate based on original creation date
  const caseNumber = await generateTimestampCaseNumber(
    "CONSULTATION",
    ticket.clinicId,
    { createdAt: ticket.createdAt }  // Generate with original date
  );
  
  await prisma.consultationTicket.update({
    where: { id: ticket.id },
    data: { 
      caseNumber,
      caseNumberGeneratedAt: new Date()  // Mark when we assigned it
    }
  });
}
```

---

## ✅ Why This Works

### Ensures Consistency

```
Consultation ID #123
  First access:  "CONS-20260112-00048" → stored
  Second access: "CONS-20260112-00048" ← retrieved from DB
  Third access:  "CONS-20260112-00048" ← retrieved from DB
  Always the same!
```

### Handles Concurrency

```typescript
// Unique constraint prevents duplicates
@@unique([caseNumber])  // Can't have two records with same number

// Lazy generation with idempotency
if (!consultation.caseNumber) {
  await prisma.consultationTicket.update({...})
  // Even if called twice concurrently, update is atomic
}
```

### Maintains Daily Reset

```
Each day, SequenceGenerator counter resets to 1
But stored caseNumber never changes

Jan 11: CONS-20260111-00048 ← Stored forever
Jan 12: CONS-20260112-00048 ← Different consultation, same sequence
```

### Audit & Compliance

```
PhilHealth claims reference: "CONS-20260112-00048"
PDF downloaded multiple times: Always shows "CONS-20260112-00048"
Medical record shows: "CONS-20260112-00048"
Compliance: ✅ Numbers match across all documents
```

---

## Migration Checklist

- [ ] Add `caseNumber` and `caseNumberGeneratedAt` to schema
- [ ] Create database migration
- [ ] Update download-consultation.action.ts (lazy generation)
- [ ] Update download-haf.action.ts (lazy generation)
- [ ] Update download-ekas.action.ts (lazy generation)
- [ ] Update consultation ticket creation endpoints (store on create)
- [ ] Update HAF creation endpoints (store on create)
- [ ] Create backfill script for existing records
- [ ] Test: Download same form twice, verify number matches
- [ ] Test: Verify database unique constraint prevents duplicates
- [ ] Deploy migration to production

---

## Example: Before vs After

### Before (Current - Broken)

```typescript
// download-consultation.action.ts
const caseNumber = await generateTimestampCaseNumber("CONSULTATION", clinicId);
// Generate fresh: "CONS-20260112-00048"

// Call action again
const caseNumber = await generateTimestampCaseNumber("CONSULTATION", clinicId);
// Generate fresh: "CONS-20260112-00049" ← DIFFERENT!
```

### After (Recommended - Fixed)

```typescript
// download-consultation.action.ts
let caseNumber = consultation.caseNumber;

if (!caseNumber) {
  caseNumber = await generateTimestampCaseNumber("CONSULTATION", clinicId);
  await prisma.consultationTicket.update({
    where: { id: consultationId },
    data: { caseNumber }
  });
}

// Use: "CONS-20260112-00048"

// Call action again
let caseNumber = consultation.caseNumber;  // ← From DB

// Use: "CONS-20260112-00048" ← SAME!
```
