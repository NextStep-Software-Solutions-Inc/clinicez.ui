# Super Admin Diagnostics & Procedures Management Console

## Overview

Added a comprehensive super admin console for managing master diagnostic/procedure data and clinic-specific procedure configurations.

## Features Implemented

### 1. Master Procedures Management

The super admin can manage three types of master procedures:

- **Imaging Procedures** (X-Ray, CT Scan, MRI, Ultrasound, PET Scan, Mammography, Fluoroscopy)
- **Laboratory Procedures** (Blood Tests, Urine Tests, Tissue Tests, Chemistry, Microbiology, Hematology, Immunology)
- **Heart Station Procedures** (ECG, Echocardiography, Stress Test, Holter Monitor, Pacemaker Check)

Each master procedure includes:

- Procedure name
- Category (predefined options per type)
- Description
- Active/Inactive status
- Created/Updated timestamps

### 2. Clinic Procedures Management

Super admins can manage clinic-specific procedure configurations:

- Select a specific clinic
- Select procedure type (Imaging, Laboratory, Heart Station)
- Link clinic procedures to master procedures
- Create custom clinic-specific procedures (not linked to master)
- Override procedures with clinic-specific information

### 3. Key Capabilities

#### Master Procedures Tab

- **List**: View all master procedures with pagination (10 per page)
- **Search**: Filter by name, description, or category
- **Toggle**: Show active only or all procedures
- **Create**: Add new master procedures with validation
- **Edit**: Update procedure details while maintaining type consistency
- **Delete**: Remove master procedures (with check for clinic usage)

#### Clinic Procedures Tab

- **Clinic Selection**: Choose clinic to manage procedures for
- **Type Selection**: Filter by procedure type
- **List**: View clinic procedures with master procedure associations
- **Link to Master**: Connect clinic procedures to master procedures for consistency
- **Custom Procedures**: Create clinic-specific procedures without master linkage
- **Edit/Delete**: Manage clinic-specific configurations

## File Structure

```text
src/
├── actions/super-admin/
│   └── diagnostics-procedures.action.ts          # Server actions
├── app/(super-admin)/super-admin/
│   └── diagnostics-procedures/
│       ├── page.tsx                              # Main page
│       ├── diagnostics-procedures-console.tsx    # Root component
│       ├── master-procedures-tab.tsx             # Master procedures tab
│       ├── clinic-procedures-tab.tsx             # Clinic procedures tab
│       ├── master-procedure-form.tsx             # Master procedure form
│       ├── clinic-procedure-form.tsx             # Clinic procedure form
│       ├── master-imaging-procedures-table.tsx   # Imaging procedures table
│       ├── master-laboratory-procedures-table.tsx # Laboratory procedures table
│       ├── master-heart-station-procedures-table.tsx # Heart station table
│       ├── clinic-procedures-selector.tsx        # Clinic selector
│       └── clinic-procedures-table.tsx           # Clinic procedures table
└── app/(super-admin)/
    └── layout.tsx                                # Updated with menu item
```

## Database Models Used

- `ImagingProcedure`: Master imaging procedures
- `LaboratoryProcedure`: Master laboratory procedures
- `HeartStationProcedure`: Master heart station procedures
- `ClinicImagingProcedure`: Clinic-specific imaging procedures
- `ClinicLaboratoryProcedure`: Clinic-specific laboratory procedures
- `ClinicHeartStationProcedure`: Clinic-specific heart station procedures
- `Clinic`: For clinic selection and association

## Navigation Integration

Added "Diagnostics & Procedures" menu item to super admin sidebar navigation:

- Path: `/super-admin/diagnostics-procedures`
- Position: Between "Appointment Tabs" and "Tenants"

## Server Actions (20 functions)

### Master Imaging Procedures

1. `getAllMasterImagingProceduresAction` - List with pagination & search
2. `createMasterImagingProcedureAction` - Create new
3. `updateMasterImagingProcedureAction` - Update existing
4. `deleteMasterImagingProcedureAction` - Delete with usage check

### Master Laboratory Procedures

1. `getAllMasterLaboratoryProceduresAction` - List with pagination & search
2. `createMasterLaboratoryProcedureAction` - Create new
3. `updateMasterLaboratoryProcedureAction` - Update existing
4. `deleteMasterLaboratoryProcedureAction` - Delete with usage check

### Master Heart Station Procedures

1. `getAllMasterHeartStationProceduresAction` - List with pagination & search
2. `createMasterHeartStationProcedureAction` - Create new
3. `updateMasterHeartStationProcedureAction` - Update existing
4. `deleteMasterHeartStationProcedureAction` - Delete with usage check

### Clinic Procedures

1. `getClinicProceduresByTypeAction` - List clinic procedures by type
2. `createClinicImagingProcedureAction` - Create clinic imaging procedure
3. `createClinicLaboratoryProcedureAction` - Create clinic laboratory procedure
4. `createClinicHeartStationProcedureAction` - Create clinic heart station procedure
5. `updateClinicProcedureAction` - Update clinic procedure (type-agnostic)
6. `deleteClinicProcedureAction` - Delete clinic procedure (type-agnostic)

### Utility

1. `getAllClinicsForSelectionAction` - Get list of active clinics for selection

## UI Components

### Tables

- Search functionality with icon
- Pagination (Previous/Page Numbers/Next)
- Active/Inactive status badges
- Edit & Delete actions for each row
- Empty state messaging

### Forms

- Modal dialogs for create/edit operations
- Form validation
- Master procedure category dropdown (predefined options)
- Active/Inactive toggle
- Description textarea
- Cancel/Submit buttons with loading state

### Dialogs

- Create dialogs
- Edit dialogs
- Delete confirmation dialogs with safety warnings

## Usage Flow

### Managing Master Procedures

1. Navigate to Super Admin Console
2. Click "Diagnostics & Procedures"
3. Go to "Master Procedures" tab
4. Select procedure type (Imaging/Laboratory/Heart Station)
5. Create, edit, search, or delete procedures
6. Link to clinic procedures as needed

### Managing Clinic Procedures

1. Navigate to Super Admin Console
2. Click "Diagnostics & Procedures"
3. Go to "Clinic Procedures" tab
4. Select a clinic and procedure type
5. Create clinic-specific procedures
6. Optionally link to master procedures
7. Edit or delete as needed

## Error Handling

- Prevents deletion of master procedures in use by clinic procedures
- Form validation for required fields
- Toast notifications for success/error messages
- Network error handling with user-friendly messages

## Performance Considerations

- Pagination for large datasets (10 items per page)
- Cached clinic list queries
- Efficient database queries with proper indexes
- React Query for state management and caching

## Future Enhancements

- Bulk import/export of procedures
- Procedure templates
- Audit logging for procedure changes
- Cost/billing information per procedure
- Procedure usage analytics
- Custom procedure categories per clinic
