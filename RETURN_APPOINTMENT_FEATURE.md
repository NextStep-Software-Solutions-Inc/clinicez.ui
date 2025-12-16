# Return Appointment Assignment Feature

## Overview

This feature addresses the issue where accepted appointments (either manually or auto-accepted) could not be returned once accepted, causing appointments to get stuck when providers decide not to proceed or have emergencies.

## Problem Solved

**Before:**
- Once an appointment was ACCEPTED, there was no way to return it
- Nurses could only cancel PENDING assignments
- Accepted appointments became irreversible after acceptance
- Workflow became blocked when providers had emergencies

**After:**
- Nurses can now return ACCEPTED appointment assignments
- Must provide a reason when returning (required field)
- Appointment status automatically updates back to RECEIVED for reassignment
- Maintains full audit trail with return reason, timestamp, and user

## Implementation Details

### 1. Database Changes

**Prisma Schema Updates:**
- Added `returnReason` field (String?) to track why assignment was returned
- Added `returnedAt` field (DateTime?) to track when it was returned
- Added `returnedBy` field (Int?) to track who returned it
- Added `ReturnedBy` relation to User model for referential integrity

**Migration:**
- Created migration: `20251211144232_add_return_fields_to_appointment_routing`
- Adds nullable columns (no breaking changes to existing data)

### 2. Permission System

**New Permission:**
- `RETURN:CLINIC:APPOINTMENT_ASSIGNMENT`
- Permission name: `return:clinic:appointment_assignment`
- Description: "User can return accepted appointment assignment within the clinic."

Added to `src/lib/permissions.ts` for permission-based access control.

### 3. Server Action

**New Action: `returnAppointmentAssignmentAction`**

Location: `src/actions/appointments/appointment-routing.action.ts`

**Features:**
- Permission check: Requires `RETURN:CLINIC:APPOINTMENT_ASSIGNMENT` permission
- Validation: Ensures reason is provided and not empty
- Transaction-based: Uses Prisma transactions with Serializable isolation level
- Status update: Changes routing status to 'CANCELLED' with return metadata
- Smart status management: Updates appointment status to 'RECEIVED' if no active assignments remain
- Error handling: Uses `withErrorHandling` wrapper for consistent error responses

**Business Logic:**
```typescript
1. Validates user has permission
2. Validates reason is provided
3. Within transaction:
   - Updates routing to CANCELLED status
   - Records returnedBy, returnedAt, and returnReason
   - Checks if any active assignments remain (PENDING or ACCEPTED)
   - If no active assignments, updates appointment status to RECEIVED
```

### 4. UI Components

**Updated: `AppointmentRoutingHistorySheet.tsx`**

**Key Changes:**
1. Added `ReturnAssignment` component as an inline component for return functionality
2. Updated ContextMenuTrigger to enable menus for both PENDING and ACCEPTED statuses
3. Conditional rendering:
   - PENDING status → Shows "Cancel Assignment" option
   - ACCEPTED status → Shows "Return Assignment" option
4. Display return reasons in orange text color to distinguish from amendments
5. Return action uses a Popover with reason input directly in the context menu

**UI Flow:**
1. User right-clicks on ACCEPTED routing history item
2. Context menu shows "Return Assignment" option with Undo2 icon
3. Clicking opens a popover with reason input field (required)
4. User enters reason and submits
5. Toast notification shows progress/result
6. Sheet automatically refreshes to show updated status

### 5. Visual Design

**Color Coding:**
- Amendment reason: Muted gray text (`text-muted-foreground`)
- Return reason: Orange text (`text-orange-600`)
- Return button: Orange color (`text-orange-500`)

**Status Badges:**
- ACCEPTED: Default variant
- PENDING: Outline variant
- DECLINED: Destructive variant
- CANCELLED: Destructive variant (includes returns)

### 6. Data Flow

```
User Action (Right-click ACCEPTED routing)
    ↓
ReturnAssignment Component
    ↓
Popover opens with reason input
    ↓
User provides reason
    ↓
returnAppointmentAssignmentAction (Server)
    ↓
Permission Check
    ↓
Transaction Start
    ↓
Update AppointmentRouting:
  - status = 'CANCELLED'
  - returnReason = user input
  - returnedAt = current timestamp
  - returnedBy = current user
    ↓
Check All Routing Statuses
    ↓
If no PENDING/ACCEPTED remain:
  Update AppointmentAttribute.status = 'RECEIVED'
    ↓
Transaction Commit
    ↓
Response to Client
    ↓
Toast Success + UI Refresh
```

## Adherence to Best Practices

### SOLID Principles

1. **Single Responsibility Principle (SRP):**
   - `returnAppointmentAssignmentAction`: Handles only return logic
   - `ReturnAssignment`: Handles only UI for return action
   - Separate components for Cancel vs Return (different workflows)

