# Case Number Attachment - Summary

## The Issue (Current Implementation)

**Question**: How are case numbers attached to consultation/health assessment records to ensure the same number on re-generation?

**Answer**: They aren't - this is the problem! 🔴

### Current Broken Flow

```
Consultation created → Download form → Generate "CONS-20260112-00048"
                   ↓
             Download again → Generate "CONS-20260112-00049" ❌ DIFFERENT!
```

**Why it's broken:**

- Numbers are generated **fresh every time**
- Nothing stores the number in the database
- Same consultation gets different numbers each time
- PhilHealth tracking breaks

---

## The Solution (Recommended)

Store case numbers in the database when first generated, then reuse them.

### Fixed Flow

```
Consultation created
       ↓
First download → Generate "CONS-20260112-00048" → **Store in DB**
       ↓
Download again → Retrieve "CONS-20260112-00048" from DB ✅ SAME!
```

### What Needs to Change

**1. Database Schema**

```prisma
model ConsultationTicket {
  id          Int
  // ... existing fields ...
  
  // ADD THESE:
  caseNumber   String?   @unique
  caseNumberGeneratedAt DateTime?
}

model HealthAssessment {
  // Same addition
  caseNumber   String?   @unique
  caseNumberGeneratedAt DateTime?
}
```

**2. Download Action Logic**

```typescript
export const downloadConsultationAction = async (consultationId) => {
  const consultation = await prisma.consultationTicket.findUnique({
    where: { id: consultationId }
  });
  
  // Use stored if exists, otherwise generate and store
  let caseNumber = consultation.caseNumber;
  
  if (!caseNumber) {
    caseNumber = await generateTimestampCaseNumber("CONSULTATION", consultation.clinicId);
    
    // STORE IT
    await prisma.consultationTicket.update({
      where: { id: consultationId },
      data: {
        caseNumber,
        caseNumberGeneratedAt: new Date()
      }
    });
  }
  
  // Use this number for PDF
  const pdfData = generatePdf(..., { caseNumber });
  return pdfData;
};
```

---

## Why This Matters

| Impact | Without Storage | With Storage |
|--------|-----------------|--------------|
| **Same document, same number** | ❌ No | ✅ Yes |
| **PhilHealth claims** | ❌ Broken | ✅ Works |
| **Audit trail** | ❌ Lost | ✅ Tracked |
| **Compliance** | ❌ Fails | ✅ Passes |
| **Medical records** | ❌ Inconsistent | ✅ Consistent |

---

## How It Ensures Consistency

### Database Design

- **Unique constraint**: `@@unique([caseNumber])`
  - Prevents duplicate numbers
  - Two consultations can't have same number

- **Timestamp**: `caseNumberGeneratedAt`
  - Shows exactly when number was assigned
  - Audit trail

### Atomic Operation

- Generate and store in single transaction
- If multiple downloads happen concurrently:
  - First one: Creates/stores number
  - Second one: Uses stored number
  - Both consistent ✅

### Daily Reset Still Works

```
SequenceGenerator Counter resets daily:
Jan 11: 99999 (maxed out)
Jan 12: 1 (resets)

But stored numbers never change:
Consultation A: CONS-20260111-00047 ← Permanent
Consultation B: CONS-20260112-00001 ← Permanent
```

---

## Implementation Checklist

- [ ] Add `caseNumber` and `caseNumberGeneratedAt` columns to schema
- [ ] Run database migration
- [ ] Update `download-consultation.action.ts` (add storage logic)
- [ ] Update `download-haf.action.ts` (add storage logic)
- [ ] Update `download-ekas.action.ts` (link to consultation case number)
- [ ] Update consultation creation endpoints (generate and store on create)
- [ ] Update health assessment creation endpoints (generate and store on create)
- [ ] Create backfill script for existing records without numbers
- [ ] Test: Download same form multiple times, verify same number
- [ ] Test: Verify unique constraint prevents duplicates
- [ ] Deploy to production

---

## Migration Strategy

### For Existing Records

```typescript
// Script to assign numbers to consultations created before this feature
const ticketsWithoutNumbers = await prisma.consultationTicket.findMany({
  where: { caseNumber: null }
});

for (const ticket of ticketsWithoutNumbers) {
  // Generate number based on original creation date
  const caseNumber = await generateTimestampCaseNumber(
    "CONSULTATION",
    ticket.clinicId,
    { createdAt: ticket.createdAt }  // Use original date
  );
  
  // Store it
  await prisma.consultationTicket.update({
    where: { id: ticket.id },
    data: {
      caseNumber,
      caseNumberGeneratedAt: ticket.createdAt
    }
  });
}
```

---

## Files to Modify

1. **prisma/schema.prisma**
   - Add `caseNumber` to `ConsultationTicket`
   - Add `caseNumber` to `HealthAssessment`
   - Add `caseNumberGeneratedAt` to both

2. **src/actions/phr/download-consultation.action.ts**
   - Check for existing `caseNumber`
   - Generate once if missing
   - Store result

3. **src/actions/phr/download-haf.action.ts**
   - Same pattern as consultation

4. **src/actions/phr/download-ekas.action.ts**
   - Use consultation's stored case number
   - Or generate once if standalone

5. **src/actions/consultation/create-consultation.action.ts** (if exists)
   - Generate case number on ticket creation
   - Store immediately

---

## Example: Before & After

### Before (Broken)

```typescript
// download-consultation.action.ts
const caseNumber = await generateTimestampCaseNumber("CONSULTATION", clinicId);

// Call 1: "CONS-20260112-00048"
// Call 2: "CONS-20260112-00049" ← WRONG!
// Call 3: "CONS-20260112-00050" ← WRONG!
```

### After (Fixed)

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

// Call 1: "CONS-20260112-00048" ← Generated & stored
// Call 2: "CONS-20260112-00048" ← Retrieved from DB ✅
// Call 3: "CONS-20260112-00048" ← Retrieved from DB ✅
```

---

## Key Takeaway

**Current**: Numbers are generated fresh every time (❌ broken)
**Recommended**: Numbers are generated once and stored forever (✅ fixed)

This ensures:

- ✅ Same consultation always has same case number
- ✅ PhilHealth tracking works correctly
- ✅ Medical records are consistent
- ✅ Audit trail is permanent
