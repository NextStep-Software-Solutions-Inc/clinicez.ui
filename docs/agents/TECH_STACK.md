# ClinicEZ Tech Stack & Configuration

## Frontend Framework

### Next.js

- **Version:** 15.1+ (App Router)
- **Runtime:** Node.js v22+
- **Package Manager:** pnpm v10.12.4+
- **Build Tool:** Turbopack (with fallback to Webpack)

```bash
# Development
pnpm dev --turbo      # Turbo development
pnpm dev:webpack      # Webpack development

# Production
pnpm build            # Full build with type generation
npm run start         # Production server

# Type Checking
npx tsc --noEmit      # Quick type check
```

### Next.js Features Used

- Server Components (default)
- Server Actions ('use server')
- API Routes (/route.ts)
- Route Groups ((folder-name))
- Dynamic Routes ([param])
- Streaming & Suspense
- Middleware (authentication)

## TypeScript

### Configuration

```jsonc
{
  "compilerOptions": {
    "strict": true,                    // ✅ ENABLED - Strict mode required
    "noImplicitAny": true,             // ✅ ENABLED - No `any` allowed
    "target": "ES2015",
    "module": "esnext",
    "lib": ["DOM", "DOM.iterable", "ESNext"],
    
    "paths": {
      "@/*": ["./src/*"],
      "@components/*": ["./src/components/*"],
      "@hooks/*": ["./src/hooks/*"],
      "@lib/*": ["./src/lib/*"],
      "@styles/*": ["./src/styles/*"],
      "@actions/*": ["./src/actions/*"],
      "@contexts/*": ["./src/contexts/*"],
      "@services/*": ["./src/services/*"]
    },
    
    "incremental": true,               // Faster rebuilds
    "skipLibCheck": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "isolatedModules": true
  }
}
```

### Code Generation

```bash
# After schema changes
npx prisma generate

# This regenerates:
# - Prisma Client types
# - Database enums
# - Database models
# - Query types
```

## Database & ORM

### PostgreSQL

- **Provider:** Neon (serverless PostgreSQL)
- **Connection Pooling:** Enabled for serverless
- **SSL Mode:** Required (ssl=require, channel_binding=require)

### Prisma ORM

```bash
# Migrations
npx prisma migrate dev --name description     # Create new migration
npx prisma migrate deploy                     # Deploy to production
npx prisma migrate status                     # Check status
npx prisma migrate reset                      # Reset database (DEV ONLY)

# Database
npx prisma studio                             # Visual database explorer
npx prisma db push                            # Sync schema without migration

# Types
npx prisma generate                           # Regenerate types
```

### Prisma Benefits for ClinicEZ

- Type-safe database queries
- Auto-generated TypeScript types
- Migration tracking & version control
- Relational query optimization
- Raw SQL for complex queries

## UI & Styling

### Shadcn/UI Components

Based on Radix UI + Tailwind CSS

**Installed Components:**

- Button, Card, Input, Select
- Dialog, Sheet, Dropdown Menu
- Tabs, Accordion, Tooltip
- Form (React Hook Form integration)
- Table, Badge, Separator
- And many more...

### Tailwind CSS

```js
// tailwind.config.js
{
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './node_modules/@shadcn/ui/**/*.js'
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: 'hsl(var(--primary))',
        secondary: 'hsl(var(--secondary))',
        muted: 'hsl(var(--muted))',
        // ...
      }
    }
  }
}
```

### CSS Architecture

```
/src/styles/
├── globals.css                    # Global resets, base styles
├── variables.css                  # Root CSS variables
├── v2-dashboard.css              # Shared dashboard layout ONLY
└── dashboards/
    ├── patient-dashboard.css      # Patient-specific styles
    ├── clinic-dashboard.css       # Clinic-specific styles
    ├── tenant-dashboard.css       # Tenant-specific styles
    └── org-dashboard.css          # Org-specific styles
```

