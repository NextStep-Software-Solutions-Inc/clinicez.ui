import { getCachedSession } from "@actions/session.action";
import "@styles/globals.css";
import { RedirectType, redirect } from "next/navigation";

export const metadata = {
  title: 'Clinic EZ',
  description: 'Optimized Healthcare Management System',
}

interface OrganizationSwitcherProps {
  children: React.ReactNode
  params: Promise<{
    orgUid: string
  }>
}

export default async function ActivationLayout({ children, params }: OrganizationSwitcherProps) {
  const session = await getCachedSession();
  if (!session) redirect("/auth/login", RedirectType.push)
  
  // If you need to use params, await them first:
  // const { orgUid } = await params;
  
  return (
    <>
      {children}
    </>
  );
}
