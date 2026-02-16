# Patient Health Records Editing Implementation Plan

**Status**: Comprehensive Planning Phase  
**Complexity**: Large (10+ models, 150+ fields)  
**Estimated Timeline**: 3-5 sprints  
**Priority**: High (Core feature)

---

## 📋 Executive Summary

This document outlines a detailed plan for implementing full editing functionality for the Patient Health Records system. The current system displays comprehensive health data across 5 tabs. The editing feature will allow patients and healthcare providers to update their health information through a modal-based or inline editing interface.

**Key Facts:**

- **11 Health Record Models** to support
- **150+ individual fields** across all models
- **3 Complexity Tiers**: Simple (strings/dates), Intermediate (relations), Complex (arrays)
- **2 User Roles**: Patient (self-edit), Healthcare Provider (professional edit)

---

## 🗂️ SCHEMA ANALYSIS & FIELD MAPPING

### Model 1: User (Demographics)

**Location**: Prisma User model  
**Edit Scope**: Demographics tab + Profile header

| Field | Type | Required | Optional | Validation | Notes |
|-------|------|----------|----------|-----------|-------|
| firstName | String | ✓ | | Min 1, Max 100 | Key field |
| middleName | String | | ✓ | Max 100 | |
| lastName | String | ✓ | | Min 1, Max 100 | Key field |
| suffix | String | | ✓ | Max 20 | E.g., "Jr", "Sr" |
| nickname | String | | ✓ | Max 100 | |
| email | String | ✓ | | Valid email | System - may be read-only |
| mobile | String | | ✓ | Phone format | E.g., +63912345678 |
| telephone | String | | ✓ | Phone format | Landline |
| dob | Date | | ✓ | Past date | Calculates age automatically |
| gender | Enum | | ✓ | MALE\|FEMALE\|OTHER | Affects OB/Gyn visibility |
| bloodType | Enum | | ✓ | BloodType enum | Displayed as O+, AB-, etc |
| civilStatus | Enum | | ✓ | SINGLE\|MARRIED\|etc | |
| placeOfBirth | String | | ✓ | Max 200 | City/Province |
| nationality | String | | ✓ | Max 100 | Country name |
| religion | String | | ✓ | Max 100 | |
| picture | String | | ✓ | Image URL | Profile photo |

**Read-Only Fields:**

- `id`, `userId` (system generated)
- `createdAt`, `updatedAt` (system managed)
- `caseNumber` (clinic assigned)
- `accountType`, `claimedAt`, `claimedBy` (system managed)

**Validation Rules:**

```typescript
// Age must be > 0 and < 150
age: dob ? Math.floor((Date.now() - new Date(dob)) / (365.25 * 24 * 60 * 60 * 1000)) : null
// Must pass 0 < age < 150
```

---

### Model 2: VitalSign

**Location**: Vitals & Exams tab  
**Edit Scope**: Add new vitals, edit recent vitals

| Field | Type | Required | Optional | Validation | Notes |
|-------|------|----------|----------|-----------|-------|
| dateTaken | DateTime | ✓ | | Past date | Current default |
| height | Float | | ✓ | 50-250 cm | Height in cm |
| weight | Float | | ✓ | 1-500 kg | Weight in kg |
| bmi | Float | | ✓ | Auto-calculated | weight/(height²) |
| bpSystolic | Int | | ✓ | 40-250 mmHg | Systolic pressure |
| bpDiastolic | Int | | ✓ | 20-160 mmHg | Diastolic pressure |
| pulseRate | Int | | ✓ | 30-200 bpm | Heart rate |
| temp | Float | | ✓ | 35-43°C | Temperature in Celsius |
| spo2 | Float | | ✓ | 80-100 % | Oxygen saturation |
| respRate | Int | | ✓ | 8-40 breaths/min | Respiration rate |
| notes | String | | ✓ | Max 500 | Clinical notes |
| isActive | Boolean | | | Default true | Soft delete flag |

**Validation Rules:**

```typescript
// Height and weight validation
if (height && weight && height > 0) {
  const bmi = (weight / ((height / 100) ** 2)).toFixed(1);
  // BMI: 10-60 typically (auto-calculate)
}

// BP validation
if (bpSystolic && bpDiastolic) {
  // Systolic > Diastolic always
  // Typically Systolic < Diastolic + 40
}

// Pulse rate realistic
if (pulseRate) {
  // Normal: 60-100, athletic: 40-60, high: 100-120
}
```

