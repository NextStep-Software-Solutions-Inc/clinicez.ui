# Appointment Assignment & Auto-Accept Bug Fix

## Issue Summary

This document details the root causes and solutions applied to fix two interconnected problems in the appointment workflow:

1. **Auto-Accept Feature Not Working**: Appointments were not being automatically accepted even when the auto-accept option was enabled in provider preferences
2. **Inability to Reassign After Provider Declines**: When a provider declined an auto-accepted appointment, nurses could not reassign it to another physician

## Root Cause Analysis

### 1. Auto-Accept Bug

**Location**: `src/actions/appointments/appointment-routing.action.ts` (lines 31-39)

**Problem**: The `assignAppointmentAction` was checking the **assigner's** (nurse's) `autoAcceptAppointmentAssignment` preference instead of the **assignee's** (healthcare provider's) preference.

**Code Before**:
```typescript
const userPreference = await prisma.userPreference.findFirst({
  where: {
    User: {
      userId: session.user.sub  // This is the nurse assigning, not the HP being assigned to
    }
  }
});

const autoAccept = userPreference?.autoAcceptAppointmentAssignment ?? false;
```

**Issue**: The system was looking at the logged-in user's (nurse's) preference to decide if the assignment should be auto-accepted, when it should be looking at the healthcare provider being assigned to.

### 2. Reassignment Blocking Bug

**Location**: `src/actions/appointments/appointment-routing.action.ts` (lines 125-137)

**Problem**: When a healthcare provider declined an assignment, the system would:
- Update the `AppointmentRouting.status` to 'DECLINED'
- BUT leave the `AppointmentAttribute.status` as 'ROUTED'

This caused the appointment to remain stuck in 'ROUTED' status even when no active assignments existed (all were declined or cancelled).

**Code Before**:
```typescript
await prisma.appointmentRouting.update({
  where: { routingCode },
  data: { 
    status: 'DECLINED',
    amendedAt: new Date(),
    AmendedBy: { connect: { userId: session.user.sub } },
    amendment: reason
  },
})
```

**Issue**: The appointment status was not being updated back to 'RECEIVED' when all assignments were declined, preventing nurses from reassigning the appointment.

### 3. Related Issue in Cancel Action

**Location**: `src/actions/appointments/appointment-routing.action.ts` (lines 156-176)

**Problem**: Same as issue #2 but for the `cancelAppointmentRoutingAction` - when a nurse cancelled an assignment, the appointment status wasn't updated if all assignments were cancelled.

## Solutions Applied

### Solution 1: Fix Auto-Accept to Check Assignee's Preference

**File**: `src/actions/appointments/appointment-routing.action.ts`

**Change**: Modified the `assignAppointmentAction` to query the healthcare provider's user preference instead of the assigner's.

**Code After**:
```typescript
// Get the healthcare provider's user preference for auto-accept
const healthcareProvider = await prisma.healthcareProvider.findUnique({
  where: { id: routedTo },
  select: {
    id: true,
    User: {
      select: {
        UserPreference: {
          select: {
            autoAcceptAppointmentAssignment: true
          }
        }
      }
    }
  }
});

if (!healthcareProvider) {
  throw new Error('Healthcare provider not found');
}

const autoAccept = healthcareProvider.User?.UserPreference?.autoAcceptAppointmentAssignment ?? false;
```

**Impact**: Now when a nurse assigns an appointment to a healthcare provider who has auto-accept enabled in their preferences, the assignment will automatically be set to 'ACCEPTED' status. Additionally:
- Validation ensures that if an invalid healthcare provider ID is provided, an appropriate error is thrown
- Query is optimized to select only the required fields, improving performance

### Solution 2: Update Appointment Status When All Assignments Are Declined

**File**: `src/actions/appointments/appointment-routing.action.ts`

**Change**: Wrapped the decline action in a transaction and added logic to check if all assignments are in terminal states (DECLINED/CANCELLED). If so, update the appointment status back to 'RECEIVED'.

**Code After**:
```typescript
await prisma.$transaction(async (prisma) => {
  // Update the routing status to DECLINED
  const updatedRouting = await prisma.appointmentRouting.update({
    where: { routingCode },
    data: { 
      status: 'DECLINED',
      amendedAt: new Date(),
      AmendedBy: { connect: { userId: session.user.sub } },
      amendment: reason
    },
    include: {
      Appointment: {
        include: {
          AppointmentRouting: true
        }
      }
    }
  });

  // Update appointment status if all assignments are declined/cancelled
  await updateAppointmentStatusIfNeeded(
    prisma,
    updatedRouting.appointmentId,
    updatedRouting.Appointment.AppointmentRouting
  );
}, {
  timeout: 5000,
  maxWait: 10000,
  isolationLevel: Prisma.TransactionIsolationLevel.Serializable
});
```

**Impact**: 
- When a healthcare provider declines an assignment, the system checks if there are any remaining active assignments (PENDING or ACCEPTED)
- If no active assignments exist, the appointment status is automatically updated to 'RECEIVED'
- This allows nurses to reassign the appointment to another healthcare provider
- The nurse will see the assignment button available again for the appointment

### Solution 3: Update Appointment Status When Assignments Are Cancelled

**File**: `src/actions/appointments/appointment-routing.action.ts`

**Change**: Applied the same logic as Solution 2 to the `cancelAppointmentRoutingAction`.

**Impact**: When a nurse cancels an assignment and no other active assignments exist, the appointment status is updated to 'RECEIVED', allowing for reassignment.

