# Complete Architecture Diagram

## System Organization

```
╔═════════════════════════════════════════════════════════════════════╗
║                     CLINICEZ SUPER ADMIN CONSOLE                   ║
╚═════════════════════════════════════════════════════════════════════╝

SIDEBAR NAVIGATION
├── 📋 Permissions
├── 🔐 Clinic Roles
├── 📅 Appointment Tabs
├── ⚙️ Diagnostics & Procedures ◄──┐ SYSTEM-WIDE ONLY
├── 🏢 Tenants                     │
├── 👤 System Admins               │
└── 👥 Users                       │

MASTER PROCEDURES CONSOLE
/super-admin/diagnostics-procedures
│
├─ Master Imaging Procedures
│  ├─ Create, Read, Update, Delete
│  ├─ Search by name/description/category
│  ├─ Toggle active/inactive
│  ├─ Pagination (10 per page)
│  └─ Cannot delete if linked to clinic procedures
│
├─ Master Laboratory Procedures
│  ├─ Create, Read, Update, Delete
│  ├─ Search by name/description/category
│  ├─ Toggle active/inactive
│  ├─ Pagination (10 per page)
│  └─ Cannot delete if linked to clinic procedures
│
└─ Master Heart Station Procedures
   ├─ Create, Read, Update, Delete
   ├─ Search by name/description/category
   ├─ Toggle active/inactive
   ├─ Pagination (10 per page)
   └─ Cannot delete if linked to clinic procedures
```

## Clinic Management Hierarchy

```
TENANTS SECTION
/super-admin/tenants

└─ Tenant List
   └─ [Select Tenant]
      └─ Tenant Detail Page
         │
         ├─ Tab: Overview
         │  ├─ Tenant Statistics
         │  └─ Tenant Information
         │
         ├─ Tab: Organizations
         │  ├─ Organization List
         │  └─ [Click Organization] → Organization Detail
         │
         └─ Tab: Clinics
            └─ [Click Clinic]
               └─ Clinic Detail Page
                  ├─ Clinic Statistics
                  │  ├─ Members Count
                  │  ├─ Patients Count
                  │  └─ Appointment Tabs Count
                  │
                  ├─ Clinic Information
                  │  ├─ Clinic UID
                  │  ├─ Email
                  │  └─ Status (Active/Inactive)
                  │
                  ├─ Tab: Clinic Roles
                  │  ├─ System-wide roles
                  │  └─ Member counts
                  │
                  ├─ Tab: Appointment Tabs
                  │  ├─ Configure tabs
                  │  └─ Manage clinic-specific tabs
                  │
                  └─ Tab: Procedures ◄──┐ CLINIC-SPECIFIC
                     │                  │
                     ├─ Imaging Procedures
                     │  ├─ List clinic imaging procedures
                     │  ├─ Create custom or link to master
                     │  ├─ Edit procedure details
                     │  ├─ Delete procedure
                     │  ├─ Search
                     │  ├─ Pagination
                     │  └─ View master procedure link
                     │
                     ├─ Laboratory Procedures
                     │  ├─ List clinic laboratory procedures
                     │  ├─ Create custom or link to master
                     │  ├─ Edit procedure details
                     │  ├─ Delete procedure
                     │  ├─ Search
                     │  ├─ Pagination
                     │  └─ View master procedure link
                     │
                     └─ Heart Station Procedures
                        ├─ List clinic heart station procedures
                        ├─ Create custom or link to master
                        ├─ Edit procedure details
                        ├─ Delete procedure
                        ├─ Search
                        ├─ Pagination
                        └─ View master procedure link
```

## Data Flow

```
┌────────────────────────────────────────────────────────────────┐
│ DATABASE                                                       │
│                                                                │
│ ┌─────────────────────────────────────────────────────────┐   │
│ │ Master Procedures (System-wide)                         │   │
│ ├─────────────────────────────────────────────────────────┤   │
│ │ • ImagingProcedure (table)                              │   │
│ │   - id, name, category, description, isActive          │   │
│ │                                                         │   │
│ │ • LaboratoryProcedure (table)                           │   │
│ │   - id, name, category, description, isActive          │   │
│ │                                                         │   │
│ │ • HeartStationProcedure (table)                         │   │
│ │   - id, name, category, description, isActive          │   │
│ └─────────────────────────────────────────────────────────┘   │
│                          ↑ ↓                                   │
│                      (LINKED BY)                              │
│                          ↑ ↓                                   │
│ ┌─────────────────────────────────────────────────────────┐   │
│ │ Clinic Procedures (Clinic-specific)                    │   │
│ ├─────────────────────────────────────────────────────────┤   │
│ │ • ClinicImagingProcedure (table)                        │   │
│ │   - id, clinicId, masterProcedureId, name, ...         │   │
│ │                                                         │   │
│ │ • ClinicLaboratoryProcedure (table)                     │   │
│ │   - id, clinicId, masterProcedureId, name, ...         │   │
│ │                                                         │   │
│ │ • ClinicHeartStationProcedure (table)                   │   │
│ │   - id, clinicId, masterProcedureId, name, ...         │   │
│ └─────────────────────────────────────────────────────────┘   │
│                                                                │
│ ┌─────────────────────────────────────────────────────────┐   │
│ │ Clinic (table) - Links everything                       │   │
│ │   - id, name, clinicUid, email, isActive               │   │
│ └─────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────┘

RELATIONSHIP: masterProcedureId (Foreign Key)
├─ Optional: NULL = Custom clinic procedure (no master link)
└─ Not NULL = Linked to master procedure
```

