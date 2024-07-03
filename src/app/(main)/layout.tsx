import { getCachedSession } from "@actions/session.action";
import "@styles/globals.css";
export const metadata = {
  title: 'Clinic EZ',
  description: 'Optimized Healthcare Management System',
}

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const session = await getCachedSession();
  // if (!session) redirect("/api/auth/login", RedirectType.push)
  return (
    <>
      {children}
    </>
  );
}

