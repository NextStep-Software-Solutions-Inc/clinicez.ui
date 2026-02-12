# Permission System Documentation

## Overview

The ClinicEZ permission system provides fine-grained access control for onboarding, patient management, and all other application features. Permissions are **independent of roles** and can be assigned directly to users or members at the organization, clinic, or user level.

## Permission Types

Permissions are categorized into three types:

1. **USER** - Global user-level permissions (e.g., super admin, profile updates)
2. **CLINIC** - Clinic-specific permissions (e.g., patient management, appointments)
3. **ORGANIZATION** - Organization-level permissions (e.g., member management, org settings)

## New Permissions for Onboarding & Patient Management

### User Onboarding Permissions (Type: USER)

| Permission | Name | Description |
|------------|------|-------------|
| `UPDATE:USER:PROFILE:OWN` | `update:user:profile:own` | User can update their own profile information |
| `UPDATE:USER:PROFILE:ANY` | `update:user:profile:any` | User can update any user's profile (admin/superadmin) |
| `UPDATE:USER:ONBOARDING_STATUS` | `update:user:onboarding_status` | User can update onboarding status for users |
| `COMPLETE:USER:ONBOARDING_STEP` | `complete:user:onboarding_step` | User can complete onboarding steps |
| `CLAIM:USER:SHELL_ACCOUNT` | `claim:user:shell_account` | User can claim a shell account |
| `VIEW:USER:ONBOARDING_STATUS` | `view:user:onboarding_status` | User can view onboarding status and steps |

### Patient Management Permissions (Type: CLINIC)

| Permission | Name | Description |
|------------|------|-------------|
| `CREATE:CLINIC:PATIENT` | `create:clinic:patient` | User can create and add new patients to clinic |
| `READ:CLINIC:PATIENT:ALL` | `read:clinic:patient:all` | User can read all patient records in clinic |
| `READ:CLINIC:PATIENT:OWN` | `read:clinic:patient:own` | User can read their own patient record |
| `UPDATE:CLINIC:PATIENT:ALL` | `update:clinic:patient:all` | User can update any patient record in clinic |
| `UPDATE:CLINIC:PATIENT:OWN` | `update:clinic:patient:own` | User can update their own patient record |
| `UPDATE:CLINIC:PATIENT:ONBOARDING_STATUS` | `update:clinic:patient:onboarding_status` | User can update patient onboarding status |
| `COMPLETE:CLINIC:PATIENT:ONBOARDING` | `complete:clinic:patient:onboarding` | User can complete patient onboarding |
| `VIEW:CLINIC:AUDIT_LOG` | `view:clinic:audit_log` | User can view audit logs |

## Permission Assignment

Permissions can be assigned through multiple paths:

1. **Direct Assignment**
   - `UserPermission` - Direct permission to user (USER type)
   - `ClinicMemberPermission` - Permission to clinic member (CLINIC type)
   - `OrgMemberPermission` - Permission to org member (ORGANIZATION type)
   - `ClinicPatientPermission` - Permission to patient (CLINIC type)

2. **Role-Based Assignment**
   - `ClinicRoleInitialPermission` - Default permissions when user gets clinic role
   - `OrgRoleInitialPermission` - Default permissions when user gets org role

## Server-Side Permission Checking

### Using Permission Checker Utilities

```typescript
import { requireClinicPermission, requirePermissionOrOwnership } from "@/lib/permission-checker";
import { PERMISSIONS } from "@/lib/permissions";

// Example 1: Require specific clinic permission
await requireClinicPermission(
  session.user.sub,
  clinicUid,
  PERMISSIONS.CLINIC["CREATE:CLINIC:PATIENT"].name,
  "add patient to clinic"
);

// Example 2: Allow if user has permission OR is accessing own resource
await requirePermissionOrOwnership(
  session.user.sub,
  clinicUid,
  targetUserId,
  PERMISSIONS.CLINIC["READ:CLINIC:PATIENT:ALL"].name,
  PERMISSIONS.CLINIC["READ:CLINIC:PATIENT:OWN"].name,
  "view patient record"
);
```

### Available Permission Check Functions

