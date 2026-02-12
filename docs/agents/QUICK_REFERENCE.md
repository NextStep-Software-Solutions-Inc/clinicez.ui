# ClinicEZ Dev Agent - Quick Reference

## 🎯 Core Values

1. **Type Safety First** - No `any` types, ever
2. **Code Quality** - Lint-free, type-inference preferred
3. **Modular Architecture** - Isolated components under v2 umbrella
4. **Efficient Workflow** - Type check fast, build only when needed
5. **Always Suggest Next** - Never say "done" without improvements list

## 🚀 Quick Start Commands

```bash
# Type check (FAST - do this first)
npx tsc --noEmit

# Lint check
npm run lint

# Development
pnpm dev --turbo

# Full build (ONLY after types pass)
pnpm build

# Database work
pnpm migrate          # New migration
npx prisma studio    # Visual explorer
npx prisma generate  # Regenerate types
```

## 📁 Project Structure at a Glance

```
src/app/v2/                       # All V2 features live here
├── (patient-dashboard)/          # Patient route group
│   └── patient/dashboard/
├── (clinic-dashboard)/           # Clinic route group
├── (tenant-dashboard)/           # Tenant route group
└── (org-dashboard)/              # Org route group

src/components/v2/                # V2 shared components
├── dashboard/                    # Shared dashboard components
├── patient/                      # Patient feature components
├── clinic/                       # Clinic feature components
└── org/                          # Org feature components

src/styles/
├── v2-dashboard.css             # Shared layout ONLY
└── dashboards/
    ├── patient-dashboard.css    # Patient styles (isolated)
    ├── clinic-dashboard.css     # Clinic styles (isolated)
    └── ...

src/actions/                      # Server actions
├── patients/
├── clinics/
└── appointments/
```

## ✅ Quality Checklist

Before submitting code:

- [ ] No `any` types (`npx tsc --noEmit`)
- [ ] No type assertions (`as`) unless absolutely necessary
- [ ] Lint-free (`npm run lint`)
- [ ] Features under v2 folder
- [ ] CSS is isolated (not affecting other dashboards)
- [ ] Types defined before components
- [ ] Imports organized (React → Next → UI → Custom → Types)
- [ ] Comments are meaningful (not redundant)
- [ ] Suggested improvements documented

## 🔍 Common Patterns

### Type-Safe Server Action

```tsx
'use server'
import type { Appointment } from '@prisma/client';

export async function getAppointments(
  patientId: number
): Promise<Appointment[]> {
  // Implementation
}
```

### Type-Safe Component

```tsx
export interface MyComponentProps {
  title: string;
  count: number;
  onAction?: (id: number) => void;
}

export const MyComponent = ({
  title,
  count,
  onAction,
}: MyComponentProps) => {
  // Implementation
};
```

### Isolated CSS for Patient Dashboard

```tsx
// In layout.tsx
import '@styles/dashboards/patient-dashboard.css';

// CSS file only used here
[data-dashboard="patient"] {
  --dash-accent: oklch(55% 0.18 250);
  /* patient-specific styles */
}
```

## 🛠️ Development Workflow

### Before Starting

1. ✅ Read existing code structure
2. ✅ Check for similar implementations
3. ✅ Review related types and interfaces
4. ✅ Plan changes on paper first

### While Coding

1. ✅ Define types/interfaces first
2. ✅ Use type inference (let TS figure it out)
3. ✅ Keep changes focused and incremental
4. ✅ Type check frequently: `npx tsc --noEmit`

### When Done

1. ✅ Lint check: `npm run lint`
2. ✅ Suggest improvements for feature
3. ✅ Identify enhancement opportunities
4. ✅ Point out integration possibilities
5. ✅ Provide roadmap for next steps

## 🚫 Common Mistakes to Avoid

### Type Safety

```tsx
// ❌ DON'T - using any
const handleChange = (value: any) => { }

// ✅ DO - explicit types
const handleChange = (value: string) => { }

// ❌ DON'T - type assertions
const data = fetchData() as Appointment[]

// ✅ DO - let TS infer or use functions
const data: Appointment[] = await fetchData()
```

