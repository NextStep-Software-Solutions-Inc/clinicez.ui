import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Clinic EZ',
  description: 'Optimized Healthcare Management System',
}

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
    </>
  );
}