- `requireOrgPermission(userId, orgUid, permissionName, actionDescription?)` - Throws if user lacks org permission
- `requireClinicPermission(userId, clinicUid, permissionName, actionDescription?)` - Throws if user lacks clinic permission
- `requireAnyOrgPermission(userId, orgUid, permissionNames[], actionDescription?)` - Requires at least one permission
- `requireAnyClinicPermission(userId, clinicUid, permissionNames[], actionDescription?)` - Requires at least one permission
- `requirePermissionOrOwnership(userId, clinicUid, targetUserId, permissionAll, permissionOwn, actionDescription?)` - Allows with permission OR ownership
- `isOwnResource(targetUserId)` - Check if user is accessing their own resource

## Client-Side Permission Checking

### Using Permission Hooks

```typescript
import { useHasPermission, useResourcePermission } from "@/hooks/useHasPermission";
import { PERMISSIONS } from "@/lib/permissions";

// Example 1: Check if user has specific permissions
const { hasPermission, isLoading } = useHasPermission(
  userId,
  [PERMISSIONS.CLINIC["CREATE:CLINIC:PATIENT"].name],
  "CLINIC"
);

// Example 2: Check resource-specific permission (all vs own)
const { canAccess } = useResourcePermission(
  currentUserId,
  patientUserId,
  PERMISSIONS.CLINIC["UPDATE:CLINIC:PATIENT:ALL"].name,
  PERMISSIONS.CLINIC["UPDATE:CLINIC:PATIENT:OWN"].name,
  "CLINIC"
);
```

### UI Example

```tsx
function PatientListActions() {
  const { user } = useSession();
  const { hasPermission } = useHasPermission(
    user?.sub,
    [PERMISSIONS.CLINIC["CREATE:CLINIC:PATIENT"].name],
    "CLINIC"
  );

  return (
    <>
      {hasPermission && (
        <Button onClick={handleAddPatient}>
          Add Patient
        </Button>
      )}
    </>
  );
}
```

## Seeding Permissions

Permissions are seeded from the `src/lib/permissions.ts` constants file using:

```bash
npx ts-node prisma/seed-permissions.ts
```

The seed script automatically:
- Reads all permissions from `PERMISSIONS` object
- Creates missing permissions in database
- Skips permissions that already exist
- Reports created/skipped counts

## Error Handling

### PermissionError

When permission checks fail, a `PermissionError` is thrown with:
- **message**: Human-readable error message
- **permissionName**: The required permission(s)
- **context**: The permission type (USER, CLINIC, ORGANIZATION)

```typescript
try {
  await requireClinicPermission(userId, clinicUid, permissionName);
} catch (error) {
  if (error instanceof PermissionError) {
    // Handle permission error with actionable feedback
    return {
      error: error.message,
      requiredPermission: error.permissionName,
      context: error.context
    };
  }
}
```

## Best Practices

1. **Always use permission constants** from `src/lib/permissions.ts`
2. **Provide descriptive action descriptions** for better error messages
3. **Check permissions early** in server actions before expensive operations
4. **Use ownership checks** when appropriate to reduce permission overhead
5. **Show actionable error messages** to users when permission is denied
6. **Test permission boundaries** with different user roles and scenarios

## Testing Permissions

### Manual Testing Steps

1. **Create test users** with different permission sets
2. **Test permission denied** scenarios
3. **Test ownership** vs all-resource access
4. **Test permission override** by admins/superadmins
5. **Verify audit logging** for permission-controlled actions

### API Testing

Use the following endpoints to test permissions:
- `GET /api/permissions?userId={userId}&type={type}` - Get user permissions
- Server actions with permission checks will return appropriate error responses

## Escalation & Override Paths

For situations where users need elevated permissions temporarily:

1. **Super Admin Override**: Users with `super_admin` permission bypass most checks
2. **Support Escalation**: Support staff can have specific override permissions
3. **Account Recovery**: Special permissions for completing incomplete onboarding

## Future Enhancements

- [ ] Time-based permissions (expiring access)
- [ ] Conditional permissions (based on patient consent, etc.)
- [ ] Permission templates for common role combinations
- [ ] Permission audit trail in UI
- [ ] Bulk permission management interface
