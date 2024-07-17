import "@styles/globals.css";
export const metadata = {
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