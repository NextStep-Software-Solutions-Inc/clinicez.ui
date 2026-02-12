# ClinicEZ Architecture Guide

## System Overview

ClinicEZ is a multi-tenant healthcare management system built with modern Next.js and cloud-native practices. The architecture supports multiple user roles across clinics, organizations, and individual practitioners.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Layer (Next.js)                     │
│  ┌──────────────┬──────────────┬──────────────┐               │
│  │   Patient    │    Clinic    │    Tenant    │   Org Admin   │
│  │  Dashboard   │  Dashboard   │  Dashboard   │   Dashboard   │
│  └──────────────┴──────────────┴──────────────┴───────────────┘
│           ↓             ↓             ↓             ↓
├─────────────────────────────────────────────────────────────┤
│            Server Actions & API Routes                        │
│  ├─ Authentication (Auth0, Clerk)                             │
│  ├─ Data Fetching (Appointment, Patient, etc.)               │
│  ├─ Business Logic                                            │
│  └─ AI Integration (Gemini, OpenAI, Anthropic)               │
├─────────────────────────────────────────────────────────────┤
│            Database Layer (PostgreSQL + Prisma)              │
│  ├─ Users & Tenants                                           │
│  ├─ Clinics & Organizations                                   │
│  ├─ Patients & Health Records                                │
│  ├─ Appointments & Bookings                                   │
│  ├─ Medical Requests (Lab, Imaging, etc.)                    │
│  └─ Audit Logs & Activity Tracking                           │
└─────────────────────────────────────────────────────────────┘
```

## Route Groups & Dashboards

### `/src/app/v2/` Structure

```
v2/
├── (patient-dashboard)/
│   ├── patient/
│   │   └── dashboard/
│   │       ├── layout.tsx        # Main patient layout
│   │       ├── page.tsx          # Dashboard home
│   │       ├── appointments/     # Appointment management
│   │       ├── records/          # Medical records
│   │       ├── prescriptions/    # Prescription view
│   │       ├── find-doctor/      # Doctor search
│   │       ├── profile/          # Profile management
│   │       └── settings/         # User settings
│   └── components/
│       └── (patient-specific components)
│
├── (clinic-dashboard)/
│   ├── clinic/
│   │   └── [clinicUid]/
│   │       └── dashboard/
│   │           ├── layout.tsx
│   │           └── page.tsx
│   └── components/
│
├── (tenant-dashboard)/
│   ├── tenant/
│   │   └── dashboard/
│   └── components/
│
├── (org-dashboard)/
│   ├── org/
│   │   └── [orgUid]/
│   │       └── dashboard/
│   └── components/
│
├── (main)/
│   ├── page.tsx             # Landing page
│   ├── auth/               # Auth routes
│   └── public/             # Public pages
│
└── layout.tsx              # Root layout
```

## Component Architecture

### Component Organization

```
/src/components/v2/
├── dashboard/
│   ├── DashboardShell.tsx       # Wrapper for all dashboards
│   ├── DashboardSidebar.tsx    # Navigation sidebar
│   ├── DashboardTopbar.tsx     # Top navigation
│   ├── StatCard.tsx            # Metric card
│   ├── WelcomeHeader.tsx       # Welcome section
│   ├── QuickActions.tsx        # Action buttons grid
│   └── index.ts                # Re-exports
│
├── clinic/
│   ├── ClinicDashboard.tsx
│   └── components/
│
├── patient/
│   ├── PatientDashboard.tsx
│   └── components/
│
├── org/
│   └── components/
│
└── (other features)
```

### Component Hierarchy

```
DashboardShell (Layout wrapper)
├── DashboardSidebar (Navigation)
│   └── NavItems with icons
├── DashboardTopbar (Header)
│   └── Actions (search, notifications, user menu)
└── main (Content area)
    ├── WelcomeHeader
    ├── StatCard (Grid)
    ├── QuickActions
    ├── UpcomingAppointments (to be added)
    ├── HealthMetrics (to be added)
    └── ActivityFeed (to be added)
```

## Data Flow

### Server Component Pattern (Recommended)

```tsx
// ✅ Server Component (can call database directly)
export default async function Dashboard() {
  const appointments = await getPatientAppointments(patientId);
  
  return <ClientComponent appointments={appointments} />;
}

// Client Component for interactivity
'use client'
export function ClientComponent({ appointments }: Props) {
  const [selected, setSelected] = useState<Appointment | null>(null);
  return ...
}
```

### Server Actions Pattern

```tsx
// /src/actions/patients/appointments.action.ts
'use server'

import type { Appointment } from '@prisma/client';

export async function getPatientAppointments(
  patientId: number
): Promise<Appointment[]> {
  const appointments = await prisma.appointment.findMany({
    where: { patientId },
    include: { clinic: true, provider: true }
  });
  
  return appointments;
}

// Usage in components
import { getPatientAppointments } from '@/actions/patients/appointments.action';

