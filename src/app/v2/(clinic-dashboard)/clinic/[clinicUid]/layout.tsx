import React from "react";
import { DashboardShell } from "@/components/v2/dashboard";
import type { NavItem } from "@/components/v2/dashboard";
import { getClinicWithUserRoleAction, getUserClinicsWithRolesAction } from "@/actions/clinics/clinic.action";
import { notFound } from "next/navigation";

interface ClinicUidLayoutProps {
  children: React.ReactNode;
  params: Promise<{ clinicUid: string }>;
}

export default async function ClinicUidLayout(
  props: ClinicUidLayoutProps,
) {
  const params = await props.params;
  const { clinicUid } = params;

  // Load clinic data and user's role in this clinic
  const clinicWithRoleResult = await getClinicWithUserRoleAction(clinicUid);
  
  // Check if clinic was found and loaded successfully
  if (!clinicWithRoleResult.status || !clinicWithRoleResult.data) {
    notFound();
  }

  const clinic = clinicWithRoleResult.data.clinic;
  const userRole = clinicWithRoleResult.data.userRole;

  // Load all user's clinics with their roles for the selector
  const userClinicsResult = await getUserClinicsWithRolesAction();
  const userClinics = userClinicsResult.data;

  // Navigation items for clinic dashboard
  const navItems: NavItem[] = [
    {
      name: "Dashboard",
      href: `/v2/clinic/${clinicUid}`,
      icon: "home",
      badgeCount: undefined,
      exact: true,
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
      name: "Reports",
      href: `/v2/clinic/${clinicUid}/reports`,
      icon: "bar-chart-2",
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
    <div className="relative min-h-screen overflow-hidden">
      {/* Fixed Mesh Grid Pattern Background */}
      <div 
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(0deg, hsl(var(--color-border) / 0.5) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--color-border) / 0.5) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
          backgroundPosition: '0 0',
          zIndex: 0,
        }}
      />
      
      <div className="relative z-10">
        <DashboardShell
          dashboardType="clinic"
          title="Clinic Dashboard"
          activeClinic={{
            id: clinic.id.toString(),
            name: clinic.name,
            uid: clinic.clinicUid,
            role: userRole?.name || "Member",
          }}
          clinics={(userClinics || []).map(c => ({
            id: c.id.toString(),
            name: c.name,
            uid: c.clinicUid,
            role: c.role,
          }))}
          headerActions={null}
          navItems={navItems}
        >
          {props.children}
        </DashboardShell>
      </div>
    </div>
  );
}
