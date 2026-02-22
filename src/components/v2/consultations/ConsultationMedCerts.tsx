"use client";

import { useState, useTransition, useEffect } from "react";
import { Plus, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import dayjs from "@/lib/day-utils";
import {
  createMedicalCertificateAction,
  getMedicalCertificateReasonsAction,
  getMedicalCertificateFindingsAction,
  getMedicalCertificateClassificationsAction,
} from "@/actions/clinics/clinical-record/medical-certificate.action";
import type { GetPatientConsultationDetail } from "@/actions/consultation/patient-consultations.action";
import type { GetHPsType } from "@/actions/hp.actions";

type Detail = NonNullable<GetPatientConsultationDetail["data"]>;
type MedCert = NonNullable<Detail["MedicalCertificates"]>[number];

interface PatientInfo {
  id: number;
  clinicPatientId: number;
  userId: string;
  fullName: string;
}

interface ConsultationMedCertsProps {
  clinicUid: string;
  patient: PatientInfo;
  consultation: Detail;
  myHPs: NonNullable<GetHPsType>;
  onRefresh: () => void;
}

type Reason = { id: number; name: string; documentTemplateId: number };
type Finding = { id: number; name: string; documentTemplateId: number };
type Classification = { id: number; name: string; documentTemplateId: number };

export default function ConsultationMedCerts({
  clinicUid,
  patient,
  consultation,
  myHPs,
  onRefresh,
}: ConsultationMedCertsProps) {
  const ticketHpIds = consultation.ConsultationTicketHPs.map((h) => h.HealthCareProvider.id);
  const myActiveHp = myHPs.find((hp) => ticketHpIds.includes(hp.id)) ?? myHPs[0] ?? null;

  const [showForm, setShowForm] = useState(false);
  const [reasons, setReasons] = useState<Reason[]>([]);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [classifications, setClassifications] = useState<Classification[]>([]);
  const [reasonId, setReasonId] = useState<number | null>(null);
  const [findingId, setFindingId] = useState<number | null>(null);
  const [classificationId, setClassificationId] = useState<number | null>(null);
  const [remarks, setRemarks] = useState("");
  const [impression, setImpression] = useState("");
  const [isPending, startTransition] = useTransition();
  const [loadingOptions, setLoadingOptions] = useState(false);

  useEffect(() => {
    if (!showForm) return;
    setLoadingOptions(true);
    Promise.all([
      getMedicalCertificateReasonsAction(),
      getMedicalCertificateFindingsAction(),
      getMedicalCertificateClassificationsAction(),
    ]).then(([rRes, fRes, cRes]) => {
      setReasons((rRes.data ?? []) as Reason[]);
      setFindings((fRes.data ?? []) as Finding[]);
      setClassifications((cRes.data ?? []) as Classification[]);
      setLoadingOptions(false);
    });
  }, [showForm]);

  const handleCreate = () => {
    if (!myActiveHp) { toast.error("No HP profile found"); return; }
    if (!reasonId) { toast.error("Select a reason"); return; }
    if (!findingId) { toast.error("Select a finding"); return; }
    if (!classificationId) { toast.error("Select a classification"); return; }

    const reason = reasons.find((r) => r.id === reasonId);
    const finding = findings.find((f) => f.id === findingId);
    const classification = classifications.find((c) => c.id === classificationId);
    const documentTemplateId =
      reason?.documentTemplateId ??
      finding?.documentTemplateId ??
      classification?.documentTemplateId;

    if (!documentTemplateId) {
      toast.error("Could not determine document template. Please contact support.");
      return;
    }

    startTransition(async () => {
      const result = await createMedicalCertificateAction({
        clinicUid,
        patientId: patient.clinicPatientId,
        documentTemplateId,
        hpIds: [myActiveHp.id],
        reasonId,
        findingId,
        classificationId,
        remarks: remarks || undefined,
        impression: impression || undefined,
        consultationTicketId: consultation.id,
      });
      if (result.status) {
        toast.success(result.message ?? "Certificate created");
        setShowForm(false);
        setReasonId(null);
        setFindingId(null);
        setClassificationId(null);
        setRemarks("");
        setImpression("");
        onRefresh();
      } else {
        toast.error(result.message ?? "Failed to create certificate");
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Award className="h-4 w-4 text-primary" />
          Medical Certificates
        </h3>
        {!showForm && (
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 h-7 text-xs"
            onClick={() => setShowForm(true)}
            disabled={!myActiveHp}
          >
            <Plus className="h-3.5 w-3.5" />
            Issue Cert
          </Button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div className="rounded-lg border border-border/50 bg-muted/20 p-4 space-y-3">
          <h4 className="text-xs font-semibold text-foreground/80 uppercase tracking-wide">
            Issue Medical Certificate
          </h4>

          {loadingOptions ? (
            <p className="text-xs text-muted-foreground">Loading options…</p>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Reason *</Label>
                  <Select
                    value={reasonId?.toString() ?? ""}
                    onValueChange={(v) => setReasonId(Number(v))}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {reasons.map((r) => (
                        <SelectItem key={r.id} value={r.id.toString()}>{r.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Finding *</Label>
                  <Select
                    value={findingId?.toString() ?? ""}
                    onValueChange={(v) => setFindingId(Number(v))}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {findings.map((f) => (
                        <SelectItem key={f.id} value={f.id.toString()}>{f.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Classification *</Label>
                  <Select
                    value={classificationId?.toString() ?? ""}
                    onValueChange={(v) => setClassificationId(Number(v))}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {classifications.map((c) => (
                        <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Impression</Label>
                  <Textarea
                    placeholder="Clinical impression…"
                    value={impression}
                    onChange={(e) => setImpression(e.target.value)}
                    className="min-h-16 text-xs resize-none"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Remarks</Label>
                  <Textarea
                    placeholder="Additional remarks…"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    className="min-h-16 text-xs resize-none"
                  />
                </div>
              </div>
            </>
          )}

          <div className="flex justify-end gap-2">
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              className="h-7 text-xs"
              disabled={isPending || loadingOptions}
              onClick={handleCreate}
            >
              {isPending ? "Issuing…" : "Issue Certificate"}
            </Button>
          </div>
        </div>
      )}

      {/* Existing certs */}
      {(consultation.MedicalCertificates?.length ?? 0) === 0 ? (
        <div className="text-center py-10 text-sm text-muted-foreground">
          No medical certificates issued yet.
        </div>
      ) : (
        <div className="space-y-2">
          {consultation.MedicalCertificates.map((cert) => (
            <CertCard key={cert.id} cert={cert} />
          ))}
        </div>
      )}
    </div>
  );
}

function CertCard({ cert }: { cert: MedCert }) {
  return (
    <div className="rounded-lg border border-border/50 bg-background px-4 py-3">
      <div className="flex items-start gap-3">
        <Award className="h-4 w-4 text-primary shrink-0 mt-0.5" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-foreground">
              {cert.Reason?.name ?? "Medical Certificate"}
            </p>
            <span className="text-[10px] font-mono text-muted-foreground">
              #{cert.serialNumber}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-0.5 flex-wrap text-xs text-muted-foreground">
            {cert.Finding?.name && <span>Finding: {cert.Finding.name}</span>}
            {cert.Classification?.name && <span>Class: {cert.Classification.name}</span>}
            <span>{dayjs(cert.createdAt).format("MMM D, YYYY")}</span>
          </div>
          {cert.impression && (
            <p className="text-xs text-muted-foreground mt-1">{cert.impression}</p>
          )}
        </div>
      </div>
    </div>
  );
}
