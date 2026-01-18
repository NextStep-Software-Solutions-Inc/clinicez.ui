# Category Field Implementation Complete

## Overview

Custom clinic procedures can now specify categories, providing the same organizational structure as master procedures.

## Changes Made

### 1. Form Updates - [clinic-procedure-form.tsx](src/app/(super-admin)/super-admin/diagnostics-procedures/clinic-procedure-form.tsx)

**Added Category Constants:**
```typescript
const IMAGING_CATEGORIES = ["X-Ray", "CT Scan", "MRI", "Ultrasound", "PET Scan", "Mammography", "Fluoroscopy"];
const LABORATORY_CATEGORIES = ["Blood Tests", "Urine Tests", "Tissue Tests", "Chemistry", "Microbiology", "Hematology", "Immunology"];
const HEART_STATION_CATEGORIES = ["ECG", "Echocardiography", "Stress Test", "Holter Monitor", "Pacemaker Check"];
const CATEGORY_MAP = { imaging, laboratory, heart_station };
```

**Updated Form State:**
```typescript
const [formData, setFormData] = useState({
  name: procedure?.name || "",
  category: procedure?.category || "",  // ✅ ADDED
  description: procedure?.description || "",
  masterProcedureId: procedure?.masterProcedureId || "",
  isActive: procedure?.isActive ?? true,
});
```

**Custom Mode - Category Dropdown:**
```tsx
<div>
  <Label htmlFor="category">Category *</Label>
  <Select
    value={formData.category || ""}
    onValueChange={(value) =>
      setFormData({ ...formData, category: value })
    }
  >
    <SelectTrigger id="category">
      <SelectValue placeholder="Select category..." />
    </SelectTrigger>
    <SelectContent>
      {categories.map((cat) => (
        <SelectItem key={cat} value={cat}>
          {cat}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
  <p className="text-xs text-muted-foreground mt-1">
    Choose the category this procedure belongs to
  </p>
</div>
```

**Link Mode - Auto-populate Category:**
When a master procedure is selected, the category is automatically copied:
```typescript
onValueChange={(value) => {
  const selectedProc = masterProcedures?.data?.find((p: any) => p.id.toString() === value);
  setFormData({ 
    ...formData, 
    masterProcedureId: value,
    category: selectedProc?.category || "",  // ✅ Auto-populated
    name: selectedProc?.name || formData.name,
  });
}}
```

**Validation:**
```typescript
if (mode === "custom") {
  if (!formData.category) {
    toast.error("Category is required for custom procedures");
    return;
  }
}
```

### 2. Server Actions - [diagnostics-procedures.action.ts](src/actions/super-admin/diagnostics-procedures.action.ts)

**Updated All Three Create Actions:**

- `createClinicImagingProcedureAction` - now accepts `category?: string`
- `createClinicLaboratoryProcedureAction` - now accepts `category?: string`
- `createClinicHeartStationProcedureAction` - now accepts `category?: string`

**Example:**
```typescript
export async function createClinicImagingProcedureAction({
  clinicId,
  name,
  category,  // ✅ ADDED
  description,
  masterProcedureId,
}: {
  clinicId: number;
  name: string;
  category?: string;  // ✅ ADDED
  description?: string;
  masterProcedureId?: number;
}) {
  const procedure = await prisma.clinicImagingProcedure.create({
    data: {
      clinicId,
      name,
      category,  // ✅ SAVED TO DB
      description,
      masterProcedureId,
      isActive: true,
    },
    include: {
      MasterProcedure: true,
    },
  });

  return { data: procedure };
}
```

**Updated Update Action:**
```typescript
export async function updateClinicProcedureAction({
  type,
  id,
  name,
  category,  // ✅ ADDED
  description,
  masterProcedureId,
  isActive,
}: {
  type: "imaging" | "laboratory" | "heart_station";
  id: number;
  name?: string;
  category?: string;  // ✅ ADDED
  description?: string;
  masterProcedureId?: number | null;
  isActive?: boolean;
}) {
  const data = {
    ...(name !== undefined ? { name } : {}),
    ...(category !== undefined ? { category } : {}),  // ✅ ADDED
    ...(description !== undefined ? { description } : {}),
    ...(masterProcedureId !== undefined ? { masterProcedureId } : {}),
    ...(isActive !== undefined ? { isActive } : {}),
  };
  // ... update logic
}
```

### 3. Schema Updates - [schema.prisma](prisma/schema.prisma)

**Already Complete (from previous work):**
- All three clinic procedure models have `category String?` field
- Removed incorrect `clinicPatientId` foreign keys
- Removed procedure relations from ClinicPatient model

