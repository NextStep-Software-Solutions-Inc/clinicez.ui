# Phase 2 Implementation Status & Remaining Tasks

## ✅ Completed (Phase 2)

### 1. Foundation Layer
- **Audit Logger** (`src/lib/audit-logger.ts`) - Centralized audit logging with change tracking
- **Demographics Action** (`src/actions/patient-profile/update-demographics.ts`) - Profile updates with field-level permissions
- **Vital Signs Action** (`src/actions/patient-profile/add-vital-sign.ts`) - Vital sign recording

### 2. Pattern Established
All server actions follow consistent architecture:
```
'use server'
1. Import Clerk currentUser
2. Import prisma (default export)
3. Import validation schema
4. Get authenticated user
5. Check permissions (field or section level)
6. Validate input with Zod schema
7. Perform database operation
8. Log audit entry
9. Return typed response
```

## 🔄 Remaining Tasks (Phase 2)

### Critical Field Mappings by Model

**PersonalHistory** (userId unique):
- Schema: smokingStatus, numberOfPacksPerYear, alcoholStatus, numberOfBottlesPerDay, illicitDrugUse, sexuallyActive
- Action: Create OR update (1:1 relation)

**ObGyneHistory** (userId unique, FEMALE only):
- Schema: menarche, lastMenstrualPeriod, menopauseAge, menopauseStatus, ageAtFirstSexualIntercourse, birthControlMethod, menstrualPeriodDuration, menstrualCycleInterval, ...
- Action: Create OR update with cross-field validation
- Add gender check: `user.gender !== 'FEMALE'` → error

**PediatricMeasurement** (multiple records, userId not unique):
- Schema: dateTaken, length, headCircumference, skinfoldThickness, waistCircumference, hipCircumference, limbCircumference, midUpperArmCircumference, remarks
- Action: Create (append new measurement)
- Note: Prisma model uses Decimal type for measurements (from Zod numbers)

**MedicalHistory** (add/remove with duplicate prevention):
- Schema fields: conditionId (Int), details (String)
- Action: Takes array of conditions, compares with existing, adds new, removes old
- Unique constraint: userId + conditionId

**FamilyMedicalHistory** (add/remove):
- Schema fields: conditionId (Int), details (String)
- Action: Similar to medical conditions but for family relations

**PhysicalExamination** (multiple records):
- Schema fields: visualAcuityLeft (String), visualAcuityRight (String), status (String)
- Action: Create new examination record

**PhilHealthRecord** (userId not unique for Prisma, but single active record):
- Schema fields: pin (String, unique), tin (String, unique), philSysId (String, unique), memberTypeId (Int)
- Action: Create OR update
- Note: pin is UNIQUE, not userId - different pattern than others

## 📋 Implementation Checklist for Remaining Actions

### 1. **update-personal-history.ts**
```typescript
// Validate with personalHistorySchema
// Check: userCanEditSection(..., 'personal-history')
// Get current: prisma.personalHistory.findUnique({ where: { userId } })
// If exists: update, else: create
// Fields: smokingStatus, numberOfPacksPerYear, etc. (map from schema)
// Response: { success, error?, message? }
```

### 2. **update-ob-gyne-history.ts**
```typescript
// Add gender check: if (user.gender !== 'FEMALE') return error
// Validate with obGyneHistorySchema
// Check: validateObGyneConsistency(input) - must pass
// Create OR update (userId unique)
// Fields: menarche (Int), lastMenstrualPeriod (Date), etc.
// Response: { success, error?, message? }
```

### 3. **add-pediatric-measurement.ts**
```typescript
// Validate with pediatricMeasurementSchema
// Check: userCanEditSection(..., 'pediatric-measurements')
// Create (NOT update - append new measurement)
// Field mapping: 
//   length → length (Decimal)
//   headCircumference → headCircumference (Decimal)
//   midUpperArmCircumference → midUpperArmCircumference (Decimal)
//   remarks → remarks
// Response: { success, error?, message?, measurementId? }
```

### 4. **update-medical-conditions.ts**
```typescript
// Input: { conditions: Array<{ conditionId, notes }> }
// Get current conditions, find adds/removes
// Delete removed: prisma.medicalHistory.delete
// Create added: prisma.medicalHistory.create with { userId, conditionId, details }
// Note: Field is 'details' in Prisma, 'notes' in schema - map correctly
// Response: { success, error?, message?, addedCount?, removedCount? }
```

### 5. **update-family-medical-conditions.ts**
```typescript
// Same pattern as medical-conditions
// Input: { conditions: Array<{ conditionId, details }> }
// Delete/Create operations
// Response: { success, error?, message?, addedCount?, removedCount? }
```

### 6. **add-physical-examination.ts**
```typescript
// Validate with physicalExaminationSchema
// Check: userCanEditSection(..., 'physical-examination')
// Create new examination (multiple records allowed)
// Fields: visualAcuityLeft, visualAcuityRight, status
// Response: { success, error?, message?, examinationId? }
```

### 7. **update-philhealth-record.ts**
```typescript
// IMPORTANT: Uses 'pin' (not userId) as unique identifier
// Validate with philHealthRecordSchema  
// Find: prisma.philHealthRecord.findFirst({ where: { userId } })
// NOT findUnique - pin is unique, not userId
// Fields: pin, tin, philSysId, memberTypeId
// Response: { success, error?, message? }
```

## 🔧 Common Patterns

### Error Handling for Zod
```typescript
const fieldErrors = validationError.flatten?.().fieldErrors || {}
const errorMessages = Object.entries(fieldErrors)
  .map(([field, errors]: [string, any]) => 
    `${field}: ${Array.isArray(errors) ? errors.join(', ') : String(errors)}`
  )
  .join('; ')
return { success: false, error: `Validation failed: ${errorMessages}` }
```

### Type-Safe User ID
```typescript
// Use parseInt() for string-to-int conversion
const vitalSign = await prisma.vitalSign.create({
  data: {
    userId: parseInt(userId),  // ← IMPORTANT
    // ...rest of fields
  }
})
```

### Audit Logging Pattern
```typescript
await logAudit({
  entityType: AuditEntityType.VITAL_SIGN,
  entityId: vitalSign.id.toString(),
  action: AuditAction.CREATE,
  performedBy: authUser.id,
  targetUser: !isOwn ? userId : undefined,
  metadata: {
    // Include relevant fields for audit trail
    source: 'actionName',
  },
})
```

## 📦 Barrel Export (Already Created)
- File: `src/actions/patient-profile/index.ts`
- Exports all 9 server actions
- Usage: `import { addVitalSign, updateDemographics } from '@/actions/patient-profile'`

## 🎯 Next Phase (Phase 3)
Once all 9 server actions are complete and TypeScript validates:
1. Create reusable form components (FormModal, EditButton, FormField)
2. Build demographics edit form (template)
3. Implement individual forms for each health model
4. Polish UI/UX and testing

## 📝 Notes
- All actions use Clerk for authentication
- All actions check permissions before database operations
- All database mutations are logged for audit trail
- Error messages are user-centric and actionable
- No `any` types - all inputs are validated
