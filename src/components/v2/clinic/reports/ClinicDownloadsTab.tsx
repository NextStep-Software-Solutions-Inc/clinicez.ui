"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  CalendarIcon,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
} from "lucide-react";
import { endOfDay, format, startOfDay } from "date-fns";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn, calculateAge } from "@/lib/utils";
import { exportXLSX, type XLSXExportData } from "@/lib/file-manipulation";
import { toast } from "sonner";
import { getActionErrorMessage } from "@/lib/action-error";
import { getClinicExportDataAction, type GetClinicExportData } from "@/actions/clinics/clinic-report-download.action";

/* ─────────────────────────────────────────────────────── */
/*  Types                                                   */
/* ─────────────────────────────────────────────────────── */

type Maybe<T> = T | null | undefined;

type ExportData = NonNullable<GetClinicExportData["data"]>;
type ConsultationRecord = ExportData["consultations"][number];
type AppointmentRecord = ExportData["appointments"][number];
type ConsultationTicketHPEntry = ConsultationRecord["ConsultationTicketHPs"][number];
type ConsultationHPRecord = NonNullable<ConsultationTicketHPEntry["HealthCareProvider"]>;
type HPRecord = ConsultationHPRecord;

type HPProfileRecord = NonNullable<ConsultationHPRecord["HPProfile"]>;

type OrgMemberLike = {
  OrganizationRole?: Maybe<{ name?: Maybe<string> }>;
};

type BasicUserRecord = {
  firstName?: Maybe<string>;
  middleName?: Maybe<string>;
  lastName?: Maybe<string>;
  suffix?: Maybe<string>;
  OrganizationMembers?: Maybe<OrgMemberLike[]>;
};

/* ─────────────────────────────────────────────────────── */
/*  Zod schemas                                             */
/* ─────────────────────────────────────────────────────── */

const reportFilterSchema = z.object({
  startDate: z.date({ required_error: "Start date is required" }),
  endDate: z.date({ required_error: "End date is required" }),
  reportType: z.enum(["ALL", "CONSULTATIONS", "APPOINTMENTS"]).default("ALL"),
  gender: z.enum(["ALL", "MALE", "FEMALE", "OTHER"]).default("ALL"),
  status: z.enum(["ALL", "PENDING", "PROCESSING", "RESOLVED"]).default("ALL"),
});

type ReportFilterValues = z.infer<typeof reportFilterSchema>;

const bulkEKASSchema = z
  .object({
    startDate: z.date({ required_error: "Start date is required" }),
    endDate: z.date({ required_error: "End date is required" }),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: "End date must be after or equal to start date",
    path: ["endDate"],
  });

type BulkEKASFormValues = z.infer<typeof bulkEKASSchema>;

/* ─────────────────────────────────────────────────────── */
/*  Constants                                               */
/* ─────────────────────────────────────────────────────── */

const REPORT_TYPE_OPTIONS = [
  { value: "ALL", label: "Consolidated Census (All Encounters - No Duplicates)" },
  { value: "CONSULTATIONS", label: "Consultations Only" },
  { value: "APPOINTMENTS", label: "Appointments Only" },
] as const;

const GENDER_OPTIONS = [
  { value: "ALL", label: "All Genders" },
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
] as const;

