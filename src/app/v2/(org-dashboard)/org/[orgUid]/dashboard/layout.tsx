import React from "react";

interface OrgDashboardLayoutProps {
  children: React.ReactNode;
}

export default function OrgDashboardLayout({ children }: OrgDashboardLayoutProps) {
  return <>{children}</>;
}
