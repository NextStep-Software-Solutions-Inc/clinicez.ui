# Case Number Attachment - Decision & Architecture

## Problem Statement

**Question**: How are case and transaction numbers attached to consultation and health assessment records to ensure consistent numbers for every regeneration?

**Answer**: Currently, they **aren't** - this is a critical issue that needs fixing.

---

## Current State (Broken) ❌

### What Happens Now

```
User creates consultation → Doctor enters notes → Patient downloads form
                                                          ↓
                                              generateTimestampCaseNumber()
                                                          ↓
                                              Generate: "CONS-20260112-00048"
                                                          ↓
                                              PDF uses this number
                                                          ↓
                                     ❌ Number NOT stored anywhere
                                                          ↓
Patient downloads SAME form again → generateTimestampCaseNumber()
                                                          ↓
                                              Generate: "CONS-20260112-00049"
                                                          ↓
                                              ❌ DIFFERENT NUMBER!
```

### Why It's Broken

1. **No Persistent Storage**: Numbers live only in memory during request
2. **No Unique Link**: Consultation record doesn't know its own case number
3. **Regeneration Problem**: Each download creates new number
4. **PhilHealth Incompatibility**: Claim tracking expects consistent numbers
5. **Audit Trail Lost**: No record of original number assignment

### Current Code Evidence

**download-consultation.action.ts:147**

```typescript
const caseNumber = consultation ? 
  await generateTimestampCaseNumber("CONSULTATION", consultation.clinicId) 
  : null;  // ← Generated fresh, not stored
```

**download-haf.action.ts:106**

```typescript
const caseNumber = await generateTimestampCaseNumber("HEALTH_ASSESSMENT");  
// ← Generated fresh, not stored
```

---

## Recommended Solution (Fixed) ✅

### What Should Happen

```
User creates consultation
       ↓
assign caseNumber immediately OR on first download
       ↓
store caseNumber in consultationTicket.caseNumber
       ↓
Patient downloads form multiple times
       ↓
Always retrieve stored caseNumber from database
       ↓
PDF always shows: "CONS-20260112-00048" ✅ CONSISTENT
```

### Architecture Decision

**Two Implementation Approaches:**

#### Option A: Generate on Creation (Recommended)

```typescript
// When consultation is created
const ticket = await prisma.consultationTicket.create({
  data: {
    ...ticketData,
    caseNumber: await generateTimestampCaseNumber("CONSULTATION", clinicId),
    caseNumberGeneratedAt: new Date()
  }
});

// When PDF is downloaded
// Just use: consultation.caseNumber
```

**Advantages**:

- ✅ Case number assigned immediately
- ✅ Clear audit trail
- ✅ Simpler download logic
- ✅ Early validation

**Disadvantages**:

- Requires change to creation endpoints
- More database writes during creation

#### Option B: Lazy Generation (Simpler)

```typescript
// When consultation is created
const ticket = await prisma.consultationTicket.create({
  data: { ...ticketData }  // No case number yet
});

// When PDF is downloaded (first time)
let caseNumber = consultation.caseNumber;
if (!caseNumber) {
  caseNumber = await generateTimestampCaseNumber("CONSULTATION", clinicId);
  await prisma.consultationTicket.update({
    where: { id: consultationId },
    data: { caseNumber, caseNumberGeneratedAt: new Date() }
  });
}
// Use caseNumber for PDF
```

**Advantages**:

- ✅ No changes to creation endpoints
- ✅ Minimal code changes
- ✅ Backward compatible

**Disadvantages**:

- First download is slower (generates & stores)
- Case number only assigned on first download

### **Recommendation**: Use Option B (Lazy Generation)

- Less invasive to current code
- All changes in download actions
- Backward compatible
- Can migrate to Option A later if needed

---

## Architecture Diagram

### Current (Broken) - Numbers Lost After Request

```
┌──────────────────┐
│ ConsultationTicket  │
│ #123             │
│ caseNumber: null │ ← Not stored!
└────────┬─────────┘
         │
         │ downloadConsultationAction()
         │
         ├─→ CALL generateTimestampCaseNumber()
         │   ↓
         │   SequenceGenerator.increment()
         │   ↓
         │   Return: "CONS-20260112-00048"
         │   ↓
         │   USE IN PDF
         │   ↓
         │   LOST (not saved)
         │
         │ downloadConsultationAction() AGAIN
         │
         └─→ CALL generateTimestampCaseNumber()
             ↓
             SequenceGenerator.increment()
             ↓
             Return: "CONS-20260112-00049" ❌ WRONG!
```

### Recommended (Fixed) - Numbers Stored in Database

```
┌──────────────────────────────────┐
│ ConsultationTicket #123          │
│ caseNumber: null                 │
│ caseNumberGeneratedAt: null      │
└────────┬─────────────────────────┘
         │
         │ downloadConsultationAction() [FIRST TIME]
         │
         ├─→ IF caseNumber IS NULL:
         │   │
         │   ├─→ CALL generateTimestampCaseNumber()
         │   │   ↓
         │   │   SequenceGenerator.increment()
         │   │   ↓
         │   │   Return: "CONS-20260112-00048"
         │   │
         │   └─→ UPDATE ConsultationTicket
         │       data: {
         │         caseNumber: "CONS-20260112-00048" ✅
         │         caseNumberGeneratedAt: NOW()
         │       }
         │
         └─→ USE caseNumber IN PDF

┌──────────────────────────────────┐
│ ConsultationTicket #123          │
│ caseNumber: "CONS-20260112..."   │ ← NOW STORED!
│ caseNumberGeneratedAt: 2026-01-12│
└────────┬─────────────────────────┘
         │
         │ downloadConsultationAction() [SECOND TIME]
         │
         ├─→ IF caseNumber IS NOT NULL:
         │   └─→ RETRIEVE STORED: "CONS-20260112-00048"
         │
         └─→ USE caseNumber IN PDF ✅ SAME!
```

