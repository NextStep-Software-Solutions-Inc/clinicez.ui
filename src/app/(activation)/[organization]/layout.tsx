import { protectOrg } from "@lib/protect-org";
import "@styles/globals.css";
import { notFound } from "next/navigation";
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
export default async function MainLayout({ children, params }:OrganizationSwitcherProps) {
  await protectOrg(params.organization)// Check if user is a member of the organization they are trying to access
  return (
    <>
      {children}
    </>
  );
}
