# Diagnostics & Procedures Console - Quick Reference

## Access Point
- **URL**: `/super-admin/diagnostics-procedures`
- **Menu**: Super Admin Console → Diagnostics & Procedures
- **Permission**: SUPER_ADMIN role required

## Two Main Sections

### 1. Master Procedures Tab
Manage system-wide procedure definitions that can be reused across all clinics.

**Three Procedure Types:**
- **Imaging Procedures** - X-Ray, CT Scan, MRI, Ultrasound, PET Scan, Mammography, Fluoroscopy
- **Laboratory Procedures** - Blood Tests, Urine Tests, Tissue Tests, Chemistry, Microbiology, Hematology, Immunology
- **Heart Station** - ECG, Echocardiography, Stress Test, Holter Monitor, Pacemaker Check

**Actions Available:**
- ➕ Add new procedure
- 🔍 Search by name, description, or category
- 🔄 Toggle between active-only and all procedures view
- ✏️ Edit procedure details
- 🗑️ Delete procedure (only if not used by any clinic)

### 2. Clinic Procedures Tab
Manage clinic-specific procedure configurations.

**Setup:**
1. Select a clinic from dropdown
2. Select procedure type (Imaging/Laboratory/Heart Station)
3. View clinic's procedures

**Actions Available:**
- ➕ Add new clinic procedure
- 🔗 Link to master procedure (optional)
- 🔍 Search by name or description
- 🔄 Toggle between active-only and all procedures view
- ✏️ Edit procedure details
- 🗑️ Delete procedure

## Best Practices

### Creating Master Procedures
1. Use standardized naming (e.g., "CT Head" not "ct scan for head")
2. Select appropriate category for consistency
3. Add meaningful descriptions for clarity
4. Keep descriptions short but informative

### Creating Clinic Procedures
1. Start with clinic-specific name/description
2. Link to master procedure when available for consistency
3. Can create custom procedures without master linking
4. Use descriptions to clarify clinic-specific requirements

### Deletion Considerations
- Cannot delete master procedures actively used by clinic procedures
- First unlink clinic procedures if needed before deleting master
- Confirm deletion in safety dialog

## Common Workflows

### Add a New Hospital-Wide Procedure
1. Go to Master Procedures
2. Select procedure type
3. Click "Add Procedure"
4. Fill in name, category, optional description
5. Ensure "Active" is checked
6. Click "Create Procedure"

### Link Clinic to Master Procedures
1. Go to Clinic Procedures
2. Select clinic
3. Select procedure type
4. Click "Add Procedure"
5. Enter clinic-specific name (if different from master)
6. Select "Master Procedure" dropdown
7. Choose master procedure to link
8. Click "Create Procedure"

### Deactivate a Procedure
1. Find the procedure in table
2. Click Edit button
3. Uncheck "Active"
4. Click "Update Procedure"

### Search Procedures
- Master Procedures: Searches by name, description, category
- Clinic Procedures: Searches by name, description
- Case-insensitive search
- Real-time filter with pagination reset

## Data Fields

### Master Procedure Fields
- **Name** * (required) - Procedure display name
- **Category** * (required) - Predefined category list
- **Description** - Optional additional info
- **Status** - Active/Inactive toggle

### Clinic Procedure Fields
- **Name** * (required) - Clinic-specific procedure name
- **Master Procedure** - Optional link to master procedure
- **Description** - Optional clinic-specific notes
- **Status** - Active/Inactive toggle

## Pagination
- Displays 10 items per page
- Navigation: Previous | Page Numbers | Next
- Current page highlighted

## Status Indicators
- **Active** - Green badge, procedure is in use
- **Inactive** - Gray badge, procedure disabled but retained

## Error Messages
- "Cannot delete procedure in use by X clinic procedure(s)" - Master procedure is linked to clinics
- Form validation errors appear at field level
- Toast notifications confirm success or warn of failures

## Tips & Tricks
- Use search to quickly find procedures instead of browsing all
- Link clinic procedures to masters for better data consistency
- Inactive procedures remain in system for historical records
- Edit dialog shows current values pre-filled

---
**Need Help?** Contact the system administrator for SUPER_ADMIN access or permissions.
