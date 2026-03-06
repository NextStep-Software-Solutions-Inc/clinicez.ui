# ClinicEZ Development Conventions

## File Naming & Organization

### TypeScript/React Files

```
✅ CORRECT
- components/v2/dashboard/DashboardShell.tsx    (PascalCase)
- hooks/usePatientAppointments.ts               (camelCase with 'use' prefix)
- actions/patients/appointments.action.ts      (camelCase with .action suffix)
- utils/formatDate.ts                          (camelCase utility)
- types/patient.ts                             (camelCase with domain prefix)

❌ WRONG
- components/v2/dashboard/dashboard-shell.tsx  (kebab-case)
- hooks/patientAppointments.ts                 (missing 'use' prefix)
- actions/PatientAppointments.ts               (should be camelCase)
- utils/FormatDate.ts                          (should be camelCase)
```

### CSS Files

```
✅ CORRECT
- styles/v2-dashboard.css                      (Component name with v2 prefix)
- styles/dashboards/patient-dashboard.css      (Feature-specific)

❌ WRONG
- styles/v2_dashboard.css                      (underscore instead of dash)
- styles/patient_dashboard.css                 (should use dash)
- styles/dashboard.css                         (too generic)
```

### Directory Structure

```
✅ CORRECT - Logical grouping
src/
├── app/v2/(patient-dashboard)/patient/dashboard/
│   ├── layout.tsx
│   ├── page.tsx
│   └── components/
│       ├── UpcomingAppointments.tsx
│       └── index.ts
├── components/v2/dashboard/          # Shared dashboard components
├── components/v2/patient/            # Patient feature components
└── actions/patients/                 # Patient server actions

❌ WRONG - Poor organization
src/
├── components/
│   ├── DashboardShell.tsx
│   ├── PatientDashboard.tsx
│   └── UpcomingAppointments.tsx
└── actions.ts                        # Too broad
```

## TypeScript Conventions

### Type Definition Order

```tsx
✅ CORRECT - Read from top to bottom
// 1. Props/Types first
export interface PatientAppointmentsProps {
  patientId: number;
  onSelectAppointment?: (apt: Appointment) => void;
}

// 2. Component second
export const PatientAppointments = ({ 
  patientId, 
  onSelectAppointment 
}: PatientAppointmentsProps) => {
  // Component logic
};

❌ WRONG - Types after component
export const PatientAppointments = (props: any) => {
  // ...
};

export interface PatientAppointmentsProps {
  patientId: number;
}
```

### Import Organization

```tsx
✅ CORRECT - Group by category
import React, { useState } from 'react';
import Link from 'next/link';

import { Card, CardContent } from '@components/ui/card';
import { Button } from '@components/ui/button';

import { PatientAppointments } from '@components/v2/patient/appointments';
import { formatDate } from '@lib/utils';

import type { Appointment } from '@prisma/client';

❌ WRONG - Unorganized imports
import { Button } from '@components/ui/button';
import React from 'react';
import type { Appointment } from '@prisma/client';
import { formatDate } from '@lib/utils';
import Link from 'next/link';
```

### Function Parameter Typing

```tsx
✅ CORRECT - Explicit types
export function formatAppointmentTime(date: Date, format: string): string {
  // Implementation
}

export const handleAppointmentSelect = (apt: Appointment): void => {
  // Handler logic
};

❌ WRONG - Using `any`
export function formatAppointmentTime(date: any, format: any) {
  // ...
}

❌ WRONG - No return type
export const handleAppointmentSelect = (apt: any) => {
  // ...
};
```

### Async/Await Patterns

```tsx
✅ CORRECT - Typed async functions
import type { Appointment } from '@prisma/client';

'use server'

export async function getPatientAppointments(
  patientId: number
): Promise<Appointment[]> {
  const appointments = await prisma.appointment.findMany({
    where: { patientId },
    include: { clinic: true }
  });
  
  return appointments;
}

❌ WRONG - No return type
export async function getPatientAppointments(patientId: number) {
  // ...
}

❌ WRONG - Using `any`
export async function getPatientAppointments(
  patientId: any
): Promise<any> {
  // ...
}
```

## Server Actions Conventions

### File Structure

```
src/actions/
├── patients/
│   ├── appointments.action.ts        # Single responsibility
│   ├── health-records.action.ts
│   └── index.ts                      # Re-exports
├── clinics/
│   └── clinic-patient.action.ts
└── appointments/
    └── index.ts
```

### Server Action Template

