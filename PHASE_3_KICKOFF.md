# 🚀 Phase 3: UI Components & Forms - Kickoff Guide

## Overview

Phase 3 builds reusable React components and form implementations that use the Phase 2 server actions.

**Phase 3 Objectives**:

1. Create reusable form components (FormModal, EditButton, FormField, etc.)
2. Build demographics edit form (template reference)
3. Implement individual forms for each health model
4. Polish UI/UX, dark mode, accessibility

---

## 📋 Phase 3 Development Plan

### Step 1: Reusable Form Components (Week 1)

**Location**: `src/components/health-records/`

#### 1.1 FormModal

Wrapper component for editing forms

```typescript
interface FormModalProps {
  isOpen: boolean
  title: string
  onClose: () => void
  onSubmit: () => Promise<void>
  isLoading?: boolean
  children: ReactNode
}
```

Features:

- Modal dialog (use shadcn Dialog)
- Loading state management
- Error display area
- Submit/Cancel buttons
- Keyboard shortcuts (Esc to close)

#### 1.2 EditButton

Trigger button to open form modal

```typescript
interface EditButtonProps {
  label?: string
  size?: 'sm' | 'md' | 'lg'
  onClick: () => void
  disabled?: boolean
}
```

Features:

- Icon + label variant
- Tooltip showing what can be edited
- Permission-aware (hide if no edit access)
- Loading state

#### 1.3 FormField

Controlled form field wrapper

```typescript
interface FormFieldProps {
  label: string
  error?: string
  required?: boolean
  help?: string
  children: ReactNode
}
```

Features:

- Label with required indicator
- Error message display
- Help text below field
- Accessible (proper labeling)

#### 1.4 ErrorDisplay

User-friendly error messages

```typescript
interface ErrorDisplayProps {
  error?: string
  onDismiss?: () => void
  variant?: 'error' | 'warning' | 'info'
}
```

Features:

- Color-coded by severity
- Dismiss button
- Icon indicator
- Accessible alerts

#### 1.5 LoadingState

Skeleton/loading placeholder

```typescript
interface LoadingStateProps {
  isLoading: boolean
  itemCount?: number
  children?: ReactNode
}
```

#### 1.6 SuccessMessage

Temporary success notification

```typescript
interface SuccessMessageProps {
  message: string
  autoDismissMs?: number
}
```

---

### Step 2: Demographics Edit Form (Week 1-2)

**File**: `src/components/health-records/demographics-edit-form.tsx`

**Template Structure**:

```typescript
export function DemographicsEditForm({ userId }: { userId: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>()
  const [success, setSuccess] = useState<string>()
  const [formData, setFormData] = useState<DemographicsFormInput>({})
  
  const handleSubmit = async () => {
    setIsLoading(true)
    setError(undefined)
    const result = await updateDemographics(userId, formData)
    setIsLoading(false)
    
    if (result.success) {
      setSuccess(result.message)
      setIsOpen(false)
      // TODO: Refresh parent data
    } else {
      setError(result.error)
    }
  }
  
  return (
    <>
      <EditButton onClick={() => setIsOpen(true)} label="Edit Profile" />
      <FormModal
        isOpen={isOpen}
        title="Edit Demographic Information"
        onClose={() => setIsOpen(false)}
        onSubmit={handleSubmit}
        isLoading={isLoading}
      >
        {error && <ErrorDisplay error={error} />}
        {success && <SuccessMessage message={success} />}
        
        <FormField label="First Name" required>
          <input
            value={formData.firstName}
            onChange={(e) => setFormData({...formData, firstName: e.target.value})}
          />
        </FormField>
        
        {/* ... repeat for all fields ... */}
      </FormModal>
    </>
  )
}
```

**Key Aspects**:

- Fieldgroup organization (Personal, Contact, Medical)
- Conditional rendering (optional fields)
- Real-time validation feedback
- Accessibility (proper ARIA labels)

---

### Step 3: Individual Form Implementations (Week 2-3)

#### 3.1 VitalSignForm

**Components**: Vital Sign recording

```
src/components/health-records/vital-sign-form.tsx
- Measurements grouped (Height/Weight, BP, Temperature, Pulse, O₂, Respiration)
- Real-time BMI calculation display
- Date picker for vital sign date
- Notes field
```

#### 3.2 PersonalHistoryForm

**Components**: Lifestyle/social history

```
src/components/health-records/personal-history-form.tsx
- Smoking status (enum dropdown + conditional pack count)
- Alcohol status (enum dropdown + conditional bottles/day)
- Illicit drug use (enum)
- Sexually active (enum)
- Non-judgmental language throughout
```

#### 3.3 MedicalConditionsForm

**Components**: Manage patient conditions

```
src/components/health-records/medical-conditions-form.tsx
- Condition picker (searchable dropdown)
- Notes field per condition
- Add/remove with live preview
- Duplicate prevention
- Shows current count
```

#### 3.4 OBGyneHistoryForm

**Components**: Reproductive health (FEMALE ONLY)

```
src/components/health-records/ob-gyne-history-form.tsx
- Conditional rendering (only for FEMALE patients)
- Field groups:
  - Menstruation (menarche, LMP, cycle details)
  - Menopause (status, age)
  - Sexual history (age at first intercourse)
  - Contraception
  - Pregnancy outcomes (gravidity, parity, delivery types)
  - Complications (pre-eclampsia, GDM, etc.)
- Cross-field validation helper (shows errors)
```

#### 3.5 PediatricMeasurementForm

**Components**: Growth tracking