### CSS Variables (Theme)

```css
:root {
  /* Colors */
  --background: 0 0% 100%;           /* HSL format */
  --foreground: 0 0% 3.6%;
  --primary: 0 84% 60%;
  --secondary: 0 0% 96%;
  --muted: 0 0% 89%;
  --border: 0 0% 89%;
  
  /* Spacing */
  --radius: 0.5rem;
}

[data-dashboard="patient"] {
  --dash-accent: oklch(55% 0.18 250);            /* Blue for patient */
  --dash-accent-light: oklch(92% 0.04 250);
  --dash-accent-hover: oklch(48% 0.2 250);
}

[data-dashboard="clinic"] {
  --dash-accent: oklch(55% 0.14 175);            /* Teal for clinic */
}
```

## Authentication & Authorization

### Auth0

```env
AUTH0_DOMAIN="https://dev-clinicez.us.auth0.com"
AUTH0_CLIENT_ID="i1SdvhyQS1SspgLhjCaDymoFxIh6kLGx"
AUTH0_CLIENT_SECRET="RJuo4Ve_afM..."
AUTH0_AUDIENCE="https://api.clinicez.com"
AUTH0_SECRET="f696d0596f51d7ded..."
AUTH0_SCOPE="openid profile email offline_access"
```

**Usage:**

```tsx
import { useSession } from '@auth0/nextjs-auth0/client';

export const useUserSession = () => {
  const { data: session, isLoading } = useSession();
  return { user: session?.user, isLoading };
};
```

### Clerk (Alternative)

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
CLERK_WEBHOOK_SECRET="whsec_..."
```

**Usage:**

```tsx
import { useUser } from '@clerk/nextjs';

export const useClerkUser = () => {
  const { user, isLoaded } = useUser();
  return { user, isLoaded };
};
```

### Role-Based Access Control

```tsx
// Middleware example
export async function middleware(request: NextRequest) {
  const session = await getSession(request);
  
  // Check role permissions
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (session?.user.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }
  
  return NextResponse.next();
}
```

## AI Integration

### Supported Providers

```bash
@ai-sdk/google       # Google Gemini (Primary)
@ai-sdk/openai       # OpenAI (Alternative)
@ai-sdk/anthropic    # Anthropic Claude (Alternative)
```

### Usage Pattern

```tsx
'use server'

import { generateText } from 'ai';
import { google } from '@ai-sdk/google';

export async function generateMedicalInsight(symptoms: string) {
  const result = await generateText({
    model: google('gemini-2.0-flash'),
    system: 'You are a medical AI assistant...',
    prompt: `Analyze symptoms: ${symptoms}`,
    temperature: 0.7,
  });

  return result.text;
}
```

## UI Icons

### Lucide React

Lightweight icon library with consistent design

```tsx
import { 
  Calendar, 
  AlertCircle, 
  Heart, 
  Pill, 
  Clock,
  Clock,
  Settings
} from 'lucide-react';

export const AppointmentIcon = () => (
  <Calendar className="h-5 w-5" />
);
```

## Form Handling

### React Hook Form + Zod

Type-safe form validation

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const appointmentSchema = z.object({
  date: z.date().min(new Date()), // Must be future date
  clinicId: z.number().min(1),
  notes: z.string().optional(),
});

type AppointmentFormData = z.infer<typeof appointmentSchema>;

export const AppointmentForm = () => {
  const form = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* Form fields */}
    </form>
  );
};
```

## Testing Framework

### Jest

```bash
npm run test              # Run all tests
npm run test:watch       # Watch mode
```

### Configuration

```ts
// jest.config.ts
{
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/?(*.)+(spec|test).ts'],
  moduleNameMapper: {
    '@/(.*)': '<rootDir>/src/$1',
  }
}
```

### Example Test

