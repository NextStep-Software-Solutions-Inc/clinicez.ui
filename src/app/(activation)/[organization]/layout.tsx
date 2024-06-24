import "@styles/globals.css";
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
  return (
    <>
      {children}
    </>
  );
}
