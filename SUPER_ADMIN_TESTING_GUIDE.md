# Super Admin Console Features - Testing Guide

## Overview
This PR implements access control and management features for the super-admin console, including system admin management and restructuring of roles management.

## Database Migration Required
Before testing, the database migration must be applied:
```bash
npx prisma migrate deploy
```

This adds the `isSuperAdmin` and `isSystemAdmin` fields to the User table.

## Manual Setup Required

### 1. Set Initial Super Admin
Before you can access the super-admin console, you need to manually set at least one user as a super admin in the database:

```sql
UPDATE "User" 
SET "isSuperAdmin" = true 
WHERE email = 'your-super-admin-email@example.com';
```

## Features to Test

### 1. Super Admin Access Control
**Test Case 1.1: Unauthorized Access**
- Log in as a regular user (without super admin privileges)
- Try to access `/super-admin`
- Expected: User should be redirected to `/unauthorized`

**Test Case 1.2: Authorized Access**
- Log in as a user with super admin privileges
- Navigate to `/super-admin`
- Expected: User should see the super-admin console with navigation menu

### 2. System Admin Management
**Test Case 2.1: View System Admins**
- As a super admin, navigate to `/super-admin/system-admins`
- Expected: See a list of users with system admin privileges
- Expected: See "Add System Admin" button

**Test Case 2.2: Grant System Admin Privileges**
- Click "Add System Admin" button
- Search for a user by name, email, or ID
- Select a user from the search results
- Click "Grant System Admin"
- Expected: User should be added to the system admins list
- Expected: Success toast message appears

**Test Case 2.3: Revoke System Admin Privileges**
- Find a system admin (who is NOT a super admin) in the list
- Click the "Revoke" button
- Confirm the action
- Expected: User should be removed from the system admins list
- Expected: Success toast message appears

**Test Case 2.4: Cannot Revoke Super Admin**
- Find a user marked as "Super Admin" in the list
- Expected: No "Revoke" button should be visible for super admins

### 3. Tenant Management & Organization View
**Test Case 3.1: View Tenants**
- Navigate to `/super-admin/tenants`
- Expected: See a list of all tenants with:
  - Tenant name and UID
  - Owner information
  - Organization count
  - Clinic count
  - Status badge
  - External link icon to view details

**Test Case 3.2: View Tenant Details**
- Click the external link icon on any tenant
- Expected: Navigate to `/super-admin/tenants/[tenantId]`
- Expected: See tenant overview with:
  - Organization count card
  - Clinic count card
  - Tenant information card
  - Three tabs: Overview, Organizations, Clinics

**Test Case 3.3: View Organizations in Tenant**
- On the tenant detail page, click "Organizations" tab
- Expected: See a list of organizations with:
  - Organization name and UID
  - Member count badge
  - Description
  - External link button to view organization details

**Test Case 3.4: View Clinics in Tenant**
- On the tenant detail page, click "Clinics" tab
- Expected: See a list of clinics with:
  - Clinic name and UID
  - Member count badge
  - Patient count badge
  - Description

### 4. Organization Roles Management
**Test Case 4.1: Navigate to Organization Roles**
- From tenant detail page → Organizations tab
- Click the external link button on any organization
- Expected: Navigate to `/super-admin/organizations/[orgId]`
- Expected: See organization details with:
  - Breadcrumb navigation (Tenants > Tenant Name > Organization)
  - Member count card
  - Roles count card
  - Organization info card
  - Organization Roles table

**Test Case 4.2: Create Organization Role**
- On the organization detail page, click "Add Role"
- Enter role name (e.g., "Manager")
- Enter description (optional)
- Click "Create"
- Expected: New role appears in the table
- Expected: Success toast message appears

**Test Case 4.3: Edit Organization Role**
- Click the edit icon on any role
- Modify the name or description
- Click "Update"
- Expected: Role is updated in the table
- Expected: Success toast message appears

**Test Case 4.4: Toggle Role Status**
- Click on the status badge of any role
- Expected: Status toggles between Active/Inactive
- Expected: Success toast message appears

**Test Case 4.5: Delete Organization Role**
- Click the delete icon on any role
- Confirm the deletion
- Expected: Role is marked as inactive
- Expected: Success toast message appears

**Test Case 4.6: Search Organization Roles**
- Enter a role name in the search box
- Press Enter or click the search button
- Expected: Table filters to show matching roles

### 5. Clinic Roles Management (Global)
**Test Case 5.1: View Clinic Roles**
- Navigate to `/super-admin/roles`
- Expected: See the "Clinic Roles" page with description explaining that organization roles are managed per organization
- Expected: See a list of global clinic roles

**Test Case 5.2: Verify Navigation**
- Check the super-admin sidebar navigation
- Expected: "Clinic Roles" menu item should be visible
- Expected: Menu items should be in order: Permissions, Clinic Roles, Appointment Tabs, Tenants, System Admins, Users

### 6. Navigation Flow Testing
**Test Case 6.1: Complete Navigation Flow**
- Start at `/super-admin/tenants`
- Click on a tenant → Navigate to tenant detail page
- Click on Organizations tab → See organizations list
- Click on an organization → Navigate to organization detail page
- Verify breadcrumb navigation works
- Click breadcrumb links to navigate back

**Test Case 6.2: Deep Links**
- Directly access `/super-admin/tenants/[tenantId]` with a valid tenant ID
- Expected: Page loads correctly
- Directly access `/super-admin/organizations/[orgId]` with a valid organization ID
- Expected: Page loads correctly with breadcrumb navigation

## Security Testing

### Authorization Tests
1. Verify that all super-admin routes require authentication
2. Verify that non-super-admin users cannot access super-admin routes
3. Verify that system admin actions can only be performed by super admins
4. Verify that organization roles can only be managed within their organization context

### Error Handling Tests
1. Test with invalid tenant ID in URL
2. Test with invalid organization ID in URL
3. Test creating role with empty name
4. Test search with special characters

## Performance Testing
1. Test with large number of tenants (pagination)
2. Test with large number of organizations per tenant
3. Test with large number of roles per organization

## Accessibility Testing
1. Test keyboard navigation through all forms
2. Test screen reader compatibility
3. Test with different screen sizes (responsive design)

## Known Limitations
1. Native browser `confirm()` dialogs are used for delete confirmations. These should be replaced with custom dialogs in a future update for better UX.
2. The build requires environment variables (`DATABASE_URL` and `DATABASE_URL_UNPOOLED`) to be set up for Prisma to work.

## Troubleshooting

### Cannot Access Super Admin Console
- Verify you have set `isSuperAdmin = true` for your user in the database
- Check browser console for any errors
- Verify you are logged in with the correct account

### Organizations Not Loading
- Check that the tenant has organizations
- Verify network requests in browser developer tools
- Check server logs for any errors

### Roles Not Appearing
- Verify the organization has roles created
- Check that you're viewing the correct organization
- Verify database migration was applied correctly
