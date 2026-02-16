# Developer Quick Reference: Patient Health Records Editing

**Phase 1 Complete** ✅ | **Ready for Phase 2** 🚀

---

## 🚀 Quick Start

### Import Schemas

```typescript
import {
  demographicsSchema,
  vitalSignSchema,
  obGyneHistorySchema,
  // ... import other schemas
  type DemographicsFormInput,
  type VitalSignFormInput,
} from '@/schemas'
```

### Import Permissions

```typescript
import {
  userCanEditField,
  userCanEditSection,
  getUserEditableSections,
  isUserEditingOwnProfile,
} from '@/lib/permissions'
```

---

## 📋 Schema Quick Reference

### Demographics Schema

```typescript
const input = {
  firstName: "John",
  lastName: "Doe",
  dob: new Date("1990-01-15"),
  gender: "MALE",
  bloodType: "O_POSITIVE",
  mobile: "+63912345678",
  // ... other fields
}

const validated = demographicsSchema.parse(input)
const age = calculateAge(validated.dob) // Returns number or null
```

**User-Centric Features**:

- Age auto-calculated (shows in form as read-only)
- Blood type displayed as "O+" not "O_POSITIVE"
- Phone validation with format guidance
- DOB past-date validation

### Vital Signs Schema

```typescript
const vitals = {
  dateTaken: new Date(),
  height: 175, // cm
  weight: 70, // kg
  bpSystolic: 120,
  bpDiastolic: 80,
  pulseRate: 72,
  temp: 37.2,
  spo2: 98,
  respRate: 16,
}

const validated = vitalSignSchema.parse(vitals)
const bmiInfo = calculateBMI(validated.height, validated.weight)
// Returns: { bmi: 22.9, category: "Normal weight" }

const bpStatus = getBPClassification(validated.bpSystolic, validated.bpDiastolic)
// Returns: "Normal" | "Elevated" | "High BP Stage 1" | "High BP Stage 2"
```

**Cross-Field Validation**:

- Systolic must be > Diastolic
- Realistic BP relationship (diff 15-50 mmHg)

### OB/Gyn Schema (Women Only)

```typescript
const obGyn = {
  menarche: 12,
  gravidity: 3,
  parity: 2,
  fullTerm: 2,
  premature: 0,
  abortion: 1,
  livingChildren: 2,
  menopauseStatus: "PRE",
  typeOfDelivery: "VAGINAL",
}

const validated = obGyneHistorySchema.parse(obGyn)
const errors = validateObGyneConsistency(validated)
// Validates: parity <= gravidity, delivery sum <= gravidity, etc.
```

**Conditional Display**:

```typescript
if (patient.gender === 'FEMALE') {
  // Show OB/Gyn section
}
```

### Personal History Schema

```typescript
const history = {
  smokingStatus: "CURRENT", // "NEVER" | "FORMER" | "CURRENT"
  numberOfPacksPerYear: 2, // Only if smoking
  alcoholStatus: "OCCASIONAL", // "NEVER" | "OCCASIONAL" | "REGULAR" | "HEAVY"
  numberOfBottlesPerDay: 0.5, // Only if not "NEVER"
  illicitDrugUse: "NEVER",
  sexuallyActive: "YES",
}

const validated = personalHistorySchema.parse(history)
```

**User-Friendly Labels**:

```typescript
import { personalHistoryLabels } from '@/schemas'

console.log(personalHistoryLabels.smokingStatus.CURRENT)
// "Currently smoking"

console.log(personalHistoryLabels.alcoholStatus.OCCASIONAL)
// "Occasional (a few times per year)"
```

---

## 🔐 Permission Quick Reference

### Check if User Can Edit

```typescript
import { UserRole, EditPermissionLevel } from '@/types/edit-permissions'
import { userCanEditField, userCanEditSection } from '@/lib/permissions'

// Check field-level permission
const canEditFirstName = userCanEditField(
  currentUserId,
  targetUserId,
  UserRole.PATIENT,
  'firstName'
)

// Check section-level permission
const canEditDemographics = userCanEditSection(
  currentUserId,
  targetUserId,
  UserRole.PATIENT,
  'demographics'
)

// Get all editable sections for user
import { getUserEditableSections } from '@/lib/permissions'

const sections = getUserEditableSections(
  currentUserId,
  targetUserId,
  UserRole.HEALTHCARE_PROVIDER
)
// Returns: ['demographics', 'vitals', 'physical-exam', ...]
```

### Permission Hierarchy

```
SELF_EDIT (Patient editing own)
  ↓
PROFESSIONAL_EDIT (Healthcare provider)
  ↓
CLINIC_ADMIN_EDIT (Clinic admin)
  ↓
READONLY (View only)
  ↓
DENIED (No access)
```

### Permission Labels

```typescript
import { permissionLabels } from '@/types/edit-permissions'

console.log(permissionLabels.SELF_EDIT)
// "You can edit your health information"

console.log(permissionLabels.READONLY)
// "View only - cannot edit"
```

---

## 💡 Common Patterns

### Pattern 1: Form Submission with Validation

```typescript
async function handleFormSubmit(formData: DemographicsFormInput) {
  try {
    // Validate with schema
    const validated = demographicsSchema.parse(formData)
    
    // Check permissions (in server action)
    if (!userCanEditField(currentUserId, targetUserId, userRole, 'firstName')) {
      throw new Error("Not authorized to edit first name")
    }
    
    // Call server action to update database
    const result = await updateDemographics(validated)
    
    if (result.success) {
      showSuccessMessage("Profile updated")
    } else {
      showErrorMessage(result.error)
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Handle validation errors
      displayFormErrors(error.flatten().fieldErrors)
    } else {
      showErrorMessage("Failed to update profile")
    }
  }
}
```

