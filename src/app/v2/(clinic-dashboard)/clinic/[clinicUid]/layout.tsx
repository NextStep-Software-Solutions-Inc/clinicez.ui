import React from "react";
import { DashboardShell } from "@/components/v2/dashboard";
import type { NavItem } from "@/components/v2/dashboard";

interface ClinicUidLayoutProps {
  children: React.ReactNode;
  params: Promise<{ clinicUid: string }>;
}

export default async function ClinicUidLayout(
  props: ClinicUidLayoutProps,
) {
  const params = await props.params;
  const { clinicUid } = params;

  // Navigation items for clinic dashboard
  const navItems: NavItem[] = [
    {
      name: "Dashboard",
      href: `/v2/clinic/${clinicUid}`,
      icon: "home",
      badgeCount: undefined,
    },
    {
      name: "Patients",
      href: `/v2/clinic/${clinicUid}/patients`,
      icon: "users",
      badgeCount: undefined,
    },
    {
      name: "Appointments",
      href: `/v2/clinic/${clinicUid}/appointments`,
      icon: "calendar",
      badgeCount: 3,
    },
    {
      name: "Consultations",
      href: `/v2/clinic/${clinicUid}/consultations`,
      icon: "stethoscope",
      badgeCount: undefined,
    },
    {
      name: "Records",
      href: `/v2/clinic/${clinicUid}/records`,
      icon: "file-text",
      badgeCount: undefined,
    },
    {
      name: "Analytics",
      href: `/v2/clinic/${clinicUid}/analytics`,
      icon: "bar-chart",
      badgeCount: undefined,
    },
    {
      name: "Settings",
      href: `/v2/clinic/${clinicUid}/settings`,
      icon: "settings",
      badgeCount: undefined,
    },
  ];

  return (
    <DashboardShell
      dashboardType="clinic"
      title="Clinic Dashboard"
      activeClinic={{
        id: clinicUid,
        name: "My Clinic", // TODO: Fetch actual clinic name from API
        uid: clinicUid,
        role: "Doctor", // TODO: Fetch user's role in this clinic from API
      }}
      clinics={[
        // TODO: Fetch user's clinics from API with their roles in each clinic
        {
          id: clinicUid,
          name: "My Clinic",
          uid: clinicUid,
          role: "Doctor",
        },
        // Example of additional clinic:
        // {
        //   id: "clinic-2",
        //   name: "Secondary Clinic",
        //   uid: "secondary-clinic",
        //   role: "Manager",
        // },
      ]}
      headerActions={null}
      navItems={navItems}
    >
      {props.children}
    </DashboardShell>
  );
}
