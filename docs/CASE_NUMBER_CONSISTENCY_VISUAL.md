# Case Number Attachment & Consistency - Visual Guide

## Problem Visualization

### Current (Broken) Flow: Fresh Generation Every Time

```
┌─────────────────────────────────────────────────────────────────────┐
│ ConsultationTicket #123                                             │
│ - Patient: John Doe                                                 │
│ - Clinic: 5                                                         │
│ - Created: Jan 12, 2026 08:00 AM                                   │
│ - caseNumber: [NULL] ← Not stored!                                 │
└─────────────────────────────────────────────────────────────────────┘
        ↓
        
User clicks "Download Consultation Form" at 08:15 AM
        ↓
downloadConsultationAction(consultationTicketId=123)
        ↓
generateTimestampCaseNumber("CONSULTATION", clinicId=5)
        ↓
SequenceGenerator query (today 20260112):
  currentValue: 47 → increment → 48
        ↓
Generate: "CONS-20260112-00048"
        ↓
PDF created with: "CONS-20260112-00048"
        ↓
❌ Number NOT stored anywhere!
        ↓
═══════════════════════════════════════════════════════════════════════
        ↓
User clicks "Download Again" at 10:30 AM (same form)
        ↓
downloadConsultationAction(consultationTicketId=123)
        ↓
generateTimestampCaseNumber("CONSULTATION", clinicId=5)
        ↓
SequenceGenerator query (today 20260112):
  currentValue: 48 → increment → 49  ← DIFFERENT!
        ↓
Generate: "CONS-20260112-00049"
        ↓
❌ PDF created with DIFFERENT number: "CONS-20260112-00049"
        ↓
PROBLEM: Same consultation, different numbers!
```

### Recommended (Fixed) Flow: Generate Once, Store Forever

```
┌─────────────────────────────────────────────────────────────────────┐
│ ConsultationTicket #123                                             │
│ - Patient: John Doe                                                 │
│ - Clinic: 5                                                         │
│ - Created: Jan 12, 2026 08:00 AM                                   │
│ - caseNumber: [NULL] ← First download will populate                │
│ - caseNumberGeneratedAt: null                                      │
└─────────────────────────────────────────────────────────────────────┘
        ↓
        
User clicks "Download Consultation Form" at 08:15 AM
        ↓
downloadConsultationAction(consultationTicketId=123)
        ↓
Check database: consultation.caseNumber = null
        ↓
if (!caseNumber) {  ← First time
  caseNumber = generateTimestampCaseNumber("CONSULTATION", clinicId=5)
        ↓
  SequenceGenerator query (today 20260112):
    currentValue: 47 → increment → 48
        ↓
  Generate: "CONS-20260112-00048"
        ↓
  UPDATE ConsultationTicket:
    - caseNumber = "CONS-20260112-00048"  ← NOW STORED!
    - caseNumberGeneratedAt = Jan 12, 2026 08:15 AM
}
        ↓
PDF created with: "CONS-20260112-00048"
        ↓

┌─────────────────────────────────────────────────────────────────────┐
│ ConsultationTicket #123 (UPDATED)                                   │
│ - caseNumber: "CONS-20260112-00048" ✅ STORED                      │
│ - caseNumberGeneratedAt: Jan 12 08:15 AM ✅ TRACKED                │
└─────────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════
        ↓
User clicks "Download Again" at 10:30 AM (same form)
        ↓
downloadConsultationAction(consultationTicketId=123)
        ↓
Check database: consultation.caseNumber = "CONS-20260112-00048"
        ↓
if (!caseNumber) {  ← FALSE, already exists!
  // Skip generation, use stored value
}
        ↓
Use: "CONS-20260112-00048"  ← SAME NUMBER!
        ↓
PDF created with: "CONS-20260112-00048"  ← CONSISTENT!
        ↓
✅ Same consultation, same number every time!
```

---

## State Diagram: Case Number Lifecycle

