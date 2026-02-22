"use client";

import { useState, useTransition, useCallback } from "react";
import { Plus, FlaskConical, ImageIcon, Search, X, FileDown, RefreshCw, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import dayjs from "@/lib/day-utils";
import { createLaboratoryRequestAction, deleteLaboratoryRequestAction } from "@/actions/clinics/clinical-record/laboratory-requests.action";
import { createImagingStudyAction, deleteImagingStudyAction } from "@/actions/clinics/clinical-record/imaging-studies.action";
import { createHeartStationRequestAction, deleteHeartStationRequestAction } from "@/actions/clinics/clinical-record/heart-station.action";
import {
  getClinicLabProceduresAction,
  getClinicImagingProceduresAction,
  getClinicHeartStationProceduresAction,
  getConsultationDiagnosticsForTicketAction,
} from "@/actions/consultation/patient-consultations.action";
import type {
  GetPatientConsultationDetail,
  GetClinicLabProcedures,
  GetClinicImagingProcedures,
  GetClinicHeartStationProcedures,
} from "@/actions/consultation/patient-consultations.action";
import type { GetHPsType } from "@/actions/hp.actions";
import DownloadLaboratoryRequestAction from "@/components/laboratory-requests/DownloadLaboratoryRequestAction";
import DownloadImagingStudiesAction from "@/components/imaging-studies/DownloadImagingStudiesAction";

type Detail = NonNullable<GetPatientConsultationDetail["data"]>;
type LabProc = NonNullable<GetClinicLabProcedures["data"]>[number];
type ImagingProc = NonNullable<GetClinicImagingProcedures["data"]>[number];
type HeartStationProc = NonNullable<GetClinicHeartStationProcedures["data"]>[number];
type HeartStationRequest = NonNullable<Detail["HeartStationRequests"]>[number];

interface PatientInfo {
  id: number;
  clinicPatientId: number;
  userId: string;
  fullName: string;
}

interface ConsultationDiagnosticsProps {
  clinicUid: string;
  patient: PatientInfo;
  consultation: Detail;
  myHPs: NonNullable<GetHPsType>;
  onPatchDetail: (patch: Partial<Detail>) => void;
}

export default function ConsultationDiagnostics({
  clinicUid,
  patient,
  consultation,
  myHPs,
  onPatchDetail,
}: ConsultationDiagnosticsProps) {
  const ticketHpIds = consultation.ConsultationTicketHPs.map((h) => h.HealthCareProvider.id);
  const myActiveHp = myHPs.find((hp) => ticketHpIds.includes(hp.id)) ?? myHPs[0] ?? null;

  type ActiveForm = "lab" | "imaging" | "heartStation" | null;
  const [activeForm, setActiveForm] = useState<ActiveForm>(null);
  const [replacingLabId, setReplacingLabId] = useState<number | null>(null);
  const [replacingImagingId, setReplacingImagingId] = useState<number | null>(null);
  const [replacingHsId, setReplacingHsId] = useState<number | null>(null);

  const handleDiagnosticsCreated = async () => {
    const result = await getConsultationDiagnosticsForTicketAction({ ticketId: consultation.id });
    if (result.status && result.data) {
      onPatchDetail({
        LaboratoryRequests: result.data.labs,
        ImagingRequests: result.data.imaging,
        HeartStationRequests: result.data.heartStation,
      });
    }
  };

  const openLabForm = (replacingId?: number) => {
    setReplacingLabId(replacingId ?? null);
    setActiveForm("lab");
  };
  const openImagingForm = (replacingId?: number) => {
    setReplacingImagingId(replacingId ?? null);
    setActiveForm("imaging");
  };
  const openHeartStationForm = (replacingId?: number) => {
    setReplacingHsId(replacingId ?? null);
    setActiveForm("heartStation");
  };
  const closeForm = () => {
    setActiveForm(null);
    setReplacingLabId(null);
    setReplacingImagingId(null);
    setReplacingHsId(null);
  };

  const totalCount =
    (consultation.LaboratoryRequests?.length ?? 0) +
    (consultation.ImagingRequests?.length ?? 0) +
    (consultation.HeartStationRequests?.length ?? 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <FlaskConical className="h-4 w-4 text-primary" />
          Diagnostic Requests
        </h3>
        {activeForm === null && (
          <div className="flex gap-2">
            <Button
              size="sm" variant="outline" className="gap-1.5 h-7 text-xs"
              onClick={() => openLabForm()} disabled={!myActiveHp}
            >
              <FlaskConical className="h-3.5 w-3.5" />
              Lab
            </Button>
            <Button
              size="sm" variant="outline" className="gap-1.5 h-7 text-xs"
              onClick={() => openImagingForm()} disabled={!myActiveHp}
            >
              <ImageIcon className="h-3.5 w-3.5" />
              Imaging
            </Button>
            <Button
              size="sm" variant="outline" className="gap-1.5 h-7 text-xs"
              onClick={() => openHeartStationForm()} disabled={!myActiveHp}
            >
              <Heart className="h-3.5 w-3.5" />
              Heart Station
            </Button>
          </div>
        )}
      </div>

      {activeForm === "lab" && myActiveHp && (
        <LabRequestForm
          clinicUid={clinicUid}
          patient={patient}
          consultation={consultation}
          hpId={myActiveHp.id}
          replacingId={replacingLabId}
          onDone={() => { closeForm(); handleDiagnosticsCreated(); }}
          onCancel={closeForm}
        />
      )}

      {activeForm === "imaging" && myActiveHp && (
        <ImagingRequestForm
          clinicUid={clinicUid}
          patient={patient}
          consultation={consultation}
          hpId={myActiveHp.id}
          replacingId={replacingImagingId}
          onDone={() => { closeForm(); handleDiagnosticsCreated(); }}
          onCancel={closeForm}
        />
      )}

      {activeForm === "heartStation" && myActiveHp && (
        <HeartStationRequestForm
          clinicUid={clinicUid}
          patient={patient}
          consultation={consultation}
          hpId={myActiveHp.id}
          replacingId={replacingHsId}
          onDone={() => { closeForm(); handleDiagnosticsCreated(); }}
          onCancel={closeForm}
        />
      )}

      {/* Existing requests */}
      {totalCount === 0 ? (
        <div className="text-center py-10 text-sm text-muted-foreground">
          No diagnostic requests issued yet.
        </div>
      ) : (
        <div className="space-y-2">
          {consultation.LaboratoryRequests?.map((req) => (
            <DiagnosticCard
              key={`lab-${req.id}`}
              id={req.id}
              type="lab"
              serialNumber={req.serialNumber}
              impression={req.impression ?? undefined}
              createdAt={req.createdAt}
              procedures={req.LaboratoryRequestProcedures?.map(
                (p) => p.LaboratoryProcedure?.name ?? ""
              ) ?? []}
              onReplace={() => openLabForm(req.id)}
            />
          ))}
          {consultation.ImagingRequests?.map((req) => (
            <DiagnosticCard
              key={`img-${req.id}`}
              id={req.id}
              type="imaging"
              serialNumber={req.serialNumber}
              impression={req.impression ?? undefined}
              createdAt={req.createdAt}
              procedures={req.ImagingRequestProcedures?.map(
                (p) => p.ImagingProcedure?.name ?? ""
              ) ?? []}
              onReplace={() => openImagingForm(req.id)}
            />
          ))}
          {consultation.HeartStationRequests?.map((req) => (
            <DiagnosticCard
              key={`hs-${req.id}`}
              id={req.id}
              type="heartStation"
              serialNumber={req.serialNumber}
              impression={req.impression ?? undefined}
              createdAt={req.createdAt}
              procedures={req.HeartStationRequestProcedures?.map(
                (p) => p.HeartStationProcedure?.name ?? ""
              ) ?? []}
              onReplace={() => openHeartStationForm(req.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Lab Request Form ── */
function LabRequestForm({
  clinicUid,
  patient,
  consultation,
  hpId,
  replacingId,
  onDone,
  onCancel,
}: {
  clinicUid: string;
  patient: PatientInfo;
  consultation: Detail;
  hpId: number;
  replacingId: number | null;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<LabProc[]>([]);
  const [selected, setSelected] = useState<LabProc[]>([]);
  const [impression, setImpression] = useState("");
  const [isPending, startTransition] = useTransition();
  const [searching, setSearching] = useState(false);

  const doSearch = useCallback(
    async (term: string) => {
      setSearching(true);
      const res = await getClinicLabProceduresAction({ clinicUid, search: term });
      if (res.status && res.data) setResults(res.data);
      setSearching(false);
    },
    [clinicUid]
  );

  const toggle = (proc: LabProc) => {
    setSelected((prev) =>
      prev.some((p) => p.id === proc.id)
        ? prev.filter((p) => p.id !== proc.id)
        : [...prev, proc]
    );
  };

  const handleSubmit = () => {
    if (selected.length === 0) { toast.error("Select at least one test"); return; }
    startTransition(async () => {
      if (replacingId !== null) {
        const voidResult = await deleteLaboratoryRequestAction({ laboratoryRequestId: replacingId });
        if (!voidResult.status) {
          toast.error(voidResult.message ?? "Failed to void existing lab request");
          return;
        }
      }
      const result = await createLaboratoryRequestAction({
        clinicUid,
        patientId: patient.clinicPatientId,
        hpIds: [hpId],
        diagnosticIds: selected.map((p) => p.id),
        consultationTicketId: consultation.id,
        impression: impression || undefined,
      });
      if (result.status) {
        toast.success(replacingId ? "Lab request replaced" : "Lab request created");
        onDone();
      } else {
        toast.error(result.message ?? "Failed to create lab request");
      }
    });
  };

  return (
    <div className="rounded-lg border border-border/50 bg-muted/20 p-4 space-y-3">
      <h4 className="text-xs font-semibold text-foreground/80 uppercase tracking-wide flex items-center gap-2">
        <FlaskConical className="h-3.5 w-3.5 text-primary" />
        {replacingId ? "Replace Lab Request" : "Laboratory Request"}
      </h4>

      <div className="space-y-1">
        <Label className="text-xs">Search Tests</Label>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="CBC, Urinalysis…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              doSearch(e.target.value);
            }}
            className="h-8 pl-8 text-xs"
          />
        </div>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="rounded-md border border-border/40 bg-background max-h-36 overflow-y-auto divide-y divide-border/30">
          {results.map((proc) => (
            <button
              key={proc.id}
              type="button"
              onClick={() => toggle(proc)}
              className={`w-full text-left px-3 py-2 text-xs hover:bg-muted/40 transition-colors flex items-center gap-2 ${
                selected.some((p) => p.id === proc.id) ? "bg-primary/5 text-primary" : ""
              }`}
            >
              <span className="flex-1">{proc.name}</span>
              {proc.MasterProcedure?.category && (
                <span className="text-muted-foreground text-[10px]">{proc.MasterProcedure.category}</span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Selected */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((p) => (
            <Badge
              key={p.id}
              variant="secondary"
              className="text-xs gap-1 cursor-pointer"
              onClick={() => toggle(p)}
            >
              {p.name}
              <X className="h-2.5 w-2.5" />
            </Badge>
          ))}
        </div>
      )}

      <div className="space-y-1">
        <Label className="text-xs">Clinical Impression</Label>
        <Textarea
          placeholder="Clinical indication or impression…"
          value={impression}
          onChange={(e) => setImpression(e.target.value)}
          className="min-h-14 text-xs resize-none"
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={onCancel}>Cancel</Button>
        <Button size="sm" className="h-7 text-xs" disabled={isPending || selected.length === 0} onClick={handleSubmit}>
          {isPending ? "Saving…" : replacingId ? "Replace Lab Request" : "Create Lab Request"}
        </Button>
      </div>
    </div>
  );
}

/* ── Imaging Request Form ── */
function ImagingRequestForm({
  clinicUid,
  patient,
  consultation,
  hpId,
  replacingId,
  onDone,
  onCancel,
}: {
  clinicUid: string;
  patient: PatientInfo;
  consultation: Detail;
  hpId: number;
  replacingId: number | null;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<ImagingProc[]>([]);
  const [selected, setSelected] = useState<ImagingProc[]>([]);
  const [impression, setImpression] = useState("");
  const [history, setHistory] = useState("");
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();

  const doSearch = useCallback(
    async (term: string) => {
      const res = await getClinicImagingProceduresAction({ clinicUid, search: term });
      if (res.status && res.data) setResults(res.data);
    },
    [clinicUid]
  );

  const toggle = (proc: ImagingProc) => {
    setSelected((prev) =>
      prev.some((p) => p.id === proc.id)
        ? prev.filter((p) => p.id !== proc.id)
        : [...prev, proc]
    );
  };

  const handleSubmit = () => {
    if (selected.length === 0) { toast.error("Select at least one procedure"); return; }
    startTransition(async () => {
      if (replacingId !== null) {
        const voidResult = await deleteImagingStudyAction({ imagingStudyId: replacingId });
        if (!voidResult.status) {
          toast.error(voidResult.message ?? "Failed to void existing imaging request");
          return;
        }
      }
      const result = await createImagingStudyAction({
        clinicUid,
        patientId: patient.clinicPatientId,
        hpIds: [hpId],
        diagnosticIds: selected.map((p) => p.id),
        consultationTicketId: consultation.id,
        impression: impression || undefined,
        history: history || undefined,
        reason: reason || undefined,
      });
      if (result.status) {
        toast.success(replacingId ? "Imaging request replaced" : "Imaging request created");
        onDone();
      } else {
        toast.error(result.message ?? "Failed to create imaging request");
      }
    });
  };

  return (
    <div className="rounded-lg border border-border/50 bg-muted/20 p-4 space-y-3">
      <h4 className="text-xs font-semibold text-foreground/80 uppercase tracking-wide flex items-center gap-2">
        <ImageIcon className="h-3.5 w-3.5 text-primary" />
        {replacingId ? "Replace Imaging Request" : "Imaging Request"}
      </h4>

      <div className="space-y-1">
        <Label className="text-xs">Search Procedures</Label>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Chest X-ray, Ultrasound…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              doSearch(e.target.value);
            }}
            className="h-8 pl-8 text-xs"
          />
        </div>
      </div>

      {results.length > 0 && (
        <div className="rounded-md border border-border/40 bg-background max-h-36 overflow-y-auto divide-y divide-border/30">
          {results.map((proc) => (
            <button
              key={proc.id}
              type="button"
              onClick={() => toggle(proc)}
              className={`w-full text-left px-3 py-2 text-xs hover:bg-muted/40 transition-colors flex items-center gap-2 ${
                selected.some((p) => p.id === proc.id) ? "bg-primary/5 text-primary" : ""
              }`}
            >
              <span className="flex-1">{proc.name}</span>
              {proc.MasterProcedure?.category && (
                <span className="text-muted-foreground text-[10px]">{proc.MasterProcedure.category}</span>
              )}
            </button>
          ))}
        </div>
      )}

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((p) => (
            <Badge key={p.id} variant="secondary" className="text-xs gap-1 cursor-pointer" onClick={() => toggle(p)}>
              {p.name}
              <X className="h-2.5 w-2.5" />
            </Badge>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Clinical History</Label>
          <Textarea
            placeholder="Relevant history…"
            value={history}
            onChange={(e) => setHistory(e.target.value)}
            className="min-h-14 text-xs resize-none"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Reason / Impression</Label>
          <Textarea
            placeholder="Reason for request…"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="min-h-14 text-xs resize-none"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={onCancel}>Cancel</Button>
        <Button size="sm" className="h-7 text-xs" disabled={isPending || selected.length === 0} onClick={handleSubmit}>
          {isPending ? "Saving…" : replacingId ? "Replace Imaging Request" : "Create Imaging Request"}
        </Button>
      </div>
    </div>
  );
}

/* ── Heart Station Request Form ── */
function HeartStationRequestForm({
  clinicUid,
  patient,
  consultation,
  hpId,
  replacingId,
  onDone,
  onCancel,
}: {
  clinicUid: string;
  patient: PatientInfo;
  consultation: Detail;
  hpId: number;
  replacingId: number | null;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<HeartStationProc[]>([]);
  const [selected, setSelected] = useState<HeartStationProc[]>([]);
  const [impression, setImpression] = useState("");
  const [clinicalHistory, setClinicalHistory] = useState("");
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();

  const doSearch = useCallback(
    async (term: string) => {
      const res = await getClinicHeartStationProceduresAction({ clinicUid, search: term });
      if (res.status && res.data) setResults(res.data);
    },
    [clinicUid]
  );

  const toggle = (proc: HeartStationProc) => {
    setSelected((prev) =>
      prev.some((p) => p.id === proc.id)
        ? prev.filter((p) => p.id !== proc.id)
        : [...prev, proc]
    );
  };

  const handleSubmit = () => {
    if (selected.length === 0) { toast.error("Select at least one procedure"); return; }
    startTransition(async () => {
      if (replacingId !== null) {
        const voidResult = await deleteHeartStationRequestAction({ id: replacingId, hpIds: [hpId] });
        if (!voidResult.status) {
          toast.error(voidResult.message ?? "Failed to void existing heart station request");
          return;
        }
      }
      const result = await createHeartStationRequestAction({
        clinicUid,
        patientId: patient.clinicPatientId,
        hpIds: [hpId],
        procedureIds: selected.map((p) => p.id),
        consultationTicketId: consultation.id,
        impression: impression || undefined,
        history: clinicalHistory || undefined,
        reason: reason || undefined,
      });
      if (result.status) {
        toast.success(replacingId ? "Heart station request replaced" : "Heart station request created");
        onDone();
      } else {
        toast.error(result.message ?? "Failed to create heart station request");
      }
    });
  };

  return (
    <div className="rounded-lg border border-border/50 bg-muted/20 p-4 space-y-3">
      <h4 className="text-xs font-semibold text-foreground/80 uppercase tracking-wide flex items-center gap-2">
        <Heart className="h-3.5 w-3.5 text-primary" />
        {replacingId ? "Replace Heart Station Request" : "Heart Station Request"}
      </h4>

      <div className="space-y-1">
        <Label className="text-xs">Search Procedures</Label>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="ECG, Echo…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              doSearch(e.target.value);
            }}
            className="h-8 pl-8 text-xs"
          />
        </div>
      </div>

      {results.length > 0 && (
        <div className="rounded-md border border-border/40 bg-background max-h-36 overflow-y-auto divide-y divide-border/30">
          {results.map((proc) => (
            <button
              key={proc.id}
              type="button"
              onClick={() => toggle(proc)}
              className={`w-full text-left px-3 py-2 text-xs hover:bg-muted/40 transition-colors ${
                selected.some((p) => p.id === proc.id) ? "bg-primary/5 text-primary" : ""
              }`}
            >
              {proc.name}
            </button>
          ))}
        </div>
      )}

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((p) => (
            <Badge key={p.id} variant="secondary" className="text-xs gap-1 cursor-pointer" onClick={() => toggle(p)}>
              {p.name}
              <X className="h-2.5 w-2.5" />
            </Badge>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Clinical History</Label>
          <Textarea
            placeholder="Relevant history…"
            value={clinicalHistory}
            onChange={(e) => setClinicalHistory(e.target.value)}
            className="min-h-14 text-xs resize-none"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Reason / Impression</Label>
          <Textarea
            placeholder="Reason for request…"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="min-h-14 text-xs resize-none"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={onCancel}>Cancel</Button>
        <Button size="sm" className="h-7 text-xs" disabled={isPending || selected.length === 0} onClick={handleSubmit}>
          {isPending ? "Saving…" : replacingId ? "Replace Request" : "Create Request"}
        </Button>
      </div>
    </div>
  );
}

/* ── Diagnostic Card ── */
function DiagnosticCard({
  id,
  type,
  serialNumber,
  impression,
  createdAt,
  procedures,
  onReplace,
}: {
  id: number;
  type: "lab" | "imaging" | "heartStation";
  serialNumber: string;
  impression?: string;
  createdAt: Date;
  procedures: string[];
  onReplace: () => void;
}) {
  const Icon = type === "lab" ? FlaskConical : type === "imaging" ? ImageIcon : Heart;
  const label = type === "lab" ? "Laboratory Request" : type === "imaging" ? "Imaging Request" : "Heart Station Request";

  return (
    <div className="rounded-lg border border-border/50 bg-background px-4 py-3">
      <div className="flex items-start gap-3">
        <Icon className="h-4 w-4 text-primary shrink-0 mt-0.5" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-foreground">{label}</p>
            <span className="text-[10px] font-mono text-muted-foreground">#{serialNumber}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {dayjs(createdAt).format("MMM D, YYYY")}
          </p>
          {procedures.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {procedures.filter(Boolean).map((name, i) => (
                <Badge key={i} variant="outline" className="text-[10px] h-4 px-1.5">
                  {name}
                </Badge>
              ))}
            </div>
          )}
          {impression && (
            <p className="text-xs text-muted-foreground mt-1 italic">{impression}</p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            size="sm" variant="ghost" className="h-7 w-7 p-0" title="Void & Replace"
            onClick={onReplace}
          >
            <RefreshCw className="h-3.5 w-3.5 text-amber-500" />
          </Button>
          {type === "lab" ? (
            <DownloadLaboratoryRequestAction request={{ id }}>
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="Preview PDF">
                <FileDown className="h-3.5 w-3.5" />
              </Button>
            </DownloadLaboratoryRequestAction>
          ) : type === "imaging" ? (
            <DownloadImagingStudiesAction study={{ id }}>
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="Preview PDF">
                <FileDown className="h-3.5 w-3.5" />
              </Button>
            </DownloadImagingStudiesAction>
          ) : null}
        </div>
      </div>
    </div>
  );
}
