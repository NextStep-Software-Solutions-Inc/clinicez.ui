# Hierarchical AI Allowance System Implementation

## Overview

A complete three-tier AI usage limit management system that prevents overcharging through hierarchical validation and capacity allocation.

## System Architecture

```
┌─────────────────────────────────────────┐
│     Super Admin Console                  │
│  ┌────────────────────────────────────┐ │
│  │   Global AI Defaults               │ │
│  │   • Default max requests: 1000     │ │
│  │   • Default max tokens: 500K       │ │
│  │   • Default max cost: $100         │ │
│  │   • Reset day: 1                   │ │
│  └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
                  ▼ Inherits (fallback)
┌─────────────────────────────────────────┐
│     Tenant Level                         │
│  ┌────────────────────────────────────┐ │
│  │   Tenant Custom Limits (Optional)  │ │
│  │   • Max requests: 5000             │ │
│  │   • Max tokens: 2M                 │ │
│  │   • Max cost: $500                 │ │
│  │   • Allocates to clinics           │ │
│  └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
                  ▼ Allocates from pool
┌─────────────────────────────────────────┐
│     Clinic Level                         │
│  ┌──────────────┬──────────────────────┐│
│  │ Clinic A     │ Clinic B             ││
│  │ 2000 req     │ 1500 req             ││
│  │ 800K tokens  │ 600K tokens          ││
│  │ $200         │ $150                 ││
│  └──────────────┴──────────────────────┘│
│  Available: 1500 req, 600K tokens, $150 │
└─────────────────────────────────────────┘
```

## Key Features

### 1. Global Defaults (Super Admin Only)

**Purpose**: Set default AI limits that apply to all tenants

**Access**: `/super-admin/ai-limits`

**Configuration Options**:
- Default max requests per month (required)
- Default max tokens per month (optional)
- Default max cost USD per month (optional)
- Reset day of month (1-31, required)

**Behavior**:
- Acts as fallback when tenant has no custom limits
- Can be updated at any time
- Changes apply to tenants without custom limits
- Singleton pattern (only one global default exists)

### 2. Tenant Custom Limits

**Purpose**: Override global defaults with tenant-specific allocation

**Access**: Tenant detail page → "AI Limits" tab

**Features**:
- Toggle to enable/disable custom limits
- Shows global defaults when custom limits disabled
- Allocates capacity pool for tenant's clinics
- Validates against existing clinic allocations

**Validation**:
```typescript
// Cannot reduce tenant limit below clinic allocations
if (newTenantLimit < sumOfClinicLimits) {
  throw Error("Tenant limit cannot be less than clinic allocations");
}
```

### 3. Clinic Allocated Limits

**Purpose**: Allocate specific AI capacity to individual clinics

**Access**: Clinic detail page → "AI Limits" tab

**Features**:
- Shows tenant's available capacity in real-time
- Progress bars for visual capacity indicators
- Input validation with max values
- Toggle to enable/disable custom limits

**Capacity Calculation**:
```typescript
availableCapacity = tenantLimit - sumOfOtherClinicLimits;

// Example:
// Tenant: 5000 requests
// Clinic A: 2000 (existing)
// Clinic B: 1500 (existing)
// Available for Clinic C: 1500 requests
```

## Database Schema

### GlobalAIDefaults Table (New)

```sql
CREATE TABLE "GlobalAIDefaults" (
    "id" SERIAL PRIMARY KEY,
    "defaultMaxRequests" INTEGER NOT NULL DEFAULT 1000,
    "defaultMaxTokens" INTEGER,
    "defaultMaxCostUSD" DOUBLE PRECISION,
    "defaultResetDay" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);
```

- Singleton pattern (only one row, id = 1)
- Auto-created with default values
- Updated via super admin console

### AIUsageLimit Table (Enhanced)

Already exists from Phase 6, now supports both:
- `tenantId` (for tenant-level limits)
- `clinicId` (for clinic-level limits)

Unique constraints:
- `unique_tenantId` - One limit per tenant
- `unique_clinicId` - One limit per clinic

## Server Actions

### File: `src/actions/super-admin/ai-limits.action.ts`

#### Global Defaults Management