---

### Model 3: PhysicalExamination

**Location**: Vitals & Exams tab  
**Edit Scope**: Latest physical exam or add new

| Field | Type | Required | Optional | Validation | Notes |
|-------|------|----------|----------|-----------|-------|
| dateTaken | DateTime | ✓ | | Past date | Derived from VitalSign |
| visualAcuityLeft | String | | ✓ | Vision format | E.g., "20/20", "6/6" |
| visualAcuityRight | String | | ✓ | Vision format | E.g., "20/20", "6/6" |
| status | String | | ✓ | Max 200 | Exam findings summary |
| createdAt | DateTime | | | System generated | |

**Note**: NO "notes" field exists - only "status"

**Validation Rules:**

```typescript
// Vision format: /\d+\/\d+/
// Status: freetext clinical findings
```

---

### Model 4: ObGyneHistory

**Location**: Lifestyle & Social tab (Women only)  
**Edit Scope**: Editable only for female patients

| Field | Type | Required | Optional | Validation | Notes |
|-------|------|----------|----------|-----------|-------|
| menarche | Int | | ✓ | 8-16 years | Age of first menstruation |
| lastMenstrualPeriod | Date | | ✓ | Past date | LMP |
| menopauseAge | Int | | ✓ | 40-60 years | Age at menopause |
| menopauseStatus | String | | ✓ | PRE\|PERI\|POST\|NONE | Status |
| ageAtFirstSexualIntercourse | Int | | ✓ | 12+ years | Age |
| birthControlMethod | String | | ✓ | Max 100 | Method used |
| menstrualPeriodDuration | Int | | ✓ | 1-10 days | Duration in days |
| menstrualCycleInterval | Int | | ✓ | 21-35 days | Cycle length |
| numberOfPadsPerDay | Int | | ✓ | 1-20 | During menstruation |
| gravidity | Int | | ✓ | 0-20 | Total pregnancies |
| parity | Int | | ✓ | 0-20 | Delivered pregnancies |
| fullTerm | Int | | ✓ | 0-20 | Full-term deliveries |
| premature | Int | | ✓ | 0-20 | Premature deliveries |
| abortion | Int | | ✓ | 0-20 | Abortions/miscarriages |
| livingChildren | Int | | ✓ | 0-20 | Living children |
| typeOfDelivery | String | | ✓ | VAGINAL\|CESAREAN | Delivery method |
| hasPreEclampsia | Boolean | | | Default false | Pregnancy complication |

**Conditional Display:**

```typescript
// Only show if: patient.gender === 'FEMALE'
// Visibility logic in component:
if (patient.gender?.toLowerCase() === 'female') {
  // Show OB/Gyn section
}
```

---

### Model 5: PediatricMeasurement

**Location**: Lifestyle & Social tab  
**Edit Scope**: Add/edit measurements

| Field | Type | Required | Optional | Validation | Notes |
|-------|------|----------|----------|-----------|-------|
| dateTaken | Date | ✓ | | Past date | Measurement date |
| length | Decimal(5,2) | | ✓ | 20-150 cm | Length/height in cm |
| headCircumference | Decimal(5,2) | | ✓ | 20-60 cm | Head circumference |
| skinfoldThickness | Decimal(5,2) | | ✓ | Varies | Various skinfold sites |
| waistCircumference | Decimal(5,2) | | ✓ | 10-150 cm | Waist measurement |
| hipCircumference | Decimal(5,2) | | ✓ | 10-150 cm | Hip measurement |
| limbCircumference | Decimal(5,2) | | ✓ | Varies | Limb measurement |
| midUpperArmCircumference | Decimal(5,2) | | ✓ | 10-50 cm | MUAC |
| remarks | String | | ✓ | Max 500 | Clinical notes |

**Validation Rules:**

```typescript
// Decimal(5,2) = max 999.99
// Realistic ranges for pediatric measurements
// All fields independent - user can enter any combination
```

---

### Model 6: PersonalHistory

**Location**: Lifestyle & Social tab  
**Edit Scope**: Editable

| Field | Type | Required | Optional | Validation | Notes |
|-------|------|----------|----------|-----------|-------|
| smokingStatus | String | | ✓ | NEVER\|FORMER\|CURRENT | Smoking status |
| numberOfPacksPerYear | Int | | ✓ | 0-100 | Packs per year |
| alcoholStatus | String | | ✓ | NEVER\|OCCASIONAL\|REGULAR | Alcohol use |
| numberOfBottlesPerDay | Decimal | | ✓ | 0-10 | Bottles per day |
| illicitDrugUse | String | | ✓ | NEVER\|FORMER\|CURRENT | Drug use status |
| sexuallyActive | String | | ✓ | YES\|NO\|INACTIVE | Sexual activity |

