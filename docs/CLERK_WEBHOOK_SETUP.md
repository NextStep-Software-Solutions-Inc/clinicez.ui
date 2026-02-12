# Clerk Webhook Setup Guide

## Overview

This application uses Clerk webhooks to synchronize user data between Clerk's authentication system and our application database. When a user signs up or updates their profile in Clerk, the webhook automatically creates or updates the corresponding user record in our database.

## Why Webhooks?

**Previous Approach (Deprecated):**
- Used `findOrCreateUserAction()` that was called on every page load
- Created users on-demand during authentication
- Caused unnecessary database transactions on every request
- Could lead to race conditions and inconsistent state

**New Approach (Current):**
- Users are created/updated via Clerk webhooks when events happen
- `getCurrentUserAction()` simply retrieves the existing user
- More efficient and follows best practices
- Eliminates race conditions

## Webhook Endpoint

The webhook endpoint is located at:
```
/api/webhooks/clerk
```

**Full URL:**
```
https://your-domain.com/api/webhooks/clerk
```

## Supported Events

The webhook handles the following Clerk events:

1. **`user.created`** - Triggered when a new user signs up
   - Creates a new user record in the database
   - Assigns default user permissions
   - Sets initial profile status

2. **`user.updated`** - Triggered when a user updates their profile
   - Updates user's email, name, and profile picture
   - Maintains existing user data not provided by Clerk

## Setup Instructions

### 1. Configure Environment Variable

Add the Clerk webhook secret to your environment variables:

```env
CLERK_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**How to get the webhook secret:**
1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Select your application
3. Navigate to **Webhooks** in the sidebar
4. Click on your webhook endpoint (or create a new one)
5. Copy the **Signing Secret**

### 2. Create Webhook in Clerk Dashboard

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Select your application
3. Click **Webhooks** in the sidebar
4. Click **Add Endpoint**
5. Configure the endpoint:
   - **Endpoint URL**: `https://your-domain.com/api/webhooks/clerk`
   - **Subscribe to events**:
     - ✅ `user.created`
     - ✅ `user.updated`
6. Click **Create**
7. Copy the **Signing Secret** and add it to your `.env` file

### 3. Test the Webhook

#### Local Testing with ngrok

For local development, you can use ngrok to expose your local server:

1. Install ngrok:
   ```bash
   npm install -g ngrok
   # or
   brew install ngrok  # macOS
   ```

2. Start your Next.js development server:
   ```bash
   npm run dev
   ```

3. Start ngrok:
   ```bash
   ngrok http 3000
   ```

4. Copy the ngrok URL (e.g., `https://abc123.ngrok.io`)

5. In Clerk Dashboard, update your webhook endpoint URL to:
   ```
   https://abc123.ngrok.io/api/webhooks/clerk
   ```

6. Test by signing up a new user or updating an existing user's profile

#### Production Testing

1. Deploy your application to production
2. Update the webhook endpoint URL in Clerk Dashboard to your production URL
3. Test by signing up or updating a user

### 4. Verify Webhook is Working

After setting up the webhook, verify it's working correctly:

1. **Sign up a new user:**
   - Go to your application's sign-up page
   - Create a new account
   - Check your database to confirm the user was created
   - Check Clerk Dashboard → Webhooks → Your endpoint → Logs

2. **Update a user:**
   - Log in to your application
   - Update your profile (name, email, etc.)
   - Check your database to confirm the updates
   - Check webhook logs in Clerk Dashboard

## Webhook Security

The webhook endpoint uses Svix to verify webhook signatures, ensuring that:
- Requests come from Clerk, not malicious actors
- Webhook payloads haven't been tampered with
- Replay attacks are prevented

**Security measures implemented:**
- ✅ Signature verification using `svix-id`, `svix-timestamp`, and `svix-signature` headers
- ✅ Request validation
- ✅ Error handling and logging
- ✅ Transaction-based database operations

## Error Handling

The webhook includes comprehensive error handling:

### Missing Webhook Secret
```json
{
  "error": "Webhook secret not configured"
}
```
**Solution:** Add `CLERK_WEBHOOK_SECRET` to your environment variables

### Invalid Signature
```json
{
  "error": "Invalid signature"
}
```
**Solution:** Verify the webhook secret matches the one in Clerk Dashboard

### Missing Headers
```json
{
  "error": "Missing svix headers"
}
```
**Solution:** Ensure the request is coming from Clerk with proper headers

### No Primary Email
```json
{
  "error": "No primary email found"
}
```
**Solution:** Ensure users have a primary email address set in Clerk

## Database Schema

The webhook creates/updates users with the following structure:

```typescript
{
  userId: string;        // Clerk user ID (unique)
  email: string;         // Primary email address (unique)
  firstName: string;     // From Clerk
  lastName: string;      // From Clerk
  mobile: string;        // Initially empty
  picture: string | null; // Profile image URL
  isActive: boolean;     // Default: true
  onboardingStatus: enum; // Default: NOT_STARTED
  profileCompletionStatus: enum; // Default: INCOMPLETE
  accountType: enum;     // Default: FULL
  createdAt: DateTime;   // Auto-generated
  updatedAt: DateTime;   // Auto-generated
}
```

## Default Permissions

When a new user is created, the webhook automatically assigns default permissions:

1. Fetches all permissions with `type: "USER"`
2. Filters out `SUPER_ADMIN` (must be granted manually)
3. Creates `UserPermission` records for each default permission

## Monitoring and Debugging

### Clerk Dashboard
- Go to **Webhooks** → Your endpoint
- Click **Logs** to see all webhook deliveries
- View request/response details
- Check for failed deliveries and retry them

### Application Logs
The webhook logs important events:
```
Created new user <userId> (<email>)
Updated user <userId> (<email>)
```

### Common Issues

**Issue:** User not found in database after signup
- **Check:** Webhook endpoint is correctly configured in Clerk
- **Check:** `CLERK_WEBHOOK_SECRET` is set correctly
- **Check:** Webhook logs in Clerk Dashboard for errors

**Issue:** Webhook signature verification fails
- **Check:** Webhook secret matches exactly (no extra spaces)
- **Check:** Environment variables are loaded correctly
- **Check:** Server is restarted after adding environment variables

## Migration from Old System

If you're migrating from the old `findOrCreateUserAction()` approach:

1. ✅ Set up webhook in Clerk Dashboard
2. ✅ Add `CLERK_WEBHOOK_SECRET` to environment
3. ✅ Deploy the webhook endpoint
4. ✅ Test with a new user signup
5. ✅ Verify existing users can still log in
6. ⚠️ The old `findOrCreateUserAction()` is marked as deprecated but still exists for backward compatibility

**Note:** Existing users created before webhook setup will still work. The `getCurrentUserAction()` will find them in the database. New users should be created via webhook.

## Code References

- **Webhook Endpoint:** `src/app/api/webhooks/clerk/route.ts`
- **Get Current User:** `src/actions/users/user.action.ts` → `getCurrentUserAction()`
- **Deprecated Action:** `src/actions/users/user.action.ts` → `findOrCreateUserAction()` (deprecated)
- **Root Layout:** `src/app/layout.tsx`

## Support

If you encounter issues with the webhook:
1. Check Clerk Dashboard webhook logs
2. Check application server logs
3. Verify environment variables are set
4. Test with a fresh user signup
5. Contact support with webhook delivery IDs from Clerk Dashboard
