# Patient Data Flow Architecture

## Complete Data Collection Pipeline

```
┌─────────────────────────────────────────────────────────────────────┐
│                     PATIENT CARD COMPONENT                          │
│  - Displays patient info                                            │
│  - Shows "AI Insights" button                                       │
│  - Handles dialog display                                           │
└────────────────────┬────────────────────────────────────────────────┘
                     │
                     │ User clicks "AI Insights" button
                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│              COMPREHENSIVE DATA FETCHING                            │
│  GET /api/patients/[userId]/data?clinicId=[clinicId]               │
│                                                                      │
│  Executes 10 Parallel Prisma Queries:                               │
│  ├─ User (demographics: name, age, DOB, gender, blood type, etc.)  │
│  ├─ AppointmentRequester (recent 20 appointments)                  │
│  ├─ UserHealthCondition (active conditions with severity)          │
│  ├─ Medication (count and names)                                   │
│  ├─ Medication (detailed with dosage, frequency, duration)         │
│  ├─ UserDisability (disabilities and severity)                     │
│  ├─ MedicalHistory (personal medical history)                      │
│  ├─ FamilyMedicalHistory (hereditary conditions)                   │
│  ├─ UserVaccination (recent 20 vaccinations)                       │
│  └─ VitalSign (recent 20 measurements for trends)                  │
│                                                                      │
└────────────────────┬────────────────────────────────────────────────┘
                     │
                     │ All data aggregated into single JSON response
                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    COMPREHENSIVE JSON RESPONSE                      │
│                                                                      │
│  {                                                                   │
│    // Demographics (7 fields)                                       │
│    firstName, lastName, middleName, age, gender, bloodType, email  │
│                                                                      │
│    // Current Status (3 counts)                                     │
│    appointments: 12                                                  │
│    conditions: ["Hypertension", "Diabetes"]                        │
│    medications: ["Metformin", "Lisinopril"]                        │
│                                                                      │
│    // Health Details (detailed objects)                             │
│    healthConditions: [                                             │
│      { name: "Hypertension",                                        │
│        severity: "MODERATE",                                        │
│        status: "UNRESOLVED",                                        │
│        dateDiagnosed: "2020-05-15",                                │
│        notes: "... detailed notes ..." }                            │
│    ]                                                                 │
│                                                                      │
│    medicationDetails: [                                             │
│      { name: "Metformin",                                           │
│        dosage: "500mg",                                             │
│        frequency: "Twice daily",                                    │
│        duration: 365,                                               │
│        notes: "Take with meals" }                                   │
│    ]                                                                 │
│                                                                      │
│    disabilities: [                                                  │
│      { name: "Mobility Impairment",                                 │
│        severity: "MILD",                                            │
│        isManaged: true }                                            │
│    ]                                                                 │
│                                                                      │
│    // Medical History                                               │
│    medicalHistory: [                                                │
│      { condition: "Appendicitis",                                   │
│        details: "Appendectomy performed 2015" }                     │
│    ]                                                                 │
│                                                                      │
│    familyMedicalHistory: [                                          │
│      { condition: "Coronary Artery Disease",                        │
│        details: "Father had MI at 55" }                             │
│    ]                                                                 │
│                                                                      │
│    // Vaccinations                                                  │
│    vaccinations: [                                                  │
│      { vaccine: "COVID-19 (Pfizer)",                                │
│        dose: "3rd Dose",                                            │
│        dateGiven: "2023-10-15" }                                    │
│    ]                                                                 │
│                                                                      │
│    // Recent Activity                                               │
│    recentVisits: [                                                  │
│      { date: "2024-01-20T10:30:00Z",                                │
│        reason: "Diabetes Follow-up",                                │
│        complaint: "Elevated fasting glucose" }                      │
│    ]                                                                 │
│                                                                      │
│    // Vital Trends (arrays for charting/analysis)                   │
│    vitalsTrends: {                                                  │
│      bloodPressure: ["140/90", "135/88", "138/92"],                │
│      heartRate: [72, 75, 70],                                       │
│      temperature: [98.6, 98.4],                                     │
│      weight: [85.5, 86.0, 85.8],                                    │
│      respiratoryRate: [16, 18, 17]                                  │
│    }                                                                 │
│  }                                                                   │
│                                                                      │
└────────────────────┬────────────────────────────────────────────────┘
                     │
                     │ Stored for debugging display
                     │ Sent to AI generation function
                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  AI INSIGHTS GENERATION                             │
│  usePatientInsights().generate(comprehensiveData, clinicId)         │
│                                                                      │
│  AI Provider: Google Gemini 2.5 Flash (Primary)                     │
│  Fallbacks: OpenAI, Anthropic, Azure OpenAI                         │
│                                                                      │
│  Generates insights based on:                                       │
│  ├─ Patient demographics and risk factors                           │
│  ├─ Active conditions and severity                                  │
│  ├─ Current medication regimen                                      │
│  ├─ Medical and family history                                      │
│  ├─ Vaccination status                                              │
│  ├─ Recent appointment patterns                                     │
│  ├─ Vital sign trends and abnormalities                             │
│  ├─ Disability status and management                                │
│  └─ Drug interactions and contraindications                         │
│                                                                      │
└────────────────────┬────────────────────────────────────────────────┘
                     │
                     │ Markdown-formatted insights
                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   DIALOG DISPLAY                                    │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Patient AI Insights                                         │   │
│  │ AI-generated insights for John Doe                          │   │
│  ├─────────────────────────────────────────────────────────────┤   │
│  │                                                               │   │
│  │ ## Clinical Summary                                          │   │
│  │ Patient presents with well-controlled hypertension...        │   │
│  │                                                               │   │
│  │ ## Risk Assessment                                           │   │
│  │ Moderate cardiovascular risk due to...                       │   │
│  │                                                               │   │
│  │ ## Medication Review                                         │   │
│  │ Current regimen appears appropriate...                       │   │
│  │                                                               │   │
│  │ ## Recommendations                                           │   │
│  │ 1. Monitor blood pressure trends...                          │   │
│  │ 2. Consider lifestyle interventions...                       │   │
│  │                                                               │   │
│  ├─────────────────────────────────────────────────────────────┤   │
│  │ Debug: Patient Data Sent to AI ▼                            │   │
│  │                                                               │   │
│  │ Processed Data (Sent to AI):                                │   │
│  │ {                                                             │   │
│  │   "firstName": "John",                                       │   │
│  │   "lastName": "Doe",                                         │   │
│  │   "age": 52,                                                 │   │
│  │   "gender": "MALE",                                          │   │
│  │   ... (all comprehensive data)                               │   │
│  │ }                                                             │   │
│  │                                                               │   │
│  │ Raw API Response:                                            │   │
│  │ { "conditionsCount": 2, "medicationsCount": 3, ... }        │   │
│  │                                                               │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Data Categorization

### Category 1: Demographics (Static)

```
User
├─ firstName: string
├─ lastName: string
├─ middleName: string
├─ email: string
├─ picture: url
├─ dob: date
├─ gender: enum
├─ bloodType: enum
└─ caseNumber: string
```

### Category 2: Current Health Status (Dynamic Counts)

```
Counts
├─ appointments: number (active/recent)
├─ conditions: string[] (active conditions)
└─ medications: string[] (current medications)
```

### Category 3: Health Conditions (Detailed)

```
UserHealthCondition[]
├─ name: string
├─ severity: enum (MILD/MODERATE/SEVERE)
├─ status: enum (UNRESOLVED/RESOLVED)
├─ dateDiagnosed: datetime
├─ dateResolved: datetime
└─ notes: string
```

### Category 4: Medication Details (Detailed)

```
Medication[]
├─ name: string
├─ dosage: string
├─ frequency: string
├─ duration: number (days)
└─ notes: string
```

### Category 5: Medical History (Historical)

```
MedicalHistory[]
├─ condition: string
└─ details: string