const STATUS_OPTIONS = [
  { value: "ALL", label: "All Statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "PROCESSING", label: "Processing" },
  { value: "RESOLVED", label: "Resolved" },
] as const;

const RESOLVED_KEYWORDS = new Set(["RESOLVED", "DONE"]);
const ROUTED_KEYWORDS = new Set(["PROCESSING", "ROUTED"]);
const NURSE_ROLE_KEYWORDS = [
  "nurse",
  "head nurse",
  "staff nurse",
  "registered nurse",
  "charge nurse",
] as const;
const DOCTOR_ROLE_KEYWORDS = [
  "doctor",
  "physician",
  "medical doctor",
  "attending physician",
  "consultant",
  "dentist",
] as const;
const DOCTOR_TITLE_KEYWORDS = [
  "dr",
  "dr.",
  "doctor",
  "physician",
  "md",
  "dmd",
  "dentist",
  "consultant",
] as const;
const DOCTOR_FIELD_KEYWORDS = [
  "doctor",
  "physician",
  "dentist",
  "medical",
  "md",
  "dmd",
  "consultant",
  "surgeon",
  "ob-gyn",
  "pediatrician",
] as const;
const DOCTOR_SUFFIX_KEYWORDS = ["md", "m.d", "dmd", "d.o", "do"] as const;

/* ─────────────────────────────────────────────────────── */
/*  Helper functions                                        */
/* ─────────────────────────────────────────────────────── */

function matchesKeyword(
  value: Maybe<string>,
  keywords: readonly string[]
): boolean {
  if (!value) return false;
  const normalized = value.toLowerCase().trim();
  if (!normalized.length) return false;
  return keywords.some((kw) => normalized.includes(kw));
}

function hasRoleMatch(
  members: Maybe<OrgMemberLike[]>,
  keywords: readonly string[]
): boolean {
  if (!members) return false;
  return members.some((m) =>
    matchesKeyword(m.OrganizationRole?.name ?? null, keywords)
  );
}

function formatUserName(user?: Maybe<BasicUserRecord>): string {
  if (!user) return "-";
  const parts = [user.firstName, user.middleName, user.lastName, user.suffix]
    .map((p) => p?.trim())
    .filter((v): v is string => Boolean(v?.length));
  return parts.length ? parts.join(" ") : "-";
}

function formatHPName(hp?: Maybe<ConsultationHPRecord>): string {
  if (!hp) return "-";
  const profile = hp.HPProfile as Maybe<HPProfileRecord>;
  const profileParts = [profile?.title, profile?.name, profile?.suffix]
    .map((p) => p?.trim())
    .filter((v): v is string => Boolean(v?.length));
  if (profileParts.length) return profileParts.join(" ");
  return formatUserName(hp.User);
}

function isDoctorHP(hp: Maybe<ConsultationHPRecord>): boolean {
  if (!hp) return false;
  if (hasRoleMatch(hp.User?.OrganizationMembers ?? null, DOCTOR_ROLE_KEYWORDS))
    return true;
  if (matchesKeyword(hp.User?.suffix ?? null, DOCTOR_SUFFIX_KEYWORDS))
    return true;
  if (
    matchesKeyword(
      (hp.HPProfile as Maybe<HPProfileRecord>)?.title ?? null,
      DOCTOR_TITLE_KEYWORDS
    )
  )
    return true;
  const profileName = (hp.HPProfile as Maybe<HPProfileRecord>)?.name ?? null;
  if (profileName) {
    const n = profileName.toLowerCase().trim();
    if (
      n.startsWith("dr ") ||
      n.startsWith("dr.") ||
      n.endsWith(" md") ||
      n.includes(" md ") ||
      n.includes(" dmd")
    )
      return true;
  }
  const specialties = (hp.HPProfile as Maybe<HPProfileRecord>)?.specialties;
  if (specialties?.some((s) => matchesKeyword(s ?? null, DOCTOR_FIELD_KEYWORDS)))
    return true;
  return false;
}

function isNurseHP(hp: Maybe<ConsultationHPRecord>): boolean {
  if (!hp) return false;
  if (hasRoleMatch(hp.User?.OrganizationMembers ?? null, NURSE_ROLE_KEYWORDS))
    return true;
  if (
    matchesKeyword(
      (hp.HPProfile as Maybe<HPProfileRecord>)?.title ?? null,
      ["nurse", "rn", "registered nurse"]
    )
  )
    return true;
  const specialties = (hp.HPProfile as Maybe<HPProfileRecord>)?.specialties;
  if (specialties?.some((s) => matchesKeyword(s ?? null, ["nurse", "rn", "registered nurse"])))
    return true;
  return false;
}

function normalizeStatus(raw: Maybe<string>): string {
  const upper = raw?.toUpperCase?.() ?? "";
  if (RESOLVED_KEYWORDS.has(upper)) return "Done";
  if (ROUTED_KEYWORDS.has(upper)) return "Routed";
  if (!raw?.trim()) return "-";
  return `${raw.trim().charAt(0).toUpperCase()}${raw.trim().slice(1).toLowerCase()}`;
}

/* ─────────────────────────────────────────────────────── */
/*  Export helpers                                          */
/* ─────────────────────────────────────────────────────── */
function getPatientUser(
  user?: Maybe<
    BasicUserRecord & {
      dob?: Maybe<Date | string>;
      gender?: Maybe<string>;
      StudentRecords?: Maybe<
        Array<{
          Program?: Maybe<{ name?: Maybe<string> }>;
          OrganizationYearLevel?: Maybe<{ name?: Maybe<string> }>;
        }>
      >;
      OrganizationMembers?: Maybe<
        Array<{
          OrganizationRole?: Maybe<{ name?: Maybe<string> }>;
          Organization?: Maybe<{ name?: Maybe<string> }>;
        }>
      >;
    }
  >
) {
  const programName = user?.StudentRecords?.[0]?.Program?.name;
  const yearLevel = user?.StudentRecords?.[0]?.OrganizationYearLevel?.name;
  const deptYearLevel =
    [programName, yearLevel].filter(Boolean).join(" / ") || "-";

  return {
    name: formatUserName(user),
    age: calculateAge(user?.dob) ?? "-",
    gender: user?.gender ?? "-",
    client: user?.OrganizationMembers?.[0]?.OrganizationRole?.name ?? "-",
    campus: user?.OrganizationMembers?.[0]?.Organization?.name ?? "-",
    deptYearLevel,
  };
}

function getDoctorFromHPs(hpList: ConsultationTicketHPEntry[]) {
  const providers = hpList
    .map((h) => h.HealthCareProvider)
    .filter((h): h is HPRecord => h !== null && h !== undefined);

  const nurseProvider = providers.find(isNurseHP);
  const doctorProviders = providers.filter(isDoctorHP);
  const fallback = providers.filter((p) => p && p !== nurseProvider);
  const primaryDoctor =
    doctorProviders[0] ??
    fallback.find((p) =>
      matchesKeyword(p.User?.suffix ?? null, DOCTOR_SUFFIX_KEYWORDS)
    ) ??
    (fallback.length === 1 ? fallback[0] : undefined);

  return {
    primaryDoctorName: primaryDoctor ? formatHPName(primaryDoctor) : "-",
    nurseProvider,
  };
}

function getNursePreAssessment(
  preNotes?: Maybe<
    Array<{
      assessment?: Maybe<string>;
      CreatedBy?: Maybe<BasicUserRecord>;
    }>
  >,
  receivedBy?: Maybe<BasicUserRecord>,
  nurseProvider?: Maybe<ConsultationHPRecord>
) {
  const latestNurseNote =
    preNotes?.find((n) =>
      hasRoleMatch(n.CreatedBy?.OrganizationMembers ?? null, NURSE_ROLE_KEYWORDS)
    ) ?? preNotes?.[0];

  const nurseFromNote = latestNurseNote?.CreatedBy
    ? formatUserName(latestNurseNote.CreatedBy as BasicUserRecord)
    : "-";

  const receivedIsNurse = hasRoleMatch(
    receivedBy?.OrganizationMembers ?? null,
    NURSE_ROLE_KEYWORDS
  );

  const nurseIncharge =
    nurseFromNote !== "-"
      ? nurseFromNote
      : receivedIsNurse
        ? formatUserName(receivedBy as BasicUserRecord)
        : nurseProvider
          ? formatHPName(nurseProvider)
          : "-";

  return {
    nurseIncharge,
    nursingImpression: latestNurseNote?.assessment?.trim() || "-",
  };
}

function getAppointmentDoctor(
  appt?: Maybe<{
    AppointmentTag?: Maybe<
      Array<{
        HealthcareProvider?: Maybe<{
          HPProfile?: Maybe<{
            title?: Maybe<string>;
            name?: Maybe<string>;
            suffix?: Maybe<string>;
          }>;
          User?: Maybe<BasicUserRecord>;
        }>;
      }>
    >;
    AppointmentRouting?: Maybe<
      Array<{
        status?: Maybe<string>;
        RoutedTo?: Maybe<{
          HPProfile?: Maybe<{
            title?: Maybe<string>;
            name?: Maybe<string>;
            suffix?: Maybe<string>;
          }>;
          User?: Maybe<BasicUserRecord>;
        }>;
      }>
    >;
  }>
): string {
  if (!appt) return "-";

  // 1. Tagged Doctor from AppointmentTag
  const taggedHPs = (appt.AppointmentTag ?? [])
    .map((t) => t.HealthcareProvider)
    .filter(Boolean);

  if (taggedHPs.length > 0) {
    const formatted = taggedHPs
      .map((hp) => {
        const parts = [
          hp?.HPProfile?.title,
          hp?.HPProfile?.name,
          hp?.HPProfile?.suffix,
        ]
          .map((p) => p?.trim())
          .filter((v): v is string => Boolean(v?.length));
        if (parts.length) return parts.join(" ");
        if (hp?.User) return formatUserName(hp.User as BasicUserRecord);
        return "-";
      })
      .filter((name) => name !== "-");

    if (formatted.length > 0) return formatted.join(", ");
  }

  // 2. Assigned / Routed Doctor from AppointmentRouting (ACCEPTED, PENDING, or any active)
  const routings = appt.AppointmentRouting ?? [];
  const acceptedRouting = routings.find((r) => r.status === "ACCEPTED");
  const pendingRouting = routings.find((r) => r.status === "PENDING");
  const activeRouting = acceptedRouting ?? pendingRouting ?? routings[0];

  const routedHP = activeRouting?.RoutedTo;
  if (routedHP) {
    const profileParts = [
      routedHP.HPProfile?.title,
      routedHP.HPProfile?.name,
      routedHP.HPProfile?.suffix,
    ]
      .map((p) => p?.trim())
      .filter((v): v is string => Boolean(v?.length));
    if (profileParts.length) return profileParts.join(" ");
    if (routedHP.User) return formatUserName(routedHP.User as BasicUserRecord);
  }

  return "-";
}

function buildConsultationRows(
  consultations: ExportData["consultations"],
  filters: ReportFilterValues
): XLSXExportData[] {
  const startBoundary = startOfDay(filters.startDate);
  const endBoundary = endOfDay(filters.endDate);

  return consultations
    .filter((ticket) => {
      const date = new Date(ticket.createdAt);
      if (date < startBoundary || date > endBoundary) return false;

      const rawUser =
        ticket.Appointment?.Requesters[0]?.User ?? ticket.ClinicPatient?.Patient;
      if (filters.gender !== "ALL" && rawUser?.gender !== filters.gender)
        return false;

      const statusRaw =
        ticket.ConsultationTicketAttribute?.status ??
        ticket.Appointment?.AppointmentAttribute?.status;
      if (filters.status !== "ALL") {
        const normalized = statusRaw?.toUpperCase?.() ?? "";
        const isResolved = RESOLVED_KEYWORDS.has(normalized);
        const isProcessing = ROUTED_KEYWORDS.has(normalized);
        if (
          (filters.status === "RESOLVED" && !isResolved) ||
          (filters.status === "PROCESSING" && !isProcessing) ||
          (filters.status === "PENDING" && (isResolved || isProcessing))
        )
          return false;
      }
      return true;
    })
    .map((ticket) => {
      const rawUser =
        ticket.Appointment?.Requesters[0]?.User ?? ticket.ClinicPatient?.Patient;
      const patient = getPatientUser(rawUser);

      const attr = ticket.Appointment?.AppointmentAttribute;
      const dateSource = attr?.date ?? ticket.createdAt;
      const date = dateSource ? format(new Date(dateSource), "yyyy-MM-dd") : "-";

      const statusRaw =
        ticket.ConsultationTicketAttribute?.status ?? attr?.status;
      const status = normalizeStatus(statusRaw);
      const isResolved = RESOLVED_KEYWORDS.has(statusRaw?.toUpperCase?.() ?? "");

      const { primaryDoctorName: hpDoctorName, nurseProvider } = getDoctorFromHPs(
        ticket.ConsultationTicketHPs
      );
      const apptDoctorName = getAppointmentDoctor(ticket.Appointment);
      const primaryDoctorName =
        hpDoctorName !== "-" ? hpDoctorName : apptDoctorName;
      const { nurseIncharge, nursingImpression } = getNursePreAssessment(
        ticket.Appointment?.PreAssessmentNotes,
        attr?.ReceivedBy,
        nurseProvider
      );

      const diagnosisNote = ticket.ConsultationNotes?.find(
        (n) => n.section?.toLowerCase() === "assessment"
      );

      const systemName =
        ticket.System?.name ?? attr?.System?.name ?? "-";

      return {
        Type: ticket.Appointment ? "Appointment -> Consultation" : "Direct Consultation",
        ID: ticket.id,
        "Pair ID": ticket.Appointment?.id ?? "-",
        Date: date,
        "Patient Name": patient.name,
        Age: patient.age,
        Gender: patient.gender,
        Client: patient.client,
        "Service Category": attr?.Service?.ServiceCategory?.name ?? "-",
        Campus: patient.campus,
        "Dept/Year Level": patient.deptYearLevel,
        Status: status,
        "Appointment Type": attr?.AppointmentMode?.name ?? "-",
        "Consultation Type": attr?.AppointmentType?.name ?? "-",
        "Purpose/Chief Complaint":
          ticket.Appointment?.complaint ?? ticket.subject ?? "-",
        "Service Offered": attr?.Service?.name ?? "-",
        System: systemName,
        "Nurse In-charge": nurseIncharge,
        "Nursing Impression": nursingImpression,
        "Tagged Doctor": primaryDoctorName,
        "Doctor DX": diagnosisNote?.content?.trim() ?? "-",
        "Resolved By": isResolved ? primaryDoctorName : "-",
        Subject: ticket.subject ?? "-",
        "Assigned To": primaryDoctorName,
        "Has Consultation": "Yes",
        "Has Appointment": ticket.Appointment != null ? "Yes" : "No",
      };
    });
}

function buildAppointmentRows(
  appointments: ExportData["appointments"],
  filters: ReportFilterValues
): XLSXExportData[] {
  const startBoundary = startOfDay(filters.startDate);
  const endBoundary = endOfDay(filters.endDate);

  return appointments
    .filter((appt) => {
      const date = new Date(appt.createdAt);
      if (date < startBoundary || date > endBoundary) return false;

      const rawUser = appt.Requesters[0]?.User;
      if (filters.gender !== "ALL" && rawUser?.gender !== filters.gender)
        return false;

      const statusRaw = appt.AppointmentAttribute?.status;
      if (filters.status !== "ALL") {
        const normalized = statusRaw?.toUpperCase?.() ?? "";
        const isResolved = RESOLVED_KEYWORDS.has(normalized);
        const isProcessing = ROUTED_KEYWORDS.has(normalized);
        if (
          (filters.status === "RESOLVED" && !isResolved) ||
          (filters.status === "PROCESSING" && !isProcessing) ||
          (filters.status === "PENDING" && (isResolved || isProcessing))
        )
          return false;
      }
      return true;
    })
    .map((appt) => {
      const rawUser = appt.Requesters[0]?.User;
      const patient = getPatientUser(rawUser);

      const attr = appt.AppointmentAttribute;
      const dateSource = attr?.date ?? appt.createdAt;
      const date = dateSource ? format(new Date(dateSource), "yyyy-MM-dd") : "-";

      const linkedConsult = appt.ConsultationTickets?.[0];
      const consultDoctorInfo = linkedConsult
        ? getDoctorFromHPs(linkedConsult.ConsultationTicketHPs)
        : null;

      const statusRaw = linkedConsult?.ConsultationTicketAttribute?.status ?? attr?.status;
      const status = normalizeStatus(statusRaw);
      const isResolved = RESOLVED_KEYWORDS.has(statusRaw?.toUpperCase?.() ?? "");

      const routedDoctor = getAppointmentDoctor(appt);
      const primaryDoctorName =
        consultDoctorInfo?.primaryDoctorName !== "-"
          ? consultDoctorInfo?.primaryDoctorName ?? "-"
          : routedDoctor;

      const { nurseIncharge, nursingImpression } = getNursePreAssessment(
        appt.PreAssessmentNotes,
        attr?.ReceivedBy,
        consultDoctorInfo?.nurseProvider
      );

      const diagnosisNote = linkedConsult?.ConsultationNotes?.find(
        (n) => n.section?.toLowerCase() === "assessment"
      );

      const systemName = attr?.System?.name ?? linkedConsult?.System?.name ?? "-";

      return {
        Type: linkedConsult ? "Appointment -> Consultation" : "Appointment Only",
        ID: appt.id,
        "Pair ID":
          appt.ConsultationTickets.length > 0
            ? appt.ConsultationTickets.map((t) => t.id).join(", ")
            : "-",
        Date: date,
        "Patient Name": patient.name,
        Age: patient.age,
        Gender: patient.gender,
        Client: patient.client,
        "Service Category": attr?.Service?.ServiceCategory?.name ?? "-",
        Campus: patient.campus,
        "Dept/Year Level": patient.deptYearLevel,
        Status: status,
        "Appointment Type": attr?.AppointmentMode?.name ?? "-",
        "Consultation Type": attr?.AppointmentType?.name ?? "-",
        "Purpose/Chief Complaint": appt.complaint ?? appt.subject ?? "-",
        "Service Offered": attr?.Service?.name ?? "-",
        System: systemName,
        "Nurse In-charge": nurseIncharge,
        "Nursing Impression": nursingImpression,
        "Tagged Doctor": primaryDoctorName,
        "Doctor DX": diagnosisNote?.content?.trim() ?? "-",
        "Resolved By": isResolved ? primaryDoctorName : "-",
        Subject: appt.subject ?? "-",
        "Assigned To": primaryDoctorName,
        "Has Consultation":
          appt.ConsultationTickets.length > 0 ? "Yes" : "No",
        "Has Appointment": "Yes",
      };
    });
}

function buildConsolidatedRows(
  consultations: ExportData["consultations"],
  appointments: ExportData["appointments"],
  filters: ReportFilterValues
): XLSXExportData[] {
  const startBoundary = startOfDay(filters.startDate);
  const endBoundary = endOfDay(filters.endDate);

  const filteredConsultations = consultations.filter((ticket) => {
    const attr = ticket.Appointment?.AppointmentAttribute;
    const date = new Date(attr?.date ?? ticket.createdAt);
    if (date < startBoundary || date > endBoundary) return false;

    const rawUser = ticket.Appointment?.Requesters[0]?.User ?? ticket.ClinicPatient?.Patient;
    if (filters.gender !== "ALL" && rawUser?.gender !== filters.gender) return false;

    const statusRaw = ticket.ConsultationTicketAttribute?.status ?? attr?.status;
    if (filters.status !== "ALL") {
      const normalized = statusRaw?.toUpperCase?.() ?? "";
      const isResolved = RESOLVED_KEYWORDS.has(normalized);
      const isProcessing = ROUTED_KEYWORDS.has(normalized);
      if (
        (filters.status === "RESOLVED" && !isResolved) ||
        (filters.status === "PROCESSING" && !isProcessing) ||
        (filters.status === "PENDING" && (isResolved || isProcessing))
      )
        return false;
    }
    return true;
  });

  const filteredAppointments = appointments.filter((appt) => {
    const attr = appt.AppointmentAttribute;
    const date = new Date(attr?.date ?? appt.createdAt);
    if (date < startBoundary || date > endBoundary) return false;

    const rawUser = appt.Requesters[0]?.User;
    if (filters.gender !== "ALL" && rawUser?.gender !== filters.gender) return false;

    const statusRaw = attr?.status;
    if (filters.status !== "ALL") {
      const normalized = statusRaw?.toUpperCase?.() ?? "";
      const isResolved = RESOLVED_KEYWORDS.has(normalized);
      const isProcessing = ROUTED_KEYWORDS.has(normalized);
      if (
        (filters.status === "RESOLVED" && !isResolved) ||
        (filters.status === "PROCESSING" && !isProcessing) ||
        (filters.status === "PENDING" && (isResolved || isProcessing))
      )
        return false;
    }
    return true;
  });

  const pairedApptIds = new Set<number>();
  const rows: { row: XLSXExportData; sortTime: number }[] = [];

  // 1. Process consultations (merges with appointment if paired, or stands alone as direct consult)
  for (const ticket of filteredConsultations) {
    const appt = ticket.Appointment;
    if (appt?.id) {
      pairedApptIds.add(appt.id);
    }

    const rawUser = appt?.Requesters[0]?.User ?? ticket.ClinicPatient?.Patient;
    const patient = getPatientUser(rawUser);

    const attr = appt?.AppointmentAttribute;
    const dateSource = attr?.date ?? ticket.createdAt;
    const dateObj = new Date(dateSource);
    const dateStr = dateSource ? format(dateObj, "yyyy-MM-dd") : "-";

    const statusRaw = ticket.ConsultationTicketAttribute?.status ?? attr?.status;
    const status = normalizeStatus(statusRaw);
    const isResolved = RESOLVED_KEYWORDS.has(statusRaw?.toUpperCase?.() ?? "");

    const { primaryDoctorName: hpDoctorName, nurseProvider } = getDoctorFromHPs(
      ticket.ConsultationTicketHPs
    );
    const apptDoctorName = getAppointmentDoctor(appt);
    const primaryDoctorName =
      hpDoctorName !== "-" ? hpDoctorName : apptDoctorName;
    const { nurseIncharge, nursingImpression } = getNursePreAssessment(
      appt?.PreAssessmentNotes,
      attr?.ReceivedBy,
      nurseProvider
    );

    const diagnosisNote = ticket.ConsultationNotes?.find(
      (n) => n.section?.toLowerCase() === "assessment"
    );

    const systemName = ticket.System?.name ?? attr?.System?.name ?? "-";

    rows.push({
      row: {
        Type: appt ? "Appointment -> Consultation" : "Direct Consultation",
        ID: ticket.id,
        "Pair ID": appt?.id ?? "-",
        Date: dateStr,
        "Patient Name": patient.name,
        Age: patient.age,
        Gender: patient.gender,
        Client: patient.client,
        "Service Category": attr?.Service?.ServiceCategory?.name ?? "-",
        Campus: patient.campus,
        "Dept/Year Level": patient.deptYearLevel,
        Status: status,
        "Appointment Type": attr?.AppointmentMode?.name ?? "-",
        "Consultation Type": attr?.AppointmentType?.name ?? "-",
        "Purpose/Chief Complaint": appt?.complaint ?? ticket.subject ?? "-",
        "Service Offered": attr?.Service?.name ?? "-",
        System: systemName,
        "Nurse In-charge": nurseIncharge,
        "Nursing Impression": nursingImpression,
        "Tagged Doctor": primaryDoctorName,
        "Doctor DX": diagnosisNote?.content?.trim() ?? "-",
        "Resolved By": isResolved ? primaryDoctorName : "-",
        Subject: ticket.subject ?? "-",
        "Assigned To": primaryDoctorName,
        "Has Consultation": "Yes",
        "Has Appointment": appt != null ? "Yes" : "No",
      },
      sortTime: dateObj.getTime(),
    });
  }

  // 2. Process appointments that were NOT paired with an already processed consultation
  for (const appt of filteredAppointments) {
    if (pairedApptIds.has(appt.id)) {
      // Already included in the consolidated report! Skip to prevent duplication!
      continue;
    }

    const rawUser = appt.Requesters[0]?.User;
    const patient = getPatientUser(rawUser);

    const attr = appt.AppointmentAttribute;
    const dateSource = attr?.date ?? appt.createdAt;
    const dateObj = new Date(dateSource);
    const dateStr = dateSource ? format(dateObj, "yyyy-MM-dd") : "-";

    const linkedConsult = appt.ConsultationTickets?.[0];
    const consultDoctorInfo = linkedConsult
      ? getDoctorFromHPs(linkedConsult.ConsultationTicketHPs)
      : null;

    const statusRaw = linkedConsult?.ConsultationTicketAttribute?.status ?? attr?.status;
    const status = normalizeStatus(statusRaw);
    const isResolved = RESOLVED_KEYWORDS.has(statusRaw?.toUpperCase?.() ?? "");

    const routedDoctor = getAppointmentDoctor(appt);
    const primaryDoctorName =
      consultDoctorInfo?.primaryDoctorName !== "-"
        ? consultDoctorInfo?.primaryDoctorName ?? "-"
        : routedDoctor;

    const { nurseIncharge, nursingImpression } = getNursePreAssessment(
      appt.PreAssessmentNotes,
      attr?.ReceivedBy,
      consultDoctorInfo?.nurseProvider
    );

    const diagnosisNote = linkedConsult?.ConsultationNotes?.find(
      (n) => n.section?.toLowerCase() === "assessment"
    );

    const systemName = attr?.System?.name ?? linkedConsult?.System?.name ?? "-";

    rows.push({
      row: {
        Type: linkedConsult ? "Appointment -> Consultation" : "Appointment Only",
        ID: appt.id,
        "Pair ID": linkedConsult?.id ?? "-",
        Date: dateStr,
        "Patient Name": patient.name,
        Age: patient.age,
        Gender: patient.gender,
        Client: patient.client,
        "Service Category": attr?.Service?.ServiceCategory?.name ?? "-",
        Campus: patient.campus,
        "Dept/Year Level": patient.deptYearLevel,
        Status: status,
        "Appointment Type": attr?.AppointmentMode?.name ?? "-",
        "Consultation Type": attr?.AppointmentType?.name ?? "-",
        "Purpose/Chief Complaint": appt.complaint ?? appt.subject ?? "-",
        "Service Offered": attr?.Service?.name ?? "-",
        System: systemName,
        "Nurse In-charge": nurseIncharge,
        "Nursing Impression": nursingImpression,
        "Tagged Doctor": primaryDoctorName,
        "Doctor DX": diagnosisNote?.content?.trim() ?? "-",
        "Resolved By": isResolved ? primaryDoctorName : "-",
        Subject: appt.subject ?? "-",
        "Assigned To": primaryDoctorName,
        "Has Consultation": linkedConsult ? "Yes" : "No",
        "Has Appointment": "Yes",
      },
      sortTime: dateObj.getTime(),
    });
  }

  // Sort descending by date
  rows.sort((a, b) => b.sortTime - a.sortTime);

  return rows.map((item) => item.row);
}

const COMBINED_COLUMNS = [
  "Type",
  "ID",
  "Pair ID",
  "Date",
  "Patient Name",
  "Age",
  "Gender",
  "Client",
  "Service Category",
  "Campus",
  "Dept/Year Level",
  "Status",
  "Appointment Type",
  "Consultation Type",
  "Purpose/Chief Complaint",
  "Service Offered",
  "System",
  "Nurse In-charge",
  "Nursing Impression",
  "Tagged Doctor",
  "Doctor DX",
  "Resolved By",
  "Subject",
  "Assigned To",
  "Has Consultation",
  "Has Appointment",
];

const CONSULTATION_COLUMNS = [
  "ID",
  "Date",
  "Patient Name",
  "Age",
  "Gender",
  "Client",
  "Service Category",
  "Campus",
  "Dept/Year Level",
  "Status",
  "Appointment Type",
  "Consultation Type",
  "Purpose/Chief Complaint",
  "Service Offered",
  "System",
  "Nurse In-charge",
  "Nursing Impression",
  "Tagged Doctor",
  "Doctor DX",
  "Resolved By",
];

const APPOINTMENT_COLUMNS = [
  "ID",
  "Date",
  "Patient Name",
  "Age",
  "Gender",
  "Client",
  "Service Category",
  "Campus",
  "Dept/Year Level",
  "Status",
  "Appointment Type",
  "Consultation Type",
  "Purpose/Chief Complaint",
  "Service Offered",
  "System",
  "Nurse In-charge",
  "Nursing Impression",
  "Tagged Doctor",
  "Doctor DX",
  "Resolved By",
  "Assigned To",
];

/* ─────────────────────────────────────────────────────── */
/*  ConsultationAppointmentReportCard                       */
/* ─────────────────────────────────────────────────────── */

function ConsultationAppointmentReportCard({ clinicUid }: { clinicUid: string }) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ReportFilterValues>({
    resolver: zodResolver(reportFilterSchema),
    defaultValues: {
      startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      endDate: new Date(),
      reportType: "ALL",
      gender: "ALL",
      status: "ALL",
    },
  });

  const handleDownload = async (values: ReportFilterValues) => {
    setIsLoading(true);
    try {
      const result = await getClinicExportDataAction({
        clinicUid,
        from: startOfDay(values.startDate),
        to: endOfDay(values.endDate),
      });

      if (!result.status || !result.data) {
        toast.error(result.message ?? "Failed to fetch report data");
        return;
      }

      const { consultations, appointments } = result.data;

      let rows: XLSXExportData[] = [];
      let columns: string[] = COMBINED_COLUMNS;
      let sheetName = "Report";
      let filename = `clinic_report_${format(new Date(), "yyyy-MM-dd")}`;

      if (values.reportType === "CONSULTATIONS") {
        rows = buildConsultationRows(consultations, values);
        columns = CONSULTATION_COLUMNS;
        sheetName = "Consultations";
        filename = `consultation_report_${format(new Date(), "yyyy-MM-dd")}`;
      } else if (values.reportType === "APPOINTMENTS") {
        rows = buildAppointmentRows(appointments, values);
        columns = APPOINTMENT_COLUMNS;
        sheetName = "Appointments";
        filename = `appointment_report_${format(new Date(), "yyyy-MM-dd")}`;
      } else {
        rows = buildConsolidatedRows(consultations, appointments, values);
        columns = COMBINED_COLUMNS;
        sheetName = "Consolidated Census";
        filename = `clinic_census_${format(new Date(), "yyyy-MM-dd")}`;
      }

      if (rows.length === 0) {
        toast.warning("No records found for the selected filters.");
        return;
      }

      await exportXLSX(columns, rows, { filename, sheetName });
      toast.success(`Report downloaded successfully (${rows.length} records)`);
    } catch (error) {
      toast.error(getActionErrorMessage(error, "Failed to download report"));
    } finally {
      setIsLoading(false);
    }
  };

  const startDate = form.watch("startDate");

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Consultation &amp; Appointment Reports
        </CardTitle>
        <CardDescription>
          Filter and download consultation and appointment records as an Excel spreadsheet.
        </CardDescription>
      </CardHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleDownload)} className="space-y-6">
          <CardContent className="space-y-5">
            {/* Date range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a start date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>End Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick an end date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() ||
                            date < new Date("1900-01-01") ||
                            (startDate != null && date < startDate)
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Filters row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="reportType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Report Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {REPORT_TYPE_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {GENDER_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {STATUS_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Active filter badges */}
            {(() => {
              const vals = form.getValues();
              const active = [
                vals.reportType !== "ALL" ? REPORT_TYPE_OPTIONS.find(o => o.value === vals.reportType)?.label : null,
                vals.gender !== "ALL" ? GENDER_OPTIONS.find(o => o.value === vals.gender)?.label : null,
                vals.status !== "ALL" ? STATUS_OPTIONS.find(o => o.value === vals.status)?.label : null,
              ].filter(Boolean);
              return active.length > 0 ? (
                <div className="flex flex-wrap items-center gap-2 p-3 bg-muted/50 rounded-lg">
                  <span className="text-xs font-medium text-muted-foreground">Active filters:</span>
                  {active.map((label) => (
                    <Badge key={label as string} variant="secondary" className="text-xs">
                      {label}
                    </Badge>
                  ))}
                </div>
              ) : null;
            })()}
          </CardContent>

          <div className="px-6 pb-6">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() =>
                  form.reset({
                    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                    endDate: new Date(),
                    reportType: "ALL",
                    gender: "ALL",
                    status: "ALL",
                  })
                }
              >
                <Filter className="h-4 w-4 mr-1.5" />
                Reset Filters
              </Button>

              <Button
                type="submit"
                className="flex items-center gap-2"
                disabled={isLoading}
              >
                <Download className="h-4 w-4" />
                {isLoading ? "Downloading…" : "Download Report"}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </Card>
  );
}

