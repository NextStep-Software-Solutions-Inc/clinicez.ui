"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import {
    Loader2, ShieldCheck, Users, ClipboardList, Send,
    History, RefreshCw, Plus, Trash2, CheckSquare, Square,
    ChevronDown, ChevronRight, AlertCircle, CheckCircle2,
    Clock, FileCode2, Lock, Upload, Eye, EyeOff,
    UserMinus, Pencil, ShieldQuestion,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter,
    DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import type {
    GetPhilHealthPatients,
    GetAllClinicPatientsWithPhilHealthStatus,
    GetKonsultaBatches,
    GetPhilHealthConsultations,
} from "@/actions/clinics/konsulta-report.action";
import {
    getPhilHealthPatientsAction,
    getAllClinicPatientsWithPhilHealthStatusAction,
    enrollPatientPhilHealthAction,
    unenrollKonsultaPatientAction,
    checkKonsultaPatientRegistrationAction,
    validateKonsultaAtcAction,
    getPhilHealthConsultationsAction,
    getKonsultaBatchesAction,
    createKonsultaBatchAction,
    generateBatchXmlAction,
    submitKonsultaBatchAction,
    deleteKonsultaBatchAction,
    toggleKonsultaEntryAction,
} from "@/actions/clinics/konsulta-report.action";

// ─── Types ────────────────────────────────────────────────────────────────────

type Patient = NonNullable<GetPhilHealthPatients["data"]>[number];
type ClinicPatientRow = NonNullable<NonNullable<GetAllClinicPatientsWithPhilHealthStatus["data"]>["patients"]>[number];
type Batch = NonNullable<GetKonsultaBatches["data"]>[number];
type Consultation = NonNullable<GetPhilHealthConsultations["data"]>[number];

const BATCH_STATUS_LABELS: Record<string, string> = {
    DRAFT: "Draft",
    GENERATED: "XML Generated",
    VALIDATED: "Validated",
    SUBMITTED: "Submitted",
    FAILED: "Failed",
};

const BATCH_STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    DRAFT: "outline",
    GENERATED: "secondary",
    VALIDATED: "secondary",
    SUBMITTED: "default",
    FAILED: "destructive",
};

function formatPeriod(period: string): string {
    if (period.length !== 6) return period;
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const m = parseInt(period.slice(4, 6), 10) - 1;
    const y = period.slice(0, 4);
    return `${months[m] ?? "?"} ${y}`;
}