FamilyMedicalHistory[]
├─ condition: string
└─ details: string
```

### Category 6: Disabilities (Detailed)

```
UserDisability[]
├─ name: string
├─ severity: enum
├─ notes: string
└─ isManaged: boolean
```

### Category 7: Vaccinations (Historical)

```
UserVaccination[] (20 most recent)
├─ vaccine: string
├─ dose: string
├─ dateGiven: datetime
└─ notes: string
```

### Category 8: Vital Trends (Time Series)

```
VitalSign[] (20 most recent)
├─ bloodPressure: [string] (formatted as "SYS/DIA")
├─ heartRate: [number]
├─ temperature: [number]
├─ weight: [number]
└─ respiratoryRate: [number]
```

### Category 9: Recent Activity (Historical)

```
AppointmentRequester[] (20 most recent)
├─ date: datetime
├─ reason: string (appointment subject)
└─ complaint: string (patient complaint)
```

## Performance Characteristics

**Query Execution:**

- Parallel queries: 10 simultaneous Prisma queries
- Result limits: 20-10 records per entity (trending data)
- Filtering: By userId and optional clinicId
- Response time: ~500ms-1s for typical patient

**Data Volume:**

- Demographics: ~10 fields
- Conditions: Variable (typically 2-5 active)
- Medications: Variable (typically 2-8 active)
- Appointments: Last 20 records
- Vaccinations: Last 20 records
- Vital Signs: Last 20 records
- Total JSON: 5-50KB depending on history depth

**Caching Opportunities:**

- Demographics: Can be cached per session
- Vital Trends: Update frequency ~monthly
- Medications: Update frequency ~weekly
- Appointments: Update frequency ~daily

## Integration Points

### 1. PatientCard Component

- Triggers data fetch on button click
- Passes to AI generation
- Stores debug info
- Displays debug details

### 2. usePatientInsights Hook

- Receives comprehensive data
- Sends to AI provider
- Handles streaming responses
- Returns markdown insights

### 3. usePatientComprehensiveData Hook

- Fetches from `/api/patients/[userId]/data`
- Caches results in state
- Handles loading/error states
- Supports refetching

### 4. API Route

- Authenticates user
- Validates parameters
- Executes parallel queries
- Transforms Prisma results to JSON
- Returns single comprehensive response

## Error Handling

**API Errors:**

- 401: Unauthorized (no auth)
- 400: Invalid userId
- 500: Database query failure

**Component-Level Handling:**

- Network errors: Logged and displayed
- Missing data: Graceful fallbacks
- Invalid responses: Error state management

**Debug Information:**

- All errors stored in debugPatientData
- Displayed in collapsible debug section
- Includes full stack traces

## Future Enhancements

1. **Response Caching**: Cache comprehensive data for 5-10 minutes
2. **Progressive Loading**: Stream vital trends as they're fetched
3. **Lazy Loading**: Load less critical data on demand
4. **Data Enrichment**: Add lab results, imaging studies, allergies
5. **Custom Fields**: Support clinic-specific patient data
6. **Real-time Updates**: WebSocket updates for active patients
7. **Data Export**: Export comprehensive data as PDF/CSV
8. **Analytics**: Track which data fields are most used by AI