const appointments = await getPatientAppointments(patientId);
```

## Styling Architecture

### Style Isolation (CSS by Feature)

```
/src/styles/
├── globals.css              # Global resets, base styles
├── v2-dashboard.css         # Shared dashboard layout ONLY
│                            # (grid, flexbox, sidebar structure)
│
└── dashboards/              # Feature-specific CSS
    ├── patient-dashboard.css    # Patient colors, patient cards, patient variants
    ├── clinic-dashboard.css     # Clinic colors, clinic cards, clinic variants
    ├── tenant-dashboard.css     # Tenant colors, tenant cards, tenant variants
    └── org-dashboard.css        # Org colors, org cards, org variants
```

### CSS Variable System

```css
/* Per-dashboard theme variables */
[data-dashboard="patient"] {
  --dash-accent: oklch(55% 0.18 250);              /* Blue */
  --dash-accent-light: oklch(92% 0.04 250);
  --dash-accent-hover: oklch(48% 0.2 250);
  --dash-accent-foreground: oklch(99% 0.002 250);
  --dash-accent-muted: oklch(96% 0.015 250);
  --dash-accent-border: oklch(88% 0.06 250);
}

[data-dashboard="clinic"] {
  --dash-accent: oklch(55% 0.14 175);              /* Teal */
  /* ... */
}
```

## Database Schema Overview

### Key Model Groups

1. **Identity Models**
   - `User` - Individual accounts (patients, providers, staff)
   - `Tenant` - Multi-tenant owner
   - `ClinicMember` - Staff at clinics
   - `ClinicPatient` - Patient enrollment at clinic

2. **Organization Models**
   - `Tenant` - Tenant container
   - `Clinic` - Individual clinics under tenant
   - `Organization` - Larger org structures
   - `OrganizationUser` - Org staff

3. **Clinical Models**
   - `Appointment` - Patient appointments
   - `Booking` - Appointment booking records
   - `ClinicPatient` - Patient records per clinic
   - `PatientAllergy` - Allergy information
   - `PatientMedication` - Current medications

4. **Request/Order Models**
   - `ClinicLaboratoryRequest` - Lab tests
   - `ClinicImagingRequest` - Imaging orders
   - `ClinicHeartStationRequest` - Cardiac tests
   - `ClinicMedicalCertificate` - Medical certificates
   - `ClinicReferralSlip` - Referrals

5. **Settings Models**
   - `TenantSetting` - Tenant configuration
   - `ClinicSetting` - Clinic configuration
   - `UserDefaultTenant` - User preferences

See [prisma/schema.prisma](../../prisma/schema.prisma) for complete schema.

## State Management

### Context API Usage

- `useAuth()` - Authentication state (Auth0 or Clerk)
- `useQuery` / `useMutation` - Data fetching (React Query if used)
- Component state with `useState` - Local UI state

### No Redux/Zustand (Keep Simple)

- Use React Server Components where possible
- Use Server Actions for data mutations
- Use local state for UI interactions only

## Security Architecture

### Authentication

- **Primary:** Auth0 (configured in `.env`)
- **Alternative:** Clerk (also configured)
- Session-based with JWT tokens
- Secure HTTP-only cookies

### Authorization

- Role-based access control (RBAC)
- Permission checks in server actions
- Data filtering by tenant/clinic isolation
- Audit logging for sensitive operations

### Data Isolation

- All queries filtered by tenant/clinic
- Multi-tenant data segregation enforced
- Sensitive fields protected
- Encryption for PII fields

## AI Integration Points

### Supported AI Providers

- Google Gemini (Primary)
- OpenAI (Alternative)
- Anthropic Claude (Alternative)

### Integration Pattern

```tsx
// Server action with AI
'use server'

import { generateText } from 'ai';

export async function generateDiagnosis(symptoms: string) {
  const result = await generateText({
    model: /* selected model */,
    prompt: /* medical prompt */,
    system: /* medical context */
  });
  
  return result.text;
}
```

## Performance Considerations

### Optimization Strategies

1. **Server Components** - Fetch data server-side when possible
2. **Streaming** - Use Next.js streaming for large datasets
3. **Pagination** - Load records in batches
4. **Caching** - Cache appropriate queries with Prisma
5. **Image Optimization** - Use Next.js Image component
6. **Bundle Splitting** - Code split by route group

### Database Optimization

- Add indexes to frequently queried fields
- Use `include`/`select` carefully in Prisma queries
- Avoid N+1 queries
- Batch operations when possible

## Testing Architecture

### Test Types

- **Unit Tests** - Utility functions, hooks
- **Component Tests** - UI components in isolation
- **Integration Tests** - Multi-component flows
- **E2E Tests** - Full user journeys

### Framework

- Jest (unit & component)
- React Testing Library (component testing)
- Playwright (E2E - optional)

## Monitoring & Logging

### Application Monitoring

- Hotjar analytics (configured in `.env`)
- Error tracking (Sentry or similar)
- Performance metrics
- Audit logs in database

### Development Logging

- Console logs in development
- Structured logs in production
- Error stack traces preserved

---

**For specific implementation details, see:**

- [Data Models](./DATA_MODELS.md)
- [Development Conventions](./DEVELOPMENT_CONVENTIONS.md)
- [Tech Stack](./TECH_STACK.md)