2. **Open/Closed Principle (OCP):**
   - Extends functionality without modifying existing cancel logic
   - Reuses existing `updateAppointmentStatusIfNeeded` helper
   - New permission added without changing existing permission structure

3. **Liskov Substitution Principle (LSP):**
   - Return action follows same pattern as decline/cancel actions
   - Uses same error handling and transaction patterns

4. **Interface Segregation Principle (ISP):**
   - Components receive only required props (appointmentRoutingId, callback)
   - No unnecessary dependencies

5. **Dependency Inversion Principle (DIP):**
   - Depends on Prisma abstraction, not direct database access
   - Uses promiseWrapper abstraction for error handling

### DRY (Don't Repeat Yourself)

- Reuses `updateAppointmentStatusIfNeeded` helper function (already existed)
- Reuses `withErrorHandling` wrapper pattern
- Reuses UI patterns from DeclineAppointmentAssignment
- Consistent permission checking pattern
- Consistent transaction pattern with same timeout/isolation settings

### Code Quality

- TypeScript types for type safety
- Proper error messages for user feedback
- Input validation (required reason)
- Permission-based access control
- Transaction isolation for data consistency
- Toast notifications for UX feedback

## Testing Scenarios

### Manual Testing

1. **Return Accepted Assignment:**
   - Assign appointment to HP (auto-accepted or manually accepted)
   - Right-click on ACCEPTED routing in history
   - Click "Return Assignment"
   - Enter a reason
   - Verify status changes to CANCELLED
   - Verify return reason displays in orange
   - Verify appointment status changes to RECEIVED

2. **Return Without Other Assignments:**
   - Single ACCEPTED assignment exists
   - Return that assignment
   - Verify appointment status changes to RECEIVED
   - Verify nurse can reassign to another HP

3. **Return With Other Assignments:**
   - Multiple assignments exist (one ACCEPTED, one PENDING)
   - Return the ACCEPTED assignment
   - Verify appointment remains ROUTED (due to PENDING assignment)
   - After other assignments are cancelled/declined, appointment becomes RECEIVED

4. **Permission Testing:**
   - User without `RETURN:CLINIC:APPOINTMENT_ASSIGNMENT` permission
   - Should not be able to return assignments
   - Should see appropriate error message

5. **Validation Testing:**
   - Try to return without providing reason
   - Should see validation error
   - Empty/whitespace-only reason should be rejected

### Edge Cases

1. Try to return an already CANCELLED assignment (should error)
2. Try to return a PENDING assignment (should not show option)
3. Try to return a DECLINED assignment (should not show option)
4. Concurrent returns of same assignment (transaction isolation should handle)
5. Return after consultation ticket created (should still work)

## Security Considerations

1. **Permission-Based Access Control:** Only users with explicit permission can return assignments
2. **Audit Trail:** Complete tracking of who returned, when, and why
3. **Data Validation:** Reason is required and validated
4. **Transaction Isolation:** Serializable isolation prevents race conditions
5. **Error Handling:** No sensitive information leaked in error messages

## Backward Compatibility

- ✅ No breaking changes to existing functionality
- ✅ All new fields are nullable (optional)
- ✅ Existing cancel logic unchanged
- ✅ Existing assignments continue to work
- ✅ Migration is additive only

## Future Enhancements

1. **Notification System:**
   - Notify nurse when assignment is returned
   - Notify assigned HP when their acceptance is returned

2. **Analytics Dashboard:**
   - Track return reasons for pattern analysis
   - Identify providers with high return rates
   - Understand common emergency scenarios

3. **Auto-Reassignment:**
   - Smart reassignment based on return reason
   - Suggest alternative providers based on availability

4. **Return Approval Workflow:**
   - Require approval for returns after certain time
   - Different rules for different clinic types

5. **Return History Report:**
   - Detailed report of all returns
   - Filter by provider, reason, date range
   - Export for compliance purposes

## Files Modified

1. `prisma/schema.prisma` - Added return fields to AppointmentRouting model
2. `prisma/migrations/20251211144232_add_return_fields_to_appointment_routing/migration.sql` - Database migration
3. `src/lib/permissions.ts` - Added RETURN:CLINIC:APPOINTMENT_ASSIGNMENT permission
4. `src/actions/appointments/appointment-routing.action.ts` - Added returnAppointmentAssignmentAction
5. `src/components/appointment/AppointmentRoutingHistorySheet.tsx` - Added return UI component and display logic

## Conclusion

This implementation provides a complete solution for returning accepted appointment assignments while maintaining data integrity, audit trails, and following best practices. The feature is permission-based, well-documented, and includes comprehensive error handling and user feedback.
