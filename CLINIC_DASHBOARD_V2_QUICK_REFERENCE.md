# Clinic Dashboard v2 - Quick Reference Guide

## Quick Start

### Import Dashboard Components

```tsx
import {
  DashboardShell,
  DashboardSidebar,
  DashboardTopbar,
  StatCard,
  WelcomeHeader,
  QuickActions,
  ActivityLog,
  ProgressBar,
} from "@/components/v2/dashboard";
import type { NavItem, QuickAction, ActivityItem } from "@/components/v2/dashboard";
```

### Basic Layout Example

```tsx
export default function MyDashboard() {
  const navItems: NavItem[] = [
    { name: "Home", href: "/dashboard", icon: "home" },
    { name: "Patients", href: "/patients", icon: "users", badgeCount: 5 },
  ];

  return (
    <DashboardShell
      dashboardType="clinic"
      title="My Dashboard"
      navItems={navItems}
    >
      {/* Your content here */}
    </DashboardShell>
  );
}
```

## Component Reference

### 1. DashboardShell

Main wrapper for all dashboards.

```tsx
<DashboardShell
  dashboardType="clinic" | "patient" | "tenant" | "organization"
  navItems={navItems}
  title="Dashboard Title"
  subtitle="Optional subtitle"
  topbarActions={/* Optional right-side actions */}
>
  {children}
</DashboardShell>
```

### 2. StatCard

Display key metrics with optional trends.

```tsx
<StatCard
  label="Patients Today"
  value={24}
  icon={<Users className="h-5 w-5" />}
  trend={{ direction: "up", value: "+6" }}
/>
```

### 3. WelcomeHeader

Time-aware greeting header.

```tsx
<WelcomeHeader
  name="Doctor Name"
  subtitle="Your message"
  dashboardType="clinic"
  actions={/* Optional action buttons */}
/>
```

### 4. QuickActions

Grid of action buttons.

```tsx
const actions: QuickAction[] = [
  {
    icon: <Eye className="h-5 w-5" />,
    label: "View Patients",
    description: "Browse and search",
    href: "/patients",
  },
];

<QuickActions actions={actions} />
```

### 5. ActivityLog

Timeline of recent activities.

```tsx
const items: ActivityItem[] = [
  {
    id: "1",
    action: "New appointment",
    detail: "John Doe",
    time: "2 hours ago",
    icon: <CalendarPlus className="h-4 w-4" />,
  },
];

<ActivityLog items={items} />
```

### 6. ProgressBar

Progress indicator with label.

```tsx
<ProgressBar
  label="Bed Occupancy"
  value={78}
  max={100}
  color="amber"
  showPercentage={true}
/>
```

## Available Icons

All icons from lucide-react are supported via string mapping:

- `home` - Home
- `users` - Users/People
- `calendar` - Calendar/Appointments
- `file-text` - Documents/Records
- `building` - Organization
- `activity` - Activity
- `bar-chart` - Analytics
- `bell` - Notifications
- `clipboard` - Tasks
- `heart` - Health
- `stethoscope` - Medical

## Color Variants for ProgressBar

- `blue` - Primary (default)
- `green` - Success
- `amber` - Warning
- `red` - Danger

## Responsive Behavior

### Desktop (> 768px)

- Sidebar visible and collapsible
- Full-width content area
- Multi-column layouts

### Tablet (640px - 768px)

- Sidebar hidden by default
- Sheet menu available
- 2-column layouts where applicable

### Mobile (< 640px)

- Sidebar hidden
- Sheet-based navigation
- Single-column layouts
- Optimized spacing

## CSS Custom Properties

Customize dashboard colors using CSS variables:

```css
[data-dashboard="clinic"] {
  --dash-accent: oklch(55% 0.14 175);           /* Main color */
  --dash-accent-light: oklch(93% 0.04 175);      /* Light background */
  --dash-accent-hover: oklch(48% 0.16 175);      /* Hover state */
  --dash-accent-muted: oklch(96% 0.015 175);     /* Muted background */
  --dash-accent-border: oklch(88% 0.06 175);     /* Border color */
}
```

