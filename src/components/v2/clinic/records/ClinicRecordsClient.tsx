"use client";

import { useState, useTransition, useCallback } from "react";
import type { ReactNode } from "react";
import {
  Pill,
  FlaskConical,
  ImageIcon,
  Heart,
  FileText,
  Share2,
  Search,
  RefreshCw,
  Loader2,
  CalendarDays,
  Download,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import dayjs from "@/lib/day-utils";

import type { GetPrescriptions } from "@/actions/clinics/clinical-record/prescription.action";
import type { GetLaboratoryRequests } from "@/actions/clinics/clinical-record/laboratory-requests.action";
import type { GetImagingStudies } from "@/actions/clinics/clinical-record/imaging-studies.action";
import type { GetHeartStationRequests } from "@/actions/clinics/clinical-record/heart-station.action";
import type { GetMedicalCertificates } from "@/actions/clinics/clinical-record/medical-certificate.action";
import type { GetReferralSlips } from "@/actions/clinics/clinical-record/referral-slip.action";
import { getPrescriptionsAction } from "@/actions/clinics/clinical-record/prescription.action";
import { getLaboratoryRequestsAction } from "@/actions/clinics/clinical-record/laboratory-requests.action";
import { getImagingStudiesAction } from "@/actions/clinics/clinical-record/imaging-studies.action";
import { getHeartStationRequestsAction } from "@/actions/clinics/clinical-record/heart-station.action";
import { getMedicalCertificatesAction } from "@/actions/clinics/clinical-record/medical-certificate.action";
import { getReferralSlipsAction } from "@/actions/clinics/clinical-record/referral-slip.action";

import DownloadPrescriptionAction from "@/components/clinic/clinical-records/prescription/DownloadPrescriptionAction";
import DownloadLaboratoryRequestAction from "@/components/laboratory-requests/DownloadLaboratoryRequestAction";
import DownloadImagingStudiesAction from "@/components/imaging-studies/DownloadImagingStudiesAction";
import DownloadHeartStationRequestAction from "@/components/heart-station-requests/DownloadHeartStationRequestAction";
import DownloadMedicalCertificateAction from "@/components/medical-certificate/DownloadMedicalCertificateAction";
import DownloadReferralSlipAction from "@/components/referral-slip/DownloadReferralSlipAction";

type Prescriptions = NonNullable<GetPrescriptions["data"]>;
type LabRequests = NonNullable<GetLaboratoryRequests["data"]>;
type ImagingStudies = NonNullable<GetImagingStudies["data"]>;
type HeartStationRequests = NonNullable<GetHeartStationRequests["data"]>;
type MedicalCertificates = NonNullable<GetMedicalCertificates["data"]>;
type ReferralSlips = NonNullable<GetReferralSlips["data"]>;

export interface ClinicRecordsInitialData {
  prescriptions: Prescriptions;
  labRequests: LabRequests;
  imagingStudies: ImagingStudies;
  heartStationRequests: HeartStationRequests;
  medicalCertificates: MedicalCertificates;
  referralSlips: ReferralSlips;
}

interface ClinicRecordsClientProps {
  clinicUid: string;
  initialData: ClinicRecordsInitialData;
}

function getInitials(firstName?: string | null, lastName?: string | null) {
  const f = firstName?.[0] ?? "";
  const l = lastName?.[0] ?? "";
  return (f + l).toUpperCase() || "?";
}

function PatientCell({
  firstName,
  lastName,
}: {
  firstName?: string | null;
  lastName?: string | null;
}) {
  const fullName =
    [firstName, lastName].filter(Boolean).join(" ") || "Unknown Patient";
  return (
    <div className="flex items-center gap-2 min-w-0">
      <Avatar className="h-7 w-7 flex-shrink-0">
        <AvatarFallback className="text-xs">
          {getInitials(firstName, lastName)}
        </AvatarFallback>
      </Avatar>
      <span className="text-sm font-medium truncate">{fullName}</span>
    </div>
  );
}

function getMedicineName(m: { name?: string | null; genericName?: string | null; brandName?: string | null }) {
  return m.name || m.genericName || m.brandName || "—";
}

function DownloadIconButton() {
  return (
    <Button
      variant="ghost"
      size="icon"
      type="submit"
      aria-label="Download / Print"
      className="h-8 w-8 text-muted-foreground hover:text-primary shrink-0"
      title="Download / Print"
    >
      <Download className="h-4 w-4" />
    </Button>
  );
}

/* ─────────────── Prescriptions tab ─────────────── */
function PrescriptionsTab({
  items,
  search,
}: {
  items: Prescriptions;
  search: string;
}) {
  const filtered = items.filter((rx) => {
    const q = search.toLowerCase();
    const patientName = [
      rx.ClinicPatient?.Patient?.firstName,
      rx.ClinicPatient?.Patient?.lastName,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return (
      !q ||
      rx.name?.toLowerCase().includes(q) ||
      rx.serialNumber?.toLowerCase().includes(q) ||
      patientName.includes(q) ||
      rx.remarks?.toLowerCase().includes(q)
    );
  });

  if (filtered.length === 0) {
    return (
      <EmptyState icon={<Pill className="h-8 w-8" />} label="No prescriptions found" />
    );
  }

  return (
    <div className="space-y-2">
      {filtered.map((rx) => (
        <Card key={rx.id} className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm truncate">{rx.name || "—"}</span>
                  {rx.serialNumber && (
                    <Badge variant="outline" className="text-xs shrink-0">
                      {rx.serialNumber}
                    </Badge>
                  )}
                </div>
                <PatientCell
                  firstName={rx.ClinicPatient?.Patient?.firstName}
                  lastName={rx.ClinicPatient?.Patient?.lastName}
                />
                {rx.Medicines && rx.Medicines.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {rx.Medicines.slice(0, 4).map((m) => (
                      <Badge key={m.id} variant="secondary" className="text-xs">
                        {getMedicineName(m)}
                        {m.dosage ? ` ${m.dosage}` : ""}
                      </Badge>
                    ))}
                    {rx.Medicines.length > 4 && (
                      <Badge variant="secondary" className="text-xs">
                        +{rx.Medicines.length - 4} more
                      </Badge>
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {dayjs(rx.createdAt).format("MMM D, YYYY")}
                </div>
                <DownloadPrescriptionAction prescription={{ id: rx.id }}>
                  <DownloadIconButton />
                </DownloadPrescriptionAction>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/* ─────────────── Lab Requests tab ─────────────── */
function LabRequestsTab({
  items,
  search,
}: {
  items: LabRequests;
  search: string;
}) {
  const filtered = items.filter((req) => {
    const q = search.toLowerCase();
    const patientName = [
      req.ClinicPatient?.Patient?.firstName,
      req.ClinicPatient?.Patient?.lastName,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    const procNames = req.LaboratoryRequestProcedures?.map((p) =>
      p.LaboratoryProcedure?.name?.toLowerCase()
    ).join(" ");
    return (
      !q ||
      req.serialNumber?.toLowerCase().includes(q) ||
      req.impression?.toLowerCase().includes(q) ||
      patientName.includes(q) ||
      procNames?.includes(q)
    );
  });

  if (filtered.length === 0) {
    return (
      <EmptyState icon={<FlaskConical className="h-8 w-8" />} label="No lab requests found" />
    );
  }

  return (
    <div className="space-y-2">
      {filtered.map((req) => (
        <Card key={req.id} className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  {req.serialNumber && (
                    <Badge variant="outline" className="text-xs shrink-0">
                      {req.serialNumber}
                    </Badge>
                  )}
                  {req._count?.LaboratoryRequestProcedures !== undefined && (
                    <span className="text-xs text-muted-foreground">
                      {req._count.LaboratoryRequestProcedures} procedure
                      {req._count.LaboratoryRequestProcedures !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
                <PatientCell
                  firstName={req.ClinicPatient?.Patient?.firstName}
                  lastName={req.ClinicPatient?.Patient?.lastName}
                />
                {req.LaboratoryRequestProcedures && req.LaboratoryRequestProcedures.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {req.LaboratoryRequestProcedures.slice(0, 4).map((p) => (
                      <Badge key={p.LaboratoryProcedure?.id ?? p.id} variant="secondary" className="text-xs">
                        {p.LaboratoryProcedure?.name}
                      </Badge>
                    ))}
                    {req.LaboratoryRequestProcedures.length > 4 && (
                      <Badge variant="secondary" className="text-xs">
                        +{req.LaboratoryRequestProcedures.length - 4} more
                      </Badge>
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {dayjs(req.createdAt).format("MMM D, YYYY")}
                </div>
                <DownloadLaboratoryRequestAction request={{ id: req.id }}>
                  <DownloadIconButton />
                </DownloadLaboratoryRequestAction>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/* ─────────────── Imaging tab ─────────────── */
function ImagingTab({
  items,
  search,
}: {
  items: ImagingStudies;
  search: string;
}) {
  const filtered = items.filter((study) => {
    const q = search.toLowerCase();
    const patientName = [
      study.ClinicPatient?.Patient?.firstName,
      study.ClinicPatient?.Patient?.lastName,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    const procNames = study.ImagingRequestProcedures?.map((p) =>
      p.ImagingProcedure?.name?.toLowerCase()
    ).join(" ");
    return (
      !q ||
      study.serialNumber?.toLowerCase().includes(q) ||
      study.impression?.toLowerCase().includes(q) ||
      patientName.includes(q) ||
      procNames?.includes(q)
    );
  });

  if (filtered.length === 0) {
    return (
      <EmptyState icon={<ImageIcon className="h-8 w-8" />} label="No imaging requests found" />
    );
  }

  return (
    <div className="space-y-2">
      {filtered.map((study) => (
        <Card key={study.id} className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  {study.serialNumber && (
                    <Badge variant="outline" className="text-xs shrink-0">
                      {study.serialNumber}
                    </Badge>
                  )}
                </div>
                <PatientCell
                  firstName={study.ClinicPatient?.Patient?.firstName}
                  lastName={study.ClinicPatient?.Patient?.lastName}
                />
                {study.ImagingRequestProcedures && study.ImagingRequestProcedures.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {study.ImagingRequestProcedures.slice(0, 4).map((p) => (
                      <Badge key={p.ImagingProcedure?.id ?? p.id} variant="secondary" className="text-xs">
                        {p.ImagingProcedure?.name}
                      </Badge>
                    ))}
                    {study.ImagingRequestProcedures.length > 4 && (
                      <Badge variant="secondary" className="text-xs">
                        +{study.ImagingRequestProcedures.length - 4} more
                      </Badge>
                    )}
                  </div>
                )}
                {study.impression && (
                  <p className="text-xs text-muted-foreground line-clamp-1 pt-0.5">
                    {study.impression}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {dayjs(study.createdAt).format("MMM D, YYYY")}
                </div>
                <DownloadImagingStudiesAction study={{ id: study.id }}>
                  <DownloadIconButton />
                </DownloadImagingStudiesAction>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/* ─────────────── Heart Station tab ─────────────── */
function HeartStationTab({
  items,
  search,
}: {
  items: HeartStationRequests;
  search: string;
}) {
  const filtered = items.filter((req) => {
    const q = search.toLowerCase();
    const patientName = [
      req.ClinicPatient?.Patient?.firstName,
      req.ClinicPatient?.Patient?.lastName,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    const procNames = req.HeartStationRequestProcedures?.map((p) =>
      p.HeartStationProcedure?.name?.toLowerCase()
    ).join(" ");
    return (
      !q ||
      req.serialNumber?.toLowerCase().includes(q) ||
      req.impression?.toLowerCase().includes(q) ||
      patientName.includes(q) ||
      procNames?.includes(q)
    );
  });

  if (filtered.length === 0) {
    return (
      <EmptyState icon={<Heart className="h-8 w-8" />} label="No heart station requests found" />
    );
  }

  return (
    <div className="space-y-2">
      {filtered.map((req) => (
        <Card key={req.id} className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  {req.serialNumber && (
                    <Badge variant="outline" className="text-xs shrink-0">
                      {req.serialNumber}
                    </Badge>
                  )}
                </div>
                <PatientCell
                  firstName={req.ClinicPatient?.Patient?.firstName}
                  lastName={req.ClinicPatient?.Patient?.lastName}
                />
                {req.HeartStationRequestProcedures && req.HeartStationRequestProcedures.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {req.HeartStationRequestProcedures.slice(0, 4).map((p) => (
                      <Badge key={p.HeartStationProcedure?.id ?? p.id} variant="secondary" className="text-xs">
                        {p.HeartStationProcedure?.name}
                      </Badge>
                    ))}
                    {req.HeartStationRequestProcedures.length > 4 && (
                      <Badge variant="secondary" className="text-xs">
                        +{req.HeartStationRequestProcedures.length - 4} more
                      </Badge>
                    )}
                  </div>
                )}
                {req.impression && (
                  <p className="text-xs text-muted-foreground line-clamp-1 pt-0.5">
                    {req.impression}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {dayjs(req.createdAt).format("MMM D, YYYY")}
                </div>
                <DownloadHeartStationRequestAction request={{ id: req.id }}>
                  <DownloadIconButton />
                </DownloadHeartStationRequestAction>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/* ─────────────── Medical Certs tab ─────────────── */
function MedicalCertsTab({
  items,
  search,
}: {
  items: MedicalCertificates;
  search: string;
}) {
  const filtered = items.filter((cert) => {
    const q = search.toLowerCase();
    const patientName = [
      cert.ClinicPatient?.Patient?.firstName,
      cert.ClinicPatient?.Patient?.lastName,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return (
      !q ||
      cert.serialNumber?.toLowerCase().includes(q) ||
      cert.impression?.toLowerCase().includes(q) ||
      cert.remarks?.toLowerCase().includes(q) ||
      patientName.includes(q) ||
      cert.Reason?.name?.toLowerCase().includes(q) ||
      cert.Classification?.name?.toLowerCase().includes(q)
    );
  });

  if (filtered.length === 0) {
    return (
      <EmptyState icon={<FileText className="h-8 w-8" />} label="No medical certificates found" />
    );
  }

  return (
    <div className="space-y-2">
      {filtered.map((cert) => (
        <Card key={cert.id} className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  {cert.serialNumber && (
                    <Badge variant="outline" className="text-xs shrink-0">
                      {cert.serialNumber}
                    </Badge>
                  )}
                  {cert.Reason && (
                    <Badge variant="secondary" className="text-xs shrink-0">
                      {cert.Reason.name}
                    </Badge>
                  )}
                  {cert.Classification && (
                    <Badge variant="secondary" className="text-xs shrink-0">
                      {cert.Classification.name}
                    </Badge>
                  )}
                </div>
                <PatientCell
                  firstName={cert.ClinicPatient?.Patient?.firstName}
                  lastName={cert.ClinicPatient?.Patient?.lastName}
                />
                {cert.impression && (
                  <p className="text-xs text-muted-foreground line-clamp-1 pt-0.5">
                    {cert.impression}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {dayjs(cert.createdAt).format("MMM D, YYYY")}
                </div>
                <DownloadMedicalCertificateAction certificate={{ id: cert.id }}>
                  <DownloadIconButton />
                </DownloadMedicalCertificateAction>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/* ─────────────── Referral Slips tab ─────────────── */
function ReferralSlipsTab({
  items,
  search,
}: {
  items: ReferralSlips;
  search: string;
}) {
  const filtered = items.filter((slip) => {
    const q = search.toLowerCase();
    const patientName = [
      slip.ClinicPatient?.Patient?.firstName,
      slip.ClinicPatient?.Patient?.lastName,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return (
      !q ||
      slip.serialNumber?.toLowerCase().includes(q) ||
      slip.referredTo?.toLowerCase().includes(q) ||
      slip.impression?.toLowerCase().includes(q) ||
      slip.reason?.toLowerCase().includes(q) ||
      patientName.includes(q)
    );
  });

  if (filtered.length === 0) {
    return (
      <EmptyState icon={<Share2 className="h-8 w-8" />} label="No referral slips found" />
    );
  }

  return (
    <div className="space-y-2">
      {filtered.map((slip) => (
        <Card key={slip.id} className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  {slip.serialNumber && (
                    <Badge variant="outline" className="text-xs shrink-0">
                      {slip.serialNumber}
                    </Badge>
                  )}
                  {slip.referredTo && (
                    <span className="text-sm font-medium truncate">
                      Referred to: {slip.referredTo}
                    </span>
                  )}
                </div>
                <PatientCell
                  firstName={slip.ClinicPatient?.Patient?.firstName}
                  lastName={slip.ClinicPatient?.Patient?.lastName}
                />
                {slip.reason && (
                  <p className="text-xs text-muted-foreground line-clamp-1 pt-0.5">
                    {slip.reason}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {dayjs(slip.createdAt).format("MMM D, YYYY")}
                </div>
                <DownloadReferralSlipAction referralSlip={{ id: slip.id }}>
                  <DownloadIconButton />
                </DownloadReferralSlipAction>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/* ─────────────── Empty state ─────────────── */
function EmptyState({
  icon,
  label,
}: {
  icon: ReactNode;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
      <div className="p-4 rounded-full bg-muted/50">{icon}</div>
      <p className="text-sm">{label}</p>
    </div>
  );
}

/* ─────────────── Tab meta ─────────────── */
const TABS = [
  { key: "prescriptions", label: "Prescriptions", icon: Pill },
  { key: "lab", label: "Lab", icon: FlaskConical },
  { key: "imaging", label: "Imaging", icon: ImageIcon },
  { key: "heart", label: "Heart Station", icon: Heart },
  { key: "medcerts", label: "Med Certs", icon: FileText },
  { key: "referrals", label: "Referrals", icon: Share2 },
] as const;

type TabKey = (typeof TABS)[number]["key"];

/* ─────────────── Main component ─────────────── */
export function ClinicRecordsClient({
  clinicUid,
  initialData,
}: ClinicRecordsClientProps) {
  const [data, setData] = useState<ClinicRecordsInitialData>(initialData);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<TabKey>("prescriptions");
  const [isPending, startTransition] = useTransition();

  const counts: Record<TabKey, number> = {
    prescriptions: data.prescriptions.length,
    lab: data.labRequests.length,
    imaging: data.imagingStudies.length,
    heart: data.heartStationRequests.length,
    medcerts: data.medicalCertificates.length,
    referrals: data.referralSlips.length,
  };

  const handleRefresh = useCallback(() => {
    startTransition(async () => {
      const [
        prescriptionsResult,
        labResult,
        imagingResult,
        heartResult,
        medCertsResult,
        referralResult,
      ] = await Promise.all([
        getPrescriptionsAction({ clinicUid }),
        getLaboratoryRequestsAction({ clinicUid }),
        getImagingStudiesAction({ clinicUid }),
        getHeartStationRequestsAction({ clinicUid }),
        getMedicalCertificatesAction({ clinicUid }),
        getReferralSlipsAction({ clinicUid }),
      ]);

      if (
        !prescriptionsResult.status ||
        !labResult.status ||
        !imagingResult.status ||
        !heartResult.status ||
        !medCertsResult.status ||
        !referralResult.status
      ) {
        toast.error("Failed to refresh records");
        return;
      }

      setData({
        prescriptions: prescriptionsResult.data ?? [],
        labRequests: labResult.data ?? [],
        imagingStudies: imagingResult.data ?? [],
        heartStationRequests: heartResult.data ?? [],
        medicalCertificates: medCertsResult.data ?? [],
        referralSlips: referralResult.data ?? [],
      });
      toast.success("Records refreshed");
    });
  }, [clinicUid]);

  return (
    <div className="space-y-4 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Clinic Records
          </h1>
          <p className="text-sm text-muted-foreground">
            All clinical documents generated in this clinic
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search records…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 w-56 sm:w-64"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isPending}
            className="gap-1.5 h-9"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as TabKey)}
        className="w-full"
      >
        <TabsList className="flex w-full overflow-x-auto [&::-webkit-scrollbar]:hidden h-auto gap-0 p-1 rounded-lg">
          {TABS.map(({ key, label, icon: Icon }) => (
            <TabsTrigger
              key={key}
              value={key}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 text-sm"
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{label}</span>
              <span className="sm:hidden">{label.split(" ")[0]}</span>
              {counts[key] > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-1 h-5 min-w-5 px-1 text-xs rounded-full"
                >
                  {counts[key]}
                </Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="prescriptions" className="mt-4">
          <PrescriptionsTab items={data.prescriptions} search={search} />
        </TabsContent>
        <TabsContent value="lab" className="mt-4">
          <LabRequestsTab items={data.labRequests} search={search} />
        </TabsContent>
        <TabsContent value="imaging" className="mt-4">
          <ImagingTab items={data.imagingStudies} search={search} />
        </TabsContent>
        <TabsContent value="heart" className="mt-4">
          <HeartStationTab items={data.heartStationRequests} search={search} />
        </TabsContent>
        <TabsContent value="medcerts" className="mt-4">
          <MedicalCertsTab items={data.medicalCertificates} search={search} />
        </TabsContent>
        <TabsContent value="referrals" className="mt-4">
          <ReferralSlipsTab items={data.referralSlips} search={search} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
