# Testing Guide - Diagnostics & Procedures

## Pre-Testing Setup

1. Ensure you have SUPER_ADMIN role
2. Database is running with all migrations applied
3. Application is running: `pnpm dev`
4. No TypeScript errors: `pnpm exec tsc --noEmit` ✓

## Test 1: Master Procedures Console Access

### Step 1.1: Navigate to Master Procedures
- Go to: `http://localhost:3000/super-admin/diagnostics-procedures`
- Expected: Page loads with "Master Procedures Management" title
- Expected: Three tabs visible: "Imaging Procedures", "Laboratory Procedures", "Heart Station Procedures"

### Step 1.2: Verify UI Elements
- [x] Search input with magnifying glass icon
- [x] "Add Procedure" button (blue)
- [x] Empty state or existing procedures table
- [x] Pagination controls at bottom

### Step 1.3: Check No Clinic Tab
- [x] Only 3 tabs visible (NOT 4)
- [x] No "Clinic Procedures" tab
- [x] Description mentions: "Clinic-specific procedures are configured in clinic management"

## Test 2: Create Master Imaging Procedure

### Step 2.1: Click Add Procedure
- Click "Add Procedure" button
- Expected: Dialog opens with form title "Add Master Imaging Procedure"

### Step 2.2: Fill Form
```
Name: X-Ray (Standard)
Category: X-Ray
Description: Standard X-Ray imaging procedure
Active: ✓ Checked
```
- Click "Save"
- Expected: Success toast appears
- Expected: Dialog closes
- Expected: New procedure appears in table

### Step 2.3: Verify in Table
- [x] Name displays: "X-Ray (Standard)"
- [x] Category displays: "X-Ray"
- [x] Status badge shows "Active"
- [x] Edit and Delete buttons visible

## Test 3: Edit Master Procedure

### Step 3.1: Click Edit
- In the table, click the Edit button for your new procedure
- Expected: Dialog opens with form title "Edit Master Imaging Procedure"
- Expected: Form pre-filled with current values

### Step 3.2: Update Data
```
Name: X-Ray (Standard) - Updated
Description: Updated standard X-Ray imaging procedure
```
- Click "Save"
- Expected: Success toast appears
- Expected: Table updates with new name

### Step 3.3: Toggle Active Status
- Click Edit again
- Uncheck the "Active" checkbox
- Click "Save"
- Expected: Status badge changes to "Inactive"

## Test 4: Search Master Procedures

### Step 4.1: Search by Name
- Type "X-Ray" in search input
- Expected: Table filters to show only X-Ray procedures
- Expected: Other procedures hidden

### Step 4.2: Clear Search
- Clear the search input
- Expected: All procedures appear again

### Step 4.3: Search Clinic-Specific Search
- Switch to "Laboratory Procedures" tab
- Type a laboratory procedure name
- Expected: Table filters correctly

## Test 5: Pagination

### Step 5.1: Create Multiple Procedures
- Create 15 imaging procedures to test pagination
- Expected: Table shows 10 items per page
- Expected: "Next" button enabled
- Expected: Page number indicator shows "Page 1 of 2"

### Step 5.2: Navigate Pages
- Click "Next" button
- Expected: Shows remaining 5 procedures
- Expected: "Previous" button now enabled
- Expected: "Next" button now disabled
- Click "Previous"
- Expected: Back to first 10 procedures

## Test 6: Delete Master Procedure

### Step 6.1: Click Delete
- Click Delete button on a procedure
- Expected: Confirmation dialog appears
- Expected: Shows procedure name

### Step 6.2: Confirm Delete
- Click "Delete" in confirmation
- Expected: Success toast appears
- Expected: Procedure removed from table

### Step 6.3: Try Delete Used Procedure (if applicable)
- If you've linked this procedure to a clinic:
  - Click Delete
  - Expected: Error toast: "Cannot delete procedure in use by X clinic(s)"
  - Expected: Procedure remains in table

## Test 7: All Procedure Types

### Step 7.1: Laboratory Procedures
- Switch to "Laboratory Procedures" tab
- Repeat Steps 2-6 with laboratory procedure
- Example: Name = "Blood Test", Category = "Blood"
- Expected: Same functionality

### Step 7.2: Heart Station Procedures
- Switch to "Heart Station Procedures" tab
- Repeat Steps 2-6 with heart station procedure
- Example: Name = "ECG", Category = "ECG"
- Expected: Same functionality

## Test 8: Clinic Procedures Management

### Step 8.1: Navigate to Tenants
- Go to: Super Admin Menu → Tenants
- Expected: List of tenants displayed

### Step 8.2: Select Tenant
- Click on a tenant row
- Expected: Tenant detail page loads
- Expected: Multiple tabs visible

### Step 8.3: Go to Clinics Tab
- Click "Clinics" tab
- Expected: List of clinics for this tenant
- Expected: Click any clinic row

### Step 8.4: Verify Procedures Tab
- Expected: Clinic detail page loads
- Expected: Tabs visible: "Clinic Roles", "Appointment Tabs", "Procedures"
- Click "Procedures" tab
- Expected: Three sub-tabs for procedure types
- Expected: Empty state or existing clinic procedures

## Test 9: Create Clinic Procedure

### Step 9.1: Add Imaging Procedure for Clinic
- Click "Add Procedure" button
- Expected: Dialog opens with form

### Step 9.2: Fill Clinic Procedure Form
```
Name: Clinic X-Ray Service
Select Master Procedure: X-Ray (Standard) [from master]
Description: Our clinic's X-Ray service
Active: ✓ Checked
```
- Click "Save"
- Expected: Success toast
- Expected: New clinic procedure appears in table
- Expected: Master procedure link visible

