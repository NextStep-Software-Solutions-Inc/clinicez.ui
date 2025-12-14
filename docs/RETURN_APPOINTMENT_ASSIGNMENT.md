# Return Appointment Assignment Feature

## Overview
This feature allows nurses and clinic staff to return accepted appointment assignments back to the assignment pool. This is useful when a healthcare provider encounters an emergency or decides they cannot proceed with the appointment.

## Required Permission

To use this feature, users must have the following permission assigned to their role:

**Permission Name:** `return:clinic:appointment_assignment`

**Permission Key:** `RETURN:CLINIC:APPOINTMENT_ASSIGNMENT`

### How to Assign the Permission

1. Navigate to the role management section in your application
2. Find the role that should be able to return appointments (typically Nurse or Clinic Admin roles)
3. Add the permission: `return:clinic:appointment_assignment`
4. Save the role configuration

## User Flow

1. **View Routing History**: Right-click on an appointment routing record in the history
2. **Select Return Assignment**: Choose "Return Assignment" from the context menu (only visible for ACCEPTED status)
3. **Provide Reason**: Enter a mandatory reason for returning the assignment
4. **Submit**: Click "Return Assignment" to confirm

## Technical Details

### Database Changes
- Added `returnReason` field to store the reason for returning
- Added `returnedAt` field to timestamp when the assignment was returned
- Added `returnedBy` field to track who returned the assignment
- Added `ReturnedBy` relation to link to the User who returned it

### Workflow
1. When an ACCEPTED appointment assignment is returned:
   - Status changes to `CANCELLED`
   - Return metadata is recorded (reason, timestamp, user)
   - If no other active assignments exist, appointment status reverts to `RECEIVED`
   - Appointment becomes available for reassignment

### Error Messages

| Error | Meaning |
|-------|---------|
| "You do not have permission to return appointment assignment" | User lacks the required permission |
| "Reason is required to return an appointment assignment" | No reason was provided |
| "Invalid appointment routing ID" | The routing ID is not valid |
| "Appointment assignment not found or you are not authorized to return it" | Record doesn't exist or is not in ACCEPTED status |

## Display

Returned assignments show:
- **Return Reason** (in orange text)
- **Returned By** (user who returned it)
- **Returned At** (timestamp)

## Related Permissions

- `assign:clinic:appointment` - Required to assign appointments
- `cancel:clinic:appointment_assignment` - For cancelling PENDING assignments
- `accept:clinic:appointment_assignment` - For accepting assignments
- `decline:clinic:appointment_assignment` - For declining assignments
