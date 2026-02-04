# Pre-Assessment Notes Access Control

## Overview

Pre-assessment notes (also called pre-consultation notes or triage notes) in ClinicEZ can be created by **any healthcare provider** who has the appropriate permissions. This is intentionally not restricted to nurses only.

## Design Decision

### Why Not Nurse-Only?

The system uses a **permission-based approach** rather than role-based restrictions for the following reasons:

1. **Clinic Workflow Diversity**
   - Different clinics have different pre-assessment workflows
   - Not all clinics have nurses on staff
   - Some clinics use medical assistants or physician assistants for triage
   - Some doctors prefer to do their own pre-assessment

2. **Regulatory Flexibility**
   - Medical regulations vary by country and region
   - Some jurisdictions allow various healthcare professionals to perform pre-assessments
   - The permission system allows clinics to comply with local regulations

3. **Operational Efficiency**
   - Small clinics may not have dedicated nursing staff
   - Multi-role staff members may need flexibility
   - Emergency situations may require any available healthcare provider to document pre-assessment

4. **Permission Granularity**
   - ClinicEZ uses a fine-grained permission system
   - Clinic administrators have full control over who can create pre-assessment notes
   - This is more flexible than hard-coded role restrictions

## How It Works

### Permission Required

To create or edit pre-assessment notes, a user must have:
- **Permission**: `WRITE:CLINIC:PRE_ASSESSMENT_NOTE`

To read pre-assessment notes:
- **Permission**: `READ:CLINIC:PRE_ASSESSMENT_NOTE`

### Assigning Permissions

Clinic administrators can assign these permissions to any role:

1. **Nurse Role**: Typically has this permission by default
2. **Medical Assistant Role**: Can be granted this permission
3. **Doctor Role**: Can be granted this permission if needed
4. **Custom Roles**: Any custom role can be configured with this permission

### Configuration Example

```typescript
// Example: A clinic might configure permissions like this

Nurse Role:
- ✅ WRITE:CLINIC:PRE_ASSESSMENT_NOTE
- ✅ READ:CLINIC:PRE_ASSESSMENT_NOTE

Medical Assistant Role:
- ✅ WRITE:CLINIC:PRE_ASSESSMENT_NOTE
- ✅ READ:CLINIC:PRE_ASSESSMENT_NOTE

Doctor Role:
- ❌ WRITE:CLINIC:PRE_ASSESSMENT_NOTE (usually not needed)
- ✅ READ:CLINIC:PRE_ASSESSMENT_NOTE (can read notes)

Front Desk Role:
- ❌ WRITE:CLINIC:PRE_ASSESSMENT_NOTE
- ❌ READ:CLINIC:PRE_ASSESSMENT_NOTE
```

## Real-World Use Cases

### Use Case 1: Traditional Hospital Setting
- **Nurses** perform all pre-assessments
- Only the "Nurse" role has `WRITE:CLINIC:PRE_ASSESSMENT_NOTE`
- Doctors and other staff can read but not write

### Use Case 2: Small Private Clinic
- **Doctor** sees all patients directly
- Doctor may want to note initial observations
- Doctor role has `WRITE:CLINIC:PRE_ASSESSMENT_NOTE`

### Use Case 3: Multi-Provider Clinic
- **Nurses**, **Medical Assistants**, and **Physician Assistants** all do pre-assessments
- All three roles have `WRITE:CLINIC:PRE_ASSESSMENT_NOTE`
- Work is distributed based on availability

### Use Case 4: Telemedicine Clinic
- **Medical Coordinators** (not traditional nurses) handle initial patient intake
- Custom "Medical Coordinator" role has `WRITE:CLINIC:PRE_ASSESSMENT_NOTE`
- Doctors review notes before virtual consultation

## Best Practices

### For Clinic Administrators

1. **Assess Your Workflow**
   - Identify who performs pre-assessments in your clinic
   - Consider your staffing model and local regulations

2. **Assign Permissions Appropriately**
   - Grant `WRITE:CLINIC:PRE_ASSESSMENT_NOTE` only to trained staff
   - Ensure staff understand documentation requirements
   - Consider your liability and quality assurance needs

3. **Train Your Staff**
   - Ensure all users with this permission understand proper documentation
   - Establish clinic-specific guidelines for pre-assessment notes
   - Review notes regularly for quality

4. **Regular Audits**
   - Review who has access to create pre-assessment notes
   - Adjust permissions as staff roles change
   - Monitor note quality and completeness

## Technical Implementation

### Code Location

- **Action**: `/src/actions/appointments/pre-assessment-note.action.ts`
- **Component**: `/src/components/appointment/PreAssessmentNoteSheet.tsx`
- **Permissions**: `/src/lib/permissions.ts`

### Permission Check

```typescript
// From pre-assessment-note.action.ts
const writePreAssessmentNotePermissions = [
  PERMISSIONS.CLINIC["WRITE:CLINIC:PRE_ASSESSMENT_NOTE"].name
];

const canWritePermission = writePreAssessmentNotePermissions.every(
  permission => myPermissionArray.includes(permission)
);

if (!canWritePermission) {
  throw new Error("You do not have permission to write pre-assessment note.");
}
```

## AI Integration

The AI-powered pre-assessment assistant is available to **any user** who can create pre-assessment notes. The AI features include:

1. **Generate Notes**: AI creates structured assessment from symptoms
2. **Enhance Notes**: AI suggests improvements to existing notes
3. **Generate Instructions**: AI creates home care instructions

AI features respect the same permission system - users must have `WRITE:CLINIC:PRE_ASSESSMENT_NOTE` to use them.

## Frequently Asked Questions

### Q: Can I restrict pre-assessment notes to nurses only?
**A**: Yes! Simply ensure only the "Nurse" role has the `WRITE:CLINIC:PRE_ASSESSMENT_NOTE` permission.

### Q: What if my clinic doesn't have nurses?
**A**: Assign the permission to whatever role handles pre-assessment in your clinic (e.g., Medical Assistant, Doctor).

### Q: Can multiple people create pre-assessment notes for the same appointment?
**A**: Yes, multiple healthcare providers can create separate pre-assessment notes. The system tracks who created each note.

### Q: Do I need to be a healthcare provider to create pre-assessment notes?
**A**: You need the permission. Clinics should only grant this permission to qualified healthcare staff.

### Q: How do I know who created a pre-assessment note?
**A**: Each note stores the creator's information and creation timestamp for audit purposes.

## Summary

Pre-assessment notes in ClinicEZ use a **flexible, permission-based system** that allows clinics to configure access based on their specific needs, workflows, and regulations. This approach provides:

- ✅ **Flexibility** for diverse clinic workflows
- ✅ **Compliance** with varying local regulations  
- ✅ **Efficiency** for multi-role healthcare teams
- ✅ **Control** for clinic administrators
- ✅ **Auditability** of who creates what notes

The system doesn't enforce nurse-only restrictions but empowers each clinic to configure access appropriately for their context.
