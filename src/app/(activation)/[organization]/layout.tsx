import { getSession } from "@auth0/nextjs-auth0";
import "@styles/globals.css";
import { RedirectType, redirect } from "next/navigation";
export const metadata = {
  title: 'Clinic EZ',
  description: 'Optimized Healthcare Management System',
}
interface OrganizationSwitcherProps {
  children: React.ReactNode
  params: {
    organization: string
  }
}
export default async function ActivationLayout({ children, params }:OrganizationSwitcherProps) {
  const session = await getSession();
  if (!session) redirect("/api/auth/login", RedirectType.push)
  return (
    <>
      {children}
    </>
  );
}