**getGlobalAIDefaultsAction()**
- Returns global defaults or creates with defaults if not exists
- Super admin only

**updateGlobalAIDefaultsAction(config)**
- Updates global default settings
- Validates all values
- Super admin only

#### Tenant Limit Management

**getTenantAILimitAction(tenantId)**
- Returns tenant limit with fallback to global defaults
- Shows effective limit in use
- Super admin only

**setTenantAILimitAction(tenantId, config)**
- Sets or updates tenant custom limits
- **Validation**: Checks sum of clinic limits ≤ new tenant limit
- Returns error if clinic allocations exceed new limit
- Super admin only

#### Clinic Limit Management

**getClinicAILimitAction(clinicId)**
- Returns clinic limit with available capacity
- Calculates: available = tenant - sum(other clinics)
- Super admin or tenant owner

**setClinicAILimitAction(clinicId, config)**
- Sets or updates clinic limits
- **Validation**: Checks new limit ≤ available capacity
- Returns error with available capacity if exceeded
- Super admin or tenant owner

#### Reporting Actions

**getAllTenantAILimitsAction()**
- Lists all tenant limits with global defaults
- Super admin only

**getTenantClinicAILimitsAction(tenantId)**
- Lists all clinic limits for a tenant
- Shows capacity summary (tenant, allocated, available)
- Super admin or tenant owner

## UI Components

### 1. GlobalAIDefaultsManager

**File**: `src/components/super-admin/GlobalAIDefaultsManager.tsx`

**Features**:
- Form to edit global defaults
- Input validation
- Save button with loading state
- Shows last updated timestamp

**Displayed At**: `/super-admin/ai-limits` → Global Defaults tab

### 2. TenantAILimitManager

**File**: `src/components/super-admin/TenantAILimitManager.tsx`

**Features**:
- Toggle for custom vs inherited limits
- Shows current global defaults when not custom
- Form to edit tenant limits
- Warning about impact on clinic allocations
- Active/inactive switch

**Displayed At**: Tenant detail page → AI Limits tab

### 3. ClinicAILimitManager

**File**: `src/components/super-admin/ClinicAILimitManager.tsx`

**Features**:
- Shows tenant available capacity with progress bars
- Toggle for custom vs inherited limits
- Form with max values based on available capacity
- Real-time capacity indicators
- Input validation against available capacity
- Active/inactive switch

**Displayed At**: Clinic detail page → AI Limits tab

## Validation Flow

### Setting Tenant Limit

```typescript
// Step 1: Get existing clinic allocations
const clinicLimits = await prisma.aIUsageLimit.findMany({
  where: {
    clinicId: { not: null },
    Clinic: { tenantId }
  }
});

// Step 2: Calculate total allocations
const totalClinicRequests = sum(clinicLimits.map(l => l.maxRequests));
const totalClinicTokens = sum(clinicLimits.map(l => l.maxTokens));
const totalClinicCost = sum(clinicLimits.map(l => l.maxCostUSD));

// Step 3: Validate new tenant limit
if (totalClinicRequests > newTenantLimit) {
  throw Error(`Cannot set tenant limit (${newTenantLimit}) below clinic allocations (${totalClinicRequests})`);
}

// Step 4: Save if valid
await prisma.aIUsageLimit.upsert({ ... });
```

### Setting Clinic Limit

```typescript
// Step 1: Get tenant limit (or global default)
const tenantLimit = await getTenantLimit(tenantId);
const maxRequests = tenantLimit?.maxRequests || globalDefaults.defaultMaxRequests;

// Step 2: Calculate available capacity
const otherClinics = await prisma.aIUsageLimit.findMany({
  where: {
    clinicId: { not: null, not: clinicId },
    Clinic: { tenantId }
  }
});

const allocated = sum(otherClinics.map(l => l.maxRequests));
const available = maxRequests - allocated;

// Step 3: Validate new clinic limit
if (newClinicLimit > available) {
  throw Error(`Clinic limit (${newClinicLimit}) exceeds available capacity (${available})`);
}

// Step 4: Save if valid
await prisma.aIUsageLimit.upsert({ ... });
```

## Permission Model

### Super Admin
- Full access to all three levels
- Can set global defaults
- Can manage any tenant's limits
- Can manage any clinic's limits