```
                    ┌──────────────────┐
                    │  Consultation    │
                    │  Created         │
                    │ caseNumber: null │
                    └────────┬─────────┘
                             │
                             │ User downloads PDF (1st time)
                             ↓
                    ┌──────────────────────────┐
                    │  Generate case number    │
                    │  CONS-20260112-00048     │
                    └────────┬─────────────────┘
                             │
                             │ Store in database
                             ↓
                    ┌──────────────────────────────┐
                    │ Consultation Updated         │
                    │ caseNumber: CONS-20260112... │
                    │ generatedAt: Jan 12 08:15 AM │
                    └────────┬─────────────────────┘
                             │
                ┌────────────┴────────────┐
                │                         │
          Download PDF (2nd)        Download PDF (3rd)
          Use stored number         Use stored number
          CONS-20260112-...         CONS-20260112-...
          ✅ SAME                    ✅ SAME
```

---

## Entity Relationship Diagram

### Current (Broken)

```
┌──────────────────────────────────────────────────────────────┐
│ SequenceGenerator (Transient)                                │
├──────────────────────────────────────────────────────────────┤
│ id: 1                                                        │
│ entityType: "CONSULTATION"                                   │
│ clinicId: 5                                                  │
│ date: "20260112"                                             │
│ currentValue: 49  ← Counter increments, but...               │
└──────────────────────────────────────────────────────────────┘
        ↑
        │ Generate fresh each time
        │
        ├─→ Download 1: "CONS-20260112-00048"
        │   ❌ Not linked to ConsultationTicket
        │
        ├─→ Download 2: "CONS-20260112-00049"
        │   ❌ Not linked to ConsultationTicket
        │
        └─→ Download 3: "CONS-20260112-00050"
            ❌ Not linked to ConsultationTicket

┌──────────────────────────────────────────────────────────────┐
│ ConsultationTicket #123                                      │
├──────────────────────────────────────────────────────────────┤
│ id: 123                                                      │
│ patientId: 456                                               │
│ clinicId: 5                                                  │
│ caseNumber: null  ← NO LINK TO SEQUENCE!                   │
│ createdAt: Jan 12 08:00 AM                                  │
│ updatedAt: Jan 12 08:00 AM                                  │
└──────────────────────────────────────────────────────────────┘

Problem: Numbers generated but never attached to record
```

### Recommended (Fixed)

```
┌──────────────────────────────────────────────────────────────┐
│ SequenceGenerator                                            │
├──────────────────────────────────────────────────────────────┤
│ id: 1                                                        │
│ entityType: "CONSULTATION"                                   │
│ clinicId: 5                                                  │
│ date: "20260112"                                             │
│ currentValue: 48  ← Used once for this ticket                │
└──────────────────────────────────────────────────────────────┘
        │
        │ Generate once
        │
        └─→ "CONS-20260112-00048"
            │
            ├─ Store in ConsultationTicket
            │
            └─ Use forever for this record

┌──────────────────────────────────────────────────────────────┐
│ ConsultationTicket #123                                      │
├──────────────────────────────────────────────────────────────┤
│ id: 123                                                      │
│ patientId: 456                                               │
│ clinicId: 5                                                  │
│ caseNumber: "CONS-20260112-00048" ✅ LINKED!               │
│ caseNumberGeneratedAt: Jan 12 08:15 AM                     │
│ createdAt: Jan 12 08:00 AM                                  │
│ updatedAt: Jan 12 08:15 AM                                  │
└──────────────────────────────────────────────────────────────┘

Benefits:
- Unique constraint: @@unique([caseNumber])
- Can index: @@index([caseNumber])
- Fast lookup: O(1) by caseNumber
- Consistent: Same consultation → same number
- Auditable: Tracked when generated
```

---

## Timeline: Same Consultation, Multiple Downloads

### Broken (Current)

```
Time     | Action                        | SequenceGen Counter | PDF Number      | DB Storage
─────────┼───────────────────────────────┼────────────────────┼─────────────────┼──────────────
08:00 AM | Ticket created                | 0                  | -               | null
08:15 AM | Download 1                    | 47 → 48            | 00048           | null ❌
08:30 AM | Download 2                    | 48 → 49            | 00049           | null ❌
08:45 AM | Download 3                    | 49 → 50            | 00050           | null ❌
10:30 AM | Download 4                    | 50 → 51            | 00051           | null ❌

Problem: Four different numbers for same document!
PhilHealth: Confused about which number to reference
```

### Fixed (Recommended)

