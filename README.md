# ClinicEZ - Healthcare Management System

A comprehensive healthcare management platform that streamlines appointment booking, patient records, and clinic operations.

**Live Website:** <https://www.clinicez.net/v2>

## Overview

ClinicEZ is a modern, user-friendly healthcare management system built with Next.js. It provides:

- **Smart Appointment Booking** - 24/7 online booking with automated reminders and calendar sync
- **Patient Management** - Complete patient profiles, medical history, and secure document storage
- **Real-time Scheduling** - Dynamic scheduling with conflict detection and automatic optimization
- **User-Friendly Interface** - Intuitive design that healthcare staff love
- **Proven Reliability** - Battle-tested in real healthcare environments
- **Quick Implementation** - Fast setup with comprehensive support

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (or npm/yarn)
- PostgreSQL database

### Installation

1. Clone the repository:

```bash
git clone https://github.com/NextStep-Software-Solutions-Inc/clinicez.ui.git
cd clinicez.ui
```

1. Install dependencies:

```bash
pnpm install
```

1. Set up environment variables:

```bash
cp .env.example .env.local
# Edit .env.local with your configuration
```

1. Set up the database:

```bash
npx prisma migrate dev
npx prisma db seed
```

1. Run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the result.

## Project Structure

```
src/
├── app/              # Next.js app directory
│   ├── v2/          # Main landing pages (public)
│   ├── (dashboard)/ # Dashboard routes (authenticated)
│   ├── (auth)/      # Authentication routes
│   └── api/         # API routes
├── components/       # Reusable React components
├── actions/         # Server actions
├── services/        # Business logic services
├── types/           # TypeScript type definitions
├── schemas/         # Validation schemas
├── utils/           # Utility functions
├── contexts/        # React contexts
├── hooks/           # Custom React hooks
├── styles/          # Global styles
└── lib/             # Library functions
```

## Key Features

### Authentication & Authorization

- Clerk-based authentication
- Role-based access control
- User profile management

### Appointment Management

- Smart booking system with conflict detection
- Automated reminders
- Calendar synchronization
- Real-time scheduling updates

### Patient Records

- Comprehensive patient profiles
- Medical history tracking
- Secure document storage
- Healthcare data compliance

### Analytics & Reporting

- Usage analytics
- Appointment statistics
- Patient insights
- Performance metrics

## Technology Stack

- **Frontend:** Next.js 14, React, TypeScript, TailwindCSS
- **Backend:** Next.js API Routes, Prisma ORM
- **Database:** PostgreSQL
- **Authentication:** Clerk
- **Deployment:** Vercel
- **Monitoring:** Vercel Analytics, HotJar

## Documentation

### Core Documentation

- **[Sequence Number Generation](./docs/SEQUENCE_NUMBER_GENERATION.md)** - Guide on case and transaction number generation
- **[Sequence Number Generation Summary](./docs/SEQUENCE_NUMBER_GENERATION_SUMMARY.md)** - Quick reference
- **[Case Number Architecture](./docs/CASE_NUMBER_ARCHITECTURE.md)** - System design and implementation
- **[Production Migration Guide](./docs/PRODUCTION_MIGRATION_GUIDE.md)** - Deployment instructions

### Feature Documentation

- [EMR Preview Enhancement](./docs/EMR_PREVIEW_ENHANCEMENT.md)
- [Return Appointment Assignment](./docs/RETURN_APPOINTMENT_ASSIGNMENT.md)
- [PHR Case Number Implementation](./docs/PHR_CASE_NUMBER_IMPLEMENTATION.md)
- [Super Admin Implementation](./SUPER_ADMIN_IMPLEMENTATION.md)

### Database

- [Migration Ready](./docs/MIGRATION_READY.md)
- [Deployment Checklist](./docs/DEPLOYMENT_CHECKLIST.md)

## Database Migrations

⚠️ **Important:** Never modify applied migrations. Always create new migrations for schema changes:

```bash
npx prisma migrate dev --name descriptive_name
```

For detailed migration guidelines, see [CRITICAL Migration Guidelines](./.github/copilot-instructions.md#database-migration-guidelines).

## Environment Variables

Create a `.env.local` file with:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/clinicez"

# Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_key
CLERK_SECRET_KEY=your_secret

# API Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Analytics
NEXT_PUBLIC_HOTJAR_ID=your_id

# Other services
# Add other required environment variables
```

## Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run with coverage
pnpm test:coverage
```

## Building for Production

```bash
# Build the application
pnpm build

# Start production server
pnpm start
```

## Deployment

### Deploy on Vercel

The easiest way to deploy is using the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme).

1. Push your changes to GitHub
2. Connect your repository to Vercel
3. Vercel will automatically build and deploy

See [Next.js deployment documentation](https://nextjs.org/docs/deployment) for detailed instructions.

## Contributing

We welcome contributions! Please:

1. Create a feature branch
2. Make your changes
3. Submit a pull request with a clear description

## Support

- **Email:** <clinicez.official@gmail.com>
- **Website:** <https://www.clinicez.net>
- **Documentation:** See `/docs` folder
- **Issues:** Report via GitHub Issues

## Links

- **Home Page:** <https://www.clinicez.net/v2>
- **Healthcare Providers:** <https://www.clinicez.net/v2/hp>
- **Clinics:** <https://www.clinicez.net/v2/clinics>
- **Organizations:** <https://www.clinicez.net/v2/organizations>
- **Pricing:** <https://www.clinicez.net/v2/pricing>
- **Contact:** <https://www.clinicez.net/v2/contact-us>
- **Privacy Policy:** <https://www.clinicez.net/v2/privacy>
- **Terms of Conditions:** <https://www.clinicez.net/v2/terms>

## License

© 2026 PointersBit Inc. All rights reserved.

## Learn More

To learn more about the technologies used:

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)
