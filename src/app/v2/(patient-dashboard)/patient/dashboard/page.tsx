"use client";

import {
  V2WelcomeHeader,
  V2StatCard,
  V2QuickActions,
} from "@/components/v2/dashboard";
import type { V2QuickAction } from "@/components/v2/dashboard";
import { Separator } from "@components/ui/separator";
import {
  CalendarDays,
  Pill,
  FlaskConical,
  HeartPulse,
  CalendarPlus,
  FolderOpen,
  ClipboardList,
  Search,
} from "lucide-react";

const quickActions: V2QuickAction[] = [
  {
    icon: <CalendarPlus className="h-5 w-5" />,
    label: "Book Appointment",
    description: "Schedule a new appointment with your doctor",
    href: "/patient/dashboard/appointments/new",
  },
  {
    icon: <FolderOpen className="h-5 w-5" />,
    label: "View Records",
    description: "Access your medical history and documents",
    href: "/patient/dashboard/records",
  },
  {
    icon: <ClipboardList className="h-5 w-5" />,
    label: "My Prescriptions",
    description: "View and manage your active prescriptions",
    href: "/patient/dashboard/prescriptions",
  },
  {
    icon: <Search className="h-5 w-5" />,
    label: "Find a Doctor",
    description: "Search for specialists and providers",
    href: "/patient/dashboard/find-doctor",
  },
];

export default function PatientDashboardPage() {
  return (
    <div className="space-y-6">
      <V2WelcomeHeader
        name="Patient"
        subtitle="Here's your health overview"
        dashboardType="patient"
      />

      <Separator />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <V2StatCard
          label="Upcoming Appointments"
          value={3}
          icon={<CalendarDays className="h-5 w-5 text-muted-foreground" />}
        />
        <V2StatCard
          label="Active Prescriptions"
          value={5}
          icon={<Pill className="h-5 w-5 text-muted-foreground" />}
        />
        <V2StatCard
          label="Lab Results"
          value={2}
          trend={{ direction: "up", value: "+1" }}
          icon={<FlaskConical className="h-5 w-5 text-muted-foreground" />}
        />
        <V2StatCard
          label="Health Score"
          value={85}
          trend={{ direction: "up", value: "+3%" }}
          icon={<HeartPulse className="h-5 w-5 text-muted-foreground" />}
        />
      </div>

      <Separator />

      <V2QuickActions actions={quickActions} />
    </div>
  );
}
