# ClinicEZ Data Fetching Patterns

## ⭐ Standard Pattern: Server Action + SWR + Custom Hook + Suspense

This is the **canonical pattern** for all lazy, tab-triggered, or on-demand data loading in ClinicEZ.
Use this pattern whenever data should only be fetched when the user navigates to a section — NOT upfront on page load.

---

### Pattern Overview

```
SSR Page (page.tsx)
  └── Fetches only the minimum "base" data (slim SSR query)
        └── Passes base data to a Client Component

Client Component (profile-client.tsx)
  └── Renders tab navigation
        └── On tab change: <TabContent tab={activeTab} />

TabContent.tsx  ← Suspense boundary
  └── <Suspense fallback={<TabSkeleton />}>
        └── <TabLoader> (created by createTabLoader factory)
              └── usePatientTab(tabId, { suspense: true })  ← SWR hook
                    └── Calls server action: getPatientVitalsData()
```

---

### Layer 1 — Server Actions (Single Responsibility, one per domain)

**Location:** `src/actions/<feature>/get-<feature>-tab-data.ts`

Rules:

- `'use server'` at the top of the file
- Each function does **one thing only** — fetches exactly one tab's data
- Each function is **independently callable** (no switch routing)
- Auth is handled internally via `currentUser()` — no auth params passed in
- Private helpers (`resolvePatientId`, `serializeDateFields`) are shared across functions in the same file
- Return type is the concrete tab interface (never `any`, never a union)

```ts
// src/actions/patient-profile/get-patient-tab-data.ts
'use server'

import { currentUser } from '@clerk/nextjs/server'
import prisma from '@/lib/prisma'
import type { VitalsTabData } from '@/types/patient-profile-tabs'

/** Private — shared auth + user lookup across all functions in this file. */
async function resolvePatientId(): Promise<number | null> {
  const user = await currentUser()
  if (!user?.id) return null
  const record = await prisma.user.findUnique({
    where: { userId: user.id },
    select: { id: true },
  })
  return record?.id ?? null
}

/** Fetches vital signs data for the Vitals tab. */
export async function getPatientVitalsData(): Promise<VitalsTabData | null> {
  const patientId = await resolvePatientId()
  if (!patientId) return null

  const signs = await prisma.vitalSign.findMany({
    where: { userId: patientId },
    orderBy: { dateTaken: 'desc' },
    select: { /* ... */ },
  })

  return { vitalSigns: signs.map(serializeDateFields), gender: /* ... */ }
}
```

---

### Layer 2 — Type Definitions (one interface per tab)

**Location:** `src/types/patient-profile-tabs.ts`

Rules:

- One interface per tab — named `<TabName>TabData`
- `PatientTabDataMap` maps every `ProfileTabId` to its data interface
- All date fields serialized to `string` (not `Date`) — data crosses the server/client boundary

```ts
// src/types/patient-profile-tabs.ts
export interface VitalsTabData {
  vitalSigns: SerializedVitalSign[]
  gender: string | null
}

export type PatientTabDataMap = {
  overview:    OverviewTabData
  medical:     MedicalTabData
  vitals:      VitalsTabData
  // ... one entry per tab
}
```

---

### Layer 3 — Custom SWR Hook

**Location:** `src/hooks/use-<feature>-tab.ts`

Rules:

- `TAB_DATA_FETCHERS` map typed as `{ [K in keyof PatientTabDataMap]: () => Promise<PatientTabDataMap[K] | null> }` — enforces exhaustive mapping at compile time
- SWR key is a tuple `['feature-tab', tabId]` — use a dedicated key-builder function so invalidation can be called from anywhere
- `revalidateOnFocus: false` and `revalidateOnReconnect: false` — tab data is stable for the session; use explicit invalidation after mutations
- Export `buildPatientTabSWRKey` and `invalidatePatientTabData` so any component can trigger a refetch after a save

```ts
// src/hooks/use-patient-tab.ts
import useSWR, { mutate } from 'swr'
import { getPatientVitalsData, /* ...all 13... */ } from '@/actions/patient-profile/get-patient-tab-data'
import type { PatientTabDataMap } from '@/types/patient-profile-tabs'

const TAB_DATA_FETCHERS: { [K in keyof PatientTabDataMap]: () => Promise<PatientTabDataMap[K] | null> } = {
  vitals: getPatientVitalsData,
  // ... one entry per tab
}

export const buildPatientTabSWRKey = (tab: keyof PatientTabDataMap) =>
  ['patient-tab', tab] as const

export function invalidatePatientTabData(tab: keyof PatientTabDataMap) {
  return mutate(buildPatientTabSWRKey(tab))
}

export function usePatientTab<T extends keyof PatientTabDataMap>(
  tab: T,
  options?: { suspense?: boolean },
) {
  return useSWR(
    buildPatientTabSWRKey(tab),
    ([, t]) => (TAB_DATA_FETCHERS[t] as () => Promise<PatientTabDataMap[T] | null>)(),
    { revalidateOnFocus: false, revalidateOnReconnect: false, suspense: options?.suspense ?? false },
  )
}
```