### Tenant Owner
- Read access to tenant's own limits
- Write access to tenant's clinics
- Cannot modify global defaults
- Cannot modify other tenant's data

### Clinic Member
- Read-only access (if implemented)
- Cannot modify any limits

## Usage Examples

### Example 1: Fresh Installation

```typescript
// Step 1: Super admin sets global defaults
await updateGlobalAIDefaultsAction({
  defaultMaxRequests: 1000,
  defaultMaxTokens: 500000,
  defaultMaxCostUSD: 100.00,
  defaultResetDay: 1,
});

// Step 2: All new tenants inherit these defaults automatically
const tenant = await getTenantAILimitAction(tenantId);
// tenant.effectiveLimit = { maxRequests: 1000, ... } from global defaults

// Step 3: Clinics inherit tenant limits (which are global defaults)
const clinic = await getClinicAILimitAction(clinicId);
// clinic.effectiveLimit = { maxRequests: 1000, ... } inherited
```

### Example 2: Custom Tenant Allocation

```typescript
// Step 1: Set custom tenant limit
await setTenantAILimitAction(tenantId, {
  maxRequests: 5000,
  maxTokens: 2000000,
  maxCostUSD: 500.00,
  resetDay: 1,
  isActive: true,
});

// Step 2: Allocate to Clinic A
await setClinicAILimitAction(clinicA, {
  maxRequests: 2000,  // ✅ Valid (5000 available)
  maxTokens: 800000,
  maxCostUSD: 200.00,
  resetDay: 1,
  isActive: true,
});

// Step 3: Allocate to Clinic B
await setClinicAILimitAction(clinicB, {
  maxRequests: 1500,  // ✅ Valid (3000 available after A)
  maxTokens: 600000,
  maxCostUSD: 150.00,
  resetDay: 1,
  isActive: true,
});

// Step 4: Try to allocate too much to Clinic C
await setClinicAILimitAction(clinicC, {
  maxRequests: 2000,  // ❌ Error - Only 1500 available
  // ...
});
// Error: "Sum of clinic limits (5500) exceeds tenant limit (5000). Available: 1500 requests."
```

### Example 3: Reducing Tenant Limit

```typescript
// Current state:
// Tenant: 5000 requests
// Clinic A: 2000
// Clinic B: 1500
// Clinic C: 1000
// Total allocated: 4500

// Try to reduce tenant limit
await setTenantAILimitAction(tenantId, {
  maxRequests: 4000,  // ❌ Error - Cannot reduce below 4500
  // ...
});
// Error: "Tenant limit (4000) cannot be less than total clinic allocations (4500). Please reduce clinic limits first."

// Correct approach:
// 1. First reduce clinic limits
await setClinicAILimitAction(clinicC, { maxRequests: 500, ... });
// Now total = 4000

// 2. Then reduce tenant limit
await setTenantAILimitAction(tenantId, { maxRequests: 4000, ... });
// ✅ Success
```

## Integration with Existing Usage Tracking

The hierarchical allowance system integrates seamlessly with existing usage tracking:

```typescript
// When checking limits (from Phase 6)
const limitCheck = await checkAIUsageLimit({
  userId,
  clinicId,
  tenantId,
  featureType: 'medical-note-summarization',
});

// The check now follows the hierarchy:
// 1. Check clinic limit first (if exists)
// 2. If no clinic limit, check tenant limit
// 3. If no tenant limit, use global defaults
// 4. Compare current usage against effective limit
// 5. Allow or deny based on result
```

## UI Workflow

### Super Admin Setting Defaults

1. Navigate to `/super-admin/ai-limits`
2. Click "Global Defaults" tab
3. Edit default values
4. Click "Save Defaults"
5. Confirmation toast appears

### Super Admin Setting Tenant Limit

1. Navigate to tenant detail page
2. Click "AI Limits" tab
3. Toggle "Use Custom Limits" ON
4. Edit limit values
5. Click "Save Tenant Limit"
6. System validates against clinic allocations
7. Success or error message displayed

### Tenant Owner Setting Clinic Limit

