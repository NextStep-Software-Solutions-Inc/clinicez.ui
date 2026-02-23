import React from "react";
import "@styles/v2-dashboard.css";

interface OrgDashboardLayoutProps {
  children: React.ReactNode;
}

export default function OrgDashboardLayout({ children }: OrgDashboardLayoutProps) {
  return <>{children}</>;
}