```
src/components/health-records/pediatric-measurement-form.tsx
- Field groups:
  - Linear (length, head circumference)
  - Circumferences (waist, hip, MUAC, limb)
  - Tissue (skinfold)
  - Notes
- MUAC evaluation displayed (shows nutritional status)
- Date picker
```

#### 3.6 FamilyMedicalHistoryForm

**Components**: Family genetic risk

```
src/components/health-records/family-medical-history-form.tsx
- Similar to medical conditions
- Add: Condition picker + family relationship field
- Shows conditions by relationship
```

#### 3.7 PhysicalExaminationForm

**Components**: Exam findings

```
src/components/health-records/physical-examination-form.tsx
- Vision acuity (format: 20/20, 6/6, etc.)
- General status (dropdown/enum)
- Free-text notes
- Date field
```

#### 3.8 PhilHealthForm

**Components**: Insurance records

```
src/components/health-records/philhealth-form.tsx
- PIN (unique, required, searchable)
- TIN (optional)
- PhilSys ID (optional)
- Member type dropdown
- Photo URL (optional)
```

---

### Step 4: Layout & Integration (Week 3)

**File**: `src/app/patient/[id]/health-records/page.tsx`

Create unified health records view:

```
┌─────────────────────────────────────────┐
│ Patient Health Records                   │
├─────────────────────────────────────────┤
│ DEMOGRAPHICS [Edit]                      │
│ • Name: John Doe                         │
│ • DOB: 1990-01-15                        │
│ • Blood Type: O+                         │
│                                          │
│ VITAL SIGNS [Add New] [History]          │
│ • Latest: Height 180cm, Weight 80kg      │
│ • BMI: 24.7 (Normal)                     │
│                                          │
│ MEDICAL CONDITIONS [Edit]                │
│ • Hypertension                           │
│ • Diabetes Type 2                        │
│                                          │
│ ... (other sections)                    │
└─────────────────────────────────────────┘
```

---

## 🎨 UI/UX Considerations

### Design Patterns

1. **Edit-in-place**: Click button → Modal opens → Edit → Save
2. **Add new**: Always shows confirmation before creating
3. **Remove**: Requires confirmation
4. **Status indicators**: Shows if data is complete/missing

### Dark Mode

- All components use Tailwind CSS classes
- Use `dark:` prefixes for dark mode
- Test with `prefers-color-scheme`

### Accessibility

- All forms use proper ARIA labels
- Error messages linked to fields
- Keyboard navigation (Tab through fields)
- Focus management
- Screen reader friendly

### Mobile Responsiveness

- Stack fields vertically on small screens
- Touch-friendly buttons (min 44px)
- Readable font sizes
- Scrollable modals on small screens

---

## 🔌 Component API Summary

### Available Server Actions

```typescript
// Demographics
updateDemographics(userId: string, input: DemographicsFormInput) 
  => { success, error?, message? }

// Vital Signs
addVitalSign(userId: string, input: VitalSignFormInput)
  => { success, error?, message?, vitalSignId? }

// Personal History
updatePersonalHistory(userId: string, input: PersonalHistoryFormInput)
  => { success, error?, message? }

// OB-Gyn
updateObGyneHistory(userId: string, input: ObGyneHistoryFormInput)
  => { success, error?, message? }

// Pediatric
addPediatricMeasurement(userId: string, input: PediatricMeasurementFormInput)
  => { success, error?, message?, measurementId? }

// Medical Conditions
updateMedicalConditions(userId: string, input: { conditions: MedicalHistoryFormInput[] })
  => { success, error?, message?, addedCount?, removedCount? }

// Family History
updateFamilyMedicalConditions(userId: string, input: { conditions: FamilyMedicalHistoryFormInput[] })
  => { success, error?, message?, addedCount?, removedCount? }

// Physical Exam
addPhysicalExamination(userId: string, input: PhysicalExaminationFormInput)
  => { success, error?, message?, examinationId? }

// PhilHealth
updatePhilhealthRecord(userId: string, input: PhilHealthRecordFormInput)
  => { success, error?, message? }
```

---

## 📅 Timeline Estimate

| Task | Estimate | Week |
|------|----------|------|
| Reusable components | 3-4 days | 1 |
| Demographics form | 2 days | 1-2 |
| Vital signs form | 1.5 days | 2 |
| Medical conditions | 1 day | 2 |
| OB-Gyn form | 2 days | 2 |
| Pediatric form | 1.5 days | 2 |
| Family history | 1 day | 3 |
| Physical exam | 1 day | 3 |
| PhilHealth form | 1 day | 3 |
| Integration & polish | 2-3 days | 3 |
| **Total** | **~16-18 days** | **3 weeks** |

---

## ✅ Phase 3 Definition of Done

- [ ] All reusable components created and tested
- [ ] Each form component fully functional
- [ ] All forms accept proper TypeScript types
- [ ] Validation messages display correctly
- [ ] Success/error handling works
- [ ] Dark mode tested and working
- [ ] Mobile responsive on all components
- [ ] Accessibility audit passed
- [ ] Integration with health records page
- [ ] User testing with sample data
- [ ] Performance optimized (no unnecessary re-renders)
- [ ] Documentation updated

---

## 🎯 Next Steps

1. **Start with reusable components** - These are used by all forms
2. **Test each component in isolation** - Use Storybook if available
3. **Implement demographics form first** - Most complex, good reference
4. **Build remaining forms incrementally** - Each one refines the pattern
5. **Integrate into health records view** - Bring it all together
6. **Polish and test** - Dark mode, accessibility, mobile

---

**Phase 3 Status**: Ready to start 🚀  
**Dependency**: Phase 2 Complete ✅  
**Next Review**: After Week 1 of Phase 3
