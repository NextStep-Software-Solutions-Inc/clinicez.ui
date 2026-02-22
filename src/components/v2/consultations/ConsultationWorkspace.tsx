"use client";

import { useState } from "react";
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
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import dayjs from "@/lib/day-utils";
import type { GetPatientConsultationDetail } from "@/actions/consultation/patient-consultations.action";
import type { GetHPsType } from "@/actions/hp.actions";
import ConsultationNotesEditor from "./ConsultationNotesEditor";
import ConsultationPrescriptions from "./ConsultationPrescriptions";
import ConsultationMedCerts from "./ConsultationMedCerts";
import ConsultationDiagnostics from "./ConsultationDiagnostics";

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
  patient: PatientInfo | null;
  consultation: Detail;
  myHPs: NonNullable<GetHPsType>;
  onUpdated?: (updated: Detail) => void;
  onRefresh: () => void;
}

export default function ConsultationWorkspace({
  clinicUid,
  patient,
  consultation,
  myHPs,
  onRefresh,
}: ConsultationWorkspaceProps) {
  const [activeTab, setActiveTab] = useState("notes");

  const status = consultation.ConsultationTicketAttribute?.status;
  const apt = consultation.Appointment;
  const preAssessment = apt?.PreAssessmentNotes?.[0];
  const hasPatient = patient !== null;

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
    <div className="flex flex-col h-full overflow-hidden bg-background/40">
      {/* ── No-patient banner ── */}
      {!hasPatient && (
        <div className="shrink-0 flex items-center gap-2 px-6 py-2 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800/40">
          <Info className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
          <p className="text-xs text-amber-700 dark:text-amber-300">
            Patient info not available for this consultation. Notes can still be edited.
          </p>
        </div>
      )}

      {/* ── Appointment / Consultation Summary Bar ── */}
      <div className="shrink-0 px-6 py-4 border-b border-border/50 bg-background/80 backdrop-blur">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-semibold text-foreground truncate">
                {consultation.subject || apt?.subject || `Consultation #${consultation.id}`}
              </h2>
              <div className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                status === "RESOLVED"
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                  : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
              }`}>
                {status === "RESOLVED" ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                {status === "RESOLVED" ? "Resolved" : "In Progress"}
              </div>
              {consultation.caseNumber && (
                <span className="text-xs text-muted-foreground font-mono">
                  #{consultation.caseNumber}
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 mt-1.5 flex-wrap">
              {/* Patient name from prop or appointment requester */}
              {patient?.fullName && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <User className="h-3.5 w-3.5" />
                  {patient.fullName}
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
              {hpNames && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <User className="h-3.5 w-3.5" />
                  {hpNames}
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
          </div>
        </div>
      </div>

      {/* ── Tabbed Workspace ── */}
      <div className="flex-1 overflow-hidden">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex flex-col h-full"
        >
          <TabsList className="shrink-0 w-full justify-start rounded-none border-b border-border/50 bg-transparent h-10 px-6 gap-0">
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
              {(labCount + imgCount) > 0 && (
                <span className="ml-1 bg-primary/10 text-primary text-[10px] px-1.5 rounded-full">
                  {labCount + imgCount}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded-full">
            <TabsContent value="notes" className="mt-0 h-full">
              <ConsultationNotesEditor
                clinicUid={clinicUid}
                consultation={consultation}
                myHPs={myHPs}
                onRefresh={onRefresh}
              />
            </TabsContent>

            <TabsContent value="rx" className="mt-0 p-6">
              {hasPatient ? (
                <ConsultationPrescriptions
                  clinicUid={clinicUid}
                  patient={patient}
                  consultation={consultation}
                  myHPs={myHPs}
                  onRefresh={onRefresh}
                />
              ) : (
                <NoPatientPlaceholder />
              )}
            </TabsContent>

            <TabsContent value="certs" className="mt-0 p-6">
              {hasPatient ? (
                <ConsultationMedCerts
                  clinicUid={clinicUid}
                  patient={patient}
                  consultation={consultation}
                  myHPs={myHPs}
                  onRefresh={onRefresh}
                />
              ) : (
                <NoPatientPlaceholder />
              )}
            </TabsContent>

            <TabsContent value="diagnostics" className="mt-0 p-6">
              {hasPatient ? (
                <ConsultationDiagnostics
                  clinicUid={clinicUid}
                  patient={patient}
                  consultation={consultation}
                  myHPs={myHPs}
                  onRefresh={onRefresh}
                />
              ) : (
                <NoPatientPlaceholder />
              )}
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