**Conditional Fields:**

```typescript
// numberOfPacksPerYear: Only if smokingStatus === 'CURRENT' or 'FORMER'
// numberOfBottlesPerDay: Only if alcoholStatus !== 'NEVER'
```

---

### Model 7: MedicalHistory

**Location**: Medical Profile tab  
**Edit Scope**: Add/remove conditions with details

| Field | Type | Required | Optional | Validation | Notes |
|-------|------|----------|----------|-----------|-------|
| conditionId | Int | ✓ | | FK to HealthCondition | Select from dropdown |
| details | String | | ✓ | Max 500 | Condition details |
| Condition | Object | ✓ | | Relation | HealthCondition.name |

**Structure:**

```typescript
interface MedicalHistoryInput {
  conditionId: Int        // Selected from dropdown
  details?: String        // Optional notes
}

// Display as HealthCondition.name: details
```

**Validation:**

```typescript
// Must select condition
// Details optional but recommended
// Cannot add duplicate condition for same user
```

---

### Model 8: FamilyMedicalHistory

**Location**: Medical Profile tab  
**Edit Scope**: Add/remove family conditions

| Field | Type | Required | Optional | Validation | Notes |
|-------|------|----------|----------|-----------|-------|
| conditionId | Int | ✓ | | FK to HealthCondition | Select from dropdown |
| details | String | | ✓ | Max 500 | Condition details/relationship |
| createdAt | DateTime | | | System generated | |
| updatedAt | DateTime | | | System managed | |
| deletedAt | DateTime | | | Soft delete | |

**Structure:**

```typescript
interface FamilyMedicalHistoryInput {
  conditionId: Int        // Which family member
  details?: String        // E.g., "Mother - age 45"
}
```

---

### Model 9: PhilHealthRecord

**Location**: Insurance & Docs tab  
**Edit Scope**: Read-only display OR update PIN/TIN if new

| Field | Type | Required | Optional | Validation | Notes |
|-------|------|----------|----------|-----------|-------|
| pin | String | ✓ | | Unique | PhilHealth PIN |
| tin | String | | ✓ | Unique | Tax ID Number |
| philSysId | String | | ✓ | Unique | PhilSys ID |
| memberTypeId | Int | | ✓ | FK to PhilHealthMemberType | Member type |
| photoUrl | String | | ✓ | Image URL | Photo |
| isActive | Boolean | | | Default true | Active flag |

**Edit Permissions:**

```typescript
// Only allow edit if:
// - User is the patient (self-edit), OR
// - User is healthcare provider with permission
// System prevents editing of: createdBy, updatedBy, deletedBy
```

---

### Model 10: ProcedureUsageHistory

**Location**: Insurance & Docs tab  
**Edit Scope**: Read-only reference (Procedures are linked to clinic visits)

| Field | Type | Required | Optional | Validation | Notes |
|-------|------|----------|----------|-----------|-------|
| usedAt | DateTime | ✓ | | Procedure date | When used |
| procedureName | String | ✓ | | Max 200 | Procedure name |
| procedureType | String | | ✓ | Max 100 | Type/category |

**Note**: This is read-only for patients - procedures are created by clinic staff

---

## 🏗️ COMPONENT STRUCTURE

### Editing Patterns (3 Approaches)

#### Pattern 1: Modal Edit (Recommended for Complex Forms)

**Use Case**: Demographics, ObGyn, Medical History

```
Profile View → Click "Edit" Button → Modal Opens → Form → Save → Close
```

**Pros**: Full-screen editing, complex validation, clear separation
**Cons**: Takes screen real estate, context switching

#### Pattern 2: Inline Edit (For Simple Fields)

**Use Case**: Single field updates, quick edits

```
Field → Hover → Click Edit Icon → Input → Save → Display Updated
```

**Pros**: Quick, contextual, less disruption
**Cons**: Limited space, hard for complex validations

#### Pattern 3: Tab-Based Edit (Recommended for Multi-step)

**Use Case**: Vitals, multiple measurements

```
View Tab → Click "Add New" → Form stays in tab → Save → Refresh list
```

