"use client";

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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@components/ui/accordion";
import type { DashboardOptions } from "@actions/dashboard/dashboard-links.action";

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

  const clinicHasAccess = (canAccessDashboard: boolean, role: string) =>
    canAccessDashboard || role.toLowerCase() === "owner";

  const orgHasAccess = (canAccessDashboard: boolean, role: string) => {
    const r = role.toLowerCase();
    return canAccessDashboard || r === "owner" || r === "admin";
  };

  /** Build the top-level cards (no clinic/org expansion needed here) */
  const buildCards = (): DashboardCard[] => {
    const cards: DashboardCard[] = [];

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
        title: `${hp.title ? hp.title + " " : ""}${hp.name}`,
        description:
          "Access your healthcare provider profile, manage consultations, and view patient assignments.",
        badge: "Healthcare Provider",
        onClick: () => router.push(hp.href),
      });
    }

    // Single clinic → direct card
    if (options.clinics.length === 1) {
      const clinic = options.clinics[0];
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
    }

    // Single org → direct card
    if (options.organizations.length === 1) {
      const org = options.organizations[0];
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
    }

    return cards;
  };

  const cards = buildCards();
  const hasMultipleClinics = options.clinics.length > 1;
  const hasMultipleOrgs = options.organizations.length > 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white/80 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <img
            src="/assets/clinic-ez_logo.svg"
            alt="ClinicEZ"
            className="h-8 object-contain"
          />
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
                <DisabledCard key={card.key} card={card} index={index} />
              ) : (
                <ActiveCard key={card.key} card={card} index={index} />
              )
            )}

            {/* Multi-clinic accordion — spans full width */}
            {hasMultipleClinics && (
              <div
                className="sm:col-span-2"
                style={{
                  animation: `fadeSlideIn 0.4s ease-out ${cards.length * 60}ms backwards`,
                }}
              >
                <ExpandableGroupCard
                  icon={<Building2 className="h-6 w-6" />}
                  title="My Clinics"
                  count={options.clinics.length}
                  accordionValue="clinics"
                >
                  {options.clinics.map((clinic) => {
                    const hasAccess = clinicHasAccess(
                      clinic.canAccessDashboard,
                      clinic.role
                    );
                    return hasAccess ? (
                      <button
                        key={clinic.clinicUid}
                        onClick={() => router.push(clinic.href)}
                        className="group w-full flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 text-left transition-all duration-200 hover:border-teal-300 hover:bg-teal-50/40 hover:shadow-sm active:scale-[0.99]"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-1.5 rounded-md bg-teal-100 text-teal-600 flex-shrink-0">
                            <Building2 className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-800 group-hover:text-teal-700 truncate">
                              {clinic.name}
                            </p>
                            <p className="text-xs text-slate-500">{clinic.role}</p>
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-teal-500 group-hover:translate-x-0.5 transition-all duration-200 flex-shrink-0" />
                      </button>
                    ) : (
                      <div
                        key={clinic.clinicUid}
                        className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 opacity-60 cursor-not-allowed"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-1.5 rounded-md bg-slate-200 text-slate-400 flex-shrink-0">
                            <Building2 className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-500 truncate">
                              {clinic.name}
                            </p>
                            <p className="text-xs text-slate-400 flex items-center gap-1">
                              <Lock className="h-3 w-3" />
                              {clinic.role} — no dashboard access
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </ExpandableGroupCard>
              </div>
            )}

            {/* Multi-org accordion — spans full width */}
            {hasMultipleOrgs && (
              <div
                className="sm:col-span-2"
                style={{
                  animation: `fadeSlideIn 0.4s ease-out ${
                    (cards.length + (hasMultipleClinics ? 1 : 0)) * 60
                  }ms backwards`,
                }}
              >
                <ExpandableGroupCard
                  icon={<Network className="h-6 w-6" />}
                  title="My Organizations"
                  count={options.organizations.length}
                  accordionValue="organizations"
                >
                  {options.organizations.map((org) => {
                    const hasAccess = orgHasAccess(
                      org.canAccessDashboard,
                      org.role
                    );
                    return hasAccess ? (
                      <button
                        key={org.orgUid}
                        onClick={() => router.push(org.href)}
                        className="group w-full flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 text-left transition-all duration-200 hover:border-teal-300 hover:bg-teal-50/40 hover:shadow-sm active:scale-[0.99]"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-1.5 rounded-md bg-teal-100 text-teal-600 flex-shrink-0">
                            <Network className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-800 group-hover:text-teal-700 truncate">
                              {org.name}
                            </p>
                            <p className="text-xs text-slate-500">{org.role}</p>
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-teal-500 group-hover:translate-x-0.5 transition-all duration-200 flex-shrink-0" />
                      </button>
                    ) : (
                      <div
                        key={org.orgUid}
                        className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 opacity-60 cursor-not-allowed"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-1.5 rounded-md bg-slate-200 text-slate-400 flex-shrink-0">
                            <Network className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-500 truncate">
                              {org.name}
                            </p>
                            <p className="text-xs text-slate-400 flex items-center gap-1">
                              <Lock className="h-3 w-3" />
                              {org.role} — no dashboard access
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </ExpandableGroupCard>
              </div>
            )}
          </div>
        </div>
      </div>

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
    </div>
  );
}

/* ── Helper sub-components ───────────────────────────────────────── */

function DisabledCard({
  card,
  index,
}: {
  card: DashboardCard;
  index: number;
}) {
  return (
    <div
      className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-5 opacity-60 cursor-not-allowed"
      style={{ animation: `fadeSlideIn 0.4s ease-out ${index * 60}ms backwards` }}
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
          <p className="font-semibold text-slate-500 truncate">{card.title}</p>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
            <Lock className="h-3 w-3 flex-shrink-0" />
            {card.disabledReason}
          </p>
        </div>
      </div>
    </div>
  );
}

function ActiveCard({
  card,
  index,
}: {
  card: DashboardCard;
  index: number;
}) {
  return (
    <button
      onClick={card.onClick}
      className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 text-left transition-all duration-300 hover:border-teal-300 hover:shadow-lg hover:shadow-teal-100/50 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
      style={{ animation: `fadeSlideIn 0.4s ease-out ${index * 60}ms backwards` }}
    >
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
  );
}

function ExpandableGroupCard({
  icon,
  title,
  count,
  accordionValue,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  count: number;
  accordionValue: string;
  children: React.ReactNode;
}) {
  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem
        value={accordionValue}
        className="rounded-xl border border-slate-200 bg-white overflow-hidden data-[state=open]:shadow-lg data-[state=open]:border-teal-300 transition-all duration-300"
      >
        <AccordionTrigger className="px-5 py-4 hover:no-underline group">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="p-2.5 rounded-lg bg-gradient-to-br from-teal-100 to-teal-50 text-teal-600 flex-shrink-0 transition-all duration-300 group-hover:from-teal-200 group-hover:to-teal-100">
              {icon}
            </div>
            <div className="min-w-0 text-left">
              <p className="font-semibold text-slate-800 group-hover:text-teal-700 transition-colors duration-300">
                {title}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {count} memberships — click to expand
              </p>
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-5 pb-4 pt-0">
          <div className="space-y-2 pt-2 border-t border-slate-100">
            {children}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}


