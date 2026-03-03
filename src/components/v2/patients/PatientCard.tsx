"use client";

import { memo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Heart, AlertCircle, Pill, ChevronRight, User, CheckCircle2, Clock, XCircle } from "lucide-react";
import { calculateAge, formatBloodType } from "@/lib/utils";
import type { ClinicPatientListItem } from "@/types/clinic-patients-v2.types";
import { PatientAIInsightButton } from "./PatientAIInsightButton";

interface PatientCardProps {
  patient: ClinicPatientListItem;
  clinicUid: string;
  viewMode?: "list" | "grid";
  /** When true, shows the AI Patient Insight button (healthcare providers only) */
  isProvider?: boolean;
}

/** Maps ProfileCompletionStatus enum values to a visual badge */
function ProfileStatusBadge({ status }: { status: string }) {
  if (status === "COMPLETE") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 dark:text-emerald-400">
        <CheckCircle2 className="h-3 w-3" />
        Complete
      </span>
    );
  }
  if (status === "PARTIAL") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-600 dark:text-amber-400">
        <Clock className="h-3 w-3" />
        Partial
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
      <XCircle className="h-3 w-3" />
      Incomplete
    </span>
  );
}

export const PatientCard = memo(function PatientCard({
  patient,
  clinicUid,
  viewMode = "list",
  isProvider = false,
}: PatientCardProps) {
  const {
    profileCompletionStatus,
    Clinic: { id: clinicId },
    Patient: {
      id: patientId,
      dob,
      gender,
      firstName,
      middleName,
      lastName,
      suffix,
      bloodType,
      nickname,
      picture,
      email,
    },
    stats = { appointments: 0, conditions: 0, medications: 0 },
  } = patient;

  const initials = `${firstName?.charAt(0) ?? ""}${lastName?.charAt(0) ?? ""}`;
  const fullName = `${firstName ?? ""} ${middleName ? middleName + " " : ""}${lastName ?? ""}${suffix ? " " + suffix : ""}`.trim();
  const age = calculateAge(dob) ?? 0;
  const genderLabel = gender
    ? `${gender.charAt(0).toUpperCase()}${gender.slice(1).toLowerCase()}`
    : null;

  const profileHref = `/v2/clinic/${clinicUid}/patients/${patientId}`;

  /* ── Grid View ─────────────────────────────────────────────────────────── */
  if (viewMode === "grid") {
    return (
      <div className="group rounded-2xl border border-white/40 dark:border-slate-700/40 bg-white/30 dark:bg-slate-800/30 backdrop-blur-xl p-5 space-y-4 shadow-sm hover:shadow-md hover:border-primary/40 transition-all duration-200">
        <Link href={profileHref} className="block space-y-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-14 w-14 rounded-xl border border-white/50 dark:border-slate-600/50 flex-shrink-0">
              {picture ? (
                <Image
                  src={picture}
                  alt={nickname ?? fullName}
                  width={56}
                  height={56}
                  className="object-cover"
                />
              ) : (
                <AvatarFallback className="rounded-xl text-sm font-semibold bg-primary/10 text-primary">
                  {initials || <User className="h-5 w-5" />}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors">
                {fullName}
              </p>
              <p className="text-xs text-muted-foreground truncate">{email}</p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {genderLabel && (
                  <span className="text-xs text-muted-foreground">
                    {genderLabel}
                  </span>
                )}
                <span className="text-xs text-muted-foreground">• {age}y</span>
                {bloodType && (
                  <Badge
                    variant="outline"
                    className="text-xs font-semibold bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800"
                  >
                    {formatBloodType(bloodType)}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-2">
            <StatBadge
              icon={<Heart className="h-3.5 w-3.5" />}
              label="Appts"
              value={stats.appointments}
              colorClass="text-rose-500"
            />
            <StatBadge
              icon={<AlertCircle className="h-3.5 w-3.5" />}
              label="Conditions"
              value={stats.conditions}
              colorClass="text-amber-500"
            />
            <StatBadge
              icon={<Pill className="h-3.5 w-3.5" />}
              label="Meds"
              value={stats.medications}
              colorClass="text-blue-500"
            />
          </div>

          <div className="flex items-center justify-between">
            <ProfileStatusBadge status={profileCompletionStatus} />
            <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors flex items-center gap-0.5">
              View Profile
              <ChevronRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </Link>

        {/* AI Insight button – only for healthcare providers */}
        {isProvider && (
          <div className="pt-1 border-t border-white/20 dark:border-slate-700/30">
            <PatientAIInsightButton
              patientId={patientId}
              clinicId={clinicId}
              patientName={fullName}
              size="sm"
              className="w-full"
            />
          </div>
        )}
      </div>
    );
  }

  /* ── List View ─────────────────────────────────────────────────────────── */
  return (
    <div
      className="group flex items-center gap-3 sm:gap-4 px-4 py-3 rounded-xl border border-white/30 dark:border-slate-700/30 bg-white/20 dark:bg-slate-800/20 backdrop-blur-sm shadow-sm hover:shadow-md hover:border-primary/40 hover:bg-white/40 dark:hover:bg-slate-700/40 transition-all duration-200"
      style={{ borderLeftWidth: 4, borderLeftColor: "hsl(var(--primary) / 0.25)" }}
    >
      {/* Main clickable area */}
      <Link href={profileHref} className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
        {/* Avatar */}
        <Avatar className="h-12 w-12 rounded-xl border border-white/50 dark:border-slate-600/50 flex-shrink-0">
          {picture ? (
            <Image
              src={picture}
              alt={nickname ?? fullName}
              width={48}
              height={48}
              className="object-cover"
            />
          ) : (
            <AvatarFallback className="rounded-xl text-xs font-semibold bg-primary/10 text-primary">
              {initials || <User className="h-4 w-4" />}
            </AvatarFallback>
          )}
        </Avatar>

        {/* Name & Meta */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm sm:text-base line-clamp-1 group-hover:text-primary transition-colors">
            {fullName}
          </p>
          <p className="text-xs text-muted-foreground truncate">{email}</p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {genderLabel && (
              <span className="text-xs text-muted-foreground">{genderLabel}</span>
            )}
            <span className="text-xs text-muted-foreground">• {age}y</span>
            {bloodType && (
              <Badge
                variant="outline"
                className="text-xs font-semibold bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800"
              >
                {formatBloodType(bloodType)}
              </Badge>
            )}
            <ProfileStatusBadge status={profileCompletionStatus} />
          </div>
        </div>

        {/* Stats — hidden on mobile */}
        <div className="hidden md:flex gap-4 lg:gap-6 flex-shrink-0">
          <StatBadge
            icon={<Heart className="h-4 w-4" />}
            label="Appointments"
            value={stats.appointments}
            colorClass="text-rose-500"
          />
          <StatBadge
            icon={<AlertCircle className="h-4 w-4" />}
            label="Conditions"
            value={stats.conditions}
            colorClass="text-amber-500"
          />
          <StatBadge
            icon={<Pill className="h-4 w-4" />}
            label="Medications"
            value={stats.medications}
            colorClass="text-blue-500"
          />
        </div>
      </Link>

      {/* AI Insight button – only for healthcare providers */}
      {isProvider && (
        <PatientAIInsightButton
          patientId={patientId}
          clinicId={clinicId}
          patientName={fullName}
          size="sm"
          className="shrink-0"
        />
      )}

      {/* Chevron */}
      <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary flex-shrink-0 transition-colors" />
    </div>
  );
});

/* ─── Utility sub-component ──────────────────────────────────────────────── */

function StatBadge({
  icon,
  label,
  value,
  colorClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  colorClass: string;
}) {
  return (
    <div className="text-center">
      <div className={`flex items-center justify-center gap-1 mb-0.5 ${colorClass}`}>
        {icon}
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
      <p className="font-bold text-base leading-none">{value}</p>
    </div>
  );
}
