# Diagnostics & Procedures Management - Navigation Guide

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Super Admin Console                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  • Permissions                                                   │
│  • Clinic Roles                                                  │
│  • Appointment Tabs                                              │
│  ► Diagnostics & Procedures ─────┐  (MASTER PROCEDURES ONLY)   │
│  • Tenants                        │                             │
│  • System Admins                  │                             │
│  • Users                          │                             │
│                                   │                             │
│  ┌──────────────────────────────┘                              │
│  │                                                              │
│  └─► Master Procedures Console                                 │
│      ├─ Imaging Procedures Tab                                 │
│      ├─ Laboratory Procedures Tab                              │
│      └─ Heart Station Procedures Tab                           │
│          • Search                                              │
│          • Pagination                                          │
│          • Add/Edit/Delete                                     │
│          • Active/Inactive Toggle                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

                              OR

┌─────────────────────────────────────────────────────────────────┐
│                    Super Admin Console                          │
│                       Tenants Section                           │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ↓
                    ┌───────────────┐
                    │ Tenant Detail │
                    └───────────────┘
                            │
                            ↓
        ┌───────────────────┬───────────────────┐
        │ Organizations Tab │  Clinics Tab      │
        └───────────────────┴───────────────────┘
                            │
                            ↓
                    ┌───────────────┐
                    │ Clinic Detail │
                    └───────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ↓                   ↓                   ↓
    Clinic Roles  Appointment Tabs   ► Procedures Tab ◄─── CLINIC PROCEDURES
        │                   │                   │
        │                   │         ┌─────────┴─────────┐
        │                   │         │                   │
        │                   │         ↓                   ↓
        │                   │   Imaging Tab        Laboratory Tab
        │                   │         │                   │
        │                   │    • Search             • Search
        │                   │    • Pagination        • Pagination
        │                   │    • Add/Edit/Delete   • Add/Edit/Delete
        │                   │    • Master Link       • Master Link
        │                   │    • Active Toggle     • Active Toggle
        │                   │
        │                   └─────────┬──────────────┐
        │                             │              │
        │                        Heart Station   (More)
        │                           Tab
        └─────────────────────────────┘
```

## Navigation Paths

### Master Procedures
**Full Path**: `/super-admin/diagnostics-procedures`
**Menu**: Super Admin Console → Diagnostics & Procedures
**Purpose**: Manage system-wide master procedures
**Contains**:
- Imaging Procedures (Master)
- Laboratory Procedures (Master)
- Heart Station Procedures (Master)

### Clinic Procedures
**Full Path**: `/super-admin/tenants/[tenantId]/clinics/[clinicId]` → Procedures Tab
**Navigation**:
1. Super Admin Console → Tenants
2. Select a Tenant
3. Click on a Clinic
4. Go to "Procedures" Tab

**Purpose**: Manage clinic-specific procedure configurations
**Contains**:
- Imaging Procedures (Clinic-specific)
- Laboratory Procedures (Clinic-specific)
- Heart Station Procedures (Clinic-specific)

## Key Differences

| Aspect | Master Procedures | Clinic Procedures |
|--------|-------------------|-------------------|
| **Scope** | System-wide | Single clinic |
| **Location** | `/super-admin/diagnostics-procedures` | Clinic detail page |
| **Reusability** | Can be linked to multiple clinics | Clinic-specific only |
| **Creation** | Direct creation | Can link to master or create custom |
| **Deletion** | Protected if in use by clinics | No protection |
| **Managed By** | System admin | Clinic-level admin |

## Workflow Examples

### Example 1: Create New Master Procedure
1. Go to Super Admin Console
2. Click "Diagnostics & Procedures"
3. Go to "Master Procedures" tab
4. Select procedure type (Imaging/Lab/Heart)
5. Click "Add Procedure"
6. Fill in name, category, description
7. Click "Create Procedure"

### Example 2: Link Clinic to Master Procedure
1. Go to Super Admin Console
2. Click "Tenants"
3. Select tenant
4. Click on clinic
5. Go to "Procedures" tab
6. Select procedure type
7. Click "Add Procedure"
8. Enter clinic-specific name (optional)
9. Select "Master Procedure" from dropdown
10. Click "Create Procedure"

### Example 3: Create Custom Clinic Procedure
1. Go to Super Admin Console
2. Click "Tenants"
3. Select tenant
4. Click on clinic
5. Go to "Procedures" tab
6. Select procedure type
7. Click "Add Procedure"
8. Enter clinic-specific name
9. Leave "Master Procedure" empty
10. Click "Create Procedure"

### Example 4: Search Procedures
**Master Procedures**:
- Searches: Name, Description, Category
- Scope: All master procedures of that type

**Clinic Procedures**:
- Searches: Name, Description
- Scope: Only procedures for selected clinic

## Quick Reference

### Master Procedures Available Actions
- ✅ Create new master procedure
- ✅ Edit master procedure details
- ✅ Search by name/description/category
- ✅ Toggle active/inactive status
- ✅ Delete (if not in use)
- ✅ View pagination (10 per page)

### Clinic Procedures Available Actions
- ✅ Create clinic-specific procedure
- ✅ Link to master procedure
- ✅ Edit clinic procedure details
- ✅ Search by name/description
- ✅ Toggle active/inactive status
- ✅ Delete procedure
- ✅ View pagination (10 per page)
- ✅ See master procedure association

## Access Control

Both sections require **SUPER_ADMIN** permission:
- `/super-admin/diagnostics-procedures` → Requires SUPER_ADMIN
- `/super-admin/tenants/[tenantId]/clinics/[clinicId]` → Requires SUPER_ADMIN

Clinic staff cannot access these sections directly; access is super-admin only.