function currentPeriod(): string {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    return `${y}${m}`;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface PhilHealthReportTabProps {
    clinicUid: string;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function PhilHealthReportTab({ clinicUid }: PhilHealthReportTabProps) {
    return (
        <Tabs defaultValue="patients" className="mt-4">
            <TabsList className="mb-4">
                <TabsTrigger value="patients" className="gap-2">
                    <Users className="h-4 w-4" />Patients
                </TabsTrigger>
                <TabsTrigger value="consultations" className="gap-2">
                    <ClipboardList className="h-4 w-4" />Consultations
                </TabsTrigger>
                <TabsTrigger value="batches" className="gap-2">
                    <Send className="h-4 w-4" />Report Batches
                </TabsTrigger>
                <TabsTrigger value="history" className="gap-2">
                    <History className="h-4 w-4" />Submission History
                </TabsTrigger>
            </TabsList>

            <TabsContent value="patients">
                <PatientsPanel clinicUid={clinicUid} />
            </TabsContent>
            <TabsContent value="consultations">
                <ConsultationsPanel clinicUid={clinicUid} />
            </TabsContent>
            <TabsContent value="batches">
                <BatchesPanel clinicUid={clinicUid} />
            </TabsContent>
            <TabsContent value="history">
                <SubmissionHistoryPanel clinicUid={clinicUid} />
            </TabsContent>
        </Tabs>
    );
}

// ─── Patients Panel ───────────────────────────────────────────────────────────

type EnrollForm = {
    pin: string;
    patientType: "MM" | "DD";
    memberPin: string;
    philSysId: string;
    tin: string;
};

const EMPTY_ENROLL_FORM: EnrollForm = { pin: "", patientType: "MM", memberPin: "", philSysId: "", tin: "" };

type PatientFeed = {
    rows: ClinicPatientRow[];
    loading: boolean;
    loadingMore: boolean;
    hasMore: boolean;
    total: number;
};

const EMPTY_FEED: PatientFeed = { rows: [], loading: true, loadingMore: false, hasMore: false, total: 0 };

function registrationBadge(status?: string | null) {
    if (status === "REGISTERED") return <Badge className="text-xs">Registered</Badge>;
    if (status === "NOT_REGISTERED") return <Badge variant="destructive" className="text-xs">Not Registered</Badge>;
    if (status === "FAILED") return <Badge variant="destructive" className="text-xs">Check Failed</Badge>;
    return <Badge variant="outline" className="text-xs">Pending</Badge>;
}

function patientDisplayName(patient: ClinicPatientRow["Patient"]): string {
    return `${patient.lastName ?? ""}, ${patient.firstName ?? ""}${patient.middleName ? ` ${patient.middleName[0]}.` : ""}`.trim();
}

function PatientsPanel({ clinicUid }: { clinicUid: string }) {
    const PAGE_SIZE = 25;
    const [enrolledFeed, setEnrolledFeed] = useState<PatientFeed>(EMPTY_FEED);
    const [unenrolledFeed, setUnenrolledFeed] = useState<PatientFeed>(EMPTY_FEED);
    const [search, setSearch] = useState("");
    const [enrollTarget, setEnrollTarget] = useState<ClinicPatientRow | null>(null);
    const [enrollForm, setEnrollForm] = useState<EnrollForm>(EMPTY_ENROLL_FORM);
    const [enrollLoading, setEnrollLoading] = useState(false);

    const loadFeed = useCallback(async (kind: "ENROLLED" | "UNENROLLED", skip: number, replace: boolean) => {
        const setFeed = kind === "ENROLLED" ? setEnrolledFeed : setUnenrolledFeed;
        setFeed((prev) => ({ ...prev, loading: replace, loadingMore: !replace }));
        const res = await getAllClinicPatientsWithPhilHealthStatusAction({
            clinicUid,
            kind,
            skip,
            take: PAGE_SIZE,
            search,
        });
        if (res.status && res.data) {
            const { patients, total: t, hasMore: more } = res.data;
            setFeed((prev) => ({
                rows: replace ? patients : [...prev.rows, ...patients],
                total: t,
                hasMore: more,
                loading: false,
                loadingMore: false,
            }));
        } else {
            setFeed((prev) => ({ ...prev, loading: false, loadingMore: false }));
            toast.error(res.message ?? "Failed to load patients");
        }
    }, [clinicUid, search]);

    const reload = useCallback(() => {
        void loadFeed("ENROLLED", 0, true);
        void loadFeed("UNENROLLED", 0, true);
    }, [loadFeed]);

    useEffect(() => { void reload(); }, [reload]);

    const handleScroll = (kind: "ENROLLED" | "UNENROLLED", event: React.UIEvent<HTMLDivElement>) => {
        const feed = kind === "ENROLLED" ? enrolledFeed : unenrolledFeed;
        if (!feed.hasMore || feed.loading || feed.loadingMore) return;
        const target = event.currentTarget;
        if (target.scrollTop + target.clientHeight >= target.scrollHeight - 96) {
            void loadFeed(kind, feed.rows.length, false);
        }
    };

    function openEnrollDialog(patient: ClinicPatientRow) {
        const ph = patient.Patient.PhilHealthRecords[0];
        setEnrollTarget(patient);
        setEnrollForm({
            pin: ph?.pin ?? "",
            patientType: patient.konsultaPatientType === "DD" ? "DD" : "MM",
            memberPin: patient.konsultaMemberPin ?? ph?.pin ?? "",
            philSysId: "",
            tin: "",
        });
    }

    async function handleEnroll() {
        if (!enrollTarget) return;
        if (!enrollForm.pin.trim()) { toast.error("PhilHealth PIN is required"); return; }
        if (enrollForm.patientType === "DD" && !enrollForm.memberPin.trim()) {
            toast.error("Primary member PIN is required for dependents");
            return;
        }

        setEnrollLoading(true);
        const res = await enrollPatientPhilHealthAction({
            clinicUid,
            clinicPatientId: enrollTarget.id,
            pin: enrollForm.pin.trim(),
            patientType: enrollForm.patientType,
            memberPin: enrollForm.patientType === "DD" ? enrollForm.memberPin.trim() : enrollForm.pin.trim(),
            philSysId: enrollForm.philSysId || null,
            tin: enrollForm.tin || null,
        });
        setEnrollLoading(false);

        if (res.status) {
            if (res.data?.registrationStatus === "REGISTERED") {
                toast.success("Konsulta registration confirmed");
            } else {
                toast.warning(res.message ?? "Patient details saved, but registration was not confirmed.");
            }
            setEnrollTarget(null);
            void reload();
        } else {
            toast.error(res.message ?? "Enrollment failed");
        }
    }

    async function handleUnenroll(patient: ClinicPatientRow) {
        const res = await unenrollKonsultaPatientAction({ clinicUid, clinicPatientId: patient.id });
        if (res.status) {
            toast.success("Patient removed from enrolled list");
            reload();
        } else {
            toast.error(res.message ?? "Unable to unenroll patient");
        }
    }

    async function handleCheck(patient: ClinicPatientRow) {
        const res = await checkKonsultaPatientRegistrationAction({ clinicUid, clinicPatientId: patient.id });
        if (res.status) {
            if (res.data?.registrationStatus === "REGISTERED") {
                toast.success("Konsulta registration confirmed");
            } else {
                toast.warning("PhilHealth did not confirm this patient for this provider.");
            }
            reload();
        } else {
            toast.error(res.message ?? "Registration check failed");
        }
    }

    function PatientRow({ patient, enrolled }: { patient: ClinicPatientRow; enrolled: boolean }) {
        const ph = patient.Patient.PhilHealthRecords[0];
        return (
            <div className="border-b px-4 py-3 last:border-b-0">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{patientDisplayName(patient.Patient)}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                            <code className="rounded bg-muted px-1.5 py-0.5">{ph?.pin ?? "No PIN"}</code>
                            <Badge variant="outline" className="text-xs">{patient.konsultaPatientType === "DD" ? "Dependent" : "Member"}</Badge>
                            {registrationBadge(patient.konsultaRegistrationStatus)}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                            {patient.Patient.dob ? new Date(patient.Patient.dob).toLocaleDateString("en-PH") : "No DOB"}
                            {patient.Patient.mobile ? ` • ${patient.Patient.mobile}` : ""}
                        </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
                        <Button variant="outline" size="sm" className="h-8 gap-1 px-2 text-xs" onClick={() => openEnrollDialog(patient)}>
                            {enrolled ? <Pencil className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                            {enrolled ? "Update" : "Enroll"}
                        </Button>
                        {enrolled && (
                            <>
                                <Button variant="ghost" size="sm" className="h-8 gap-1 px-2 text-xs" onClick={() => void handleCheck(patient)}>
                                    <ShieldQuestion className="h-3.5 w-3.5" />Check
                                </Button>
                                <Button variant="ghost" size="sm" className="h-8 gap-1 px-2 text-xs text-destructive" onClick={() => void handleUnenroll(patient)}>
                                    <UserMinus className="h-3.5 w-3.5" />Unenroll
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    function PatientFeedColumn({
        title,
        kind,
        feed,
        icon,
    }: {
        title: string;
        kind: "ENROLLED" | "UNENROLLED";
        feed: PatientFeed;
        icon: React.ReactNode;
    }) {
        return (
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-3">
                        <CardTitle className="flex items-center gap-2 text-sm">{icon}{title}</CardTitle>
                        <Badge variant="outline" className="text-xs">{feed.rows.length}/{feed.total}</Badge>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="h-[620px] overflow-y-auto" onScroll={(e) => handleScroll(kind, e)}>
                        {feed.loading ? (
                            <div className="flex h-full items-center justify-center">
                                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                            </div>
                        ) : feed.rows.length === 0 ? (
                            <div className="px-4 py-10 text-center text-sm text-muted-foreground">
                                {search ? "No patients match your search." : kind === "ENROLLED" ? "No registered Konsulta patients." : "No unenrolled patients."}
                            </div>
                        ) : (
                            <>
                                {feed.rows.map((patient) => (
                                    <PatientRow key={patient.id} patient={patient} enrolled={kind === "ENROLLED"} />
                                ))}
                                {feed.loadingMore && (
                                    <div className="flex justify-center py-4">
                                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                    </div>
                                )}
                                {feed.hasMore && !feed.loadingMore && (
                                    <div className="py-4 text-center text-xs text-muted-foreground">Scroll for more</div>
                                )}
                            </>
                        )}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <Card className="mb-4">
                <CardHeader className="pb-3">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2 text-sm">
                                <ShieldCheck className="h-4 w-4 text-primary" />
                                Clinic Patients — Konsulta Registration
                            </CardTitle>
                            <CardDescription className="mt-1">
                                Enrolled means registered to this HCI for the current effectivity year.
                            </CardDescription>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => reload()}>
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                    </div>
                    <Input
                        placeholder="Search by name or PhilHealth PIN…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="max-w-sm"
                    />
                </CardHeader>
            </Card>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <PatientFeedColumn
                    title="Enrolled"
                    kind="ENROLLED"
                    feed={enrolledFeed}
                    icon={<CheckCircle2 className="h-4 w-4 text-green-500" />}
                />
                <PatientFeedColumn
                    title="Unenrolled"
                    kind="UNENROLLED"
                    feed={unenrolledFeed}
                    icon={<AlertCircle className="h-4 w-4 text-amber-500" />}
                />
            </div>

            {/* ── Enrollment Dialog ── */}
            <Dialog open={!!enrollTarget} onOpenChange={(o) => { if (!o) setEnrollTarget(null); }}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4 text-primary" />
                            {enrollTarget?.konsultaRegistrationStatus === "REGISTERED" ? "Update Konsulta Enrollment" : "Enroll for Konsulta"}
                        </DialogTitle>
                        <DialogDescription>
                            {enrollTarget
                                ? `Add a PhilHealth PIN for ${enrollTarget.Patient.firstName} ${enrollTarget.Patient.lastName}.`
                                : ""}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <Label htmlFor="enroll-pin">
                                PhilHealth PIN <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="enroll-pin"
                                placeholder="12-digit PhilHealth PIN"
                                value={enrollForm.pin}
                                onChange={(e) =>
                                    setEnrollForm((f) => ({ ...f, pin: e.target.value }))
                                }
                                maxLength={20}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="enroll-patient-type">
                                Patient Type <span className="text-destructive">*</span>
                            </Label>
                            <Select
                                value={enrollForm.patientType}
                                onValueChange={(v: "MM" | "DD") =>
                                    setEnrollForm((f) => ({ ...f, patientType: v, memberPin: v === "MM" ? f.pin : f.memberPin }))
                                }
                            >
                                <SelectTrigger id="enroll-patient-type">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="MM">Member</SelectItem>
                                    <SelectItem value="DD">Dependent</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {enrollForm.patientType === "DD" && (
                            <div className="space-y-1.5">
                                <Label htmlFor="enroll-member-pin">
                                    Primary Member PIN <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="enroll-member-pin"
                                    placeholder="Primary member PhilHealth PIN"
                                    value={enrollForm.memberPin}
                                    onChange={(e) =>
                                        setEnrollForm((f) => ({ ...f, memberPin: e.target.value }))
                                    }
                                />
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="enroll-philsys" className="text-xs">
                                    PhilSys ID <span className="text-muted-foreground">(optional)</span>
                                </Label>
                                <Input
                                    id="enroll-philsys"
                                    placeholder="PhilSys ID"
                                    value={enrollForm.philSysId}
                                    onChange={(e) =>
                                        setEnrollForm((f) => ({ ...f, philSysId: e.target.value }))
                                    }
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="enroll-tin" className="text-xs">
                                    TIN <span className="text-muted-foreground">(optional)</span>
                                </Label>
                                <Input
                                    id="enroll-tin"
                                    placeholder="Tax ID number"
                                    value={enrollForm.tin}
                                    onChange={(e) =>
                                        setEnrollForm((f) => ({ ...f, tin: e.target.value }))
                                    }
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEnrollTarget(null)} disabled={enrollLoading}>
                            Cancel
                        </Button>
                        <Button onClick={() => void handleEnroll()} disabled={enrollLoading}>
                            {enrollLoading ? (
                                <><Loader2 className="h-4 w-4 animate-spin mr-2" />Enrolling…</>
                            ) : (
                                "Enroll Patient"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}


// ─── Consultations Panel ──────────────────────────────────────────────────────

function ConsultationsPanel({ clinicUid }: { clinicUid: string }) {
    const [consultations, setConsultations] = useState<Consultation[]>([]);
    const [loading, setLoading] = useState(true);
    const [atcTarget, setAtcTarget] = useState<Consultation | null>(null);
    const [atc, setAtc] = useState("");
    const [atcLoading, setAtcLoading] = useState(false);
    const [from, setFrom] = useState(() => {
        const d = new Date();
        d.setDate(1);
        return d.toISOString().slice(0, 10);
    });
    const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));

    const load = useCallback(async () => {
        setLoading(true);
        const res = await getPhilHealthConsultationsAction({
            clinicUid,
            from: new Date(from),
            to: new Date(to + "T23:59:59"),
        });
        if (res.status && res.data) setConsultations(res.data);
        else toast.error(res.message ?? "Failed to load consultations");
        setLoading(false);
    }, [clinicUid, from, to]);

    useEffect(() => { void load(); }, [load]);

    async function handleValidateAtc() {
        if (!atcTarget) return;
        if (!atc.trim()) { toast.error("ATC is required"); return; }
        setAtcLoading(true);
        const res = await validateKonsultaAtcAction({
            clinicUid,
            consultationTicketId: atcTarget.id,
            atc,
        });
        setAtcLoading(false);
        if (res.status) {
            if (res.data?.validationStatus === "VALID") {
                toast.success("ATC is valid");
            } else {
                toast.warning("ATC is invalid for this appointment");
            }
            setAtcTarget(null);
            setAtc("");
            void load();
        } else {
            toast.error(res.message ?? "ATC validation failed");
        }
    }

    return (
        <>
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-sm flex items-center gap-2">
                            <ClipboardList className="h-4 w-4 text-primary" />
                            PhilHealth Patient Consultations
                        </CardTitle>
                        <CardDescription className="mt-1">
                            Consultations from enrolled PhilHealth patients eligible for reporting.
                        </CardDescription>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => void load()} disabled={loading}>
                        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                    </Button>
                </div>
                <div className="flex gap-3 mt-2 items-end">
                    <div>
                        <Label className="text-xs">From</Label>
                        <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-36" />
                    </div>
                    <div>
                        <Label className="text-xs">To</Label>
                        <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-36" />
                    </div>
                    <Button size="sm" variant="outline" onClick={() => void load()} disabled={loading}>
                        Apply
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                {loading ? (
                    <div className="flex items-center justify-center py-10">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                ) : consultations.length === 0 ? (
                    <div className="text-center text-muted-foreground text-sm py-10">
                        No PhilHealth consultations found in this date range.
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>HCI Case</TableHead>
                                <TableHead>HCI Trans</TableHead>
                                <TableHead>Patient</TableHead>
                                <TableHead>PIN</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Primary Diagnosis</TableHead>
                                <TableHead>Physician</TableHead>
                                <TableHead>ATC</TableHead>
                                <TableHead>Reporting</TableHead>
                                <TableHead />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {consultations.map((c) => {
                                const patient = c.ClinicPatient?.Patient;
                                const pin = patient?.PhilHealthRecords[0]?.pin;
                                const primary = c.ConsultationDiagnoses.find((d) => d.type === "PRIMARY");
                                const hp = c.ConsultationTicketHPs[0]?.HealthCareProvider?.User;
                                const ready = !!c.konsultaHciCaseNo && !!c.konsultaHciTransNo && c.konsultaAtcValidationStatus === "VALID";
                                return (
                                    <TableRow key={c.id}>
                                        <TableCell className="font-mono text-xs">
                                            {c.konsultaHciCaseNo ?? c.caseNumber ?? `#${c.id}`}
                                        </TableCell>
                                        <TableCell className="font-mono text-xs">
                                            {c.konsultaHciTransNo ?? "—"}
                                        </TableCell>
                                        <TableCell className="font-medium text-sm">
                                            {patient?.lastName}, {patient?.firstName}
                                        </TableCell>
                                        <TableCell>
                                            <code className="text-xs bg-muted px-1 py-0.5 rounded">
                                                {pin ?? "—"}
                                            </code>
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {new Date(c.createdAt).toLocaleDateString("en-PH")}
                                        </TableCell>
                                        <TableCell className="text-sm max-w-[180px] truncate">
                                            {primary ? (
                                                <span title={primary.description}>
                                                    <code className="text-xs">{primary.icd10Code}</code>{" "}
                                                    {primary.description.slice(0, 30)}
                                                    {primary.description.length > 30 ? "…" : ""}
                                                </span>
                                            ) : (
                                                <span className="text-muted-foreground">—</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {hp ? `${hp.firstName ?? ""} ${hp.lastName ?? ""}`.trim() : "—"}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={c.konsultaAtcValidationStatus === "VALID" ? "default" : c.konsultaAtcValidationStatus === "INVALID" ? "destructive" : "outline"} className="text-xs">
                                                {c.konsultaAtcValidationStatus ?? (c.konsultaAtc ? "Pending" : "No ATC")}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={ready ? "default" : "outline"} className="text-xs">
                                                {ready ? "Ready" : "Needs ATC"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-8 text-xs"
                                                onClick={() => { setAtcTarget(c); setAtc(c.konsultaAtc ?? ""); }}
                                            >
                                                Validate ATC
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
        <Dialog open={!!atcTarget} onOpenChange={(open) => { if (!open) setAtcTarget(null); }}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Validate Authorization Transaction Code</DialogTitle>
                    <DialogDescription>
                        The ATC is checked against the member/dependent PIN and the appointment date.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-2 py-2">
                    <Label htmlFor="konsulta-atc">ATC</Label>
                    <Input
                        id="konsulta-atc"
                        value={atc}
                        onChange={(e) => setAtc(e.target.value.toUpperCase())}
                        placeholder="12-character ATC"
                    />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setAtcTarget(null)} disabled={atcLoading}>Cancel</Button>
                    <Button onClick={() => void handleValidateAtc()} disabled={atcLoading}>
                        {atcLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Validating…</> : "Validate"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        </>
    );
}

// ─── Batches Panel ────────────────────────────────────────────────────────────

function BatchesPanel({ clinicUid }: { clinicUid: string }) {
    const [batches, setBatches] = useState<Batch[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [expandedBatch, setExpandedBatch] = useState<string | null>(null);
    const [pendingAction, setPendingAction] = useState<string | null>(null);
    const [, startTransition] = useTransition();

    const load = useCallback(async () => {
        setLoading(true);
        const res = await getKonsultaBatchesAction(clinicUid);
        if (res.status && res.data) setBatches(res.data);
        setLoading(false);
    }, [clinicUid]);

    useEffect(() => { void load(); }, [load]);

    const handleGenerateXml = (batchUid: string) => {
        setPendingAction(batchUid + ":generate");
        startTransition(async () => {
            const res = await generateBatchXmlAction(batchUid);
            if (res.status) {
                toast.success(`XML generated — transmittal: ${(res.data as { transmittalNo: string }).transmittalNo}`);
                void load();
            } else {
                toast.error(res.message ?? "XML generation failed");
            }
            setPendingAction(null);
        });
    };

    const handleSubmit = (batchUid: string) => {
        setPendingAction(batchUid + ":submit");
        startTransition(async () => {
            const res = await submitKonsultaBatchAction(batchUid);
            if (res.status) {
                toast.success("Batch submitted to PhilHealth successfully");
                void load();
            } else {
                toast.error(res.message ?? "Submission failed");
            }
            setPendingAction(null);
        });
    };

    const handleDelete = (batchUid: string) => {
        setPendingAction(batchUid + ":delete");
        startTransition(async () => {
            const res = await deleteKonsultaBatchAction(batchUid);
            if (res.status) {
                toast.success("Batch deleted");
                void load();
            } else {
                toast.error(res.message ?? "Delete failed");
            }
            setPendingAction(null);
        });
    };

    const handleToggleEntry = (entryId: number, included: boolean, batchUid: string) => {
        startTransition(async () => {
            const res = await toggleKonsultaEntryAction({ entryId, included });
            if (!res.status) toast.error(res.message ?? "Failed to update entry");
            else void load();
            // Reopen expanded batch
            setExpandedBatch(batchUid);
        });
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                        <Send className="h-4 w-4 text-primary" />Report Batches
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Group patients into a batch, generate PCB XML, encrypt, and submit to PhilHealth.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => void load()} disabled={loading}>
                        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                    </Button>
                    <Button size="sm" onClick={() => setShowCreate(true)} className="gap-1">
                        <Plus className="h-4 w-4" />New Batch
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
            ) : batches.length === 0 ? (
                <Card>
                    <CardContent className="text-center text-muted-foreground text-sm py-12">
                        No batches yet. Click <strong>New Batch</strong> to get started.
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {batches.map((batch) => {
                        const isExpanded = expandedBatch === batch.batchUid;
                        const isGenerating = pendingAction === batch.batchUid + ":generate";
                        const isSubmitting = pendingAction === batch.batchUid + ":submit";
                        const isDeleting = pendingAction === batch.batchUid + ":delete";
                        const canGenerate = ["DRAFT", "GENERATED", "FAILED"].includes(batch.status);
                        const canSubmit = ["GENERATED", "VALIDATED"].includes(batch.status);
                        const canDelete = batch.status !== "SUBMITTED";

                        return (
                            <Card key={batch.batchUid}>
                                <CardHeader className="pb-2">
                                    <div className="flex items-center justify-between gap-3">
                                        <button
                                            className="flex items-center gap-2 text-left"
                                            onClick={() => setExpandedBatch(isExpanded ? null : batch.batchUid)}
                                        >
                                            {isExpanded
                                                ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                                : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                                            <span className="font-semibold text-sm">
                                                {formatPeriod(batch.period)}
                                            </span>
                                            <Badge variant={BATCH_STATUS_VARIANTS[batch.status] ?? "outline"}>
                                                {BATCH_STATUS_LABELS[batch.status] ?? batch.status}
                                            </Badge>
                                            <span className="text-xs text-muted-foreground">
                                                Tagging {batch.reportTagging} · {batch.KonsultaEntries.length} patient(s)
                                            </span>
                                        </button>

                                        <div className="flex gap-1 shrink-0">
                                            {canGenerate && (
                                                <Button
                                                    size="sm" variant="outline"
                                                    disabled={isGenerating}
                                                    onClick={() => handleGenerateXml(batch.batchUid)}
                                                    title="Generate PCB XML"
                                                >
                                                    {isGenerating
                                                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                        : <FileCode2 className="h-3.5 w-3.5" />}
                                                </Button>
                                            )}
                                            {canSubmit && (
                                                <Button
                                                    size="sm"
                                                    disabled={isSubmitting}
                                                    onClick={() => handleSubmit(batch.batchUid)}
                                                    title="Validate & Submit"
                                                >
                                                    {isSubmitting
                                                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                        : <Upload className="h-3.5 w-3.5" />}
                                                </Button>
                                            )}
                                            {canDelete && (
                                                <Button
                                                    size="sm" variant="ghost"
                                                    disabled={isDeleting}
                                                    onClick={() => handleDelete(batch.batchUid)}
                                                    title="Delete batch"
                                                    className="text-destructive hover:text-destructive"
                                                >
                                                    {isDeleting
                                                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                        : <Trash2 className="h-3.5 w-3.5" />}
                                                </Button>
                                            )}
                                        </div>
                                    </div>

                                    {batch.transmittalNo && (
                                        <div className="mt-1 ml-6 text-xs text-muted-foreground">
                                            Transmittal: <code className="font-mono">{batch.transmittalNo}</code>
                                        </div>
                                    )}
                                    {batch.errorMessage && (
                                        <div className="mt-1 ml-6 flex items-center gap-1 text-xs text-destructive">
                                            <AlertCircle className="h-3 w-3" />{batch.errorMessage}
                                        </div>
                                    )}
                                </CardHeader>

                                {isExpanded && (
                                    <CardContent>
                                        <BatchEntryTable
                                            entries={batch.KonsultaEntries}
                                            batchUid={batch.batchUid}
                                            readOnly={batch.status === "SUBMITTED"}
                                            onToggle={handleToggleEntry}
                                        />
                                        {(batch.validateResult ?? batch.submitResult) && (
                                            <ResultJsonViewer
                                                label="Response"
                                                data={batch.submitResult ?? batch.validateResult}
                                            />
                                        )}
                                    </CardContent>
                                )}
                            </Card>
                        );
                    })}
                </div>
            )}

            {showCreate && (
                <CreateBatchDialog
                    clinicUid={clinicUid}
                    onClose={() => setShowCreate(false)}
                    onCreated={() => { setShowCreate(false); void load(); }}
                />
            )}
        </div>
    );
}

// ─── Batch Entry Table ────────────────────────────────────────────────────────

type EntryRow = Batch["KonsultaEntries"][number];

function BatchEntryTable({
    entries, batchUid, readOnly, onToggle,
}: {
    entries: EntryRow[];
    batchUid: string;
    readOnly: boolean;
    onToggle: (entryId: number, included: boolean, batchUid: string) => void;
}) {
    if (entries.length === 0) {
        return <p className="text-sm text-muted-foreground">No entries in this batch.</p>;
    }
    return (
        <Table className="text-sm">
            <TableHeader>
                <TableRow>
                    <TableHead className="w-8">{!readOnly && "Include"}</TableHead>
                    <TableHead>PIN</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>HCI Case</TableHead>
                    <TableHead>HCI Trans</TableHead>
                    <TableHead>Consultations</TableHead>
                    <TableHead>Status</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {entries.map((e) => (
                    <TableRow key={e.id} className={e.included ? "" : "opacity-50"}>
                        <TableCell>
                            {!readOnly && (
                                <Checkbox
                                    checked={e.included}
                                    onCheckedChange={(v) => onToggle(e.id, !!v, batchUid)}
                                />
                            )}
                        </TableCell>
                        <TableCell>
                            <code className="text-xs">{e.philHealthPin}</code>
                        </TableCell>
                        <TableCell>
                            <Badge variant="outline" className="text-xs">{e.memberType}</Badge>
                        </TableCell>
                        <TableCell><code className="text-xs">{e.hciCaseNo ?? "—"}</code></TableCell>
                        <TableCell><code className="text-xs">{e.hciTransNo ?? "—"}</code></TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                            {e.included
                                ? `${(e as EntryRow & { consultationIds?: number[] }).consultationIds?.length ?? 0} consult(s)`
                                : "excluded"}
                        </TableCell>
                        <TableCell>
                            <StatusChip status={e.status} />
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}

function StatusChip({ status }: { status: string }) {
    if (status === "PENDING") return <Badge variant="outline" className="text-xs gap-1"><Clock className="h-3 w-3" />Pending</Badge>;
    if (status === "INCLUDED") return <Badge variant="default" className="text-xs gap-1"><CheckCircle2 className="h-3 w-3" />Included</Badge>;
    if (status === "FAILED") return <Badge variant="destructive" className="text-xs gap-1"><AlertCircle className="h-3 w-3" />Failed</Badge>;
    return <Badge variant="secondary" className="text-xs">{status}</Badge>;
}

// ─── Result JSON Viewer ───────────────────────────────────────────────────────

function ResultJsonViewer({ label, data }: { label: string; data: unknown }) {
    const [show, setShow] = useState(false);
    return (
        <div className="mt-3">
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 px-2" onClick={() => setShow(!show)}>
                {show ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                {show ? "Hide" : "Show"} {label}
            </Button>
            {show && (
                <pre className="mt-1 rounded bg-muted p-3 text-xs whitespace-pre-wrap break-all max-h-64 overflow-y-auto">
                    {JSON.stringify(data, null, 2)}
                </pre>
            )}
        </div>
    );
}

// ─── Create Batch Dialog ──────────────────────────────────────────────────────

function CreateBatchDialog({
    clinicUid, onClose, onCreated,
}: {
    clinicUid: string;
    onClose: () => void;
    onCreated: () => void;
}) {
    const [patients, setPatients] = useState<Patient[]>([]);
    const [loadingPatients, setLoadingPatients] = useState(true);
    const [selected, setSelected] = useState<Set<number>>(new Set());
    const [period, setPeriod] = useState(currentPeriod);
    const [reportTagging, setReportTagging] = useState<"1" | "2">("1");
    const [notes, setNotes] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        void (async () => {
            setLoadingPatients(true);
            const res = await getPhilHealthPatientsAction(clinicUid);
            if (res.status && res.data) setPatients(res.data);
            setLoadingPatients(false);
        })();
    }, [clinicUid]);

    const toggleAll = () => {
        if (selected.size === patients.length) {
            setSelected(new Set());
        } else {
            setSelected(new Set(patients.map((p) => p.Patient.id)));
        }
    };

    const handleCreate = async () => {
        if (selected.size === 0) { toast.error("Select at least one patient."); return; }
        if (!period.match(/^\d{6}$/)) { toast.error("Period must be YYYYMM format."); return; }
        setSubmitting(true);
        const res = await createKonsultaBatchAction({
            clinicUid,
            period,
            reportTagging,
            notes: notes || undefined,
            patientUserIds: Array.from(selected),
        });
        setSubmitting(false);
        if (res.status) {
            toast.success("Batch created");
            onCreated();
        } else {
            toast.error(res.message ?? "Failed to create batch");
        }
    };

    return (
        <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Lock className="h-4 w-4" />New PhilHealth Report Batch
                    </DialogTitle>
                    <DialogDescription>
                        Select the reporting period, tagging type, and patients to include.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                        <Label className="text-xs">Reporting Period (YYYYMM)</Label>
                        <Input
                            value={period}
                            onChange={(e) => setPeriod(e.target.value)}
                            placeholder="e.g. 202604"
                            className="mt-1"
                        />
                    </div>
                    <div>
                        <Label className="text-xs">Report Tagging</Label>
                        <Select
                            value={reportTagging}
                            onValueChange={(v) => setReportTagging(v as "1" | "2")}
                        >
                            <SelectTrigger className="mt-1">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="1">1 — Enlistment + Profile</SelectItem>
                                <SelectItem value="2">2 — Encounter / Consultation</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="mt-1">
                    <Label className="text-xs">Notes (optional)</Label>
                    <Textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Internal notes for this batch…"
                        rows={2}
                        className="mt-1"
                    />
                </div>

                <div className="mt-2">
                    <div className="flex items-center justify-between mb-2">
                        <Label className="text-xs">Select Patients</Label>
                        {!loadingPatients && patients.length > 0 && (
                            <button
                                className="text-xs text-primary underline-offset-2 hover:underline"
                                onClick={toggleAll}
                            >
                                {selected.size === patients.length ? "Deselect all" : `Select all (${patients.length})`}
                            </button>
                        )}
                    </div>

                    {loadingPatients ? (
                        <div className="flex justify-center py-6">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                    ) : patients.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                            No PhilHealth enrolled patients found.
                        </p>
                    ) : (
                        <div className="border rounded-md max-h-56 overflow-y-auto divide-y">
                            {patients.map((p) => {
                                const ph = p.Patient.PhilHealthRecords[0];
                                const isChecked = selected.has(p.Patient.id);
                                return (
                                    <label
                                        key={p.Patient.id}
                                        className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-muted/50"
                                    >
                                        {isChecked
                                            ? <CheckSquare className="h-4 w-4 text-primary shrink-0" />
                                            : <Square className="h-4 w-4 text-muted-foreground shrink-0" />}
                                        <input
                                            type="checkbox"
                                            className="sr-only"
                                            checked={isChecked}
                                            onChange={(e) => {
                                                const next = new Set(selected);
                                                if (e.target.checked) next.add(p.Patient.id);
                                                else next.delete(p.Patient.id);
                                                setSelected(next);
                                            }}
                                        />
                                        <span className="text-sm flex-1">
                                            {p.Patient.lastName}, {p.Patient.firstName}
                                        </span>
                                        <span className="text-xs text-muted-foreground font-mono">
                                            {ph?.pin ?? "No PIN"}
                                        </span>
                                        <Badge variant="outline" className="text-xs">
                                            {p.konsultaPatientType === "DD" ? "Dependent" : "Member"}
                                        </Badge>
                                    </label>
                                );
                            })}
                        </div>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">{selected.size} selected</p>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={submitting}>Cancel</Button>
                    <Button onClick={() => void handleCreate()} disabled={submitting || selected.size === 0}>
                        {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Create Batch
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ─── Submission History Panel ─────────────────────────────────────────────────

function SubmissionHistoryPanel({ clinicUid }: { clinicUid: string }) {
    const [batches, setBatches] = useState<Batch[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<Batch | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        const res = await getKonsultaBatchesAction(clinicUid);
        if (res.status && res.data) {
            setBatches(res.data.filter((b) => b.status === "SUBMITTED"));
        }
        setLoading(false);
    }, [clinicUid]);

    useEffect(() => { void load(); }, [load]);

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-sm flex items-center gap-2">
                            <History className="h-4 w-4 text-primary" />
                            Submission History
                        </CardTitle>
                        <CardDescription className="mt-1">
                            All successfully submitted PhilHealth Konsulta report batches.
                        </CardDescription>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => void load()} disabled={loading}>
                        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                {loading ? (
                    <div className="flex items-center justify-center py-10">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                ) : batches.length === 0 ? (
                    <div className="text-center text-muted-foreground text-sm py-10">
                        No submitted batches yet.
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Period</TableHead>
                                <TableHead>Transmittal No.</TableHead>
                                <TableHead>Tagging</TableHead>
                                <TableHead>Patients</TableHead>
                                <TableHead>Submitted At</TableHead>
                                <TableHead>Response</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {batches.map((b) => (
                                <TableRow key={b.batchUid}>
                                    <TableCell className="font-medium">
                                        {formatPeriod(b.period)}
                                    </TableCell>
                                    <TableCell>
                                        <code className="text-xs font-mono">{b.transmittalNo ?? "—"}</code>
                                    </TableCell>
                                    <TableCell className="text-sm">
                                        {b.reportTagging === "1" ? "Enlistment" : "Encounter"}
                                    </TableCell>
                                    <TableCell className="text-sm">
                                        {b.KonsultaEntries.filter((e) => e.included).length}
                                    </TableCell>
                                    <TableCell className="text-sm">
                                        {b.submittedAt
                                            ? new Date(b.submittedAt).toLocaleDateString("en-PH", {
                                                year: "numeric", month: "short", day: "numeric",
                                                hour: "2-digit", minute: "2-digit",
                                            })
                                            : "—"}
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            size="sm" variant="ghost"
                                            className="h-6 text-xs px-2"
                                            onClick={() => setSelected(b)}
                                        >
                                            View
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>

            {selected && (
                <Dialog open onOpenChange={(open) => { if (!open) setSelected(null); }}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Submission Detail — {formatPeriod(selected.period)}</DialogTitle>
                            <DialogDescription>
                                Transmittal: <code className="font-mono">{selected.transmittalNo}</code>
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                            {selected.validateResult && (
                                <div>
                                    <p className="text-xs font-medium mb-1">Validate Result</p>
                                    <pre className="text-xs bg-muted rounded p-3 whitespace-pre-wrap break-all">
                                        {JSON.stringify(selected.validateResult, null, 2)}
                                    </pre>
                                </div>
                            )}
                            {selected.submitResult && (
                                <div>
                                    <p className="text-xs font-medium mb-1">Submit Result</p>
                                    <pre className="text-xs bg-muted rounded p-3 whitespace-pre-wrap break-all">
                                        {JSON.stringify(selected.submitResult, null, 2)}
                                    </pre>
                                </div>
                            )}
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setSelected(null)}>Close</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </Card>
    );
}