### Step 9.3: Create Custom Procedure (No Master Link)
- Click "Add Procedure" again
- Fill form:
```
Name: Custom Lab Test
Select Master Procedure: [Leave empty / None selected]
Description: Custom clinic procedure
Active: ✓ Checked
```
- Click "Save"
- Expected: Procedure saved without master link

## Test 10: Edit/Delete Clinic Procedures

### Step 10.1: Edit Clinic Procedure
- Click Edit on clinic procedure
- Expected: Form pre-fills
- Update name and save
- Expected: Update reflected in table

### Step 10.2: Delete Clinic Procedure
- Click Delete
- Expected: Confirmation dialog
- Confirm delete
- Expected: Procedure removed from table

## Test 11: Search in Clinic Context

### Step 11.1: Search Clinic Procedures
- Type procedure name in search
- Expected: Filters clinic procedures only
- Expected: Does NOT search master procedures
- Note: This is clinic-scoped search only

## Test 12: Navigate Back

### Step 12.1: Return to Master Procedures
- Navigate to Super Admin Menu → Diagnostics & Procedures
- Expected: Master procedures console loads
- Expected: Your master procedures still there

### Step 12.2: Verify Clinic Still Has Its Procedures
- Navigate back to clinic detail → Procedures tab
- Expected: Clinic procedures unchanged
- Expected: No conflict with master procedures

## Test 13: React Query Functionality

### Step 13.1: Check Browser DevTools
- Open Browser DevTools → Network tab
- Create a new master procedure
- Expected: Request goes to server action
- Expected: No "No QueryClient set" error in console

### Step 13.2: Check React Query DevTools (if installed)
- Open React Query DevTools (bottom-right corner)
- Expected: Queries show diagnostics-procedures cache
- Expected: Mutations track create/update/delete operations
- Expected: Cache invalidates and refetches after mutation

### Step 13.3: Console Check
- Open DevTools → Console
- Perform any CRUD operation
- Expected: No errors related to QueryClient
- Expected: No React warnings

## Test 14: Pagination Across Tabs

### Step 14.1: Create Large Dataset
- Create 20+ procedures across different types
- Ensure some are inactive

### Step 14.2: Test All Tabs
- Switch between tabs
- Expected: Each tab maintains its own pagination
- Expected: Switching tabs doesn't reset other tabs' page state
- Expected: Search and pagination work independently

## Test 15: Permission & Security Check

### Step 15.1: Server-Side Validation
- Open DevTools → Network
- Create a procedure
- Expected: Request to server action succeeds
- Expected: Check server logs for permission validation

### Step 15.2: Missing SUPER_ADMIN Role (if you can test)
- Ask someone without SUPER_ADMIN to try
- Expected: Get permission denied error
- Expected: Cannot see create/edit/delete buttons

## Checklist: All Tests Passing?

- [ ] Master procedures console loads (Test 1)
- [ ] Create master procedures works (Test 2)
- [ ] Edit master procedures works (Test 3)
- [ ] Search filters correctly (Test 4)
- [ ] Pagination works (Test 5)
- [ ] Delete procedures works (Test 6)
- [ ] All three types work (Test 7)
- [ ] Clinic procedures accessible (Test 8)
- [ ] Create clinic procedures works (Test 9)
- [ ] Edit/delete clinic procedures works (Test 10)
- [ ] Search in clinic context works (Test 11)
- [ ] Navigation between master and clinic works (Test 12)
- [ ] React Query configured correctly (Test 13)
- [ ] Pagination independent per tab (Test 14)
- [ ] Permissions properly enforced (Test 15)

## Troubleshooting

### Issue: Page doesn't load
```
Solution:
1. Check you have SUPER_ADMIN role
2. Check database is running
3. Check TypeScript errors: pnpm exec tsc --noEmit
4. Check server logs for errors
```

### Issue: "No QueryClient set" error
```
Solution:
1. Verify super-admin-query-provider.tsx exists
2. Verify layout.tsx imports and wraps with SuperAdminQueryProvider
3. Restart dev server: pnpm dev
4. Clear browser cache
```

### Issue: Search not working
```
Solution:
1. Check server action is called (network tab)
2. Verify database has data
3. Try creating a procedure first
4. Check for SQL errors in server logs
```

### Issue: Procedures not showing in clinic
```
Solution:
1. Ensure you're in the correct clinic detail page
2. Check clinic ID is passed correctly
3. Verify clinicId is not null in component props
4. Check database has procedures for this clinic
```

### Issue: Create button is disabled
```
Solution:
1. Check you have SUPER_ADMIN permission
2. Ensure form is not in loading state
3. Check browser console for errors
4. Try page refresh
```

## Performance Notes

- ✓ Master procedures with 100+ items: Should paginate at 10/page
- ✓ Search on 1000+ procedures: Server-side filtering keeps it fast
- ✓ Switching clinic contexts: Query cache keeps it responsive
- ✓ Network requests: React Query caches prevent duplicate requests

## Success Indicators

✅ All pages load without errors
✅ All CRUD operations work (Create, Read, Update, Delete)
✅ Search and pagination work correctly
✅ Clinic and master procedures are properly separated
✅ React Query is configured and working
✅ No console errors or warnings
✅ Navigation flows work smoothly
✅ Responsive design on mobile/tablet (if applicable)

---

**Test Version**: 3.0  
**Last Updated**: January 18, 2026  
**Status**: Ready for Testing