## Component Structure

```
Super Admin Layout (Provides QueryClientProvider)
│
├─ Root Pages
│  └─ Diagnostics & Procedures Console
│     └─ Master Procedures Tab
│        ├─ Imaging Procedures Table
│        ├─ Laboratory Procedures Table
│        └─ Heart Station Procedures Table
│
└─ Clinic Detail Page
   └─ Procedures Tab (NEW)
      └─ Clinic Procedures Manager
         ├─ Imaging Procedures (with table + add dialog)
         ├─ Laboratory Procedures (with table + add dialog)
         └─ Heart Station Procedures (with table + add dialog)

Forms & Dialogs
├─ Master Procedure Form
│  └─ Used in: Master procedures tables
│
└─ Clinic Procedure Form
   └─ Used in: Clinic procedures manager
```

## Server Actions

```
MASTER PROCEDURES ACTIONS
├─ getAllMasterImagingProceduresAction()
├─ createMasterImagingProcedureAction()
├─ updateMasterImagingProcedureAction()
├─ deleteMasterImagingProcedureAction()
│
├─ getAllMasterLaboratoryProceduresAction()
├─ createMasterLaboratoryProcedureAction()
├─ updateMasterLaboratoryProcedureAction()
├─ deleteMasterLaboratoryProcedureAction()
│
├─ getAllMasterHeartStationProceduresAction()
├─ createMasterHeartStationProcedureAction()
├─ updateMasterHeartStationProcedureAction()
└─ deleteMasterHeartStationProcedureAction()

CLINIC PROCEDURES ACTIONS
├─ getClinicProceduresByTypeAction()
├─ createClinicImagingProcedureAction()
├─ createClinicLaboratoryProcedureAction()
├─ createClinicHeartStationProcedureAction()
├─ updateClinicProcedureAction()
└─ deleteClinicProcedureAction()

UTILITY ACTIONS
└─ getAllClinicsForSelectionAction()
```

## Access Control

```
┌─────────────────────────────────────┐
│   PERMISSION: SUPER_ADMIN           │
├─────────────────────────────────────┤
│ Required for:                       │
│ • Master Procedures Console Access  │
│ • Clinic Procedures Tab Access      │
│ • All CRUD operations               │
│ • Deletion of procedures            │
└─────────────────────────────────────┘
     ↓
     All operations require SUPER_ADMIN check via isSuperAdminAction()
```

## User Flows

### FLOW 1: Create Master Procedure
```
User (with SUPER_ADMIN)
  ↓
Super Admin Console
  ↓
Diagnostics & Procedures
  ↓
Master Procedures → Select Type
  ↓
Click "Add Procedure"
  ↓
Fill Form (name, category, description, active)
  ↓
Submit
  ↓
Server Action: createMasterXxxProcedureAction()
  ↓
Database: Insert into MasterProcedure table
  ↓
Refresh: useQuery refetch()
  ↓
Display in Table
```

### FLOW 2: Create Clinic Procedure (Linked)
```
User (with SUPER_ADMIN)
  ↓
Super Admin Console → Tenants
  ↓
Select Tenant → View Detail
  ↓
Clinics Tab → Click Clinic
  ↓
Procedures Tab → Select Type
  ↓
Click "Add Procedure"
  ↓
Fill Form:
  - Name (clinic-specific)
  - Select Master Procedure
  - Description (optional)
  ↓
Submit
  ↓
Server Action: createClinicXxxProcedureAction()
  ↓
Database: 
  - Insert into ClinicXxxProcedure table
  - masterProcedureId = selected master id
  ↓
Refresh: useQuery refetch()
  ↓
Display with Master Link in Table
```

## Search & Filter

```
Master Procedures Search
├─ Name (ILIKE)
├─ Description (ILIKE)
├─ Category (ILIKE)
└─ Active/Inactive Toggle

Clinic Procedures Search
├─ Name (ILIKE)
├─ Description (ILIKE)
└─ Active/Inactive Toggle

All searches:
├─ Case-insensitive
├─ Real-time filter
├─ Reset page to 1 on new search
└─ Pagination: 10 items per page
```

## Error Handling

```
Delete Master Procedure
  ↓
Check: Is it in use by clinic procedures?
  ↓
  YES → Error Toast: "Cannot delete procedure in use by X clinic(s)"
  NO → Proceed with deletion
       ↓
       Database: DELETE
       ↓
       Success Toast
       ↓
       Refresh Table
```

---

**Diagram Last Updated**: January 18, 2026
**Status**: Architecture Complete and Tested
