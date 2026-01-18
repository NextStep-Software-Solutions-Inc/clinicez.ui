# ✨ Enhanced Add Procedure Dialog - v3.2

## Changes Made

### Issue 1: Why 2 "Add Procedure" Buttons?
Actually, there's only **1 button per tab** - each of the 3 procedure type tabs (Imaging, Laboratory, Heart Station) has its own "Add Procedure" button at the top right, which is why it might appear to be showing multiple times. This is correct behavior - each tab manages its own procedures independently.

---

### Issue 2: Unclear Procedure Creation Options
**Solution**: Completely redesigned the Add Procedure dialog to make it crystal clear how to either create a custom procedure or link to a master procedure.

### What Changed

#### File Modified
`src/app/(super-admin)/super-admin/diagnostics-procedures/clinic-procedure-form.tsx`

#### New Features

**1. Step-by-Step Guidance**
The form now presents a clear 2-step process:

```
Step 1: Choose How to Add Procedure
├─ ⊙ Create Custom Procedure
│  └─ Create a new procedure specific to this clinic (not linked to master)
└─ ⊙ Link to Master Procedure
   └─ Select an existing master procedure and customize it for this clinic

Step 2: Procedure Details
├─ [Depends on Step 1 choice]
├─ Clinic-Specific Details (Optional)
└─ Active Status
```

**2. Radio Button Mode Selection**
- Clear visual distinction between two modes
- Icons for each option (Plus for create, Link for link)
- Helpful descriptions for each mode

**3. Dynamic Form Content**

**If "Create Custom Procedure" is selected:**
```
- Procedure Name * (required text input)
- Clinic-Specific Details (optional textarea)
- Active Status (toggle)
```

**If "Link to Master Procedure" is selected:**
```
- Select Master Procedure * (required dropdown)
  - Shows all available master procedures
  - Displays procedure name and category
  - Shows message if no master procedures exist
- Blue success alert when procedure selected
  "✓ Linked to master procedure. You can add clinic-specific details below."
- Clinic-Specific Details (optional textarea)
- Active Status (toggle)
```

**4. Smart Validation**
- Form submission button only enabled when required fields are filled
- Different validation rules based on mode:
  - Custom mode: Requires procedure name
  - Link mode: Requires selected master procedure
- Real-time validation alerts shown above submit buttons

**5. Improved Labels & Help Text**
```
"Clinic-Specific Details (Optional)"
→ For custom mode: "Add details about this procedure..."
→ For link mode: "Add any clinic-specific notes or instructions..."

Active Status:
→ "Active (Enable this procedure for clinicians)"
```

**6. Visual Hierarchy**
- Large font for step titles
- Color-coded alerts:
  - Blue (info): Master procedure linked
  - Amber (warning): Validation errors
- Proper spacing and borders to separate steps
- Background color for important toggle options

---

## How It Looks

### Mode Selection (Step 1)
```
┌─────────────────────────────────────────────────┐
│ Step 1: Choose How to Add Procedure             │
│                                                  │
│ ⊙ + Create Custom Procedure                    │
│   Create a new procedure specific to this      │
│   clinic (not linked to master)                │
│                                                  │
│ ○ 🔗 Link to Master Procedure                  │
│   Select an existing master procedure and      │
│   customize it for this clinic                 │
└─────────────────────────────────────────────────┘
```

### Custom Mode (Step 2)
```
┌─────────────────────────────────────────────────┐
│ Step 2: Procedure Details                       │
│                                                  │
│ Procedure Name *                                │
│ [_______________________________]                │
│ Create a custom name for this clinic-specific  │
│ procedure                                       │
│                                                  │
│ Clinic-Specific Details (Optional)              │
│ [_______________________________]                │
│ [_______________________________]                │
│ Add details about this procedure...            │
│                                                  │
│ ☑ Active (Enable this procedure for clinicians)│
│                                                  │
│ [Cancel]  [Create Procedure]                   │
└─────────────────────────────────────────────────┘
```

### Link Mode (Step 2)
```
┌─────────────────────────────────────────────────┐
│ Step 2: Procedure Details                       │
│                                                  │
│ Select Master Procedure *                       │
│ [Choose a master procedure...]                 │
│ Your clinic name will be added as a suffix to  │
│ the master procedure name                      │
│                                                  │
│ ╔═════════════════════════════════════════╗    │
│ ║ ✓ Linked to master procedure. You can   ║    │
│ ║   add clinic-specific details below.    ║    │
│ ╚═════════════════════════════════════════╝    │
│                                                  │
│ Clinic-Specific Details (Optional)              │
│ [_______________________________]                │
│ [_______________________________]                │
│ Add any clinic-specific notes or...            │
│                                                  │
│ ☑ Active (Enable this procedure for clinicians)│
│                                                  │
│ [Cancel]  [Create Procedure]                   │
└─────────────────────────────────────────────────┘
```