**Pros**: In-context, no modal overhead
**Cons**: Limited space in tab

### Recommended Approach

- **Demographics**: Modal (complex form, ~15 fields)
- **Medical History**: Modal List (add/remove conditions)
- **Vitals**: Tab-based "Add New Vital" form
- **Physical Exam**: Tab-based "Add New Exam" form
- **OB/Gyn**: Modal (single record, conditional fields)
- **Pediatric**: Tab-based "Add New Measurement"
- **Personal History**: Modal (enum dropdowns)
- **Insurance**: Modal or read-only (limited edit)

---

## 📊 FORM SCHEMAS & VALIDATION

### Schema 1: Demographics Form (ZOD)

```typescript
import { z } from "zod"

export const demographicsSchema = z.object({
  firstName: z.string().min(1, "First name required").max(100),
  middleName: z.string().max(100).optional().nullable(),
  lastName: z.string().min(1, "Last name required").max(100),
  suffix: z.string().max(20).optional().nullable(),
  nickname: z.string().max(100).optional().nullable(),
  mobile: z.string().regex(/^\+?[\d\s-]+$/, "Invalid phone format").optional().nullable(),
  telephone: z.string().regex(/^\+?[\d\s-]+$/, "Invalid phone format").optional().nullable(),
  dob: z.date().max(new Date(), "DOB must be in past").optional().nullable(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional().nullable(),
  bloodType: z.enum(['O_POSITIVE', 'O_NEGATIVE', 'A_POSITIVE', 'A_NEGATIVE', 
                      'B_POSITIVE', 'B_NEGATIVE', 'AB_POSITIVE', 'AB_NEGATIVE']).optional().nullable(),
  civilStatus: z.enum(['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED']).optional().nullable(),
  placeOfBirth: z.string().max(200).optional().nullable(),
  nationality: z.string().max(100).optional().nullable(),
  religion: z.string().max(100).optional().nullable(),
})

export type DemographicsFormInput = z.infer<typeof demographicsSchema>
```

### Schema 2: Vitals Form

```typescript
export const vitalSignSchema = z.object({
  dateTaken: z.date().max(new Date(), "Date must be today or earlier"),
  height: z.number().min(50).max(250).optional().nullable(),
  weight: z.number().min(1).max(500).optional().nullable(),
  bpSystolic: z.number().min(40).max(250).optional().nullable(),
  bpDiastolic: z.number().min(20).max(160).optional().nullable(),
  pulseRate: z.number().min(30).max(200).int().optional().nullable(),
  temp: z.number().min(35).max(43).optional().nullable(),
  spo2: z.number().min(80).max(100).optional().nullable(),
  respRate: z.number().min(8).max(40).int().optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
}).refine((data) => {
  // Custom validation: if height and weight provided, validate BP is realistic
  if (data.bpSystolic && data.bpDiastolic && data.bpSystolic <= data.bpDiastolic) {
    return false
  }
  return true
}, { message: "Systolic BP must be greater than Diastolic" })

export type VitalSignFormInput = z.infer<typeof vitalSignSchema>
```

### Schema 3: Medical History

```typescript
export const medicalHistorySchema = z.object({
  conditions: z.array(z.object({
    conditionId: z.number().min(1, "Select a condition"),
    details: z.string().max(500).optional().nullable(),
  }))
})

export type MedicalHistoryFormInput = z.infer<typeof medicalHistorySchema>
```

### Schema 4: OB/Gyn History

```typescript
export const obGyneSchema = z.object({
  menarche: z.number().min(8).max(16).optional().nullable(),
  lastMenstrualPeriod: z.date().optional().nullable(),
  menopauseAge: z.number().min(40).max(60).optional().nullable(),
  menopauseStatus: z.enum(['PRE', 'PERI', 'POST', 'NONE']).optional().nullable(),
  gravidity: z.number().min(0).max(20).int().optional().nullable(),
  parity: z.number().min(0).max(20).int().optional().nullable(),
  // ... more fields
})
```

---

## 🔧 SERVER ACTIONS (Update Operations)

### Action 1: Update Demographics

```typescript
// File: src/actions/patient-profile/update-demographics.ts

export async function updateDemographics(
  input: DemographicsFormInput
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await currentUser()
    if (!user?.id) throw new Error("Unauthorized")

    const validatedData = demographicsSchema.parse(input)

    const updated = await prisma.user.update({
      where: { userId: user.id },
      data: {
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        middleName: validatedData.middleName,
        dob: validatedData.dob,
        gender: validatedData.gender,
        bloodType: validatedData.bloodType,
        mobile: validatedData.mobile,
        // ... other fields
      },
    })

    // Audit log
    await createAuditLog({
      entityType: 'USER',
      entityId: updated.id,
      action: 'UPDATE',
      performedBy: user.id,
    })

    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
}
```