---

### Layer 4 — Suspense Boundary + Tab Loader Factory

**Location:** `src/app/v2/<feature>/_components/TabContent.tsx`

Rules:

- `'use client'` — this file renders inside the browser
- `createTabLoader` factory eliminates N near-identical loader declarations with a single generic
- Each loader is wrapped in `<Suspense fallback={<TabSkeleton />}>` — each tab has its own independent loading state
- Cast `data as PatientTabDataMap[T]` inside the loader — SWR returns a union but `TabComponent` expects the specific type

```tsx
// src/app/v2/(patient-dashboard)/profile/_components/TabContent.tsx
'use client'

import { Suspense } from 'react'
import { usePatientTab } from '@/hooks/use-patient-tab'
import type { PatientTabDataMap } from '@/types/patient-profile-tabs'

/** Generic factory — creates one Suspense-enabled loader per tab. */
function createTabLoader<T extends keyof PatientTabDataMap>(
  tabId: T,
  TabComponent: React.ComponentType<{ data: PatientTabDataMap[T] }>,
): React.ComponentType {
  function TabLoader() {
    const { data } = usePatientTab(tabId, { suspense: true })
    if (!data) return null
    return <TabComponent data={data as PatientTabDataMap[T]} />
  }
  TabLoader.displayName = `${String(tabId)}TabLoader`
  return TabLoader
}

const TAB_LOADERS: Record<keyof PatientTabDataMap, React.ComponentType> = {
  vitals: createTabLoader('vitals', VitalsTab),
  // ... one per tab
}

export function TabContent({ tab }: { tab: keyof PatientTabDataMap }) {
  const Loader = TAB_LOADERS[tab]
  return (
    <Suspense fallback={<TabSkeleton />}>
      <Loader />
    </Suspense>
  )
}
```

---

### Layer 5 — Tab Component (pure display)

**Location:** `src/app/v2/<feature>/_components/tabs/<Name>Tab.tsx`

Rules:

- `'use client'` — renders in browser
- Props type is `{ data: <TabName>TabData }` — always the concrete interface, nothing else
- No data fetching, no hooks other than UI state (`useState`, `useMemo`)
- Import type from `@/types/<feature>-tabs` — never from `@/types/data-*` (legacy)

```tsx
// src/app/v2/(patient-dashboard)/profile/_components/tabs/VitalsTab.tsx
'use client'

import type { VitalsTabData } from '@/types/patient-profile-tabs'

type Props = { data: VitalsTabData }

export function VitalsTab({ data }: Props) {
  return <div>{/* render data.vitalSigns */}</div>
}
```

---

### After-Mutation Invalidation

After saving new data (e.g. a new vital sign reading), invalidate that tab's cache so the next render re-fetches:

```ts
import { invalidatePatientTabData } from '@/hooks/use-patient-tab'

// Inside a save handler or server action callback:
await invalidatePatientTabData('vitals')
```

---

### When to Use This Pattern

| Situation | Use this pattern? |
|---|---|
| Data only needed when user clicks a tab | ✅ Yes |
| Large or complex subsets of patient data | ✅ Yes |
| Data that changes after a form save | ✅ Yes (+ invalidation) |
| Slim data needed immediately on page load | ❌ No — use SSR in `page.tsx` |
| Global UI state (theme, auth) | ❌ No — use React Context |
| One-off API calls not tied to tabs | ❌ No — use a dedicated action + `useSWR` directly |

---

### Real-World Reference Implementation

| File | Role |
|---|---|
| [src/actions/patient-profile/get-patient-tab-data.ts](../../src/actions/patient-profile/get-patient-tab-data.ts) | 13 individual server action functions |
| [src/types/patient-profile-tabs.ts](../../src/types/patient-profile-tabs.ts) | Tab data interfaces + `PatientTabDataMap` |
| [src/hooks/use-patient-tab.ts](../../src/hooks/use-patient-tab.ts) | SWR hook + key builder + invalidation helper |
| [src/app/v2/(patient-dashboard)/profile/_components/TabContent.tsx](../../src/app/v2/(patient-dashboard)/profile/_components/TabContent.tsx) | Suspense boundary + `createTabLoader` factory |
| [src/app/v2/(patient-dashboard)/profile/_components/tabs/VitalsTab.tsx](../../src/app/v2/(patient-dashboard)/profile/_components/tabs/VitalsTab.tsx) | Example pure display tab component |