---

## User Experience Flow

### Scenario 1: Create Custom Procedure
```
1. Click "Add Procedure" button
2. Dialog opens → See radio buttons
3. "Create Custom Procedure" already selected (default)
4. Enter procedure name
5. (Optional) Add clinic-specific notes
6. (Optional) Toggle Active status
7. Click "Create Procedure"
8. Dialog closes, table refreshes
```

### Scenario 2: Link to Master Procedure
```
1. Click "Add Procedure" button
2. Dialog opens → See radio buttons
3. Select "Link to Master Procedure"
4. Form changes → Select Master Procedure dropdown appears
5. Choose from available master procedures
6. Blue alert confirms: "✓ Linked to master procedure..."
7. (Optional) Add clinic-specific notes
8. (Optional) Toggle Active status
9. Click "Create Procedure"
10. Dialog closes, table refreshes with linked procedure
```

---

## Validation & Error Handling

### Create Custom Mode Validation
```
✅ Valid: Name filled in
❌ Invalid: Name empty → Alert shows "⚠ Enter a procedure name to continue"
           Submit button disabled
```

### Link to Master Mode Validation
```
✅ Valid: Master procedure selected
❌ Invalid: No selection → Alert shows "⚠ Select a master procedure to continue"
           Submit button disabled
```

### Success Messages
```
✅ "Procedure created successfully" (Toast)
✅ "Procedure updated successfully" (Toast)
❌ "Please select a master procedure" (Toast)
❌ "Procedure name is required" (Toast)
```

---

## Code Changes Summary

### Imports Added
```typescript
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Link as LinkIcon } from "lucide-react";
```

### State Changes
```typescript
// Added mode state
const [mode, setMode] = useState<"custom" | "link">(
  procedure?.masterProcedureId ? "link" : "custom"
);

// When editing, automatically selects "link" mode if masterProcedureId exists
```

### Form Structure
```typescript
// Step 1: Mode Selection
<RadioGroup /> with two options:
  - custom: Create Custom Procedure
  - link: Link to Master Procedure

// Step 2: Procedure Details (dynamic based on mode)
if (mode === "link"):
  - Master Procedure Select dropdown
  - Blue alert when selected
else (mode === "custom"):
  - Procedure Name input

// Always shown:
  - Clinic-Specific Details textarea
  - Active status checkbox
  - Submit/Cancel buttons
```

---

## Testing Checklist

- [ ] Navigate to clinic detail → Procedures tab
- [ ] Click "Add Procedure" button in any tab
- [ ] Dialog opens with radio button selection
- [ ] Select "Create Custom Procedure"
  - [ ] Form shows Procedure Name input
  - [ ] Can enter custom name
  - [ ] Submit button works
- [ ] Switch to "Link to Master Procedure"
  - [ ] Master procedure dropdown appears
  - [ ] Can select procedure from list
  - [ ] Blue alert shows when selected
  - [ ] Submit button works
- [ ] Validation works:
  - [ ] Custom mode: Can't submit without name
  - [ ] Link mode: Can't submit without selection
- [ ] Procedure appears in table after creation
- [ ] Can toggle between modes without data loss

---

## Technical Details

### Component: ClinicProcedureForm
- Location: `src/app/(super-admin)/super-admin/diagnostics-procedures/clinic-procedure-form.tsx`
- Lines changed: ~150+ lines added/modified
- TypeScript: ✅ Zero compilation errors
- Validation: Smart mode-based validation

### Styling
- Uses shadcn/ui components: RadioGroup, Alert, Input, Select, etc.
- Responsive design maintained
- Proper spacing and visual hierarchy
- Color-coded feedback (blue info, amber warning)

---

## Benefits

✅ **Clear Intent**: Users immediately understand the two options
✅ **Reduced Errors**: Smart validation prevents invalid states
✅ **Better UX**: Dynamic form changes based on selected mode
✅ **Visual Feedback**: Color-coded alerts and helpful text
✅ **Flexible**: Supports both custom and master-linked procedures
✅ **Guided Process**: Step-by-step instructions reduce confusion

---

**Status**: ✅ Ready for Testing  
**Version**: 3.2  
**Date**: January 18, 2026  
**TypeScript**: ✅ Zero Errors