---

## Database Design

### Schema Changes

```prisma
model ConsultationTicket {
  id          Int
  
  // Existing fields...
  patientId   Int
  clinicId    Int
  
  // NEW FIELDS FOR CASE NUMBER:
  caseNumber                String?   @unique      // The actual number
  caseNumberGeneratedAt     DateTime?              // When it was assigned
  
  // Indexes
  @@unique([caseNumber])        // No duplicates
  @@index([caseNumber])         // Fast lookups
  
  // Existing indexes...
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### Key Constraints

| Constraint | Purpose |
|-----------|---------|
| `@unique` | Each number appears only once |
| `@@index([caseNumber])` | Fast lookup by case number |
| `caseNumberGeneratedAt` | Audit trail of when number was assigned |

---

## Flow Diagram: Ensuring Consistency

### Idempotent Generation (Key to Consistency)

```
┌─────────────────────────────────────┐
│ generateCaseNumber(entityType, clinicId)
│                                      │
│ IDEMPOTENT:                         │
│ - Multiple calls return same value  │
│ - As long as DB still has same row  │
└──────────────┬──────────────────────┘
               │
        ┌──────┴──────┐
        │             │
        ↓             ↓
      FIRST        SECOND+
      CALL         CALLS
        │             │
        ├─ Generate  ├─ DB Has
        │   number   │   number
        │   "CONS... │   "CONS...
        │            │
        └─ STORE ────└─ RETRIEVE
           IN DB        FROM DB
           
        Both return: "CONS-20260112-00048"
        ✅ CONSISTENT
```

---

## Comparison: Different Scenarios

### Scenario 1: Single Download

```
Action                  | Current | Fixed
────────────────────────┼─────────┼─────────
generateNumber()        | Yes     | Yes
StoreNumber()           | ❌ No   | ✅ Yes
Result in PDF           | OK      | ✅ OK
Result in DB            | ❌ Lost | ✅ Stored
```

### Scenario 2: Multiple Downloads (Same Day)

```
Download 1: 
  Current: Generate "CONS-20260112-00048" → Use → Lost ❌
  Fixed: Generate "CONS-20260112-00048" → Store → Use ✅

Download 2:
  Current: Generate "CONS-20260112-00049" → Use ❌ WRONG!
  Fixed: Retrieve "CONS-20260112-00048" → Use ✅ CORRECT!

Download 3:
  Current: Generate "CONS-20260112-00050" → Use ❌ WRONG!
  Fixed: Retrieve "CONS-20260112-00048" → Use ✅ CORRECT!
```

### Scenario 3: Concurrent Downloads

```
Download A & B happen simultaneously:

Current (Broken):
  A: Generate seq#48 → "CONS-20260112-00048"
  B: Generate seq#49 → "CONS-20260112-00049" ❌ DIFFERENT!

Fixed:
  A: Check DB→null, Generate seq#48 → Store → "CONS-20260112-00048"
  B: Check DB→has value, Retrieve → "CONS-20260112-00048" ✅ SAME!
```

---

## Atomic Operation Guarantee

### Why Storing Works Even With Concurrency

```typescript
// Atomic operation in database transaction
await prisma.$transaction(async (tx) => {
  // Check current state
  const ticket = await tx.consultationTicket.findUnique({
    where: { id: 123 }
  });
  
  if (!ticket.caseNumber) {
    // Generate new
    const newCaseNumber = await generateTimestampCaseNumber(...);
    
    // Store atomically
    await tx.consultationTicket.update({
      where: { id: 123 },
      data: { caseNumber: newCaseNumber }
    });
  }
});

// Even if called concurrently:
// Thread A and B both arrive at caseNumber=null
// Thread A wins, stores caseNumber
// Thread B sees caseNumber already exists, uses it
// Both get same result ✅
```

---

## Impact Assessment

### What Breaks Now (Without Fix)

- ❌ Same consultation shows different numbers
- ❌ PhilHealth claim tracking fails
- ❌ Audit trails are inconsistent
- ❌ Medical records have conflicting case numbers
- ❌ EKAS forms reference wrong numbers

### What Works After Fix

- ✅ Same consultation always shows same number
- ✅ PhilHealth tracking works
- ✅ Audit trail clear
- ✅ Medical records consistent
- ✅ EKAS forms reference correct numbers

---

## Rollout Plan

### Phase 1: Code & Schema

1. Update schema (add columns)
2. Create migration
3. Update download actions
4. Test thoroughly

### Phase 2: Deployment

1. Deploy migration to production
2. Deploy updated code
3. Run for a few days (new records get numbers on download)

### Phase 3: Backfill

1. Run backfill script for existing records
2. Assign numbers retroactively using original creation dates
3. Verify all records have numbers

### Phase 4: Verification

1. Test re-downloads (verify same number)
2. Check audit logs (verify timestamps)
3. Monitor for issues

---

## Key Takeaways

| Item | Details |
|------|---------|
| **Problem** | Numbers generated fresh each time, never stored |
| **Impact** | Same document gets different numbers on re-download |
| **Solution** | Store case number in database, retrieve on re-download |
| **Storage** | Add `caseNumber` column to ConsultationTicket & HealthAssessment |
| **Implementation** | Lazy generation (generate once on first download, store, reuse) |
| **Effort** | Medium (schema change + 3 action files) |
| **Risk** | Low (backward compatible, only adds fields) |
| **Benefit** | Consistency, auditability, PhilHealth compatibility |
