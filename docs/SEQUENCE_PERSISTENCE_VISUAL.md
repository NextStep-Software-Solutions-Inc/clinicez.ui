# Sequence Number Persistence - Visual Flow

## Daily Sequence Reset Lifecycle

```
┌─────────────────────────────────────────────────────────────────┐
│ Application generates numbers throughout the day                 │
└─────────────────────────────────────────────────────────────────┘

   January 11, 2026                          January 12, 2026
   ─────────────────────────────────────     ─────────────────────

   08:00 AM
   generateTimestampCaseNumber("CONSULTATION", clinicId=5)
   ↓
   Check SequenceGenerator:
   entityType='CONSULTATION'
   clinicId=5
   date='20260111'
   
   No row found? CREATE:
   ┌──────────────────────────────────────┐
   │ SequenceGenerator                    │
   ├──────────────────────────────────────┤
   │ id: 1                                │
   │ entityType: "CONSULTATION"           │
   │ clinicId: 5                          │
   │ date: "20260111"                     │
   │ currentValue: 0 → increment → 1      │
   └──────────────────────────────────────┘
   
   Return: "CONS-20260111-00001"
   
   08:15 AM
   generateTimestampCaseNumber("CONSULTATION", clinicId=5)
   ↓
   Row EXISTS, increment:
   ┌──────────────────────────────────────┐
   │ SequenceGenerator (id: 1)            │
   ├──────────────────────────────────────┤
   │ currentValue: 1 → increment → 2      │
   └──────────────────────────────────────┘
   
   Return: "CONS-20260111-00002"
   
   12:00 PM  [Many more generations...]
   
   11:50 PM
   generateTimestampCaseNumber("CONSULTATION", clinicId=5)
   ↓
   ┌──────────────────────────────────────┐
   │ SequenceGenerator (id: 1)            │
   ├──────────────────────────────────────┤
   │ currentValue: 47 → increment → 48    │
   └──────────────────────────────────────┘
   
   Return: "CONS-20260111-00048"
   
   
                    🌙 MIDNIGHT PASSES 🌙
   
   
   12:00 AM (Next Day)
   generateTimestampCaseNumber("CONSULTATION", clinicId=5)
   ↓
   Check SequenceGenerator:
   entityType='CONSULTATION'
   clinicId=5
   date='20260112'  ← NEW DATE KEY!
   
   No row found? CREATE NEW:
   ┌──────────────────────────────────────┐
   │ SequenceGenerator (id: 2) ← NEW      │
   ├──────────────────────────────────────┤
   │ entityType: "CONSULTATION"           │
   │ clinicId: 5                          │
   │ date: "20260112"  ← NEW DATE        │
   │ currentValue: 0 → increment → 1      │
   └──────────────────────────────────────┘
   
   Return: "CONS-20260112-00001"  ← RESET TO 1!
```

## Concurrent Access - Transaction Safety

```
Request A                              Request B
(Both at 08:00:05)                    (Both at 08:00:05)
─────────────────────────────────────────────────────

generateTimestampCaseNumber()        generateTimestampCaseNumber()
↓                                    ↓
START TRANSACTION A              START TRANSACTION B
↓                                ↓
LOCK SequenceGenerator           WAITS FOR LOCK...
row (entityType, clinicId, date) 
↓
currentValue = 1
↓
UNLOCK (Increment to 2)
↓
COMMIT TRANSACTION A
│
└─────────────────────→ LOCK ACQUIRED by B
                        ↓
                        currentValue = 2
                        ↓
                        UNLOCK (Increment to 3)
                        ↓
                        COMMIT TRANSACTION B

Return: "CONS-20260112-00001"  Return: "CONS-20260112-00002"

✅ NO DUPLICATES - Transactions ensure atomic read-modify-write
```

## Database Schema Relationships

```
┌─────────────────────────┐
│    SequenceGenerator    │
├─────────────────────────┤
│ id (PK)                 │
│ entityType              │
│ clinicId (FK) ──┐       │
│ date            │       │
│ currentValue    │       │
│ createdAt       │       │
│ updatedAt       │       │
├─────────────────────────┤
│ UNIQUE(entityType,      │ ← Ensures one per entity/clinic/day
│        clinicId,        │
│        date)            │
│ INDEX(clinicId, date)   │ ← Fast lookups
│ INDEX(date)             │
└─────────────────────────┘
                │
                │ @relation(fields: [clinicId], references: [id])
                │ onDelete: Cascade
                ↓
        ┌──────────────┐
        │   Clinic     │
        ├──────────────┤
        │ id (PK)      │
        │ ...          │
        └──────────────┘
```