### Component Organization

```
❌ src/components/dashboard/PatientDashboard.tsx
❌ src/app/patient-dashboard/page.tsx

✅ src/app/v2/(patient-dashboard)/patient/dashboard/
✅ src/components/v2/dashboard/DashboardShell.tsx
```

### CSS Files

```
❌ src/styles/patient-dashboard.css (used globally)
❌ src/styles/v2_dashboard.css

✅ src/styles/dashboards/patient-dashboard.css (isolated)
✅ src/styles/v2-dashboard.css (shared layout only)
```

### Workflow Mistakes

```
❌ Run pnpm dev after every change
❌ Use npm run build to test code
❌ Suggest without implementing

✅ Type check with npx tsc --noEmit
✅ Make code changes, suggest next steps
✅ Only build/run when explicitly asked
```

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| [CLINICEZ_FULLSTACK_DEV.md](./CLINICEZ_FULLSTACK_DEV.md) | Agent definition & core principles |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System design & structural overview |
| [DEVELOPMENT_CONVENTIONS.md](./DEVELOPMENT_CONVENTIONS.md) | Coding standards & patterns |
| [TECH_STACK.md](./TECH_STACK.md) | Technologies & configuration |
| [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) | This file - quick lookup |

## 🔗 Key Resources

- **Prisma Schema:** [prisma/schema.prisma](../../prisma/schema.prisma)
- **TypeScript Config:** [tsconfig.json](../../tsconfig.json)
- **Next.js Config:** [next.config.mjs](../../next.config.mjs)
- **Tailwind Config:** [tailwind.config.js](../../tailwind.config.js)
- **Copilot Instructions:** [.github/copilot-instructions.md](../../.github/copilot-instructions.md)

## 💬 Examples Worth Copying

### Patient Dashboard Page

[src/app/v2/(patient-dashboard)/patient/dashboard/page.tsx](../../src/app/v2/%28patient-dashboard%29/patient/dashboard/page.tsx)

### Dashboard Components

[src/components/v2/dashboard/](../../src/components/v2/dashboard/)

### Styling Pattern

[src/styles/v2-dashboard.css](../../src/styles/v2-dashboard.css)

## 🎓 Learning Path for New Features

When building a new patient dashboard feature:

1. **Read:** Patient dashboard page structure
2. **Understand:** Existing components (WelcomeHeader, StatCard, etc.)
3. **Review:** Styling in v2-dashboard.css and patient-dashboard.css
4. **Create:** New component under `src/components/v2/patient/`
5. **Integrate:** Into patient dashboard page
6. **Style:** Add to patient-dashboard.css (isolated)
7. **Test:** Type check, lint, functionality
8. **Suggest:** Improvements & next features

## 📋 Template: Feature Implementation Checklist

When implementing a new feature:

- [ ] Component created under v2 folder
- [ ] Types defined with explicit interfaces
- [ ] No `any` types used
- [ ] Type inference preferred over assertions
- [ ] CSS isolated (patient-dashboard.css for patient features)
- [ ] Lint-free: `npm run lint`
- [ ] Type-safe: `npx tsc --noEmit`
- [ ] Comments meaningful and concise
- [ ] JSDoc for public APIs
- [ ] Server actions have error handling
- [ ] Improvements suggested for next phase

## 🚨 Red Flags

If you see these, fix them:

- `any` type →  Define explicit interface
- `as Type` → Use type inference
- Linting errors → Run `npm run lint`
- Global CSS changes → Isolate to feature CSS
- Features outside v2 folder → Move to v2
- "Code complete" without suggestions → Always suggest next steps

---

**Last Updated:** February 13, 2026  
**Agent Version:** 1.0  
**Start with:** [CLINICEZ_FULLSTACK_DEV.md](./CLINICEZ_FULLSTACK_DEV.md)