## Animation Classes

Add animations to elements:

```tsx
<div className="v2-animate-in">Fade in</div>
<div className="v2-animate-slide-up">Slide up</div>
<div className="v2-animate-scale-in">Scale in</div>

{/* Stagger children - each child gets sequential delay */}
<div className="v2-stagger-children">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</div>
```

## Common Patterns

### Dashboard Page with Stats

```tsx
export default function DashboardPage() {
  const stats = [
    { label: "Total", value: 100, icon: <Activity /> },
    { label: "Pending", value: 12, icon: <Clock /> },
  ];

  return (
    <div className="space-y-6">
      <WelcomeHeader name="Doctor" />
      <div className="grid gap-4 lg:grid-cols-2">
        {stats.map(stat => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>
    </div>
  );
}
```

### Activity Feed

```tsx
export default function ActivitySection() {
  const items: ActivityItem[] = [
    // ... activity items
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <ActivityLog items={items} />
      </CardContent>
    </Card>
  );
}
```

## URL Structure

Clinic dashboard routes:

```
/v2/clinic/{clinicUid}/dashboard
├── /patients
├── /appointments
├── /consultations
├── /records
├── /analytics
└── /settings
```

## Accessing Clinic UID

In page components:

```tsx
import { useParams } from "next/navigation";

export default function Page() {
  const params = useParams();
  const clinicUid = params.clinicUid as string;
  
  return (
    <div>
      {/* Use clinicUid to fetch data */}
    </div>
  );
}
```

## Type Definitions

```typescript
// Navigation
interface NavItem {
  name: string;
  href: string;
  icon: string;
  badgeCount?: number;
}

// Quick Actions
interface QuickAction {
  icon: React.ReactNode;
  label: string;
  description: string;
  href: string;
}

// Activity
interface ActivityItem {
  id: string;
  action: string;
  detail: string;
  time: string;
  icon: React.ReactNode;
}

// Stat Card
interface StatCardProps {
  label: string;
  value: string | number;
  trend?: { direction: "up" | "down"; value: string };
  icon?: React.ReactNode;
}
```

## Styling Tips

### Custom Stat Card

```tsx
<StatCard
  label="Revenue"
  value="$12,450"
  className="border-blue-200 bg-blue-50"
/>
```

### Custom Quick Action Grid

```tsx
<QuickActions
  actions={actions}
  className="grid-cols-1 md:grid-cols-2"
/>
```

## Accessibility

All components include:

- ✅ ARIA labels
- ✅ Keyboard navigation
- ✅ Screen reader support
- ✅ Focus management
- ✅ Reduced motion support

## Performance Tips

1. **Memoize expensive props**

   ```tsx
   const navItems = useMemo(() => [...], [])
   ```

2. **Lazy load content sections**

   ```tsx
   const ActivitySection = lazy(() => import('./ActivitySection'))
   ```

3. **Use Server Components**

   ```tsx
   // layout.tsx - server component
   export default async function Layout() { ... }
   ```

## Common Issues & Solutions

### Issue: Icons not showing

- Ensure icon string matches the ICON_MAP keys
- Check icon import from lucide-react

### Issue: Sidebar not collapsing

- Make sure you're using `DashboardShell` wrapper
- Check desktop breakpoint (> 768px)

### Issue: Animations not smooth

- Check `prefers-reduced-motion` in system settings
- Verify GPU acceleration in browser dev tools

### Issue: Mobile menu not appearing

- Check screen size (< 768px)
- Verify `MobileMenu` is passed to `DashboardTopbar`

## Next Steps

1. Implement real data fetching
2. Add error boundaries
3. Create sub-routes for each section
4. Add loading states
5. Integrate with auth system
6. Add toast notifications
7. Create tests for components

## Related Documentation

- **Full Architecture**: `docs/agents/ARCHITECTURE.md`
- **Development Conventions**: `docs/agents/DEVELOPMENT_CONVENTIONS.md`
- **Implementation Summary**: `CLINIC_DASHBOARD_V2_SUMMARY.md`