## Technical Details

### Database Transaction Usage

All three fixes use Prisma transactions with the following settings:
- `timeout`: 5000ms (5 seconds)
- `maxWait`: 10000ms (10 seconds)
- `isolationLevel`: Serializable

This ensures:
- **Atomicity**: All operations succeed or fail together
- **Consistency**: The appointment and routing states remain consistent
- **Isolation**: Concurrent operations don't interfere with each other
- **Durability**: Once committed, changes are permanent

### Active Assignment Check

The logic determines if an assignment is "active" by checking if its status is either:
- `PENDING`: Waiting for the healthcare provider to accept
- `ACCEPTED`: The healthcare provider has accepted the assignment

Terminal states (not active):
- `DECLINED`: Healthcare provider declined the assignment
- `CANCELLED`: Nurse cancelled the assignment

### Workflow States

**Before Fix**:
1. Nurse assigns appointment to HP → Status: ROUTED
2. HP has auto-accept disabled → Routing status: PENDING
3. HP declines → Routing status: DECLINED, Appointment status: ROUTED (STUCK!)
4. Nurse cannot reassign

**After Fix**:
1. Nurse assigns appointment to HP → Status: ROUTED
2. HP has auto-accept enabled → Routing status: ACCEPTED ✓
3. HP declines → Routing status: DECLINED, Appointment status: RECEIVED ✓
4. Nurse can reassign to another HP ✓

## Adherence to Best Practices

### SOLID Principles

1. **Single Responsibility Principle**: Each action function has a clear, single purpose
   - `assignAppointmentAction`: Handles assignment creation
   - `declineAppointmentAction`: Handles decline and status cleanup
   - `cancelAppointmentRoutingAction`: Handles cancellation and status cleanup

2. **Open/Closed Principle**: The fixes extend functionality without modifying the existing core logic structure

3. **Dependency Inversion Principle**: All functions depend on the Prisma abstraction layer rather than direct database access

### DRY (Don't Repeat Yourself)

- The "check for active assignments and update appointment status" logic is extracted into a reusable helper function `updateAppointmentStatusIfNeeded`
- This function is used by both `declineAppointmentAction` and `cancelAppointmentRoutingAction`
- This ensures consistency and maintainability while adhering to DRY principles
- The helper function is properly typed using `Prisma.TransactionClient` for type safety

**Helper Function**:
```typescript
async function updateAppointmentStatusIfNeeded(
  prisma: Prisma.TransactionClient,
  appointmentId: number,
  allRoutings: Array<{ status: string }>
) {
  const hasActiveAssignment = allRoutings.some(r => 
    r.status === 'PENDING' || r.status === 'ACCEPTED'
  );

  if (!hasActiveAssignment) {
    await prisma.appointmentAttribute.update({
      where: { appointmentId },
      data: { status: 'RECEIVED' }
    });
  }
}
```

### Error Handling

All actions use the `withErrorHandling` wrapper (following existing repository pattern) to:
- Catch and handle Prisma errors gracefully
- Provide user-friendly error messages
- Log errors for debugging

## Testing Recommendations

### Manual Testing Scenarios

1. **Auto-Accept Feature**:
   - Enable auto-accept in HP's user preferences
   - Have a nurse assign an appointment to that HP
   - Verify the routing status is 'ACCEPTED' immediately

2. **Reassignment After Decline**:
   - Assign appointment to HP (with or without auto-accept)
   - Have HP decline the assignment
   - Verify appointment status changes to 'RECEIVED'
   - Verify nurse can now reassign to another HP

3. **Multiple Assignments**:
   - Assign appointment to HP1
   - Assign appointment to HP2
   - Have HP1 decline
   - Verify appointment remains 'ROUTED' (HP2 still pending/accepted)
   - Have HP2 decline
   - Verify appointment changes to 'RECEIVED'

4. **Cancellation**:
   - Nurse assigns appointment to HP
   - Nurse cancels the assignment
   - Verify appointment status changes to 'RECEIVED'
   - Verify nurse can reassign

### Edge Cases to Test

1. Multiple concurrent declines/cancellations
2. Declining an already declined assignment (should error)
3. Auto-accept with invalid HP ID
4. Permission checks for each action

## Files Modified

1. `/src/actions/appointments/appointment-routing.action.ts`
   - Added helper function `updateAppointmentStatusIfNeeded` (lines 12-35)
   - Modified `assignAppointmentAction` (lines 56-72)
   - Modified `declineAppointmentAction` (lines 158-191)
   - Modified `cancelAppointmentRoutingAction` (lines 211-252)

## Backward Compatibility

These changes are **fully backward compatible**:
- No database schema changes required
- No breaking API changes
- Existing appointment workflows continue to work
- Only fixes broken functionality without affecting working features

## Future Improvements

1. **Notification System**: Add notifications to nurses when all assignments are declined so they're immediately aware reassignment is needed

2. **Status Indicator**: Add a visual indicator in the UI showing "Provider Declined - Reassignment Needed" when appointment status is 'RECEIVED' after declines

3. **Auto-Reassignment**: Consider implementing smart auto-reassignment based on provider availability and specialty

4. **Audit Trail**: Enhanced logging of status changes for better troubleshooting and compliance

## Conclusion

These fixes address the core issues preventing the auto-accept feature from working and allowing reassignment after provider declines. The implementation follows SOLID principles and DRY methodology while maintaining backward compatibility and ensuring data consistency through proper transaction management.
