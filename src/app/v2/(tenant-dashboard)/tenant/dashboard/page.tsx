"use client";

import {
  WelcomeHeader,
  StatCard,
  QuickActions,
} from "@/components/v2/dashboard";
import type { QuickAction } from "@/components/v2/dashboard";
import { Separator } from "@components/ui/separator";
import {
  Building2,
  Stethoscope,
  Users,
  Activity,
  Network,
  Eye,
  UserCog,
  Settings,
} from "lucide-react";

const quickActions: QuickAction[] = [
  {
    icon: <Network className="h-5 w-5" />,
    label: "Manage Organizations",
    description: "Create and manage organization accounts",
    href: "/tenant/dashboard/organizations",
  },
  {
    icon: <Eye className="h-5 w-5" />,
    label: "View Clinics",
    description: "Monitor all registered clinics",
    href: "/tenant/dashboard/clinics",
  },
  {
    icon: <UserCog className="h-5 w-5" />,
    label: "User Management",
    description: "Manage user accounts and permissions",
    href: "/tenant/dashboard/users",
  },
  {
    icon: <Settings className="h-5 w-5" />,
    label: "System Settings",
    description: "Configure system-wide settings",
    href: "/tenant/dashboard/settings",
  },
];

export default function TenantDashboardPage() {
  return (
    <div className="space-y-6">
      <WelcomeHeader
        name="Admin"
        subtitle="System overview and management"
        dashboardType="tenant"
      />

      <Separator />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Organizations"
          value={12}
          icon={<Building2 className="h-5 w-5 text-muted-foreground" />}
        />
        <StatCard
          label="Active Clinics"
          value={38}
          trend={{ direction: "up", value: "+4" }}
          icon={<Stethoscope className="h-5 w-5 text-muted-foreground" />}
        />
        <StatCard
          label="Registered Users"
          value="1,240"
          trend={{ direction: "up", value: "+12%" }}
          icon={<Users className="h-5 w-5 text-muted-foreground" />}
        />
        <StatCard
          label="System Health"
          value="99.9%"
          icon={<Activity className="h-5 w-5 text-muted-foreground" />}
        />
      </div>

      <Separator />

      <QuickActions actions={quickActions} />
    </div>
  );
}