/* ─────────────────────────────────────────────────────── */
/*  SAPGenerationCard                                       */
/* ─────────────────────────────────────────────────────── */

function SAPGenerationCard({ clinicUid }: { clinicUid: string }) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<BulkEKASFormValues>({
    resolver: zodResolver(bulkEKASSchema),
    defaultValues: {
      startDate: undefined,
      endDate: undefined,
    },
  });

  const handleDownload = async (values: BulkEKASFormValues) => {
    setIsLoading(true);

    const toastId = toast.loading("Generating EKAS forms…", {
      description: "This may take a moment for large date ranges",
    });

    try {
      const response = await fetch(`/api/clinics/${clinicUid}/ekas/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate: values.startDate.toISOString(),
          endDate: values.endDate.toISOString(),
        }),
      });

      if (!response.ok) {
        const error = await response.json() as { message?: string };
        throw new Error(error.message ?? "Failed to download bulk EKAS");
      }

      const result = await response.json() as {
        message: string;
        data: { zipData: string; filename: string };
      };

      const binaryString = atob(result.data.zipData);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: "application/zip" });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.data.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success(result.message, { id: toastId });
      form.reset();
    } catch (error) {
      toast.error(getActionErrorMessage(error, "Failed to download bulk EKAS"), {
        id: toastId,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startDate = form.watch("startDate");

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          SAP Generation Request Form
        </CardTitle>
        <CardDescription>
          Download EKAS forms for multiple patients within a date range.
        </CardDescription>
      </CardHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleDownload)} className="space-y-6">
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a start date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>End Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick an end date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() ||
                            date < new Date("1900-01-01") ||
                            (startDate != null && date < startDate)
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>

          <div className="px-6 pb-6">
            <Button
              type="submit"
              className="flex items-center gap-2"
              disabled={isLoading}
            >
              <Download className="h-4 w-4" />
              {isLoading ? "Downloading…" : "Download EKAS"}
            </Button>
          </div>
        </form>
      </Form>
    </Card>
  );
}

/* ─────────────────────────────────────────────────────── */
/*  Public export: ClinicDownloadsTab                       */
/* ─────────────────────────────────────────────────────── */

interface ClinicDownloadsTabProps {
  clinicUid: string;
}

export function ClinicDownloadsTab({ clinicUid }: ClinicDownloadsTabProps) {
  return (
    <div className="space-y-6 mt-4">
      <ConsultationAppointmentReportCard clinicUid={clinicUid} />
      <SAPGenerationCard clinicUid={clinicUid} />
    </div>
  );
}
