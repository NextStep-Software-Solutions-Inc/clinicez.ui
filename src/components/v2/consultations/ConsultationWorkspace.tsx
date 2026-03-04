"use client";

import { useState, useTransition } from "react";
import {
  Stethoscope,
  Pill,
  Award,
  FlaskConical,
  CalendarDays,
  Clock,
  User,
  CheckCircle2,
  AlertCircle,
  Info,
  ExternalLink,
  GitFork,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import dayjs from "@/lib/day-utils";
import type { GetPatientConsultationDetail } from "@/actions/consultation/patient-consultations.action";
import type { GetHPsType } from "@/actions/hp.actions";
import { resolveConsultationTicket } from "@/actions/consultation/consultation-ticket.action";
import ConsultationNotesEditor from "./ConsultationNotesEditor";
import ConsultationPrescriptions from "./ConsultationPrescriptions";
import ConsultationMedCerts from "./ConsultationMedCerts";
import ConsultationDiagnostics from "./ConsultationDiagnostics";
import ConsultationReferrals from "./ConsultationReferrals";
import { PatientAIInsightButton } from "@/components/v2/patients/PatientAIInsightButton";
import AddCoCreatorDialog from "./AddCoCreatorDialog";

type Detail = NonNullable<GetPatientConsultationDetail["data"]>;

interface PatientInfo {
  id: number;
  clinicPatientId: number;
  userId: string;
  fullName: string;
  dob: string | null;
  gender: string | null;
}

interface ConsultationWorkspaceProps {
  clinicUid: string;
  /** Optional numeric clinic ID – used for the AI Patient Insight feature */
  clinicId?: number;
  patient: PatientInfo | null;
  consultation: Detail;
  myHPs: NonNullable<GetHPsType>;
  onPatchDetail: (patch: Partial<Detail>) => void;
  /** Called with the consultation id after it has been resolved. */
  onResolved?: (id: number) => void;
  /** Called to trigger a full re-fetch of the consultation detail from the server. */
  onReloadDetail?: () => void;
}

export default function ConsultationWorkspace({
  clinicUid,
  clinicId,
  patient,
  consultation,
  myHPs,
  onPatchDetail,
  onResolved,
  onReloadDetail,
}: ConsultationWorkspaceProps) {
  const [activeTab, setActiveTab] = useState("notes");
  const [resolving, startResolveTransition] = useTransition();
  const [addCoCreatorOpen, setAddCoCreatorOpen] = useState(false);

  const status = consultation.ConsultationTicketAttribute?.status;
  const apt = consultation.Appointment;
  const preAssessment = apt?.PreAssessmentNotes?.[0];
  const hasPatient = patient !== null;
  /** True when the consultation can still be resolved (not yet done). */
  const canBeResolved = status !== "RESOLVED";
  const isResolved = status === "RESOLVED";

  const handleResolve = () => {
    startResolveTransition(async () => {
      const result = await resolveConsultationTicket(consultation.id);
      if (result.status) {
        toast.success("Consultation marked as resolved");
        onResolved?.(consultation.id);
        onReloadDetail?.();
      } else {
        toast.error(result.message ?? "Failed to resolve consultation");
      }
    });
  };

  const hpNames = consultation.ConsultationTicketHPs.map((h) => {
    const hp = h.HealthCareProvider;
    return hp.HPProfile?.name
      ? `${hp.HPProfile.title ?? ""} ${hp.HPProfile.name}`.trim()
      : `${hp.User?.firstName ?? ""} ${hp.User?.lastName ?? ""}`.trim();
  }).join(", ");

  const rxCount = consultation.Prescriptions?.length ?? 0;
  const certCount = consultation.MedicalCertificates?.length ?? 0;
  const labCount = consultation.LaboratoryRequests?.length ?? 0;
  const imgCount = consultation.ImagingRequests?.length ?? 0;
  const hsCount = consultation.HeartStationRequests?.length ?? 0;
  const refCount = consultation.ClinicReferralSlips?.length ?? 0;

  // Placeholder shown inside patient-requiring tabs when patient context is unavailable
  const NoPatientPlaceholder = () => (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center px-6">
      <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
        <Info className="h-6 w-6 text-amber-600 dark:text-amber-400" />
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground/80">Patient not linked</p>
        <p className="text-xs text-muted-foreground mt-1 max-w-xs">
          This consultation has no linked patient record. Contact a clinic admin to associate
          a patient, or use the appointment-based workflow to issue prescriptions, certificates,
          and diagnostic requests.
        </p>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-background/40">
      {/* ── No-patient banner ── */}
      {!hasPatient && (
        <div className="shrink-0 flex items-center gap-2 px-6 py-2 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800/40">
          <Info className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
          <p className="text-xs text-amber-700 dark:text-amber-300">
            Patient info not available for this consultation. Notes can still be edited.
          </p>
        </div>
      )}

      {/* ── Add Co-creator Dialog (non-layout, must be outside the scroll container) ── */}
      {canBeResolved && (
        <AddCoCreatorDialog
          open={addCoCreatorOpen}
          onOpenChange={setAddCoCreatorOpen}
          consultation={consultation}
          clinicUid={clinicUid}
          onCoCreatorsAdded={() => onReloadDetail?.()}
        />
      )}

      {/* ── Single scrollable body: summary + sticky tab bar + tab contents ── */}
      <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded-full">

      {/* ── Appointment / Consultation Summary Bar ── */}
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border/50 bg-background/80 backdrop-blur">
        {/* ── Subject row: subject title + status badge + case# + Resolve button ── */}
        {/* Resolve lives here — outside the detail block — so it never competes for column space */}
        <div className="flex items-start gap-3 mb-1.5">
          <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
            <h2 className="text-base font-semibold text-foreground truncate">
              {consultation.subject || apt?.subject || `Consultation #${consultation.id}`}
            </h2>
            <div className={`shrink-0 flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
              status === "RESOLVED"
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
            }`}>
              {status === "RESOLVED" ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
              {status === "RESOLVED" ? "Resolved" : "In Progress"}
            </div>
            {consultation.caseNumber && (
              <span className="shrink-0 text-xs text-muted-foreground font-mono">
                #{consultation.caseNumber}
              </span>
            )}
          </div>
          {canBeResolved && myHPs.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              className="shrink-0 gap-1.5 h-8 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
              disabled={resolving}
              onClick={handleResolve}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              {resolving ? "Resolving…" : "Resolve"}
            </Button>
          )}
        </div>

        {/* ── Details: patient info, date, type, service, healthcare providers ── */}
        <div className="flex items-center gap-4 flex-wrap">
          {patient?.fullName && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <User className="h-3.5 w-3.5" />
              {patient.fullName}
              <Link
                href={`/v2/clinic/${clinicUid}/patients/${patient.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-0.5 inline-flex items-center gap-0.5 text-primary hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded"
                title="View patient profile"
              >
                <ExternalLink className="h-3 w-3" />
                <span className="sr-only">View patient profile</span>
              </Link>
            </span>
          )}
          {apt?.AppointmentAttribute?.date && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5" />
              {dayjs(apt.AppointmentAttribute.date).format("MMM D, YYYY")}
              {apt.AppointmentAttribute.timeStart && (
                <span className="ml-1 flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {apt.AppointmentAttribute.timeStart}
                </span>
              )}
            </span>
          )}
          {apt?.AppointmentAttribute?.AppointmentType?.name && (
            <Badge variant="outline" className="text-xs h-5">
              {apt.AppointmentAttribute.AppointmentType.name}
            </Badge>
          )}
          {apt?.AppointmentAttribute?.Service?.name && (
            <Badge variant="outline" className="text-xs h-5">
              {apt.AppointmentAttribute.Service.name}
            </Badge>
          )}
          {(hpNames || (canBeResolved && myHPs.length > 0)) && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <User className="h-3.5 w-3.5 shrink-0" />
              {hpNames}
                  {canBeResolved && myHPs.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setAddCoCreatorOpen(true)}
                      className="ml-0.5 inline-flex items-center gap-1 rounded px-1 py-0.5 text-xs text-primary hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary transition-colors"
                      title="Add co-creator"
                    >
                      <UserPlus className="h-3 w-3" />
                      Add
                    </button>
                  )}
            </span>
          )}
        </div>

        {/* Chief Complaint */}
        {apt?.complaint && (
          <p className="mt-1.5 text-xs text-muted-foreground">
            <span className="font-medium text-foreground/70">Chief complaint: </span>
            {apt.complaint}
          </p>
        )}
        {/* Pre-assessment */}
        {preAssessment?.assessment && (
          <p className="mt-1 text-xs text-muted-foreground">
            <span className="font-medium text-foreground/70">Pre-assessment: </span>
            {preAssessment.assessment}
          </p>
        )}
        {/* AI Patient Insight */}
        {patient && myHPs.length > 0 && (
          <div className="mt-2">
            <PatientAIInsightButton
              patientId={patient.id}
              clinicId={clinicId}
              patientName={patient.fullName}
              size="sm"
            />
          </div>
        )}
      </div>

      {/* ── Tabbed Workspace ── */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="sticky top-0 z-10 w-full justify-start rounded-none border-b border-border/50 bg-background h-10 px-2 sm:px-6 gap-0 overflow-x-auto [&::-webkit-scrollbar]:hidden">
            <TabsTrigger
              value="notes"
              className="flex items-center gap-1.5 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary h-full px-3 text-xs"
            >
              <Stethoscope className="h-3.5 w-3.5" />
              Notes
            </TabsTrigger>
            <TabsTrigger
              value="rx"
              className="flex items-center gap-1.5 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary h-full px-3 text-xs"
            >
              <Pill className="h-3.5 w-3.5" />
              Prescriptions
              {rxCount > 0 && (
                <span className="ml-1 bg-primary/10 text-primary text-[10px] px-1.5 rounded-full">
                  {rxCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="certs"
              className="flex items-center gap-1.5 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary h-full px-3 text-xs"
            >
              <Award className="h-3.5 w-3.5" />
              Med. Certs
              {certCount > 0 && (
                <span className="ml-1 bg-primary/10 text-primary text-[10px] px-1.5 rounded-full">
                  {certCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="diagnostics"
              className="flex items-center gap-1.5 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary h-full px-3 text-xs"
            >
              <FlaskConical className="h-3.5 w-3.5" />
              Diagnostics
              {(labCount + imgCount + hsCount) > 0 && (
                <span className="ml-1 bg-primary/10 text-primary text-[10px] px-1.5 rounded-full">
                  {labCount + imgCount + hsCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="referrals"
              className="flex items-center gap-1.5 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary h-full px-3 text-xs"
            >
              <GitFork className="h-3.5 w-3.5" />
              Referrals
              {refCount > 0 && (
                <span className="ml-1 bg-primary/10 text-primary text-[10px] px-1.5 rounded-full">
                  {refCount}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="notes" className="mt-0">
            <ConsultationNotesEditor
              clinicUid={clinicUid}
              consultation={consultation}
              myHPs={myHPs}
              onPatchDetail={onPatchDetail}
              isResolved={isResolved}
            />
          </TabsContent>

          <TabsContent value="rx" className="mt-0 p-4 sm:p-6">
            {hasPatient ? (
              <ConsultationPrescriptions
                clinicUid={clinicUid}
                patient={patient}
                consultation={consultation}
                myHPs={myHPs}
                onPatchDetail={onPatchDetail}
                isResolved={isResolved}
              />
            ) : (
              <NoPatientPlaceholder />
            )}
          </TabsContent>

          <TabsContent value="certs" className="mt-0 p-4 sm:p-6">
            {hasPatient ? (
              <ConsultationMedCerts
                clinicUid={clinicUid}
                patient={patient}
                consultation={consultation}
                myHPs={myHPs}
                onPatchDetail={onPatchDetail}
                isResolved={isResolved}
              />
            ) : (
              <NoPatientPlaceholder />
            )}
          </TabsContent>

          <TabsContent value="diagnostics" className="mt-0 p-4 sm:p-6">
            {hasPatient ? (
              <ConsultationDiagnostics
                clinicUid={clinicUid}
                patient={patient}
                consultation={consultation}
                myHPs={myHPs}
                onPatchDetail={onPatchDetail}
                isResolved={isResolved}
              />
            ) : (
              <NoPatientPlaceholder />
            )}
          </TabsContent>

          <TabsContent value="referrals" className="mt-0 p-4 sm:p-6">
            {hasPatient ? (
              <ConsultationReferrals
                clinicUid={clinicUid}
                patient={patient}
                consultation={consultation}
                myHPs={myHPs}
                onPatchDetail={onPatchDetail}
                isResolved={isResolved}
              />
            ) : (
              <NoPatientPlaceholder />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