```
Time     | Action                        | SequenceGen Counter | PDF Number      | DB Storage
─────────┼───────────────────────────────┼────────────────────┼─────────────────┼──────────────
08:00 AM | Ticket created                | 0                  | -               | null
08:15 AM | Download 1 (1st time)         | 47 → 48            | 00048           | 00048 ✅
08:30 AM | Download 2 (use stored)       | 48 (no change)     | 00048           | 00048 ✅
08:45 AM | Download 3 (use stored)       | 48 (no change)     | 00048           | 00048 ✅
10:30 AM | Download 4 (use stored)       | 48 (no change)     | 00048           | 00048 ✅

Benefit: Same number forever!
PhilHealth: Clear reference: "CONS-20260112-00048"
```

---

## Database Query Flow

### Current (Every Download)

```
Each downloadConsultationAction call:

1. SELECT ConsultationTicket WHERE id=123
   → Returns: {id:123, caseNumber:null, ...}

2. CALL generateTimestampCaseNumber(...)
   → SELECT SequenceGenerator WHERE entityType=... AND date=...
   → UPDATE SequenceGenerator SET currentValue=currentValue+1
   → Increment: 47→48, 48→49, 49→50, etc.

3. Generate PDF with whatever number was returned
   → DONE, number is lost after request

Total DB writes per download: 1 (read) + 2 (read+write in sequence)
Total storage of number: 0 ❌
```

### Recommended (Lazy Generation)

```
First downloadConsultationAction call:

1. SELECT ConsultationTicket WHERE id=123
   → Returns: {id:123, caseNumber:null, ...}

2. IF caseNumber IS NULL:
   3. CALL generateTimestampCaseNumber(...)
      → SELECT SequenceGenerator WHERE entityType=... AND date=...
      → UPDATE SequenceGenerator SET currentValue=currentValue+1
      
   4. UPDATE ConsultationTicket 
      SET caseNumber='CONS-20260112-00048', 
          caseNumberGeneratedAt=NOW()
      WHERE id=123

Total DB writes: 1 (read) + 2 (sequence) + 1 (update ticket) = 4 ops

Second downloadConsultationAction call:

1. SELECT ConsultationTicket WHERE id=123
   → Returns: {id:123, caseNumber:'CONS-20260112-00048', ...}
   
2. IF caseNumber IS NOT NULL:
   → Use stored value, skip generation

Total DB writes: 1 (read) ✅ Much faster!
```

---

## Comparison Table

| Scenario | Current | Recommended |
|----------|---------|-------------|
| **Download 1st time** | Generate fresh, use | Generate once, store |
| **Download 2nd time** | Generate again ❌ | Retrieve from DB ✅ |
| **Download 10th time** | Generate again ❌ | Retrieve from DB ✅ |
| **PDF Number Changes** | Yes, every time | No, always same |
| **Database Lookup** | No storage | Indexed query |
| **PhilHealth Reference** | Unclear (multiple) | Clear (single) |
| **Audit Trail** | Lost | Permanent record |
| **Unique Constraint** | No | Yes |
| **Performance** | Same all times | Better after 1st |
| **Consistency** | ❌ Broken | ✅ Fixed |

---

## Migration Impact

```
Before Migration:
┌────────────────────────────────────┐
│ ConsultationTicket                 │
├────────────────────────────────────┤
│ id                                 │
│ patientId                          │
│ clinicId                           │
│ createdAt                          │
│ updatedAt                          │
└────────────────────────────────────┘
      ↓
      ↓ Add columns
      ↓

After Migration:
┌────────────────────────────────────┐
│ ConsultationTicket                 │
├────────────────────────────────────┤
│ id                                 │
│ patientId                          │
│ clinicId                           │
│ caseNumber         ← NEW ✅        │
│ caseNumberGeneratedAt ← NEW ✅     │
│ createdAt                          │
│ updatedAt                          │
└────────────────────────────────────┘
      ↓
      ↓ Run backfill script
      ↓

Populated:
┌────────────────────────────────────┐
│ ConsultationTicket #123            │
├────────────────────────────────────┤
│ caseNumber: "CONS-20260111-00047"  │
│ caseNumberGeneratedAt: (original   │
│   creation date)                   │
└────────────────────────────────────┘
```
