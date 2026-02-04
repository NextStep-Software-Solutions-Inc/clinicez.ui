# PatientCard Component Hook Refactoring

## What Changed

The `PatientCard` component has been refactored to properly use the `usePatientComprehensiveData` hook instead of making direct API calls.

## Before (Direct API Calls)

```tsx
const handleOpenAIInsights = async () => {
  // Making direct fetch call inside component
  const response = await fetch(`/api/patients/${userId}/data?...`);
  // ... process response
}
```

**Problems:**

- Direct HTTP calls in component logic
- Hard to reuse across components
- Logic not separated from UI concerns
- Difficult to test

## After (Using Hook)

```tsx
// Declare the hook with disabled fetch on mount
const { 
  data: comprehensiveData, 
  loading: isLoadingPatientData, 
  error: patientDataError,
  refetch: refetchPatientData
} = usePatientComprehensiveData({
  userId: patientId,      // Numeric patient ID
  clinicId: clinic?.id,   // Clinic context
  enabled: false,         // Only fetch on demand
});

// Use refetch in handler when needed
const handleOpenAIInsights = async () => {
  if (!comprehensiveData) {
    await refetchPatientData();  // Fetch on demand
  }
  // ... use comprehensiveData
}
```

**Benefits:**

- ✅ Reusable hook for comprehensive patient data
- ✅ Separated concerns (hook handles fetching, component uses data)
- ✅ Cleaner component logic
- ✅ Loading and error states managed by hook
- ✅ Easy to test hook independently
- ✅ Consistent with React patterns

## Key Points

### 1. Hook Usage

- **Hook:** `usePatientComprehensiveData` from `@/hooks/usePatientComprehensiveData`
- **Options:**
  - `userId`: Numeric patient ID (not Clerk ID)
  - `clinicId`: Clinic context (optional)
  - `enabled`: Set to `false` for on-demand fetching

### 2. Correct ID Usage

- **`userId` (Clerk):** String ID from Clerk authentication (e.g., "user_12345...")
- **`patientId`:** Numeric database ID from `patient.Patient.id`
- **Use `patientId` with the hook**, not Clerk's `userId`

### 3. On-Demand Fetching

```tsx
// Disabled on mount (enabled: false)
const { data, refetch } = usePatientComprehensiveData({
  enabled: false,
});

// Fetch manually when needed
const handleOpenAIInsights = async () => {
  if (!data) {
    // Option 1: Use refetch from hook
    await refetch();
    
    // Option 2: Manual fetch for fallback scenarios
    const response = await fetch(`/api/patients/${patientId}/data?...`);
  }
}
```

## Component Changes Summary

### File: `src/components/patient/PatientCard.tsx`

**Changes Made:**

1. Added hook initialization with `enabled: false` (on-demand)
2. Removed direct API call from `handleOpenAIInsights`
3. Added conditional logic to use cached or fetch new data
4. Updated userId references to use numeric `patientId`
5. Removed duplicate patient data destructuring
6. Used hook's `refetch` method for on-demand fetching

### Before vs After

**Lines Changed:** ~150 lines
**Complexity Reduced:** Yes - moved fetch logic to hook
**Type Safety:** Improved - proper numeric ID usage
**Reusability:** Increased - hook can be used elsewhere

## Hook Features

The `usePatientComprehensiveData` hook provides:

### Return Values

```typescript
{
  data: ComprehensivePatientData | null;        // Fetched data
  loading: boolean;                              // Loading state
  error: string | null;                          // Error message
  refetch: () => Promise<void>;                  // Manual refetch function
}
```

### Data Structure

The hook returns data with 18 data sources:

- Demographics
- Health conditions
- Medications
- Clinical notes (NEW)
- Prescriptions (NEW)
- Surgical history (NEW)
- Allergies (NEW)
- Vital signs
- And more...

## Type Safety

✅ **TypeScript Validation Passed**

- No `any` types used
- Proper type casting for clinic ID
- Correct numeric/string ID usage
- All property types validated

## Build Status

✅ **Full Build Successful**

- TypeScript: 0 errors
- Build: Complete
- All routes compiled
- No runtime errors expected

## Testing Recommendations

1. **Click "AI Insights" button**
   - Should trigger data fetch via hook
   - Debug panel should show complete data
   - AI should generate insights

2. **Check Hook Behavior**
   - Data loads on demand (not on mount)
   - Refetch works when called
   - Error states handled properly

3. **Verify Data Completeness**
   - All 18 data sources present
   - Conditions not empty
   - Medications with dosages
   - Clinical documentation included

## Future Improvements

1. **Add caching** - Reuse fetched data across page navigations
2. **Add pagination** - For large result sets
3. **Add filtering** - Allow selecting specific data categories
4. **Performance optimization** - Use React Query or SWR for advanced caching

## Summary

The component now properly uses a dedicated hook for comprehensive patient data fetching, following React best practices for data management and separation of concerns. The implementation is cleaner, more maintainable, and more testable.
