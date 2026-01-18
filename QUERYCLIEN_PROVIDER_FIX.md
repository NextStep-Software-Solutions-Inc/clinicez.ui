# QueryClientProvider Fix for Diagnostics & Procedures Console

## Issue
When visiting `/super-admin/diagnostics-procedures`, the page threw an error:
```
No QueryClient set, use QueryClientProvider to set one. Try again
```

## Root Cause
The diagnostics-procedures components use React Query's `useQuery` hook, which requires a `QueryClientProvider` to be set up in the component tree. The super-admin layout was missing this provider.

## Solution Implemented

### 1. Created QueryClientProvider Wrapper
**File**: `src/app/(super-admin)/super-admin-query-provider.tsx`

A client-side component that:
- Creates a new QueryClient instance with optimized defaults
- Wraps children with QueryClientProvider
- Configures stale time and garbage collection times
- Exports SuperAdminQueryProvider for use in the layout

```typescript
"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
```

### 2. Updated Super Admin Layout
**File**: `src/app/(super-admin)/layout.tsx`

- Imported the SuperAdminQueryProvider
- Wrapped the entire layout content with SuperAdminQueryProvider
- All child pages now have access to React Query functionality

## Configuration
- **Stale Time**: 5 minutes - queries are fresh for 5 minutes after fetching
- **Garbage Collection**: 10 minutes - unused queries are cleaned up after 10 minutes

## Result
✅ React Query hooks now work properly in all super-admin pages  
✅ Diagnostics & Procedures console now loads without errors  
✅ All CRUD operations with search, pagination, and filtering now functional  
✅ Real-time data fetching with automatic caching and refetching  

## Testing
Visit `/super-admin/diagnostics-procedures` to verify:
1. Page loads without errors
2. Master Procedures tab displays procedures list
3. Clinic Procedures tab allows clinic selection
4. Search, pagination, and CRUD operations work smoothly
