# Diagnostics & Procedures Management - Reorganization

## Changes Made

### 1. Master Procedures Console (Root Super Admin)
**Location**: `/super-admin/diagnostics-procedures`

**Now contains only:**
- Imaging Procedures (system-wide master definitions)
- Laboratory Procedures (system-wide master definitions)
- Heart Station Procedures (system-wide master definitions)

**Clinic procedures tab removed** - Clinic-specific procedures are now managed within each clinic's configuration.

### 2. Clinic Procedures Management
**Location**: `/super-admin/tenants/[tenantId]/clinics/[clinicId]` → **Procedures Tab**

**New "Procedures" tab** added to clinic detail page with:
- Three procedure type tabs (Imaging, Laboratory, Heart Station)
- Add/Edit/Delete clinic procedures
- Link clinic procedures to master procedures
- Full search and pagination

### File Structure Changes

```
BEFORE:
src/app/(super-admin)/super-admin/
└── diagnostics-procedures/
    ├── master-procedures-tab.tsx
    ├── clinic-procedures-tab.tsx (REMOVED)
    └── clinic-procedures-selector.tsx (MODIFIED)

AFTER:
src/app/(super-admin)/super-admin/
├── diagnostics-procedures/
│   ├── master-procedures-tab.tsx (ONLY MASTER)
│   └── clinic-procedures-selector.tsx (SUPPORT COMPONENT)
│
└── clinics/
    └── [clinicId]/
        └── page.tsx (NOW INCLUDES PROCEDURES TAB)

src/components/super-admin/
└── ClinicProceduresManager.tsx (NEW)
```

### Updated Components

#### diagnostics-procedures-console.tsx
- Removed clinic procedures tab
- Simplified to show only master procedures
- Updated description to clarify clinic procedures are in clinic management

#### clinic-procedures-selector.tsx
- Enhanced to support both standalone and embedded usage
- `clinicId` prop - when provided, skips clinic selection dropdown
- `type` prop - when provided, shows only that procedure type
- `isEmbedded` flag - controls whether to show clinic/type selectors

#### ClinicProceduresManager.tsx (NEW)
- Client component for embedding in clinic detail page
- Handles procedure type selection
- Integrates with ClinicProceduresTable and ClinicProcedureForm
- Provides add procedure dialog

#### clinics/[clinicId]/page.tsx
- Added "Procedures" tab to clinic detail
- Tab count increased from 2 to 3
- Integrates ClinicProceduresManager component

### Navigation Changes

**Master Procedures:**
- Super Admin Console → Diagnostics & Procedures

**Clinic Procedures:**
- Super Admin Console → Tenants → [Tenant] → Clinics → [Clinic] → Procedures Tab

### UI/UX Flow

#### Master Procedures Flow
1. Navigate to Super Admin Console
2. Click "Diagnostics & Procedures"
3. View system-wide master procedures
4. Create/Edit/Delete master procedures by type

#### Clinic Procedures Flow
1. Navigate to Super Admin Console
2. Click "Tenants"
3. Select a tenant
4. Click on a clinic
5. Go to "Procedures" tab
6. Manage clinic-specific procedures

### Benefits of This Organization

✅ **Clear Separation of Concerns**
- Master procedures are system-level (root super admin)
- Clinic procedures are clinic-level (within clinic management)

✅ **Contextual Management**
- Clinic procedures managed in clinic context
- Clearer relationship between clinic and its procedures

✅ **Hierarchical Structure**
- Tenants → Clinics → Procedures
- Natural navigation flow

✅ **Reduced Clutter**
- Root super admin console focuses on system-wide settings
- Clinic-specific settings co-located with clinic

### Technical Details

**Server Actions Used:**
- Master procedures: All 12 master procedure actions
- Clinic procedures: All 6 clinic procedure actions
- Unchanged - all actions remain functional

**Database Models:**
- No schema changes
- All existing relationships preserved
- Master procedures link to clinic procedures through `masterProcedureId`

**QueryClientProvider:**
- Already integrated in super-admin layout
- Works for both master and clinic procedures pages