## Sequence Generation Flow Diagram

```
User Action (Download Form, Create Consultation, etc.)
        ↓
    Action/Route Handler
        ↓
    generateTimestampCaseNumber(entityType, clinicId?)
        ↓
    ┌─────────────────────────────────────────┐
    │ Get Today's Date in YYYYMMDD format     │
    │ Example: new Date() → "20260112"        │
    └─────────────────────────────────────────┘
        ↓
    START DATABASE TRANSACTION
        ↓
    ┌─────────────────────────────────────────┐
    │ Query SequenceGenerator Table:          │
    │ WHERE entityType=?                      │
    │   AND clinicId=?                        │
    │   AND date='20260112'                   │
    └─────────────────────────────────────────┘
        ↓
    Does row exist?
    │
    ├─ NO ──→ CREATE new row with currentValue=1 ──┐
    │                                              │
    └─ YES ──→ Increment currentValue: n → (n+1) ──┤
                                                    ↓
                                        ┌──────────────────────┐
                                        │ Retrieve new value   │
                                        │ seqNum = currentValue│
                                        └──────────────────────┘
                                                    ↓
                                        COMMIT TRANSACTION
                                                    ↓
                                        ┌──────────────────────┐
                                        │ Format Number:       │
                                        │ PREFIX-DATE-SEQNUM   │
                                        │ E.g. CONS-20260112   │
                                        │      -00001          │
                                        └──────────────────────┘
                                                    ↓
                                        Return to caller
```

## Entity Types & Scope

```
Entity Type              | Clinic Scoped? | Prefix | Max/Day  | Use Case
─────────────────────────┼────────────────┼────────┼──────────┼──────────────────
CONSULTATION             | YES (clinicId) | CONS   | 99,999   | Consultation tickets
HEALTH_ASSESSMENT        | NO (null)      | HAFT   | 99,999   | Health assessment forms
EKAS_TRANSACTION         | YES (clinicId) | EKAS   | 999,999  | EKAS transactions
EKAS_AUTH_CODE           | YES (clinicId) | PHK    | 999,999  | EKAS auth codes

Example with Clinic ID=5:
CONS-20260112-00001    (Consultation at clinic 5)
HAFT-20260112-00001    (Personal health assessment)
EKAS-C5-20260112-000001 (EKAS transaction at clinic 5)
PHK-C5-20260112-000001  (EKAS auth at clinic 5)
```

## Performance Characteristics

```
Operation          | Time    | Why
───────────────────┼─────────┼──────────────────────────────────
First of Day       | ~5ms    | CREATE new row (index hit)
Regular Gen        | ~2ms    | UPDATE existing row (locked)
Peak Load (100/sec)| ~50ms   | Queue behind locks, exponential backoff

Indexes Used:
- PRIMARY: (id)
- UNIQUE: (entityType, clinicId, date) ← Fast lookups
- COMPOSITE: (clinicId, date) ← For multi-clinic queries
- SIMPLE: (date) ← Time-range queries
```

## Error Scenarios & Recovery

```
Scenario 1: Sequence Limit Exceeded
─────────────────────────────────────
currentValue = 99999
generateTimestampCaseNumber("CONSULTATION", clinicId)
        ↓
Query finds: currentValue >= 99999
        ↓
Throw SequenceGenerationError
        ↓
Client receives error → Notify admin
Recovery: Very rare (needs 99k consultations in one day)

Scenario 2: Clock Skew (Server time goes backward)
──────────────────────────────────────────────────
Current: 20260112
generateTimestampCaseNumber() called with createdAt=20260111
        ↓
dateKey = "20260111" (past)
        ↓
Check for YESTERDAY'S row exists? 
        ├─ YES → Increment that row (data goes back in time)
        └─ NO → Create new row for 20260111
        ↓
Unusual but handled gracefully via `createdAt` option

Scenario 3: Database Connection Lost
─────────────────────────────────────
withRetry(fn, maxRetries=3, baseDelay=100ms)
Attempt 1: FAIL → Wait 100ms
Attempt 2: FAIL → Wait 200ms  
Attempt 3: FAIL → Throw error
        ↓
Action fails, user retries
```