### Pattern 2: Conditional Field Visibility

```typescript
function DemographicsForm({ patient }) {
  const permission = getUserPermissionLevel(currentUserId, targetUserId, userRole)
  
  return (
    <>
      {/* Always visible */}
      <input
        name="firstName"
        disabled={!canEditField(permission, 'firstName', demographicsFieldPermissions)}
      />
      
      {/* Only for females */}
      {patient.gender === 'FEMALE' && (
        <ObGyneHistoryForm />
      )}
      
      {/* Only if can edit */}
      {canEditSection(permission, 'demographics') && (
        <button onClick={handleEdit}>Edit Demographics</button>
      )}
    </>
  )
}
```

### Pattern 3: Auto-Calculated Fields

```typescript
function VitalSignsForm({ height, weight, bpSystolic, bpDiastolic }) {
  // Auto-calculate BMI
  const bmiInfo = calculateBMI(height, weight)
  
  // Show BP classification
  const bpStatus = getBPClassification(bpSystolic, bpDiastolic)
  
  return (
    <>
      <input name="height" value={height} />
      <input name="weight" value={weight} />
      
      {/* Display calculated BMI */}
      {bmiInfo && (
        <p>BMI: {bmiInfo.bmi} ({bmiInfo.category})</p>
      )}
      
      <input name="bpSystolic" value={bpSystolic} />
      <input name="bpDiastolic" value={bpDiastolic} />
      
      {/* Display BP classification */}
      {bpStatus && (
        <p>Blood Pressure Status: {bpStatus}</p>
      )}
    </>
  )
}
```

---

## 🧪 Testing Examples

### Test Validation

```typescript
import { demographicsSchema } from '@/schemas'

describe('DemographicsSchema', () => {
  it('validates valid demographics', () => {
    const valid = {
      firstName: "John",
      lastName: "Doe",
      dob: new Date("1990-01-15"),
    }
    expect(() => demographicsSchema.parse(valid)).not.toThrow()
  })
  
  it('rejects invalid email', () => {
    const invalid = {
      firstName: "",
      lastName: "Doe",
    }
    expect(() => demographicsSchema.parse(invalid)).toThrow()
  })
  
  it('validates age between 0-120', () => {
    const tooOld = {
      firstName: "John",
      lastName: "Doe",
      dob: new Date("1800-01-01"),
    }
    expect(() => demographicsSchema.parse(tooOld)).toThrow()
  })
})
```

### Test Permissions

```typescript
import { userCanEditField } from '@/lib/permissions'
import { UserRole } from '@/types/edit-permissions'

describe('Permissions', () => {
  it('allows patient to edit own demographics', () => {
    const canEdit = userCanEditField(
      "patient-123",
      "patient-123",
      UserRole.PATIENT,
      'firstName'
    )
    expect(canEdit).toBe(true)
  })
  
  it('allows provider to edit clinical fields', () => {
    const canEdit = userCanEditField(
      "provider-456",
      "patient-123",
      UserRole.HEALTHCARE_PROVIDER,
      'firstName'
    )
    expect(canEdit).toBe(true)
  })
  
  it('prevents readonly user from editing', () => {
    const canEdit = userCanEditField(
      "viewer-789",
      "patient-123",
      UserRole.SYSTEM_ADMIN, // Assume mapped to readonly
      'firstName'
    )
    expect(canEdit).toBe(false)
  })
})
```

---

## 🔄 Workflow: From Form to Database

```
User fills form
    ↓
FormSubmit → validate with schema
    ↓
Schema valid? → No → Show error message
    ↓
Yes → Check permissions
    ↓
Authorized? → No → Show "Not authorized" error
    ↓
Yes → Call server action
    ↓
Server action:
  - Re-validate input
  - Check permissions again (security)
  - Update database
  - Log audit trail
  - Return success
    ↓
Success? → Yes → Update UI, show success
    ↓
No → Show error message
```

---

## 📚 File References

| Task | File | Key Exports |
|------|------|-------------|
| Validate demographics | `src/schemas/demographics-schema.ts` | `demographicsSchema`, `DemographicsFormInput`, `calculateAge()` |
| Validate vitals | `src/schemas/vital-signs-schema.ts` | `vitalSignSchema`, `calculateBMI()`, `getBPClassification()` |
| Check permissions | `src/lib/permissions.ts` | `userCanEditField()`, `userCanEditSection()`, `getUserEditableSections()` |
| Permission types | `src/types/edit-permissions.ts` | `EditPermissionLevel`, `UserRole`, `FieldEditPermission` |
| All schemas | `src/schemas/index.ts` | All schema exports + `AllFormInputs` type |

---

## 💬 Common Questions

**Q: Why are all fields optional in the User model?**  
A: Allows partial updates. `firstName` and `lastName` are required at signup but optional for updates.

**Q: How do I show blood type as "O+" instead of "O_POSITIVE"?**  
A: Use `formatBloodType()` utility from `src/lib/utils.ts`

**Q: How do I validate that Systolic > Diastolic?**  
A: Already built into `vitalSignSchema` - uses `.refine()` for cross-field validation

**Q: How do I show OB/Gyn fields only for females?**  
A: Check `patient.gender === 'FEMALE'` before rendering form section

**Q: How do I prevent duplicate medical conditions?**  
A: Use `medicalHistoriesSchema.refine()` which checks for duplicate `conditionId`

**Q: How do I log who edited what?**  
A: Use `logPermissionCheck()` in server actions to log change attempts

---

**Phase 1 Complete** ✅  
**Ready to build Phase 2 server actions** 🚀
