"use client";

import { useState, useTransition, useEffect } from "react";
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
  ClipboardList,
  Ban,
  ShieldCheck,
  Activity,
} from "lucide-react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import dayjs from "@/lib/day-utils";
import type { GetPatientConsultationDetail } from "@/actions/consultation/patient-consultations.action";
import type { GetHPsType } from "@/actions/hp.actions";
import { resolveConsultationTicket, dropConsultationTicketAction } from "@/actions/consultation/consultation-ticket.action";
import { generateConsultationSoapTransNoAction } from "@/actions/philhealth-yakap.actions";
import ConsultationNotesEditor from "./ConsultationNotesEditor";
import ConsultationPrescriptions from "./ConsultationPrescriptions";
import ConsultationMedCerts from "./ConsultationMedCerts";
import ConsultationDiagnostics from "./ConsultationDiagnostics";
import ConsultationReferrals from "./ConsultationReferrals";
import ConsultationDiagnoses from "./ConsultationDiagnoses";
import { PatientAIInsightButton } from "@/components/v2/patients/PatientAIInsightButton";
import AddCoCreatorDialog from "./AddCoCreatorDialog";
import { MarkdownRenderer } from "@/components/markdown/MarkdownRenderer";
import KonsultaEncounterPanel from "./KonsultaEncounterPanel";
import KonsultaDiagnosticResultsPanel from "./KonsultaDiagnosticResultsPanel";
import KonsultaManagementPanel from "./KonsultaManagementPanel";
import KonsultaRecommendedServicesPanel from "./KonsultaRecommendedServicesPanel";
import KonsultaDiagnosticRequests from "./KonsultaDiagnosticRequests";
import { PhysicalExamEditForm } from "@/components/health-records/physical-exam-edit-form";

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
  const [recommendedConsultDesc, setRecommendedConsultDesc] = useState("");

  useEffect(() => {
    if (consultation.isPhilHealthKonsulta && patient?.dob) {
      const ageMonths = Math.floor((new Date().getTime() - new Date(patient.dob).getTime()) / (30.44 * 24 * 60 * 60 * 1000));
      import("@/actions/consultation/konsulta-recommended-services.action").then((mod) => {
        mod.getKonsultaRecommendedService(ageMonths, patient.gender as any).then((res) => {
          if (res) {
            setRecommendedConsultDesc(res.consultationDescription);
          }
        });
      });
    }
  }, [consultation.isPhilHealthKonsulta, patient?.dob, patient?.gender]);

  const [resolving, startResolveTransition] = useTransition();
  const [dropping, startDropTransition] = useTransition();
  const [generatingYakap, startGeneratingYakap] = useTransition();

  const [addCoCreatorOpen, setAddCoCreatorOpen] = useState(false);
  const [showDropForm, setShowDropForm] = useState(false);
  const [dropReason, setDropReason] = useState("");
  // Tracks whether PhilHealth Yakap profiling is complete — gates the Resolve button
  const [konsultaProfilingComplete, setKonsultaProfilingComplete] = useState<boolean | null>(null);

  const status = consultation.ConsultationTicketAttribute?.status;
  const apt = consultation.Appointment;
  const preAssessment = apt?.PreAssessmentNotes?.[0];
  const hasPatient = patient !== null;
  /** True when the consultation can still be resolved/dropped (not yet done). */
  const canBeResolved = status !== "RESOLVED" && status !== "DROPPED";
  const isResolved = status === "RESOLVED";
  const isDropped = status === "DROPPED";

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

  const handleGenerateYakap = () => {
    startGeneratingYakap(async () => {
      const result = await generateConsultationSoapTransNoAction(clinicUid, consultation.id);
      if (result.success) {
        toast.success("Yakap No. generated");
        onReloadDetail?.();
      } else {
        toast.error(result.message ?? "Failed to generate Yakap No.");
      }
    });
  };

  const handleDrop = () => {
    if (!dropReason.trim()) {
      toast.error("A reason is required to drop this consultation.");
      return;
    }
    startDropTransition(async () => {
      const result = await dropConsultationTicketAction({ consultationId: consultation.id, reason: dropReason.trim() });
      if (result.status) {
        toast.success("Consultation marked as dropped");
        setShowDropForm(false);
        setDropReason("");
        onReloadDetail?.();
      } else {
        toast.error(result.message ?? "Failed to drop consultation");
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
  const diagnosesCount = consultation.ConsultationDiagnoses?.length ?? 0;

  const famHistories = consultation.ClinicPatient?.Patient?.FamilyMedicalHistories || [];
  const hasDiabetesFamHist = famHistories.some(fh =>
    fh.Condition?.code === '006' ||
    fh.Condition?.code === '6' ||
    fh.Condition?.name?.toUpperCase() === 'DIABETES MELLITUS'
  );
  // @ts-ignore - The property KonsultaDiagnosticResults is dynamically included in the query
  const hasDiagResults = (consultation.KonsultaDiagnosticResults?.length ?? 0) > 0;

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
              <div className={`shrink-0 flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${status === "RESOLVED"
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                  : isDropped
                    ? "bg-gray-100 text-gray-700 dark:bg-gray-800/40 dark:text-gray-400"
                    : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                }`}>
                {status === "RESOLVED" ? <CheckCircle2 className="h-3 w-3" /> : isDropped ? <Ban className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                {status === "RESOLVED" ? "Resolved" : isDropped ? "Dropped" : "In Progress"}
              </div>
              {consultation.caseNumber && (
                <span className="shrink-0 text-xs text-muted-foreground font-mono">
                  #{consultation.caseNumber}
                </span>
              )}
            </div>
            {canBeResolved && myHPs.length > 0 && (
              <div className="flex items-center gap-1.5 shrink-0">
                {consultation.isPhilHealthKonsulta && (
                  consultation.soapTransNo ? (
                    <Badge variant="outline" className="h-8 text-[10px] sm:text-xs font-mono bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-400 dark:border-teal-800">
                      SOAP: {consultation.soapTransNo}
                    </Badge>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 h-8 text-xs border-teal-300 text-teal-700 hover:bg-teal-50 hover:text-teal-800 dark:border-teal-700 dark:text-teal-400 dark:hover:bg-teal-950/30"
                      disabled={generatingYakap}
                      onClick={handleGenerateYakap}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {generatingYakap ? "Generating..." : "Generate Yakap No."}
                    </Button>
                  )
                )}
                {(() => {
                  const isKonsultaBlocked =
                    (consultation.isPhilHealthKonsulta) &&
                    konsultaProfilingComplete === false;
                  return (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 h-8 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-950/30 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={resolving || dropping || generatingYakap || isKonsultaBlocked}
                      title={isKonsultaBlocked ? "PhilHealth profiling is incomplete — complete all required fields first" : undefined}
                      onClick={handleResolve}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {resolving ? "Resolving…" : "Resolve"}
                    </Button>
                  );
                })()}
                {!showDropForm && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 h-8 text-xs border-gray-300 text-gray-600 hover:bg-gray-100 hover:text-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-800/30"
                    disabled={resolving || dropping || generatingYakap}
                    onClick={() => setShowDropForm(true)}
                  >
                    <Ban className="h-3.5 w-3.5" />
                    Drop
                  </Button>
                )}
              </div>
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
            <div className="mt-1 text-xs text-muted-foreground">
              <span className="font-medium text-foreground/70">Pre-assessment: </span>
              <MarkdownRenderer content={preAssessment.assessment} className="text-xs" />
            </div>
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

          {/* Diabetes Mellitus Diagnostic Warning */}
          {hasDiabetesFamHist && !hasDiagResults && consultation.isPhilHealthKonsulta && (
            <div className="mt-3 rounded-xl border border-amber-500/30 bg-amber-50 dark:bg-amber-950/20 p-3 space-y-1">
              <h4 className="text-xs font-semibold text-amber-800 dark:text-amber-500 uppercase tracking-wide flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5" />
                Diagnostic Exam Required
              </h4>
              <p className="text-xs text-amber-700/90 dark:text-amber-400/90">
                The patient has a family history of Diabetes Mellitus. Please ensure a diagnostic exam result is provided for PhilHealth Yakap compliance.
              </p>
            </div>
          )}

          {/* Drop form */}
          {showDropForm && (
            <div className="mt-3 rounded-xl border border-gray-400/30 bg-gray-50/50 dark:bg-gray-900/20 p-4 space-y-3">
              <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                <Ban className="h-3.5 w-3.5" />
                Drop Consultation
              </h4>
              <p className="text-xs text-muted-foreground">
                Dropping a consultation marks it as no longer active. This is for organizing and tracking purposes.
              </p>
              <div className="space-y-1.5">
                <Label className="text-xs">
                  Reason <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  value={dropReason}
                  onChange={(e) => setDropReason(e.target.value)}
                  placeholder="Please provide a reason for dropping this consultation..."
                  rows={3}
                  className="resize-none text-sm"
                  disabled={dropping}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  disabled={dropping}
                  onClick={() => { setShowDropForm(false); setDropReason(""); }}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 gap-1.5 border-gray-500 text-gray-700 hover:bg-gray-700 hover:text-white"
                  disabled={dropping || !dropReason.trim()}
                  onClick={handleDrop}
                >
                  <Ban className="h-4 w-4" />
                  {dropping ? "Dropping..." : "Confirm Drop"}
                </Button>
              </div>
            </div>
          )}
          {/* Dropped info banner */}
          {isDropped && consultation.ConsultationTicketAttribute?.dropReason && (
            <div className="mt-2 rounded-lg border border-gray-300/50 bg-gray-50/50 dark:bg-gray-900/20 px-4 py-2 flex items-start gap-2">
              <Ban className="h-3.5 w-3.5 text-gray-500 mt-0.5 shrink-0" />
              <div>
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Drop reason: </span>
                <span className="text-xs text-muted-foreground italic">{consultation.ConsultationTicketAttribute.dropReason}</span>
              </div>
            </div>
          )}
        </div>

        {/* ── PhilHealth Yakap Panel ── */}
        {hasPatient && (
          <KonsultaEncounterPanel
            ticketId={consultation.id}
            clinicPatientId={patient.clinicPatientId}
            isPhilHealthKonsulta={consultation.isPhilHealthKonsulta ?? false}
            konsultaAtcCode={(consultation as any).konsultaAtcCode ?? null}
            konsultaIsWalkedIn={(consultation as any).konsultaIsWalkedIn ?? null}
            konsultaCoPay={(consultation as any).konsultaCoPay ? Number((consultation as any).konsultaCoPay) : null}
            isResolved={isResolved || isDropped}
            onUpdate={() => onReloadDetail?.()}
            onProfilingChecked={(complete) => setKonsultaProfilingComplete(complete)}
            recommendedServicesText={recommendedConsultDesc ? `Recommended for patient's age (${patient?.dob ? `${dayjs().diff(dayjs(patient.dob), 'year')} yrs` : 'Unknown'}) and gender (${patient?.gender || 'Unknown'}): ${recommendedConsultDesc}. Please navigate to the Diagnostics tab to offer these recommended services to the patient.` : undefined}
          />
        )}

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
              value="pe"
              className="flex items-center gap-1.5 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary h-full px-3 text-xs"
            >
              <Activity className="h-3.5 w-3.5" />
              Physical Exam
              {((consultation as any).PhysicalExaminations?.length > 0) && (
                <span className="ml-1 bg-primary/10 text-primary text-[10px] px-1.5 rounded-full">
                  <CheckCircle2 className="h-3 w-3" />
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
            <TabsTrigger
              value="diagnoses"
              className="flex items-center gap-1.5 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary h-full px-3 text-xs"
            >
              <ClipboardList className="h-3.5 w-3.5" />
              Diagnoses
              {diagnosesCount > 0 && (
                <span className="ml-1 bg-primary/10 text-primary text-[10px] px-1.5 rounded-full">
                  {diagnosesCount}
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
            {consultation.isPhilHealthKonsulta && (
              <div className="px-4 sm:px-6 pb-6 border-t border-border/30 pt-4">
                <KonsultaManagementPanel
                  consultationTicketId={consultation.id}
                  isResolved={isResolved || isDropped}
                />
              </div>
            )}
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

          <TabsContent value="pe" className="mt-0 p-4 sm:p-6">
            {hasPatient ? (
              <PhysicalExamEditForm
                patientId={patient.id}
                consultationTicketId={consultation.id}
                examId={(consultation as any).PhysicalExaminations?.[0]?.id}
                initialData={(consultation as any).PhysicalExaminations?.[0] || null}
                onSuccess={onReloadDetail}
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
              <div className="space-y-6">
                {consultation.isPhilHealthKonsulta ? (
                  <Tabs defaultValue="recommended" className="w-full">
                    <TabsList className="w-full flex justify-start h-auto bg-transparent border-b p-0 rounded-none mb-6">
                      {consultation.ClinicPatient?.Patient?.dob && (
                        <TabsTrigger
                          value="recommended"
                          className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-teal-600 rounded-none px-4 py-2 flex items-center gap-1.5 text-xs font-medium text-teal-700 dark:text-teal-400"
                        >
                          <ShieldCheck className="h-3.5 w-3.5" />
                          PhilHealth Recommended Services
                        </TabsTrigger>
                      )}
                      <TabsTrigger
                        value="requests"
                        className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-teal-600 rounded-none px-4 py-2 flex items-center gap-1.5 text-xs font-medium text-teal-700 dark:text-teal-400"
                      >
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Diagnostic Requests
                      </TabsTrigger>
                      <TabsTrigger
                        value="results"
                        className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-teal-600 rounded-none px-4 py-2 flex items-center gap-1.5 text-xs font-medium text-teal-700 dark:text-teal-400"
                      >
                        <ShieldCheck className="h-3.5 w-3.5" />
                        PhilHealth Diagnostic Results
                      </TabsTrigger>
                    </TabsList>

                    {consultation.ClinicPatient?.Patient?.dob && (
                      <TabsContent value="recommended" className="mt-0">
                        <KonsultaRecommendedServicesPanel
                          consultationTicketId={consultation.id}
                          patientAgeMonths={Math.floor((new Date().getTime() - new Date(consultation.ClinicPatient.Patient.dob).getTime()) / (30.44 * 24 * 60 * 60 * 1000))}
                          patientGender={consultation.ClinicPatient.Patient.gender || ""}
                          initialOptions={(consultation as any).konsultaRecommendedDiagnosticOptions as any || []}
                          onUpdate={() => onReloadDetail?.()}
                        />
                      </TabsContent>
                    )}

                    <TabsContent value="requests" className="mt-0">
                      <KonsultaDiagnosticRequests
                        clinicUid={clinicUid}
                        hpId={myHPs[0]?.id || 0}
                        patientId={patient.id}
                        consultationTicketId={consultation.id}
                        recommendedOptions={(consultation as any).konsultaRecommendedDiagnosticOptions as any || []}
                        onDone={() => onReloadDetail?.()}
                      />
                    </TabsContent>

                    <TabsContent value="results" className="mt-0">
                      <KonsultaDiagnosticResultsPanel
                        consultationTicketId={consultation.id}
                        clinicPatientId={patient.clinicPatientId}
                        hciCaseNo={(consultation as any).hciCaseNo ?? ""}
                        hciTransNo={consultation.soapTransNo ?? ""}
                        isResolved={isResolved || isDropped}
                      />
                    </TabsContent>
                  </Tabs>
                ) : (
                  <ConsultationDiagnostics
                    clinicUid={clinicUid}
                    patient={patient}
                    consultation={consultation}
                    myHPs={myHPs}
                    onPatchDetail={onPatchDetail}
                    isResolved={isResolved}
                  />
                )}
              </div>
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

          <TabsContent value="diagnoses" className="mt-0">
            <ConsultationDiagnoses
              consultation={consultation}
              myHPs={myHPs}
              onPatchDetail={onPatchDetail}
              isResolved={isResolved}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
