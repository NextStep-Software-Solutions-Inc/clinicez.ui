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
  CalendarClock,
  Stethoscope,
  DollarSign,
  Eye,
  CalendarPlus,
  MessageSquare,
  FileBarChart,
} from "lucide-react";

// TODO: Replace placeholder hrefs with dynamic routes once clinicUid is available via useParams
const quickActions: QuickAction[] = [
  {
    icon: <Eye className="h-5 w-5" />,
    label: "View Patients",
    description: "Browse and search patient records",
    href: "#",
  },
  {
    icon: <CalendarPlus className="h-5 w-5" />,
    label: "Schedule Appointment",
    description: "Book a new patient appointment",
    href: "#",
  },
  {
    icon: <MessageSquare className="h-5 w-5" />,
    label: "Start Consultation",
    description: "Begin a new patient consultation",
    href: "#",
  },
  {
    icon: <FileBarChart className="h-5 w-5" />,
    label: "Generate Report",
    description: "Create clinic performance reports",
    href: "#",
  },
];

export default function ClinicDashboardPage() {
  return (
    <div className="space-y-6">
      <WelcomeHeader
        name="Doctor"
        subtitle="Your clinic at a glance"
        dashboardType="clinic"
      />

      <Separator />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Patients Today"
          value={24}
          icon={<Users className="h-5 w-5 text-muted-foreground" />}
        />
        <StatCard
          label="Pending Appointments"
          value={8}
          trend={{ direction: "down", value: "-2" }}
          icon={<CalendarClock className="h-5 w-5 text-muted-foreground" />}
        />
        <StatCard
          label="Consultations"
          value={156}
          trend={{ direction: "up", value: "+18%" }}
          icon={<Stethoscope className="h-5 w-5 text-muted-foreground" />}
        />
        <StatCard
          label="Revenue"
          value="$12,450"
          trend={{ direction: "up", value: "+8%" }}
          icon={<DollarSign className="h-5 w-5 text-muted-foreground" />}
        />
      </div>

      <Separator />

      <QuickActions actions={quickActions} />
    </div>
  );
}