### Action 2: Add Vital Sign

```typescript
export async function addVitalSign(
  input: VitalSignFormInput
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await currentUser()
    if (!user?.id) throw new Error("Unauthorized")

    const validatedData = vitalSignSchema.parse(input)

    // Auto-calculate BMI if both height and weight provided
    let bmi = null
    if (validatedData.height && validatedData.weight && validatedData.height > 0) {
      const heightInMeters = validatedData.height / 100
      bmi = parseFloat((validatedData.weight / (heightInMeters * heightInMeters)).toFixed(1))
    }

    const vital = await prisma.vitalSign.create({
      data: {
        userId: user.id,
        dateTaken: validatedData.dateTaken,
        height: validatedData.height,
        weight: validatedData.weight,
        bmi,
        bpSystolic: validatedData.bpSystolic,
        bpDiastolic: validatedData.bpDiastolic,
        pulseRate: validatedData.pulseRate,
        temp: validatedData.temp,
        spo2: validatedData.spo2,
        respRate: validatedData.respRate,
        notes: validatedData.notes,
      },
    })

    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
}
```

### Action 3: Update Medical Conditions

```typescript
export async function updateMedicalConditions(
  input: MedicalHistoryFormInput
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await currentUser()
    if (!user?.id) throw new Error("Unauthorized")

    const validatedData = medicalHistorySchema.parse(input)

    // Delete existing conditions
    await prisma.medicalHistory.deleteMany({
      where: { userId: user.id },
    })

    // Create new conditions
    await prisma.medicalHistory.createMany({
      data: validatedData.conditions.map((cond) => ({
        userId: user.id,
        conditionId: cond.conditionId,
        details: cond.details,
      })),
    })

    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
}
```

---

## 🎨 UI COMPONENTS

### Component Structure

```
src/components/patient-profile/editing/
├── DemographicsModal.tsx          // Full demographics form
├── VitalsForm.tsx                 // Add/edit vital signs
├── MedicalHistoryForm.tsx         // Condition picker + list
├── ObGyneForm.tsx                 // OB/Gyn history
├── PediatricMeasurementForm.tsx    // Growth measurements
├── PersonalHistoryForm.tsx         // Lifestyle habits
├── PhilHealthForm.tsx             // Insurance info
├── EditButton.tsx                 // Reusable edit trigger
├── FormModal.tsx                  // Reusable modal wrapper
└── hooks/
    └── useEditForm.ts             // Form state management hook
```

### EditButton Component

```typescript
interface EditButtonProps {
  onClick: () => void
  disabled?: boolean
  variant?: 'icon' | 'text' | 'button'
}

export function EditButton({ onClick, disabled, variant = 'icon' }: EditButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
    >
      {variant === 'icon' && <Edit2 className="w-4 h-4" />}
      {variant === 'text' && <>Edit</>}
      {variant === 'button' && (
        <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 rounded">Edit</span>
      )}
    </button>
  )
}
```

### Form Modal Wrapper

```typescript
interface FormModalProps {
  isOpen: boolean
  title: string
  onClose: () => void
  onSubmit: (data: any) => Promise<void>
  isLoading?: boolean
  children: React.ReactNode
}

export function FormModal({
  isOpen,
  title,
  onClose,
  onSubmit,
  isLoading,
  children,
}: FormModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-6">
          {children}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

---

## 🔐 PERMISSION & AUTHORIZATION

### Permission Levels

```typescript
enum EditPermission {
  SELF_EDIT = 'SELF_EDIT',           // Patient editing own records
  PROFESSIONAL_EDIT = 'PROFESSIONAL_EDIT',  // Healthcare provider
  CLINIC_EDIT = 'CLINIC_EDIT',       // Clinic staff
  READONLY = 'READONLY'              // View only
}

