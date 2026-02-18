"use client";

import React, { useState } from "react";
import {
  WelcomeHeader,
  StatCard,
  ActivityLog,
  ProgressBar,
} from "@/components/v2/dashboard";
import { KPICard } from "@/components/v2/dashboard/KPICard";
import { Separator } from "@components/ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@components/ui/tabs";
import {
  Users,
  CalendarClock,
  Stethoscope,
  DollarSign,
  Activity,
  Clock,
  Beaker,
  Microscope,
  Heart,
  Share2,
  TrendingUp,
  AlertCircle,
  Calendar,
  UserCheck,
} from "lucide-react";
import type { ClinicDashboardData } from "@/types/clinic-dashboard.types";
import { formatDistanceToNow, format } from "date-fns";

interface ActivityItem {
  id: string;
  action: string;
  detail: string;
  time: string;
  icon: React.ReactNode;
}

interface ClinicDashboardClientProps {
  clinicUid: string;
  data: ClinicDashboardData;
  userName: string;
}

export function ClinicDashboardClient({
  clinicUid,
  data,
  userName,
}: ClinicDashboardClientProps) {
  const { metrics, diagnosticRequests, workload, schedule, teamStatus } = data;
  const [activeWorkloadTab, setActiveWorkloadTab] = useState("consultations");

  // Activity items
  const activityItems: ActivityItem[] = [
    ...data.recentActivity.appointments.map((apt) => ({
      id: apt.id?.toString() || Math.random().toString(),
      action: apt.action,
      detail: `${apt.detail}${apt.detail2 ? ` - ${apt.detail2}` : ""}`,
      time: apt.time ? formatDistanceToNow(new Date(apt.time), { addSuffix: true }) : "just now",
      icon: <Calendar className="h-4 w-4" />,
    })),
    ...data.recentActivity.newPatients.map((patient: typeof data.recentActivity.newPatients[0], idx: number) => ({
      id: `patient-${idx}`,
      action: patient.action,
      detail: patient.detail,
      time: "recently",
      icon: <Users className="h-4 w-4" />,
    })),
  ].slice(0, 8);

  return (
    <div className="space-y-6 pb-8">
      {/* 1. Welcome & Summary Header */}
      <div className="space-y-6">
        <WelcomeHeader
          name={userName}
          subtitle="Your clinic at a glance"
          dashboardType="clinic"
        />
        
        {/* Compact KPI Row - Secondary Focus */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KPICard
            label="Patients"
            value={metrics.patientsToday}
            icon={Users}
            trend={{ direction: "up", text: "+6 today" }}
            progress={68}
            color="primary"
          />
          
          <KPICard
            label="Pending"
            value={metrics.pendingAppointments}
            icon={CalendarClock}
            trend={{ direction: "down", text: "-2 this hour" }}
            progress={44}
            color="secondary"
          />
          
          <KPICard
            label="Active"
            value={workload.activeConsultations}
            icon={Stethoscope}
            trend={{ direction: "up", text: "+3 in progress" }}
            progress={83}
            color="accent"
          />
          
          <KPICard
            label="Revenue"
            value={`$${(metrics.monthlyRevenue / 1000).toFixed(1)}k`}
            icon={DollarSign}
            trend={{ direction: "up", text: "+8% month" }}
            progress={71}
            color="primary"
          />
        </div>
      </div>

      {/* 2. Primary Content - Full Width Schedule (Hero Section) */}
      <div>
        <Card className="glassmorphic-card-lg overflow-hidden border" style={{borderColor: `hsl(var(--color-border-light))`}}>
          <CardHeader className="border-b" style={{borderColor: `hsl(var(--color-border-light))`, background: `hsl(var(--primary) / 0.05)`}}>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold" style={{color: `hsl(var(--primary))`}}>
              <Calendar className="h-6 w-6" />
              Schedule Today
            </CardTitle>
            <CardDescription>Next {schedule.upcomingCount} appointments</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {schedule.upcomingAppointments.length > 0 ? (
              <div className="space-y-2">
                {schedule.upcomingAppointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="flex items-center gap-4 p-4 rounded-lg border transition-colors hover:bg-muted/30"
                    style={{borderColor: `hsl(var(--color-border-light))`}}
                  >
                    <div className="h-12 w-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{background: `hsl(var(--primary) / 0.2)`}}>
                      <Clock className="h-5 w-5" style={{color: `hsl(var(--primary))`}} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{apt.subject}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {apt.timeStart && apt.timeEnd ? `${apt.timeStart} - ${apt.timeEnd}` : apt.timeStart || "Time not set"}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-semibold px-3 py-1.5 rounded-full" style={{background: `hsl(var(--primary) / 0.1)`, color: `hsl(var(--primary))`}}>
                        {apt.date ? format(new Date(apt.date), "MMM d") : "TBD"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No upcoming appointments</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 3. Three-Column Analysis Zone */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Workload & Consultations */}
        <Card className="glassmorphic-card-lg overflow-hidden border" style={{borderColor: `hsl(var(--color-border-light))`}}>
          <CardHeader className="border-b" style={{borderColor: `hsl(var(--color-border-light))`, background: `hsl(var(--secondary) / 0.05)`}}>
            <CardTitle className="flex items-center gap-2 text-base font-semibold" style={{color: `hsl(var(--secondary))`}}>
              <Stethoscope className="h-5 w-5" />
              Active Workload
            </CardTitle>
            <CardDescription>{workload.activeConsultations} in progress</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {workload.consultationDetails.length > 0 ? (
              <div className="space-y-2">
                {workload.consultationDetails.slice(0, 5).map((consultation) => (
                  <div
                    key={consultation.id}
                    className="p-3 rounded-lg border text-sm"
                    style={{background: `hsl(var(--secondary) / 0.08)`, borderColor: `hsl(var(--secondary) / 0.2)`}}
                  >
                    <p className="font-medium text-foreground truncate">{consultation.subject}</p>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(consultation.createdAt), { addSuffix: true })}
                      </p>
                      <span className="text-xs font-medium px-2 py-0.5 rounded" style={{background: `hsl(var(--secondary) / 0.2)`, color: `hsl(var(--secondary))`}}>
                        {consultation.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Stethoscope className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No active consultations</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Diagnostic Requests Summary */}
        <Card className="glassmorphic-card-lg overflow-hidden border" style={{borderColor: `hsl(var(--color-border-light))`}}>
          <CardHeader className="border-b" style={{borderColor: `hsl(var(--color-border-light))`, background: `hsl(var(--muted) / 0.05)`}}>
            <CardTitle className="flex items-center gap-2 text-base font-semibold" style={{color: `hsl(var(--muted))`}}>
              <AlertCircle className="h-5 w-5" />
              Diagnostics
            </CardTitle>
            <CardDescription>Pending requests</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Beaker className="h-4 w-4" style={{color: `hsl(var(--muted))`}} />
                  <span className="text-sm text-foreground">Lab</span>
                </div>
                <span className="text-lg font-bold" style={{color: `hsl(var(--muted))`}}>{diagnosticRequests.labRequests}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Microscope className="h-4 w-4" style={{color: `hsl(var(--secondary))`}} />
                  <span className="text-sm text-foreground">Imaging</span>
                </div>
                <span className="text-lg font-bold" style={{color: `hsl(var(--secondary))`}}>{diagnosticRequests.imagingRequests}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4" style={{color: `hsl(var(--muted))`}} />
                  <span className="text-sm text-foreground">Heart</span>
                </div>
                <span className="text-lg font-bold" style={{color: `hsl(var(--muted))`}}>{diagnosticRequests.heartRequests}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Share2 className="h-4 w-4" style={{color: `hsl(var(--accent))`}} />
                  <span className="text-sm text-foreground">Referrals</span>
                </div>
                <span className="text-lg font-bold" style={{color: `hsl(var(--accent))`}}>{diagnosticRequests.referrals}</span>
              </div>
              <div className="pt-2 border-t" style={{borderColor: `hsl(var(--color-border-light))`}}>
                <p className="text-xs text-muted-foreground font-medium">
                  {diagnosticRequests.labRequests + diagnosticRequests.imagingRequests + diagnosticRequests.heartRequests + diagnosticRequests.referrals} total
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card className="glassmorphic-card-lg overflow-hidden border" style={{borderColor: `hsl(var(--color-border-light))`}}>
          <CardHeader className="border-b" style={{borderColor: `hsl(var(--color-border-light))`, background: `hsl(var(--accent) / 0.05)`}}>
            <CardTitle className="flex items-center gap-2 text-base font-semibold" style={{color: `hsl(var(--accent))`}}>
              <TrendingUp className="h-5 w-5" />
              Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-foreground">Completion</span>
                <span className="text-sm font-bold">88%</span>
              </div>
              <ProgressBar label="" value={88} max={100} color="blue" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-foreground">Consultation</span>
                <span className="text-sm font-bold">92%</span>
              </div>
              <ProgressBar label="" value={92} max={100} color="blue" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-foreground">Satisfaction</span>
                <span className="text-sm font-bold">96%</span>
              </div>
              <ProgressBar label="" value={96} max={100} color="green" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 4. Team & Activity Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Team Status */}
        <Card className="glassmorphic-card-lg overflow-hidden border" style={{borderColor: `hsl(var(--color-border-light))`}}>
          <CardHeader className="border-b" style={{borderColor: `hsl(var(--color-border-light))`, background: `hsl(var(--accent) / 0.05)`}}>
            <CardTitle className="flex items-center gap-2 text-base font-semibold" style={{color: `hsl(var(--accent))`}}>
              <UserCheck className="h-5 w-5" />
              Team Status
            </CardTitle>
            <CardDescription>{teamStatus.totalMembers} active members</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {teamStatus.members.length > 0 ? (
              <div className="space-y-2">
                {teamStatus.members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {member.avatar ? (
                        <img
                          src={member.avatar}
                          alt={member.name}
                          className="h-8 w-8 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{background: `linear-gradient(135deg, hsl(var(--accent)), hsl(var(--accent) / 0.7))`}}>
                          {member.name.charAt(0)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{member.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{member.role}</p>
                      </div>
                    </div>
                    <div className="h-2 w-2 rounded-full flex-shrink-0 animate-pulse" style={{background: `hsl(var(--accent))`}} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No team members</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="glassmorphic-card-lg overflow-hidden border" style={{borderColor: `hsl(var(--color-border-light))`}}>
          <CardHeader className="border-b" style={{borderColor: `hsl(var(--color-border-light))`, background: `hsl(var(--primary) / 0.05)`}}>
            <CardTitle className="flex items-center gap-2 text-base font-semibold" style={{color: `hsl(var(--primary))`}}>
              <Activity className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest clinic events</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <ActivityLog items={activityItems} />
          </CardContent>
        </Card>
      </div>

      {/* 5. Footer Status Bar */}
      <Card className="glassmorphic-card-lg border" style={{borderColor: `hsl(var(--color-border-light))`, background: `linear-gradient(135deg, hsl(var(--primary) / 0.05) 0%, hsl(var(--secondary) / 0.05) 100%)`}}>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider" style={{color: `hsl(var(--primary))`}}>
                Dashboard Status
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {schedule.upcomingCount} appointments • {workload.activeConsultations} consultations • Last updated {format(new Date(), "HH:mm")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
