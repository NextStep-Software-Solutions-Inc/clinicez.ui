"use client";

import {
  WelcomeHeader,
  StatCard,
  QuickActions,
} from "@/components/v2/dashboard";
import type { QuickAction } from "@/components/v2/dashboard";
import { Separator } from "@components/ui/separator";
import {
  Users,
  Building2,
  DollarSign,
  Inbox,
  UserCog,
  Eye,
  FileBarChart,
  Settings,
} from "lucide-react";

// TODO: Replace placeholder hrefs with dynamic routes once orgUid is available via useParams
const quickActions: QuickAction[] = [
  {
    icon: <UserCog className="h-5 w-5" />,
    label: "Manage Members",
    description: "Add, remove, or update organization members",
    href: "#",
  },
  {
    icon: <Eye className="h-5 w-5" />,
    label: "View Clinics",
    description: "Monitor and manage associated clinics",
    href: "#",
  },
  {
    icon: <FileBarChart className="h-5 w-5" />,
    label: "Financial Reports",
    description: "View revenue and financial analytics",
    href: "#",
  },
  {
    icon: <Settings className="h-5 w-5" />,
    label: "Organization Settings",
    description: "Configure organization preferences",
    href: "#",
  },
];

export default function OrgDashboardPage() {
  return (
    <div className="space-y-6">
      <WelcomeHeader
        name="Administrator"
        subtitle="Organization performance overview"
        dashboardType="organization"
      />

      <Separator />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Members"
          value={86}
          trend={{ direction: "up", value: "+5" }}
          icon={<Users className="h-5 w-5 text-muted-foreground" />}
        />
        <StatCard
          label="Active Clinics"
          value={4}
          icon={<Building2 className="h-5 w-5 text-muted-foreground" />}
        />
        <StatCard
          label="Monthly Revenue"
          value="$48,200"
          trend={{ direction: "up", value: "+12%" }}
          icon={<DollarSign className="h-5 w-5 text-muted-foreground" />}
        />
        <StatCard
          label="Pending Requests"
          value={7}
          trend={{ direction: "down", value: "-3" }}
          icon={<Inbox className="h-5 w-5 text-muted-foreground" />}
        />
      </div>

      <Separator />

      <QuickActions actions={quickActions} />
    </div>
  );
}
