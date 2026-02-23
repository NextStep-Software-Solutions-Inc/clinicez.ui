"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  HeartPulse,
  KeyRound,
  Stethoscope,
  Building2,
  Network,
  ArrowRight,
  Lock,
  LogOut,
} from "lucide-react";
import { Button } from "@components/ui/button";
import { useClerk } from "@clerk/nextjs";
import { ClinicOrgSelectorModal } from "@/components/dashboard/clinic-org-selector-modal";
import type {
  DashboardOptions,
  ClinicDashboardOption,
  OrgDashboardOption,
} from "@actions/dashboard/dashboard-links.action";

interface SelectDashboardClientProps {
  options: DashboardOptions;
  userName: string;
}

interface DashboardCard {
  key: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  badge?: string;
  disabled?: boolean;
  disabledReason?: string;
  onClick: () => void;
}

export default function SelectDashboardClient({
  options,
  userName,
}: SelectDashboardClientProps) {
  const router = useRouter();
  const { signOut } = useClerk();
  const [selectorModalType, setSelectorModalType] = useState<
    "clinic" | "organization" | null
  >(null);

  const buildCards = (): DashboardCard[] => {
    const cards: DashboardCard[] = [];

    const clinicHasAccess = (canAccessDashboard: boolean, role: string) =>
      canAccessDashboard || role.toLowerCase() === "owner";

    const orgHasAccess = (canAccessDashboard: boolean, role: string) => {
      const r = role.toLowerCase();
      return canAccessDashboard || r === "owner" || r === "admin";
    };

    // Patient — always available
    cards.push({
      key: "patient",
      icon: <HeartPulse className="h-6 w-6" />,
      title: "Patient Dashboard",
      description:
        "View your health records, book appointments, track prescriptions, and manage your medical history.",
      onClick: () => router.push("/v2/patient/"),
    });

    // Tenant — if user owns a tenant
    for (const tenant of options.tenants) {
      cards.push({
        key: `tenant-${tenant.href}`,
        icon: <KeyRound className="h-6 w-6" />,
        title: tenant.name ? `Tenant: ${tenant.name}` : "Tenant Admin",
        description:
          "Manage your organizations, clinics, and system-level settings across the platform.",
        onClick: () => router.push(tenant.href),
      });
    }

    // Healthcare Provider profiles
    for (const hp of options.hpProfiles) {
      cards.push({
        key: `hp-${hp.id}`,
        icon: <Stethoscope className="h-6 w-6" />,
        title: `${hp.title} ${hp.name}`,
        description:
          "Access your healthcare provider profile, manage consultations, and view patient assignments.",
        badge: "Healthcare Provider",
        onClick: () => router.push(hp.href),
      });
    }

    // Clinics
    if (options.clinics.length === 1) {
      const clinic: ClinicDashboardOption = options.clinics[0];
      const hasAccess = clinicHasAccess(clinic.canAccessDashboard, clinic.role);
      cards.push({
        key: `clinic-${clinic.clinicUid}`,
        icon: <Building2 className="h-6 w-6" />,
        title: clinic.name,
        description: hasAccess
          ? "Manage appointments, patients, and clinic operations."
          : "You do not have dashboard access for this clinic role.",
        badge: clinic.role,
        disabled: !hasAccess,
        disabledReason: "Dashboard access not enabled for your role",
        onClick: () => {
          if (hasAccess) router.push(clinic.href);
        },
      });
    } else if (options.clinics.length > 1) {
      const accessibleCount = options.clinics.filter((c) =>
        clinicHasAccess(c.canAccessDashboard, c.role)
      ).length;
      cards.push({
        key: "clinics",
        icon: <Building2 className="h-6 w-6" />,
        title: "My Clinics",
        description: `You are a member of ${options.clinics.length} clinics. Select the clinic you want to access.`,
        badge: `${accessibleCount} accessible`,
        onClick: () => setSelectorModalType("clinic"),
      });
    }

    // Organizations
    if (options.organizations.length === 1) {
      const org: OrgDashboardOption = options.organizations[0];
      const hasAccess = orgHasAccess(org.canAccessDashboard, org.role);
      cards.push({
        key: `org-${org.orgUid}`,
        icon: <Network className="h-6 w-6" />,
        title: org.name,
        description: hasAccess
          ? "Manage members, clinics, roles, and organizational settings."
          : "You do not have dashboard access for this organization role.",
        badge: org.role,
        disabled: !hasAccess,
        disabledReason: "Dashboard access not enabled for your role",
        onClick: () => {
          if (hasAccess) router.push(org.href);
        },
      });
    } else if (options.organizations.length > 1) {
      const accessibleCount = options.organizations.filter((o) =>
        orgHasAccess(o.canAccessDashboard, o.role)
      ).length;
      cards.push({
        key: "organizations",
        icon: <Network className="h-6 w-6" />,
        title: "My Organizations",
        description: `You are a member of ${options.organizations.length} organizations. Select the organization you want to access.`,
        badge: `${accessibleCount} accessible`,
        onClick: () => setSelectorModalType("organization"),
      });
    }

    return cards;
  };

  const cards = buildCards();

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white/80 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <HeartPulse className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg text-slate-800">ClinicEZ</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-500 hover:text-slate-700 gap-2"
            onClick={() => signOut({ redirectUrl: "/" })}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
          <div className="w-full max-w-3xl space-y-8">
            {/* Welcome heading */}
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                Welcome back{userName ? `, ${userName}` : ""}!
              </h1>
              <p className="text-slate-500 text-base">
                Select the role you want to access today.
              </p>
            </div>

            {/* Cards grid */}
            <div className="grid gap-4 sm:grid-cols-2">
              {cards.map((card, index) =>
                card.disabled ? (
                  <div
                    key={card.key}
                    className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-5 opacity-60 cursor-not-allowed"
                    style={{
                      animation: `fadeSlideIn 0.4s ease-out ${index * 60}ms backwards`,
                    }}
                  >
                    {card.badge && (
                      <span className="inline-block mb-3 px-2 py-0.5 text-xs font-medium rounded-full bg-slate-200 text-slate-500">
                        {card.badge}
                      </span>
                    )}
                    <div className="flex items-start gap-4">
                      <div className="p-2.5 rounded-lg bg-slate-200 text-slate-400 flex-shrink-0">
                        {card.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-500 truncate">
                          {card.title}
                        </p>
                        <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                          <Lock className="h-3 w-3 flex-shrink-0" />
                          {card.disabledReason}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    key={card.key}
                    onClick={card.onClick}
                    className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 text-left transition-all duration-300 hover:border-teal-300 hover:shadow-lg hover:shadow-teal-100/50 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                    style={{
                      animation: `fadeSlideIn 0.4s ease-out ${index * 60}ms backwards`,
                    }}
                  >
                    {/* Hover gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-teal-50/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                    <div className="relative space-y-3">
                      {card.badge && (
                        <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-teal-100 text-teal-700">
                          {card.badge}
                        </span>
                      )}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="p-2.5 rounded-lg bg-gradient-to-br from-teal-100 to-teal-50 text-teal-600 flex-shrink-0 transition-all duration-300 group-hover:from-teal-200 group-hover:to-teal-100 group-hover:scale-110 group-hover:shadow-md">
                            {card.icon}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-slate-800 group-hover:text-teal-700 transition-colors duration-300 truncate">
                              {card.title}
                            </p>
                            <p className="text-xs text-slate-500 mt-1 line-clamp-2 group-hover:text-slate-600 transition-colors duration-300">
                              {card.description}
                            </p>
                          </div>
                        </div>
                        <div className="flex-shrink-0 mt-0.5 text-slate-300 group-hover:text-teal-500 group-hover:translate-x-1 transition-all duration-300">
                          <ArrowRight className="h-5 w-5" />
                        </div>
                      </div>
                    </div>
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Clinic / Organization selector modal */}
      <ClinicOrgSelectorModal
        isOpen={selectorModalType !== null}
        onClose={() => setSelectorModalType(null)}
        type={selectorModalType ?? "clinic"}
      />

      <style jsx>{`
        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
}