```tsx
'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import type { Appointment } from '@prisma/client';

/**
 * Fetch patient appointments with full details
 * @param patientId - The patient database ID
 * @param limit - Maximum records to return (default: 10)
 */
export async function getPatientAppointments(
  patientId: number,
  limit: number = 10
): Promise<Appointment[]> {
  try {
    const appointments = await prisma.appointment.findMany({
      where: { patientId },
      include: {
        clinic: true,
        provider: true,
      },
      orderBy: { appointmentDateTime: 'desc' },
      take: limit,
    });

    return appointments;
  } catch (error) {
    console.error('Failed to fetch appointments:', error);
    throw new Error('Failed to fetch appointments');
  }
}

/**
 * Cancel a patient appointment
 */
export async function cancelAppointment(appointmentId: number): Promise<void> {
  try {
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: 'CANCELLED' }
    });

    revalidatePath('/patient/dashboard/appointments');
  } catch (error) {
    console.error('Failed to cancel appointment:', error);
    throw new Error('Failed to cancel appointment');
  }
}
```

## Component Conventions

### Functional Component Template

```tsx
'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader } from '@components/ui/card';
import { Button } from '@components/ui/button';

import type { Appointment } from '@prisma/client';

export interface AppointmentListProps {
  appointments: Appointment[];
  onSelectAppointment: (appointment: Appointment) => void;
  isLoading?: boolean;
}

export const AppointmentList = ({
  appointments,
  onSelectAppointment,
  isLoading = false,
}: AppointmentListProps) => {
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const handleSelect = useCallback(
    (appointment: Appointment) => {
      setSelectedId(appointment.id);
      onSelectAppointment(appointment);
    },
    [onSelectAppointment]
  );

  if (isLoading) {
    return <div>Loading appointments...</div>;
  }

  return (
    <div className="space-y-2">
      {appointments.map((appointment) => (
        <Card
          key={appointment.id}
          className={`cursor-pointer transition-colors ${
            selectedId === appointment.id ? 'border-primary' : ''
          }`}
          onClick={() => handleSelect(appointment)}
        >
          <CardContent className="pt-6">
            <p className="font-medium">{appointment.title}</p>
            <p className="text-sm text-muted-foreground">
              {appointment.appointmentDateTime.toLocaleDateString()}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

AppointmentList.displayName = 'AppointmentList';
```

## CSS Conventions

### CSS File Organization

```css
/* Patient Dashboard Styles (isolated) */
/* ===================================== */

/* 1. Patient Theme Variables */
[data-dashboard="patient"] {
  --patient-primary: oklch(55% 0.18 250);
  --patient-light: oklch(92% 0.04 250);
  --patient-hover: oklch(48% 0.2 250);
}

/* 2. Patient Card Styles */
.patient-card {
  border: 1px solid var(--patient-light);
  border-radius: 8px;
  padding: 1rem;
  transition: border-color 200ms ease;
}

.patient-card:hover {
  border-color: var(--patient-primary);
}

/* 3. Patient-specific Components */
.patient-appointment-item {
  /* styles */
}

.patient-health-metric {
  /* styles */
}

/* 4. Responsive Overrides */
@media (max-width: 768px) {
  .patient-card {
    padding: 0.75rem;
  }
}
```

### Class Naming (BEM-inspired)

```css
✅ CORRECT
.patient-dashboard { }
.patient-dashboard__header { }
.patient-dashboard__header--active { }
.patient-appointment-card { }
.patient-appointment-card__title { }

❌ WRONG
.patient { }                          /* Too general */
.dashboard-header { }                 /* Not patient-specific */
.patientDashboard { }                 /* Should use kebab-case */
.patient_dashboard { }                /* Should use dash */
```

## Comment Conventions

### Code Comments

```tsx
✅ CORRECT - Meaningful comments
// Filter appointments that are in the future
const upcomingAppointments = appointments.filter(
  (apt) => apt.appointmentDateTime > new Date()
);

// Only include appointments from patient's primary clinic
const clinicAppointments = appointments.filter(
  (apt) => apt.clinicId === user.primaryClinicId
);

❌ WRONG - Redundant comments
// Set isLoading to false
setIsLoading(false);

// Map over appointments
appointments.map((apt) => apt.id);
```

### JSDoc for Public APIs

```tsx
✅ CORRECT
/**
 * Formats an appointment date for display
 * @param date - The appointment date/time
 * @param format - Date format string (default: 'short')
 * @returns Formatted date string
 * @example
 * formatAppointmentDate(new Date(), 'long')
 * // => "Monday, January 15, 2024"
 */
export function formatAppointmentDate(
  date: Date,
  format: 'short' | 'long' = 'short'
): string {
  // Implementation
}

❌ WRONG
export function formatAppointmentDate(date: Date, format: string) {
  // This formats date
  return ...
}
```