**Models Updated:**
```prisma
model ClinicImagingProcedure {
  id                Int               @id @default(autoincrement())
  clinicId          Int
  name              String
  category          String?           // ✅ ADDED
  description       String?
  masterProcedureId Int?
  isActive          Boolean           @default(true)
  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt
  // Relations...
}

model ClinicLaboratoryProcedure {
  // Same structure with category field
}

model ClinicHeartStationProcedure {
  // Same structure with category field
}
```

## User Experience

### Creating Custom Procedure

1. User opens "Add Procedure" dialog
2. Selects "Create Custom Procedure" mode
3. Enters procedure name
4. **Selects category from dropdown** ← NEW!
5. Optionally adds description
6. Clicks "Create Procedure"

**Category dropdown shows:**
- For Imaging: X-Ray, CT Scan, MRI, Ultrasound, PET Scan, Mammography, Fluoroscopy
- For Laboratory: Blood Tests, Urine Tests, Tissue Tests, Chemistry, Microbiology, Hematology, Immunology
- For Heart Station: ECG, Echocardiography, Stress Test, Holter Monitor, Pacemaker Check

### Linking to Master Procedure

1. User opens "Add Procedure" dialog
2. Selects "Link to Master Procedure" mode
3. Master procedures dropdown shows grouped by category
4. User selects a master procedure
5. **Category is automatically inherited from master** ← Automatic!
6. User can add clinic-specific description
7. Clicks "Create Procedure"

## Validation Rules

1. **Custom Mode:**
   - Name is required
   - Category is required
   - Description is optional

2. **Link Mode:**
   - Master procedure selection is required
   - Category is auto-populated from master
   - Name is auto-populated from master (can be customized)
   - Description is optional (clinic-specific notes)

## Next Steps

### Required: Run Database Migration

⚠️ **Schema changes need to be migrated to the database:**

```bash
# Generate and apply migration
npx prisma migrate dev --name add_category_to_clinic_procedures

# Generate Prisma client with updated types
npx prisma generate
```

### Optional: Display Category in Table

Update clinic procedures table to show category column:

**File:** `src/components/super-admin/clinic-procedures-table.tsx`

Add category column:
```tsx
<TableHead>Category</TableHead>
// ...
<TableCell>{procedure.category || "-"}</TableCell>
```

### Optional: Filter/Group by Category

Enhance table with category filters or grouping:
- Add dropdown filter to show only procedures in selected category
- Group procedures by category in the display
- Add category badges with color coding

## Testing Checklist

- [ ] Create custom imaging procedure with category
- [ ] Create custom laboratory procedure with category
- [ ] Create custom heart station procedure with category
- [ ] Link to master procedure (verify category auto-populated)
- [ ] Edit existing clinic procedure (verify category field shown)
- [ ] Verify validation: cannot create custom procedure without category
- [ ] Verify category saved correctly to database
- [ ] Test all three procedure types (imaging, laboratory, heart station)

## Files Modified

1. ✅ [clinic-procedure-form.tsx](src/app/(super-admin)/super-admin/diagnostics-procedures/clinic-procedure-form.tsx)
   - Added category constants
   - Added category to form state
   - Added category dropdown for custom mode
   - Added category auto-population for link mode
   - Added validation

2. ✅ [diagnostics-procedures.action.ts](src/actions/super-admin/diagnostics-procedures.action.ts)
   - Updated createClinicImagingProcedureAction
   - Updated createClinicLaboratoryProcedureAction
   - Updated createClinicHeartStationProcedureAction
   - Updated updateClinicProcedureAction

3. ✅ [schema.prisma](prisma/schema.prisma)
   - Already had category field (from previous work)
   - Removed incorrect procedure relations from ClinicPatient

## Benefits

1. **Consistency**: Custom clinic procedures now have same organizational structure as master procedures
2. **Usability**: Easy to find and filter procedures by category
3. **Data Quality**: Required category field ensures all procedures are properly classified
4. **Auto-populate**: Linking to master procedures automatically inherits category (no manual entry needed)
5. **Type-safe**: Category constants prevent typos and ensure valid categories

## Architecture

```
Master Procedures (with categories)
         ↓
    Link Feature
         ↓
Clinic Procedures (inherit category OR specify custom category)
         ↓
    Used in
         ↓
Patient Requests (ClinicImagingRequest, etc.)
```

**Note:** Patient links exist only in *Request* models, not in procedure definition models. Procedures are clinic-level definitions that can be used across multiple patient requests.