// Determine permission
function getEditPermission(currentUser: User, targetUser: User): EditPermission {
  // User editing themselves
  if (currentUser.id === targetUser.id) return EditPermission.SELF_EDIT
  
  // Healthcare provider - needs permission
  if (currentUser.HealthcareProvider?.isActive) return EditPermission.PROFESSIONAL_EDIT
  
  // Clinic staff - needs permission
  if (currentUser.ClinicMembers?.some(m => m.isActive)) return EditPermission.CLINIC_EDIT
  
  return EditPermission.READONLY
}
```

### Field-Level Permissions

```typescript
interface FieldPermission {
  fieldName: string
  allowedFor: EditPermission[]
  readOnly?: boolean
}

const fieldPermissions: FieldPermission[] = [
  { fieldName: 'firstName', allowedFor: [SELF_EDIT, PROFESSIONAL_EDIT] },
  { fieldName: 'caseNumber', allowedFor: [], readOnly: true },
  { fieldName: 'bloodType', allowedFor: [SELF_EDIT, PROFESSIONAL_EDIT] },
  // ...
]
```

---

## 📋 IMPLEMENTATION PHASES

### Phase 1: Foundation (Week 1-2)

- [x] Schema analysis & field mapping (DONE)
- [ ] Create ZOD validation schemas for all models
- [ ] Create server actions for each update operation
- [ ] Set up permission/authorization logic
- [ ] Create reusable form components

### Phase 2: Demographics & Basic Edit (Week 2-3)

- [ ] Implement DemographicsModal
- [ ] Wire up updateDemographics server action
- [ ] Add edit buttons to profile header
- [ ] Test validation & error handling
- [ ] Add audit logging

### Phase 3: Health Records Edit (Week 3-4)

- [ ] VitalSigns: Add new, edit recent
- [ ] PhysicalExamination: Add new
- [ ] Medical conditions: Add/remove interface
- [ ] Family history: Add/remove interface
- [ ] PersonalHistory form

### Phase 4: Complex Forms (Week 4-5)

- [ ] ObGyn history form (conditional fields)
- [ ] PediatricMeasurement form
- [ ] Insurance/PhilHealth form
- [ ] Procedure history (view-only)

### Phase 5: Polish & Testing (Week 5)

- [ ] Form validation across all types
- [ ] Error handling & user feedback
- [ ] Dark mode compatibility
- [ ] Mobile responsiveness
- [ ] Accessibility audit
- [ ] User testing

---

## 🧪 TESTING STRATEGY

### Unit Tests

- Validation schema tests
- Permission logic tests
- Server action tests

### Integration Tests

- Create → Read → Update flow
- Permission enforcement
- Audit log creation

### E2E Tests (Optional)

- User completes edit workflow
- Form submission & redirect
- Error state handling

---

## 📁 FILE STRUCTURE

```
src/
├── actions/patient-profile/
│   ├── update-demographics.ts
│   ├── update-vitals.ts
│   ├── add-medical-condition.ts
│   ├── update-ob-gyn.ts
│   ├── update-pediatric.ts
│   └── ... (one per major model)
├── components/patient-profile/
│   ├── editing/
│   │   ├── DemographicsModal.tsx
│   │   ├── VitalsForm.tsx
│   │   ├── MedicalHistoryForm.tsx
│   │   ├── FormModal.tsx
│   │   └── EditButton.tsx
│   └── ... (existing components)
├── schemas/
│   ├── demographics-schema.ts
│   ├── vitals-schema.ts
│   ├── medical-history-schema.ts
│   └── ... (ZOD schemas)
└── types/
    └── edit-permissions.ts
```

---

## 🎯 SUCCESS CRITERIA

- [ ] All 11 models have update paths
- [ ] Form validation prevents invalid data
- [ ] Permission checks enforce authorization
- [ ] Audit logs record all changes
- [ ] UI clearly indicates optional vs required fields
- [ ] Error messages are user-friendly
- [ ] Mobile view is functional
- [ ] Dark mode is fully supported
- [ ] No TypeScript errors
- [ ] Zero `any` types used

---

## 📝 NOTES

1. **Blood Type Format**: Already has `formatBloodType()` utility - use for display
2. **Age Calculation**: Auto-calculated from DOB - don't allow manual entry
3. **BMI Calculation**: Auto-calculated from height/weight
4. **Conditional Display**: OB/Gyn only for female patients
5. **Soft Deletes**: Use `deletedAt` flag, not hard deletes
6. **Audit Logging**: Record all changes with user ID and timestamp
7. **Decimal Precision**: PediatricMeasurement uses Decimal(5,2) - handle in forms

---

**Created**: 2025-02-16  
**Version**: 1.0  
**Status**: Ready for implementation
