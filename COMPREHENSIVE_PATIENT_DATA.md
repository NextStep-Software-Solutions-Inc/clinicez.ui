# Comprehensive Patient Data Integration

## Overview

Implemented a comprehensive patient data fetching system that collects ALL available patient information from the database schema and provides it to AI for intelligent insights generation.

## Database Schema Coverage

The system now fetches information from the following schema models:

### 1. **User Demographics** (User Model)

- First Name, Last Name, Middle Name
- Date of Birth
- Gender
- Blood Type
- Email Address
- Profile Picture
- Case Number
- Calculated Age

### 2. **Current Health Status**

- **Appointments**: Count + recent visit details (subject, complaint, dates)
- **Health Conditions**: Active conditions with severity, diagnosis dates, status, notes
- **Medications**: Names and detailed info (dosage, frequency, duration, notes)
- **Disabilities**: Types, severity levels, management status

### 3. **Medical History**

- **Personal Medical History**: Past conditions with details
- **Family Medical History**: Hereditary conditions with notes
- Shows complete disease history for risk assessment

### 4. **Medications & Treatments**

- Medication names and quantities
- Dosage information
- Frequency of administration
- Treatment duration
- Associated notes
- Generic vs. brand identification

### 5. **Vaccinations**

- Vaccine names
- Dose information
- Date administered
- Notes (adverse reactions, etc.)
- 20 most recent vaccinations tracked

### 6. **Vital Signs Trends**

- Blood Pressure (Systolic/Diastolic)
- Heart Rate / Pulse Rate
- Temperature
- Weight
- Respiratory Rate
- 20 most recent measurements for trend analysis

### 7. **Appointment Details**

- Visit reasons/subjects
- Patient complaints
- Appointment dates and times
- Status tracking
- 20 most recent appointments

## Implementation Details

### New Files Created

1. **`src/hooks/usePatientComprehensiveData.ts`**
   - React hook for fetching comprehensive patient data
   - Supports parallel data loading
   - Includes error handling and retry functionality
   - Type-safe with TypeScript interfaces

2. **Enhanced API Route: `src/app/api/patients/[userId]/data`**
   - Single endpoint returning ALL patient information
   - Uses Prisma parallel queries for performance
   - Calculates derived data (age, etc.)
   - Includes clinic-specific filtering

### Integration in PatientCard Component

The `PatientCard.tsx` component now:

1. Fetches comprehensive patient data when AI Insights is clicked
2. Passes all collected information to the AI generation function
3. Displays debug information showing exactly what data was sent
4. Provides detailed error feedback

## Data Structure Sent to AI

```typescript
{
  // Demographics
  firstName: string;
  lastName: string;
  middleName: string;
  age: number;
  gender: string;
  bloodType: string;
  email: string;
  picture: string;
  caseNumber: string;

  // Current Status (counts)
  appointments: number;
  conditions: string[];
  medications: string[];

  // Detailed Health Info
  healthConditions: Array<{
    name: string;
    severity: string;
    status: string;
    dateDiagnosed: string;
    dateResolved: string;
    notes: string;
  }>;

  medicationDetails: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: number;
    notes: string;
  }>;

  disabilities: Array<{
    name: string;
    severity: string;
    notes: string;
    isManaged: boolean;
  }>;

  // History
  medicalHistory: Array<{
    condition: string;
    details: string;
  }>;

  familyMedicalHistory: Array<{
    condition: string;
    details: string;
  }>;

  vaccinations: Array<{
    vaccine: string;
    dose: string;
    dateGiven: string;
    notes: string;
  }>;

  // Recent Activity
  recentVisits: Array<{
    date: string;
    reason: string;
    complaint: string;
  }>;

  // Vital Trends
  vitalsTrends: {
    bloodPressure: string[];
    heartRate: number[];
    temperature: number[];
    weight: number[];
    respiratoryRate: number[];
  };
}
```

## API Endpoint Details

### GET `/api/patients/[userId]/data`

**Query Parameters:**

- `clinicId` (optional): Filter appointments and medications by clinic

**Response Includes:**

- All demographic information
- All active health conditions with details
- All medications with dosage info
- All disabilities
- Medical history (personal and family)
- Vaccination records
- Vital sign trends (20 most recent)
- Recent appointment history

**Performance:**

- Uses 10 parallel Prisma queries for optimal performance
- Returns comprehensive data in single request
- Caches friendly for client-side caching if needed

## Debug Display

The AI Insights dialog now shows:

1. **Processed Data**: Exact JSON sent to AI model
2. **Raw API Response**: Complete response from data endpoint
3. **Data Counts**: Number of conditions, medications, appointments fetched
4. **Errors**: Any errors encountered during data retrieval
5. **Timestamp**: When data was generated

This helps diagnose if:

- APIs are returning empty data
- Data transformation is losing information
- Patient records are incomplete in database
- There are query/filtering issues

## Database Queries Executed

The comprehensive data endpoint executes these parallel queries:

1. `User.findUnique()` - Demographics
2. `AppointmentRequester.findMany()` - Appointments (20 records)
3. `UserHealthCondition.findMany()` - Active health conditions
4. `Medication.findMany()` - Medications (count)
5. `Medication.findMany()` - Medications (with details)
6. `UserDisability.findMany()` - Disabilities
7. `MedicalHistory.findMany()` - Medical history
8. `FamilyMedicalHistory.findMany()` - Family history
9. `UserVaccination.findMany()` - Vaccinations (20 records)
10. `VitalSign.findMany()` - Vital signs (20 records)

All queries use appropriate:

- WHERE filters for clinic/user context
- INCLUDE clauses for related data
- ORDER BY for chronological data
- TAKE for result limiting
- SELECT for minimal field selection

## Usage Example

```typescript
import { usePatientComprehensiveData } from '@/hooks/usePatientComprehensiveData';

export function MyComponent() {
  const { data, loading, error } = usePatientComprehensiveData({
    userId: 123,
    clinicId: 456,
    enabled: true,
  });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>{data?.firstName} {data?.lastName}</h2>
      <p>Age: {data?.age}</p>
      <p>Conditions: {data?.conditions.join(', ')}</p>
      {/* Use data... */}
    </div>
  );
}
```

## Type Safety

All data is properly typed with TypeScript:

- `ComprehensivePatientData` interface defines all fields
- API responses are type-checked
- Hook returns typed data
- No `any` types used

## Benefits

1. **Complete Patient Context**: AI has access to all relevant patient information
2. **Better AI Insights**: More comprehensive data → more accurate insights
3. **Single Request**: One API call instead of multiple requests
4. **Performance**: Parallel queries for optimal speed
5. **Maintainability**: Centralized patient data fetching
6. **Debugging**: Built-in debug display for troubleshooting
7. **Type Safety**: Full TypeScript support throughout

## Next Steps

The AI now has access to comprehensive patient data including:

- Complete medical history
- All active conditions with severity
- Detailed medication information
- Vaccination records
- Vital sign trends
- Family medical history
- All recent appointments

This should provide much richer context for generating high-quality, clinically relevant AI insights.
