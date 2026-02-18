"use client";

import { useParams } from "next/navigation";
import {
  WelcomeHeader,
  StatCard,
  QuickActions,
  ActivityLog,
  ProgressBar,
} from "@/components/v2/dashboard";
import type { QuickAction, ActivityItem } from "@/components/v2/dashboard";
import { Separator } from "@components/ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card";
import {
  Users,
  CalendarClock,
  Stethoscope,
  DollarSign,
  Eye,
  CalendarPlus,
  MessageSquare,
  FileBarChart,
  TrendingUp,
  Activity,
  Clock,
  CheckCircle2,
} from "lucide-react";

export interface ClinicDashboardPageProps {
  params?: Promise<{ clinicUid: string }>;
}

export default function ClinicDashboardPage({ params }: ClinicDashboardPageProps) {
  const routeParams = useParams();
  const clinicUid = (routeParams?.clinicUid as string) || "";

  // Quick actions configured with dynamic clinic routes
  const quickActions: QuickAction[] = [
    {
      icon: <Eye className="h-5 w-5" />,
      label: "View Patients",
      description: "Browse and search patient records",
      href: `/v2/clinic/${clinicUid}/patients`,
    },
    {
      icon: <CalendarPlus className="h-5 w-5" />,
      label: "Schedule Appointment",
      description: "Book a new patient appointment",
      href: `/v2/clinic/${clinicUid}/appointments`,
    },
    {
      icon: <MessageSquare className="h-5 w-5" />,
      label: "Start Consultation",
      description: "Begin a new patient consultation",
      href: `/v2/clinic/${clinicUid}/consultations`,
    },
    {
      icon: <FileBarChart className="h-5 w-5" />,
      label: "View Reports",
      description: "Create clinic performance reports",
      href: `/v2/clinic/${clinicUid}/analytics`,
    },
  ];

  // Dashboard statistics
  const stats = [
    {
      label: "Patients Today",
      value: 24,
      trend: { direction: "up" as const, value: "+6" },
      icon: <Users className="h-5 w-5 text-muted-foreground" />,
    },
    {
      label: "Pending Appointments",
      value: 8,
      trend: { direction: "down" as const, value: "-2" },
      icon: <CalendarClock className="h-5 w-5 text-muted-foreground" />,
    },
    {
      label: "Total Consultations",
      value: 156,
      trend: { direction: "up" as const, value: "+18%" },
      icon: <Stethoscope className="h-5 w-5 text-muted-foreground" />,
    },
    {
      label: "Monthly Revenue",
      value: "$12,450",
      trend: { direction: "up" as const, value: "+8%" },
      icon: <DollarSign className="h-5 w-5 text-muted-foreground" />,
    },
  ];

  // Activity items for the activity log
  const activityItems: ActivityItem[] = [
    {
      id: "1",
      action: "New appointment booked",
      detail: "John Doe - General Checkup",
      time: "2 hours ago",
      icon: <CalendarPlus className="h-4 w-4" />,
    },
    {
      id: "2",
      action: "Consultation completed",
      detail: "Jane Smith - Follow-up",
      time: "4 hours ago",
      icon: <CheckCircle2 className="h-4 w-4" />,
    },
    {
      id: "3",
      action: "New patient registered",
      detail: "Robert Johnson - New Patient",
      time: "6 hours ago",
      icon: <Users className="h-4 w-4" />,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <WelcomeHeader
        name="Doctor"
        subtitle="Your clinic at a glance"
        dashboardType="clinic"
      />

      <Separator className="my-2" />

      {/* Key Metrics Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            trend={stat.trend}
            icon={stat.icon}
          />
        ))}
      </div>

      <Separator className="my-2" />

      {/* Quick Actions */}
      <div className="v2-animate-scale-in">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-foreground">Quick Actions</h2>
          <p className="text-sm text-muted-foreground">
            Common tasks to manage your clinic
          </p>
        </div>
        <QuickActions actions={quickActions} />
      </div>

      <Separator className="my-2" />

      {/* Recent Activity & Overview Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Activity Section */}
        <Card className="lg:col-span-2 v2-animate-slide-up">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest clinic activities from today</CardDescription>
          </CardHeader>
          <CardContent>
            <ActivityLog items={activityItems} />
          </CardContent>
        </Card>

        {/* Clinic Overview */}
        <Card className="v2-animate-slide-up">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Clinic Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ProgressBar
              label="Avg. Wait Time"
              value={12}
              max={30}
              color="blue"
            />

            <ProgressBar
              label="Patient Satisfaction"
              value={96}
              max={100}
              color="green"
            />

            <ProgressBar
              label="Bed Occupancy"
              value={78}
              max={100}
              color="amber"
            />

            <div className="pt-2 border-t">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                Updated just now
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Info Bar */}
      <Card className="bg-accent/5 border-accent/20 v2-animate-slide-up">
        <CardContent className="p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">
                Need to access more features?
              </p>
              <p className="text-xs text-muted-foreground">
                Explore all clinic management tools in the sidebar
              </p>
            </div>
            <div className="text-xs text-muted-foreground font-medium">
              v2.0 Dashboard
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