```tsx
import { render, screen } from '@testing-library/react';
import { AppointmentList } from '@/components/v2/patient/AppointmentList';

describe('AppointmentList', () => {
  it('renders appointment items', () => {
    const appointments = [
      { id: 1, title: 'Checkup', appointmentDateTime: new Date() }
    ];

    render(<AppointmentList appointments={appointments} />);
    
    expect(screen.getByText('Checkup')).toBeInTheDocument();
  });
});
```

## Cloud & Storage

### Azure Storage

```env
AZURE_STORAGE_CONNECTION_STRING="DefaultEndpointsProtocol=https;..."
AZURE_STORAGE_CONTAINER_NAME="dev"
```

**Usage:**

```tsx
import { BlobServiceClient } from '@azure/storage-blob';

export async function uploadDocument(file: File, patientId: number) {
  const blobClient = blobServiceClient
    .getContainerClient('dev')
    .getBlockBlobClient(`patients/${patientId}/${file.name}`);

  await blobClient.upload(file.stream(), file.size);
}
```

### Vercel

- Primary hosting platform
- Environment variables managed via Vercel dashboard
- Edge Config for feature flags
- Serverless functions & database

```env
EDGE_CONFIG="https://edge-config.vercel.com/..."
VERCEL_OIDC_TOKEN="eyJhbGc..."
```

## Analytics & Monitoring

### Hotjar

User behavior tracking and heatmaps

```env
NEXT_PUBLIC_HOTJAR_SITE_ID="5036459"
NEXT_PUBLIC_HOTJAR_VERSION="6"
```

### App Configuration

```env
NEXT_PUBLIC_APP_NAME="DEV - Clinic EZ"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_EMAIL="clinicez.official@gmail.com"
NEXT_PUBLIC_BUILD_ENV="development"
```

## Email Service

### SendGrid

```env
SENDGRID_API_KEY="SG.mxB3YJIeQ...
PROVIDER="sendgrid"
MAIL_FROM_NAME="DEV - Clinic EZ"
MAIL_FROM_EMAIL="clinicez.official@gmail.com"
REPLY_TO_EMAIL="clinicez.official@gmail.com"
```

## Environmental Configuration

### Development Database

```env
DATABASE_URL="postgresql://user:password@host/db?sslmode=require"
DATABASE_URL_UNPOOLED="postgresql://..." # For migrations
MYSQL_CONNECTION_STRING="mysql://..." # Legacy HIMS
```

### API Integration

```env
NEXT_PUBLIC_API_BASE_URL="https://mock.pstmn.io"
```

## Scripts & Commands

```bash
# Development
pnpm dev              # Start dev server
pnpm dev:webpack      # Use webpack instead of turbo

# Building
pnpm build            # Full build with type generation
pnpm start            # Run production build

# Code Quality
npm run lint          # Run ESLint
npx tsc --noEmit      # Type check only

# Database
pnpm migrate          # Create & apply migration
pnpm migrate:deploy   # Deploy existing migrations
pnpm db:studio        # Open Prisma Studio

# Data Seeding
pnpm seed:permissions # Seed permissions
pnpm seed:procedures  # Seed medical procedures
pnpm seed:philhealth  # Seed PhilHealth data

# Testing
npm run test          # Run tests
npm run test:watch    # Watch mode
```

## Performance Metrics

### Lighthouse Targets (Patient Dashboard)

- **Performance:** 90+
- **Accessibility:** 95+
- **Best Practices:** 95+
- **SEO:** 90+

### Core Web Vitals

- **LCP:** < 2.5s (Largest Contentful Paint)
- **FID:** < 100ms (First Input Delay)
- **CLS:** < 0.1 (Cumulative Layout Shift)

---

**For implementation details, see:**

- [Architecture Guide](./ARCHITECTURE.md)
- [Development Conventions](./DEVELOPMENT_CONVENTIONS.md)
- [Clinicez Fullstack Dev](./CLINICEZ_FULLSTACK_DEV.md)