## Git Conventions

### Commit Messages

```
✅ CORRECT - Clear, semantic commits
feat: add upcoming appointments section to patient dashboard
fix: correct health metrics calculation in statistics card
refactor: isolate patient dashboard CSS styles
docs: update architecture documentation

❌ WRONG
updated code
fix stuff
working on dashboard
wip
```

### Branch Naming

```
✅ CORRECT
feature/patient-dashboard-appointments
feature/patient-health-metrics-section
fix/patient-dashboard-styling
docs/patient-dashboard-guide

❌ WRONG
patient_dashboard
update-patient
work-in-progress
feature123
```

## Error Handling

### Server Actions Error Pattern

```tsx
'use server'

export async function riskyOperation(id: number): Promise<ResultType | null> {
  try {
    const result = await performDangerousOperation(id);
    return result;
  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError) {
      console.error('Database error:', error.message);
      throw new Error('Database operation failed');
    }
    
    console.error('Unexpected error:', error);
    throw new Error('An unexpected error occurred');
  }
}
```

### Component Error Handling

```tsx
'use client'

export const AppointmentList = ({ appointments }: Props) => {
  if (!appointments || appointments.length === 0) {
    return <div>No appointments found</div>;
  }

  // Rest of component
};
```

## Performance Best Practices

### React Optimization

```tsx
✅ CORRECT - Memoized callbacks
const handleClick = useCallback(() => {
  onAppointmentSelect(appointment);
}, [appointment, onAppointmentSelect]);

✅ CORRECT - Memoized components
export const AppointmentCard = memo(({ appointment }: Props) => {
  return ...
});

❌ WRONG - Inline functions in render
onClick={() => onSelect(appointment)}  // Creates new function on each render
```

### Data Fetching

```tsx
✅ CORRECT - Server component for data available at page load
export default async function Dashboard() {
  const appointments = await getPatientAppointments(patientId);
  return <AppointmentList appointments={appointments} />;
}

❌ WRONG - Client-side fetch with useEffect
'use client'
const [data, setData] = useState(null);
useEffect(() => {
  fetch('/api/appointments').then(r => r.json()).then(setData);
}, []);
```

### ⭐ Lazy / Tab-Triggered Data: Server Action + SWR + Custom Hook + Suspense

When data is only needed **after the user interacts** (switches tabs, opens a panel, etc.), use this layered pattern instead of loading everything on page render.

**5-layer architecture:**

| Layer | Responsibility | Location |
|---|---|---|
| Server Action | Single-purpose fetcher, one per data domain | `src/actions/<feature>/get-*-tab-data.ts` |
| Type Definition | `<Name>TabData` interface + `TabDataMap` | `src/types/<feature>-tabs.ts` |
| Custom SWR Hook | Cache key builder, fetcher map, invalidation helper | `src/hooks/use-<feature>-tab.ts` |
| Suspense Boundary | `createTabLoader` factory + `<Suspense>` per tab | `_components/TabContent.tsx` |
| Tab Component | Pure display, receives `data` prop | `_components/tabs/<Name>Tab.tsx` |

**Key rules:**

- Each server action does **one thing** — no switch routing, no generic tab param
- Auth is handled **inside** the server action (`currentUser()`) — never passed as a parameter
- SWR key is a **tuple** `['feature-tab', tabId]` — use the exported `buildXxxSWRKey` helper everywhere
- `revalidateOnFocus: false` — tab data is stable; call `invalidateXxxTabData(tab)` after any mutation
- Tab components are **pure display** — no fetching, no auth, no Prisma

📖 **Full pattern documentation with copy-paste templates:**
**[docs/agents/DATA_FETCHING_PATTERNS.md](./DATA_FETCHING_PATTERNS.md)**

📌 **Real implementation reference:**

- `src/actions/patient-profile/get-patient-tab-data.ts` — 13 individual server actions
- `src/hooks/use-patient-tab.ts` — SWR hook with typed fetcher map
- `src/app/v2/(patient-dashboard)/profile/_components/TabContent.tsx` — Suspense + factory pattern

---

**Related Documentation:**

- [Clinicez Fullstack Dev](./CLINICEZ_FULLSTACK_DEV.md)
- [Architecture Guide](./ARCHITECTURE.md)
- [Data Fetching Patterns](./DATA_FETCHING_PATTERNS.md)
- [Data Models](./DATA_MODELS.md)
