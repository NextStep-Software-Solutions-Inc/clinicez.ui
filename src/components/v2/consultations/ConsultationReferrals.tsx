"use client";

import { useState, useTransition } from "react";
import { Plus, GitFork, FileDown, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import dayjs from "@/lib/day-utils";
import {
  createReferralSlipAction,
  deleteReferralSlipAction,
} from "@/actions/clinics/clinical-record/referral-slip.action";
import {
  getConsultationReferralsForTicketAction,
} from "@/actions/consultation/patient-consultations.action";
import type { GetPatientConsultationDetail } from "@/actions/consultation/patient-consultations.action";
import type { GetHPsType } from "@/actions/hp.actions";
import DownloadReferralSlipAction from "@/components/referral-slip/DownloadReferralSlipAction";

type Detail = NonNullable<GetPatientConsultationDetail["data"]>;
type ReferralSlip = NonNullable<Detail["ClinicReferralSlips"]>[number];

interface PatientInfo {
  id: number;
  clinicPatientId: number;
  userId: string;
  fullName: string;
}

interface ConsultationReferralsProps {
  clinicUid: string;
  patient: PatientInfo;
  consultation: Detail;
  myHPs: NonNullable<GetHPsType>;
  onPatchDetail: (patch: Partial<Detail>) => void;
  isResolved?: boolean;
}

export default function ConsultationReferrals({
  clinicUid,
  patient,
  consultation,
  myHPs,
  onPatchDetail,
  isResolved = false,
}: ConsultationReferralsProps) {
  const ticketHpIds = consultation.ConsultationTicketHPs.map((h) => h.HealthCareProvider.id);
  const myActiveHp = myHPs.find((hp) => ticketHpIds.includes(hp.id)) ?? myHPs[0] ?? null;
  const appointmentId = consultation.Appointment?.id ?? null;

  const [showForm, setShowForm] = useState(false);
  const [replacingId, setReplacingId] = useState<number | null>(null);
  const [referredTo, setReferredTo] = useState("");
  const [reason, setReason] = useState("");
  const [history, setHistory] = useState("");
  const [impression, setImpression] = useState("");
  const [recommendation, setRecommendation] = useState("");
  const [isPending, startTransition] = useTransition();

  const openReplaceForm = (id: number) => {
    setReplacingId(id);
    setReferredTo("");
    setReason("");
    setHistory("");
    setImpression("");
    setRecommendation("");
    setShowForm(true);
  };

  const resetForm = () => {
    setShowForm(false);
    setReplacingId(null);
    setReferredTo("");
    setReason("");
    setHistory("");
    setImpression("");
    setRecommendation("");
  };

  const refreshReferrals = async () => {
    const result = await getConsultationReferralsForTicketAction({ ticketId: consultation.id });
    if (result.status && result.data) {
      onPatchDetail({ ClinicReferralSlips: result.data });
    }
  };

  const handleCreate = () => {
    if (!myActiveHp) {
      toast.error("No HP profile found for this consultation");
      return;
    }
    if (!appointmentId) {
      toast.error("A linked appointment is required to issue a referral slip");
      return;
    }
    if (!referredTo.trim()) {
      toast.error("Please specify who the patient is referred to");
      return;
    }
    if (!reason.trim()) {
      toast.error("Please specify the reason for referral");
      return;
    }

    startTransition(async () => {
      if (replacingId !== null) {
        const voidResult = await deleteReferralSlipAction({ id: replacingId, hpIds: [myActiveHp.id] });
        if (!voidResult.status) {
          toast.error(voidResult.message ?? "Failed to void existing referral slip");
          return;
        }
      }

      const result = await createReferralSlipAction({
        clinicUid,
        referredTo: referredTo.trim(),
        patientId: patient.clinicPatientId,
        hpIds: [myActiveHp.id],
        consultationTicketId: consultation.id,
        appointmentId,
        reason: reason.trim(),
        history: history.trim() || undefined,
        impression: impression.trim() || undefined,
        recommendation: recommendation.trim() || undefined,
      });

      if (result.status) {
        toast.success(replacingId ? "Referral slip replaced" : "Referral slip issued");
        resetForm();
        await refreshReferrals();
      } else {
        toast.error(result.message ?? "Failed to issue referral slip");
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <GitFork className="h-4 w-4 text-primary" />
          Referral Slips
        </h3>
        {!isResolved && !showForm && (
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 h-7 text-xs"
            onClick={() => setShowForm(true)}
            disabled={!myActiveHp || !appointmentId}
            title={!appointmentId ? "A linked appointment is required" : undefined}
          >
            <Plus className="h-3.5 w-3.5" />
            Issue Referral
          </Button>
        )}
      </div>

      {showForm && (
        <div className="rounded-lg border border-border/50 bg-muted/20 p-4 space-y-3">
          <h4 className="text-xs font-semibold text-foreground/80 uppercase tracking-wide">
            {replacingId ? "Replace Referral Slip" : "Issue Referral Slip"}
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Referred To <span className="text-destructive">*</span></Label>
              <Input
                placeholder="Specialist / Department"
                value={referredTo}
                onChange={(e) => setReferredTo(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Reason for Referral <span className="text-destructive">*</span></Label>
              <Input
                placeholder="Primary reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Brief History</Label>
            <Textarea
              placeholder="Relevant patient history…"
              value={history}
              onChange={(e) => setHistory(e.target.value)}
              className="min-h-14 text-xs resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Clinical Impression</Label>
              <Textarea
                placeholder="Diagnosis / impression…"
                value={impression}
                onChange={(e) => setImpression(e.target.value)}
                className="min-h-14 text-xs resize-none"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Recommendation</Label>
              <Textarea
                placeholder="Recommended management…"
                value={recommendation}
                onChange={(e) => setRecommendation(e.target.value)}
                className="min-h-14 text-xs resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={resetForm}>
              Cancel
            </Button>
            <Button
              size="sm"
              className="h-7 text-xs"
              disabled={isPending || !referredTo.trim() || !reason.trim()}
              onClick={handleCreate}
            >
              {isPending ? "Issuing…" : replacingId ? "Replace Referral" : "Issue Referral"}
            </Button>
          </div>
        </div>
      )}

      {(consultation.ClinicReferralSlips?.length ?? 0) === 0 ? (
        <div className="text-center py-10 text-sm text-muted-foreground">
          No referral slips issued yet.
        </div>
      ) : (
        <div className="space-y-2">
          {consultation.ClinicReferralSlips?.map((slip) => (
            <ReferralCard
              key={slip.id}
              slip={slip}
              onReplace={() => openReplaceForm(slip.id)}
              isResolved={isResolved}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ReferralCard({
  slip,
  onReplace,
  isResolved = false,
}: {
  slip: ReferralSlip;
  onReplace: () => void;
  isResolved?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border/50 bg-background px-4 py-3">
      <div className="flex items-start gap-3">
        <GitFork className="h-4 w-4 text-primary shrink-0 mt-0.5" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium text-foreground">
              {slip.referredTo ?? "—"}
            </p>
            <span className="text-[10px] font-mono text-muted-foreground">
              #{slip.serialNumber}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-0.5 flex-wrap text-xs text-muted-foreground">
            {slip.reason && <span>{slip.reason}</span>}
            <span>{dayjs(slip.createdAt).format("MMM D, YYYY")}</span>
          </div>
          {slip.impression && (
            <p className="text-xs text-muted-foreground mt-1 italic">{slip.impression}</p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            size="sm" variant="ghost" className="h-7 w-7 p-0" title="Void & Replace"
            onClick={onReplace}
            disabled={isResolved}
          >
            <RefreshCw className="h-3.5 w-3.5 text-amber-500" />
          </Button>
          <DownloadReferralSlipAction referralSlip={{ id: slip.id }}>
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="Preview PDF">
              <FileDown className="h-3.5 w-3.5" />
            </Button>
          </DownloadReferralSlipAction>
        </div>
      </div>
    </div>
  );
}