1. Navigate to clinic detail page
2. Click "AI Limits" tab
3. View available capacity indicators
4. Toggle "Use Custom Limits" ON
5. Enter values (max based on available capacity)
6. Click "Save Clinic Limit"
7. System validates against available capacity
8. Success or error message displayed

## Error Messages

### Over-allocation Errors

**Tenant Level**:
```
"Tenant limit (1000 requests) cannot be less than total clinic 
allocations (2500 requests). Please reduce clinic limits first."
```

**Clinic Level**:
```
"Sum of clinic limits (3500 requests) exceeds tenant limit (3000 requests). 
Available: 500 requests."
```

### Validation Errors

```
"Maximum requests must be at least 1"
"Maximum tokens must be at least 1 or null"
"Maximum cost must be at least $0.01 or null"
"Reset day must be between 1 and 31"
```

## Migration Instructions

### Step 1: Run Migrations

```bash
cd /path/to/clinicez.ui
pnpm prisma migrate deploy
```

This creates:
- `GlobalAIDefaults` table
- Initial row with default values

### Step 2: Verify Installation

```sql
-- Check global defaults exist
SELECT * FROM "GlobalAIDefaults";

-- Should return one row with default values
-- id: 1
-- defaultMaxRequests: 1000
-- defaultMaxTokens: 500000
-- defaultMaxCostUSD: 100.00
-- defaultResetDay: 1
```

### Step 3: Configure Defaults (Optional)

1. Login as super admin
2. Navigate to `/super-admin/ai-limits`
3. Adjust default values as needed
4. Save changes

### Step 4: Configure Tenants (Optional)

For tenants needing custom limits:
1. Navigate to tenant detail page
2. Click "AI Limits" tab
3. Enable custom limits
4. Set values
5. Save

### Step 5: Allocate to Clinics (Optional)

For clinics needing specific allocations:
1. Navigate to clinic detail page
2. Click "AI Limits" tab
3. Enable custom limits
4. Set values within available capacity
5. Save

## Monitoring & Maintenance

### Check Capacity Utilization

```typescript
// Get tenant summary
const summary = await getTenantClinicAILimitsAction(tenantId);

console.log(summary.summary);
// {
//   tenantCapacity: { requests: 5000, tokens: 2000000, cost: 500 },
//   allocated: { requests: 4500, tokens: 1800000, cost: 450 },
//   available: { requests: 500, tokens: 200000, cost: 50 }
// }
```

### Audit Limits

```sql
-- List all custom tenant limits
SELECT 
  t.name as tenant_name,
  l.maxRequests,
  l.maxTokens,
  l.maxCostUSD
FROM "AIUsageLimit" l
JOIN "Tenant" t ON t.id = l.tenantId
WHERE l.tenantId IS NOT NULL;

-- List all clinic allocations with tenant
SELECT 
  t.name as tenant_name,
  c.name as clinic_name,
  l.maxRequests,
  l.maxTokens,
  l.maxCostUSD
FROM "AIUsageLimit" l
JOIN "Clinic" c ON c.id = l.clinicId
JOIN "Tenant" t ON t.id = c.tenantId
WHERE l.clinicId IS NOT NULL
ORDER BY t.name, c.name;
```

## Future Enhancements

### Phase 8 (Planned)
- Usage analytics dashboard
- Alerts when approaching limits
- Automatic reallocation recommendations
- Billing integration based on usage
- Historical limit changes audit log
- Bulk update tools for limits
- Export/import limit configurations

## Troubleshooting

### Issue: Cannot reduce tenant limit

**Cause**: Sum of clinic limits exceeds new tenant limit

**Solution**:
1. List all clinic limits for tenant
2. Reduce or remove clinic limits as needed
3. Then reduce tenant limit

### Issue: Cannot set clinic limit

**Cause**: No available capacity in tenant allocation

**Solution**:
1. Check available capacity displayed in UI
2. Either increase tenant limit
3. Or reduce other clinic limits
4. Then set new clinic limit

### Issue: Global defaults not applying

**Cause**: Tenant has custom limits set

**Solution**:
- This is expected behavior
- Disable tenant custom limits to use global defaults
- Or update tenant limits manually

## Support

For questions or issues:
- Review this documentation
- Check server action error messages
- Verify permissions (super admin / tenant owner)
- Check database for limit conflicts
