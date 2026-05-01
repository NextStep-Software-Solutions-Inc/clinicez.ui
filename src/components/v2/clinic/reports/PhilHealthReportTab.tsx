"use client";

import { useState, useEffect, useCallback, useTransition, useRef, useLayoutEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
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
    checkEnrolledPatientsRegistrationBatchAction,
    validateKonsultaAtcAction,
    getPhilHealthConsultationsAction,
    getKonsultaBatchesAction,
    createKonsultaBatchAction,
    generateBatchXmlAction,
    validateKonsultaBatchAction,
    submitKonsultaBatchAction,
    deleteKonsultaBatchAction,
    toggleKonsultaEntryAction,
    generateConsultationCaseTransNumbersAction,
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

const BATCH_STATUS_DESCRIPTIONS: Record<string, string> = {
    DRAFT: "Batch is being prepared. Add patients and generate the XML report when ready.",
    GENERATED: "The PCB XML report has been generated. Run validation before submitting to PhilHealth.",
    VALIDATED: "The XML report passed PhilHealth validation. Ready to submit.",
    SUBMITTED: "Successfully submitted to PhilHealth. Awaiting acknowledgment.",
    FAILED: "An error occurred during validation or submission. Review the response and regenerate.",
};

const ENTRY_STATUS_DESCRIPTIONS: Record<string, string> = {
    PENDING: "Queued for inclusion in the next batch XML.",
    INCLUDED: "Included in the generated XML report.",
    EXCLUDED: "Manually excluded from this batch.",
    FAILED: "Could not be processed. Review the patient data.",
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

const VALID_TABS = ["patients", "consultations", "batches", "history"] as const;
type KonsultaTab = typeof VALID_TABS[number];

export function PhilHealthReportTab({ clinicUid }: PhilHealthReportTabProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const rawTab = searchParams.get("konsultaTab");
    const activeTab: KonsultaTab = (VALID_TABS as readonly string[]).includes(rawTab ?? "") ? (rawTab as KonsultaTab) : "patients";

    const handleTabChange = (value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("konsultaTab", value);
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    };

    return (
        <Tabs value={activeTab} onValueChange={handleTabChange} className="mt-4">
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
    const [selectedEnrolledIds, setSelectedEnrolledIds] = useState<Set<number>>(new Set());

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
        const patientName = `${enrollTarget.Patient.firstName} ${enrollTarget.Patient.lastName}`;
        console.log(`[Enrollment] Starting enrollment for ${patientName} (ID: ${enrollTarget.id})`, {
            pin: enrollForm.pin.substring(0, 6) + "****",
            patientType: enrollForm.patientType,
            memberPin: enrollForm.patientType === "DD" ? enrollForm.memberPin.substring(0, 6) + "****" : "(same as patient PIN)",
        });
        
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

        console.log(`[Enrollment] Response for ${patientName}:`, {
            status: res.status,
            registrationStatus: res.data?.registrationStatus,
            registrationResult: res.data?.registrationResult,
            message: res.message,
        });
        

        if (res.status) {
            if (res.data?.registrationStatus === "REGISTERED") {
                toast.success(`✓ ${patientName} is now registered with Konsulta`);
                console.log(`[Enrollment] Success: Patient registered`);
            } else {
                // Build detailed error message from registration result
                let detailedMessage = `Patient details saved. Status: ${res.data?.registrationStatus ?? "unknown"}.`;
                const result = res.data?.registrationResult as Record<string, unknown> | undefined;
                
                if (result?.error) {
                    detailedMessage += ` Error: ${result.error}`;
                } else if (result) {
                    // PhilHealth SOAP response details
                    const details = Object.entries(result)
                        .filter(([key]) => key !== "registrationStatus")
                        .map(([key, value]) => `${key}: ${value}`)
                        .join(" | ");
                    if (details) {
                        detailedMessage += ` Details: ${details}`;
                    }
                }
                
                toast.warning(detailedMessage);
                console.warn(`[Enrollment] Partial success: Registration not confirmed.`, {
                    status: res.data?.registrationStatus,
                    result: res.data?.registrationResult,
                    message: res.message,
                });
            }
            setEnrollTarget(null);
            void reload();
        } else {
            toast.error(res.message ?? "Enrollment failed");
            console.error(`[Enrollment] Failed:`, res.message);
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

    const [isBatchChecking, startBatchCheckTransition] = useTransition();

    function toggleEnrolledSelection(patientId: number) {
        setSelectedEnrolledIds((prev) => {
            const next = new Set(prev);
            if (next.has(patientId)) {
                next.delete(patientId);
            } else {
                next.add(patientId);
            }
            return next;
        });
    }

    function toggleSelectAllEnrolled() {
        if (selectedEnrolledIds.size === enrolledFeed.rows.length) {
            setSelectedEnrolledIds(new Set());
        } else {
            setSelectedEnrolledIds(new Set(enrolledFeed.rows.map((p) => p.id)));
        }
    }

    async function handleBatchCheckEnrolled() {
        startBatchCheckTransition(async () => {
            const idsToCheck = selectedEnrolledIds.size > 0 ? Array.from(selectedEnrolledIds) : undefined;
            const res = await checkEnrolledPatientsRegistrationBatchAction({ clinicUid, clinicPatientIds: idsToCheck });
            if (res.status) {
                const data = res.data;
                if (data) {
                    const { checked, valid, invalid, failed } = data;
                    const summary = `Checked ${checked} patients: ${valid} registered, ${invalid} not registered, ${failed} errors`;
                    if (failed === 0) {
                        toast.success(summary);
                    } else {
                        toast.warning(summary);
                    }
                }
                setSelectedEnrolledIds(new Set());
                reload();
            } else {
                toast.error(res.message ?? "Batch check failed");
            }
        });
    }

    function PatientRow({ patient, enrolled, isSelected, onToggleSelect }: { patient: ClinicPatientRow; enrolled: boolean; isSelected?: boolean; onToggleSelect?: (id: number) => void }) {
        const ph = patient.Patient.PhilHealthRecords[0];
        return (
            <div className="border-b px-4 py-3 last:border-b-0">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2">
                        {enrolled && onToggleSelect && (
                            <div className="mt-0.5 flex items-center">
                                <Checkbox checked={isSelected ?? false} onCheckedChange={() => onToggleSelect(patient.id)} />
                            </div>
                        )}
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
        selectedIds,
        onToggleSelect,
        onToggleSelectAll,
    }: {
        title: string;
        kind: "ENROLLED" | "UNENROLLED";
        feed: PatientFeed;
        icon: React.ReactNode;
        selectedIds?: Set<number>;
        onToggleSelect?: (id: number) => void;
        onToggleSelectAll?: () => void;
    }) {
        const scrollRef = useRef<HTMLDivElement>(null);
        const savedScrollRef = useRef<number>(0);
        const wasLoadingMoreRef = useRef<boolean>(false);

        // When loading completes and new rows are added, restore scroll position
        useLayoutEffect(() => {
            const node = scrollRef.current;
            if (!node) return;

            // Detect the moment when loadingMore transitions from true to false
            const wasLoading = wasLoadingMoreRef.current;
            const isLoading = feed.loadingMore;

            if (wasLoading && !isLoading) {
                // Load completed, restore scroll position
                node.scrollTop = savedScrollRef.current;
                console.log(`[Scroll] Restored after load complete: ${savedScrollRef.current}px`);
            } else if (!wasLoading && isLoading) {
                // Load starting, save current scroll position
                savedScrollRef.current = node.scrollTop;
                console.log(`[Scroll] Saving position ${savedScrollRef.current}px before load`);
            }

            wasLoadingMoreRef.current = isLoading;
        }, [feed.loadingMore]);

        return (
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-3">
                        <CardTitle className="flex items-center gap-2 text-sm">{icon}{title}</CardTitle>
                        <div className="flex items-center gap-2">
                            {kind === "ENROLLED" && feed.rows.length > 0 && (
                                <>
                                    {selectedIds && onToggleSelectAll && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={onToggleSelectAll}
                                            className="h-7 gap-1 px-2 text-xs"
                                        >
                                            {selectedIds.size > 0 && selectedIds.size === feed.rows.length ? (
                                                <>
                                                    <CheckSquare className="h-4 w-4" />
                                                    Deselect All
                                                </>
                                            ) : selectedIds.size > 0 ? (
                                                <>
                                                    <Square className="h-4 w-4 opacity-60" />
                                                    Deselect All
                                                </>
                                            ) : (
                                                <>
                                                    <Square className="h-4 w-4" />
                                                    Select All
                                                </>
                                            )}
                                        </Button>
                                    )}
                                    {selectedIds && selectedIds.size > 0 && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={isBatchChecking || feed.loading}
                                            onClick={() => void handleBatchCheckEnrolled()}
                                            className="h-7 gap-1 px-2 text-xs"
                                        >
                                            {isBatchChecking ? (
                                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                            ) : (
                                                <ShieldCheck className="h-3.5 w-3.5" />
                                            )}
                                            Check Selected ({selectedIds.size})
                                        </Button>
                                    )}
                                </>
                            )}
                            <Badge variant="outline" className="text-xs">{feed.rows.length}/{feed.total}</Badge>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div ref={scrollRef} className="h-[620px] overflow-y-auto" onScroll={(e) => handleScroll(kind, e)}>
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
                                    <PatientRow
                                        key={patient.id}
                                        patient={patient}
                                        enrolled={kind === "ENROLLED"}
                                        isSelected={kind === "ENROLLED" ? selectedIds?.has(patient.id) : undefined}
                                        onToggleSelect={kind === "ENROLLED" ? onToggleSelect : undefined}
                                    />
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
                    selectedIds={selectedEnrolledIds}
                    onToggleSelect={toggleEnrolledSelection}
                    onToggleSelectAll={toggleSelectAllEnrolled}
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
    const [generateTarget, setGenerateTarget] = useState<Consultation | null>(null);
    const [generateLoading, setGenerateLoading] = useState(false);
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

    async function handleGenerateCaseTransNumbers() {
        if (!generateTarget) return;
        setGenerateLoading(true);
        try {
            const res = await generateConsultationCaseTransNumbersAction({
                consultationTicketId: generateTarget.id,
            });
            if (res.status && res.data) {
                toast.success(`Generated: ${res.data.konsultaHciCaseNo} / ${res.data.konsultaHciTransNo}`);
                setGenerateTarget(null);
                void load();
            } else {
                toast.error(res.message ?? "Failed to generate numbers");
            }
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to generate numbers");
        } finally {
            setGenerateLoading(false);
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
                            Consultations from patients with REGISTERED status in the current effectivity year, within the selected date range.
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
                                // Get patient from either path: ClinicPatient or Appointment.Requesters
                                const patient = c.ClinicPatient?.Patient ?? c.Appointment?.Requesters[0]?.User;
                                const pin = patient?.PhilHealthRecords[0]?.pin;
                                const primary = c.ConsultationDiagnoses.find((d) => d.type === "PRIMARY");
                                const hp = c.ConsultationTicketHPs[0]?.HealthCareProvider?.User;
                                const ready = !!c.konsultaHciCaseNo && !!c.konsultaHciTransNo && c.konsultaAtcValidationStatus === "VALID";
                                const hasValidCaseAndTrans = !!c.konsultaHciCaseNo && !!c.konsultaHciTransNo;
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
                                        <TableCell className="text-right flex gap-1 justify-end">
                                            {!hasValidCaseAndTrans ? (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-8 text-xs"
                                                    onClick={() => setGenerateTarget(c)}
                                                >
                                                    Generate
                                                </Button>
                                            ) : (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-8 text-xs"
                                                    onClick={() => { setAtcTarget(c); setAtc(c.konsultaAtc ?? ""); }}
                                                >
                                                    Validate ATC
                                                </Button>
                                            )}
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

        <Dialog open={!!generateTarget} onOpenChange={(open) => { if (!open) setGenerateTarget(null); }}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Generate Case & Transaction Numbers</DialogTitle>
                    <DialogDescription>
                        This will generate the HCI Case Number and HCI Transaction Number for this consultation. These are required for reporting.
                    </DialogDescription>
                </DialogHeader>
                {generateTarget && (
                    <div className="space-y-2 py-2 text-sm">
                        <div>
                            <Label className="text-xs font-semibold">Case Number</Label>
                            <div className="font-mono text-sm bg-muted px-2 py-1 rounded">
                                {generateTarget.caseNumber ?? `#${generateTarget.id}`}
                            </div>
                        </div>
                        <div>
                            <Label className="text-xs font-semibold">Current HCI Case No</Label>
                            <div className="font-mono text-sm bg-muted px-2 py-1 rounded">
                                {generateTarget.konsultaHciCaseNo ?? "Not set"}
                            </div>
                        </div>
                        <div>
                            <Label className="text-xs font-semibold">Current HCI Trans No</Label>
                            <div className="font-mono text-sm bg-muted px-2 py-1 rounded">
                                {generateTarget.konsultaHciTransNo ?? "Not set"}
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-3">
                            Generation of these numbers requires valid clinic HCI credentials and sequence management. Please ensure the clinic Konsulta settings are configured.
                        </p>
                    </div>
                )}
                <DialogFooter>
                    <Button variant="outline" onClick={() => setGenerateTarget(null)} disabled={generateLoading}>Cancel</Button>
                    <Button onClick={() => void handleGenerateCaseTransNumbers()} disabled={generateLoading}>
                        {generateLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating…</> : "Generate"}
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

    // Silently refresh a single batch in-place without triggering the full loading state
    const refreshBatch = useCallback(async (batchUid: string) => {
        const res = await getKonsultaBatchesAction(clinicUid);
        if (res.status && res.data) {
            const updated = res.data.find((b) => b.batchUid === batchUid);
            if (updated) {
                setBatches((prev) => prev.map((b) => b.batchUid === batchUid ? updated : b));
            }
        }
    }, [clinicUid]);

    useEffect(() => { void load(); }, [load]);

    // Helper function to parse and format error messages for toast
    const showErrorToast = (message: string | undefined, defaultMessage: string = "An error occurred") => {
        if (!message) {
            toast.error(defaultMessage);
            return;
        }
        
        try {
            // Try to parse as JSON
            const parsed = JSON.parse(message);
            
            // If it has an errors array, extract and display them
            if (parsed.errors && Array.isArray(parsed.errors) && parsed.errors.length > 0) {
                const errors = parsed.errors.map((e: unknown) => 
                    typeof e === "string" ? e : JSON.stringify(e)
                );
                
                // Clean summary in title, all errors in description
                const title = `PhilHealth validation failed (${errors.length} error${errors.length > 1 ? "s" : ""})`;
                const description = errors.map((e: string, i: number) => `${i + 1}. ${e}`).join('\n');
                
                toast.error(title, { description });
                return;
            }
            
            // If it's an object with message property, use that
            if (parsed.message && typeof parsed.message === "string") {
                toast.error(parsed.message);
                return;
            }
        } catch {
            // Not JSON, continue below
        }
        
        // Fallback: use message as-is
        toast.error(message);
    };

    const handleGenerateXml = (batchUid: string) => {
        setPendingAction(batchUid + ":generate");
        startTransition(async () => {
            const res = await generateBatchXmlAction(batchUid);
            if (res.status) {
                toast.success(`XML generated — transmittal: ${(res.data as { transmittalNo: string }).transmittalNo}`);
                // Expand the batch to show the generated XML
                setExpandedBatch(batchUid);
                await refreshBatch(batchUid);
            } else {
                // Show detailed error message from server
                if (res.message) {
                    showErrorToast(res.message, "XML generation failed");
                } else {
                    toast.error("XML generation failed");
                }
            }
            setPendingAction(null);
        });
    };

    const handleValidate = (batchUid: string) => {
        setPendingAction(batchUid + ":validate");
        startTransition(async () => {
            const res = await validateKonsultaBatchAction(batchUid);
            if (res.status) {
                toast.success("Batch validated — ready to submit to PhilHealth.");
            } else {
                showErrorToast(res.message, "Validation failed");
            }
            // Always refresh the single batch after validation, whether it succeeds or fails
            await refreshBatch(batchUid);
            setPendingAction(null);
        });
    };

    const handleSubmit = (batchUid: string) => {
        setPendingAction(batchUid + ":submit");
        startTransition(async () => {
            const res = await submitKonsultaBatchAction(batchUid);
            if (res.status) {
                toast.success("Batch submitted to PhilHealth successfully.");
            } else {
                showErrorToast(res.message, "Submission failed");
            }
            // Always refresh the single batch after submission, whether it succeeds or fails
            await refreshBatch(batchUid);
            setPendingAction(null);
        });
    };

    const handleDelete = (batchUid: string) => {
        setPendingAction(batchUid + ":delete");
        startTransition(async () => {
            const res = await deleteKonsultaBatchAction(batchUid);
            if (res.status) {
                toast.success("Batch deleted");
                await load();  // Properly await the load to ensure data is refreshed
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
            else await refreshBatch(batchUid);
        });
        // Reopen expanded batch
        setExpandedBatch(batchUid);
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
                        const isValidating = pendingAction === batch.batchUid + ":validate";
                        const isSubmitting = pendingAction === batch.batchUid + ":submit";
                        const isDeleting = pendingAction === batch.batchUid + ":delete";
                        const canGenerate = ["DRAFT", "GENERATED", "FAILED"].includes(batch.status);
                        const canValidate = ["GENERATED", "FAILED"].includes(batch.status);
                        const canSubmit = batch.status === "VALIDATED";
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
                                            <span title={BATCH_STATUS_DESCRIPTIONS[batch.status]}>
                                                <Badge variant={BATCH_STATUS_VARIANTS[batch.status] ?? "outline"}>
                                                    {BATCH_STATUS_LABELS[batch.status] ?? batch.status}
                                                </Badge>
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                Tagging {batch.reportTagging} · {batch.KonsultaEntries.length} patient(s)
                                            </span>
                                        </button>

                                        <div className="flex gap-1 shrink-0">
                                            {canGenerate && (
                                                <Button
                                                    type="button"
                                                    size="sm" variant="outline"
                                                    disabled={isGenerating}
                                                    onClick={() => handleGenerateXml(batch.batchUid)}
                                                    title={batch.xmlPayload ? "Regenerate PCB XML report" : "Generate PCB XML report"}
                                                >
                                                    {isGenerating
                                                        ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /><span className="ml-1 text-xs">Generating…</span></>
                                                        : <><FileCode2 className="h-3.5 w-3.5" /><span className="ml-1 text-xs">{batch.xmlPayload ? "Regenerate XML" : "Generate XML"}</span></>}
                                                </Button>
                                            )}
                                            {canValidate && (
                                                <Button
                                                    type="button"
                                                    size="sm" variant="outline"
                                                    disabled={isValidating}
                                                    onClick={() => handleValidate(batch.batchUid)}
                                                    title="Validate report with PhilHealth"
                                                >
                                                    {isValidating
                                                        ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /><span className="ml-1 text-xs">Validating…</span></>
                                                        : <><ShieldCheck className="h-3.5 w-3.5" /><span className="ml-1 text-xs">Validate</span></>}
                                                </Button>
                                            )}
                                            {canSubmit && (
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    disabled={isSubmitting}
                                                    onClick={() => handleSubmit(batch.batchUid)}
                                                    title="Submit validated report to PhilHealth"
                                                >
                                                    {isSubmitting
                                                        ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /><span className="ml-1 text-xs">Submitting…</span></>
                                                        : <><Upload className="h-3.5 w-3.5" /><span className="ml-1 text-xs">Submit</span></>}
                                                </Button>
                                            )}
                                            {canDelete && (
                                                <Button
                                                    type="button"
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
                                </CardHeader>

                                {isExpanded && (
                                    <CardContent>
                                        <BatchEntryTable
                                            entries={batch.KonsultaEntries}
                                            batchUid={batch.batchUid}
                                            readOnly={batch.status === "SUBMITTED"}
                                            onToggle={handleToggleEntry}
                                        />
                                        {batch.xmlPayload && !batch.validateResult && !batch.submitResult && (
                                            <div className="mt-4">
                                                <BatchResultSummary
                                                    label="Generated XML"
                                                    data={{ status: "XML generated successfully", length: batch.xmlPayload.length }}
                                                    batchUid={batch.batchUid}
                                                    xmlPayload={batch.xmlPayload}
                                                    onDecrypted={() => void refreshBatch(batch.batchUid)}
                                                />
                                            </div>
                                        )}
                                        {batch.validateResult && (
                                            <BatchResultSummary
                                                label="Validation Response"
                                                data={batch.validateResult}
                                                batchUid={batch.batchUid}
                                                xmlPayload={batch.xmlPayload}
                                                onDecrypted={() => void refreshBatch(batch.batchUid)}
                                                resultType="validate"
                                            />
                                        )}
                                        {batch.submitResult && (
                                            <BatchResultSummary
                                                label="Submission Response"
                                                data={batch.submitResult}
                                                batchUid={batch.batchUid}
                                                xmlPayload={batch.xmlPayload}
                                                onDecrypted={() => void refreshBatch(batch.batchUid)}
                                                resultType="submit"
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
                    <TableHead>Patient</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>HCI Case</TableHead>
                    <TableHead>HCI Trans</TableHead>
                    <TableHead>Consults</TableHead>
                    <TableHead>Status</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {entries.map((e) => {
                    const name = [e.Patient?.firstName, e.Patient?.lastName].filter(Boolean).join(" ") || "—";
                    const consultCount = e.consultationIds?.length ?? 0;
                    return (
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
                                <div className="font-medium text-sm">{name}</div>
                                <code className="text-xs text-muted-foreground">{e.philHealthPin}</code>
                            </TableCell>
                            <TableCell>
                                <Badge variant="outline" className="text-xs">{e.memberType}</Badge>
                            </TableCell>
                            <TableCell><code className="text-xs">{e.hciCaseNo ?? "—"}</code></TableCell>
                            <TableCell><code className="text-xs">{e.hciTransNo ?? "—"}</code></TableCell>
                            <TableCell className="text-xs">
                                {e.included
                                    ? <span className={consultCount === 0 ? "text-muted-foreground" : ""}>{consultCount} consult{consultCount !== 1 ? "s" : ""}</span>
                                    : <span className="text-muted-foreground">excluded</span>}
                            </TableCell>
                            <TableCell>
                                <EntryStatusChip status={e.status} />
                            </TableCell>
                        </TableRow>
                    );
                })}
            </TableBody>
        </Table>
    );
}

function EntryStatusChip({ status }: { status: string }) {
    const desc = ENTRY_STATUS_DESCRIPTIONS[status];
    const chip = (() => {
        if (status === "PENDING") return <Badge variant="outline" className="text-xs gap-1"><Clock className="h-3 w-3" />Pending</Badge>;
        if (status === "INCLUDED") return <Badge variant="default" className="text-xs gap-1"><CheckCircle2 className="h-3 w-3" />Included</Badge>;
        if (status === "FAILED") return <Badge variant="destructive" className="text-xs gap-1"><AlertCircle className="h-3 w-3" />Failed</Badge>;
        return <Badge variant="secondary" className="text-xs">{status}</Badge>;
    })();
    return desc ? <span title={desc}>{chip}</span> : chip;
}

// ─── Batch Result Summary ─────────────────────────────────────────────────────

function extractFriendlySummary(data: unknown): { status: "ok" | "warn" | "error"; lines: string[]; decryptedErrors: string | null; parsedErrors: string[] | null } {
    const str = JSON.stringify(data ?? {}).toLowerCase();
    const lines: string[] = [];

    const obj = typeof data === "object" && data !== null ? data as Record<string, unknown> : {};

    // Surface decrypted PhilHealth errors first
    let decryptedErrors = typeof obj.decryptedErrors === "string" ? obj.decryptedErrors : null;
    let parsedErrors: string[] | null = null;

    // Try to parse decrypted errors if they're stringified JSON
    if (decryptedErrors) {
        try {
            // Try to parse as JSON
            const parsed = JSON.parse(decryptedErrors);
            if (parsed && typeof parsed === "object") {
                // If it has an errors array, extract those
                if (Array.isArray(parsed.errors)) {
                    parsedErrors = parsed.errors.map((e: unknown) => 
                        typeof e === "string" ? e : typeof e === "object" ? JSON.stringify(e) : String(e)
                    );
                    // Don't show the raw decryptedErrors string if we have parsed errors
                    decryptedErrors = null;
                } else if (Array.isArray(parsed)) {
                    // If the parsed result is directly an array
                    parsedErrors = parsed.map((e: unknown) => 
                        typeof e === "string" ? e : typeof e === "object" ? JSON.stringify(e) : String(e)
                    );
                    decryptedErrors = null;
                }
            }
        } catch {
            // Not JSON, keep as raw text
        }
    }

    // uploadxmlresult structure
    const upload = obj.uploadxmlresult as Record<string, unknown> | undefined;
    if (upload) {
        if (upload.responsecode) lines.push(`Response Code: ${String(upload.responsecode)}`);
        if (upload.responsemessage) lines.push(`Message: ${String(upload.responsemessage)}`);
        if (upload.transmittalid) lines.push(`Transmittal ID: ${String(upload.transmittalid)}`);
        if (upload.referencenumber) lines.push(`Reference No: ${String(upload.referencenumber)}`);
        const errors = upload.errors;
        if (errors && typeof errors === "object") {
            const errorArr = Array.isArray(errors) ? errors : Object.values(errors);
            errorArr.slice(0, 5).forEach((e) => {
                if (typeof e === "object" && e !== null) {
                    const er = e as Record<string, unknown>;
                    lines.push(`• ${er.errordescription ?? er.message ?? JSON.stringify(e)}`);
                } else {
                    lines.push(`• ${String(e)}`);
                }
            });
        }
    }

    // Flat validate response
    if (!lines.length) {
        if (obj.responsecode) lines.push(`Response Code: ${String(obj.responsecode)}`);
        if (obj.responsemessage) lines.push(`Message: ${String(obj.responsemessage)}`);
        if (obj.message) lines.push(`Message: ${String(obj.message)}`);
        if (obj.result) lines.push(`Result: ${String(obj.result)}`);
        if (obj.raw) lines.push(String(obj.raw).slice(0, 200));
    }

    if (!lines.length && !decryptedErrors && !parsedErrors) lines.push("No details available.");

    const isError = str.includes("failed") || str.includes("error") || str.includes("invalid");
    const isOk = str.includes("success") || str.includes("valid") || str.includes('"v"');
    const status = isError ? "error" : isOk ? "ok" : "warn";

    return { status, lines, decryptedErrors, parsedErrors };
}

const IS_DEV = process.env.NODE_ENV === "development";

// Helper function to format XML with proper indentation
function formatXml(xml: string): string {
    // Remove existing extra whitespace but preserve text content
    let formatted = xml.replace(/>\s+</g, '><');
    
    // Add newlines and indentation
    let indent = 0;
    const lines: string[] = [];
    let currentLine = '';
    let i = 0;
    
    while (i < formatted.length) {
        const char = formatted[i];
        
        if (char === '<') {
            // Check if this is a closing tag or self-closing tag
            const tagEnd = formatted.indexOf('>', i);
            if (tagEnd === -1) break;
            
            const tag = formatted.substring(i, tagEnd + 1);
            const isClosing = tag.startsWith('</');
            const isSelfClosing = tag.endsWith('/>');
            
            // Decrease indent for closing tags
            if (isClosing) indent = Math.max(0, indent - 1);
            
            // Add current line if it has content
            if (currentLine.trim()) {
                lines.push('  '.repeat(indent) + currentLine.trim());
                currentLine = '';
            }
            
            // Add the tag
            lines.push('  '.repeat(indent) + tag);
            
            // Increase indent for opening tags (not self-closing)
            if (!isClosing && !isSelfClosing) indent++;
            
            i = tagEnd + 1;
        } else if (char === ' ' || char === '\n' || char === '\t') {
            // Skip whitespace outside tags
            if (currentLine.trim()) currentLine += char;
            i++;
        } else {
            // Accumulate content
            currentLine += char;
            i++;
        }
    }
    
    // Add any remaining content
    if (currentLine.trim()) {
        lines.push('  '.repeat(indent) + currentLine.trim());
    }
    
    return lines.join('\n');
}

// Helper function to colorize XML syntax
function colorizeXmlLine(line: string): React.ReactNode[] {
    const parts: React.ReactNode[] = [];
    
    // Split by tags: match anything between < and >
    const tagRegex = /<[^>]*>/g;
    let lastIndex = 0;
    let match;
    let keyCounter = 0;
    
    while ((match = tagRegex.exec(line)) !== null) {
        const tag = match[0];
        const tagIndex = match.index;
        
        // Add text before the tag
        if (tagIndex > lastIndex) {
            parts.push(
                <span key={`text-${keyCounter++}`} className="text-slate-700">
                    {line.substring(lastIndex, tagIndex)}
                </span>
            );
        }
        
        // Parse and colorize the tag
        const tagContent = tag.substring(1, tag.length - 1); // Remove < and >
        const isClosingTag = tagContent.startsWith('/');
        const isSelfClosing = tagContent.endsWith('/');
        
        // Extract tag name (first word after < or </)
        const nameMatch = tagContent.match(/^\/?\s*([a-zA-Z_:][a-zA-Z0-9_:.-]*)/);
        const tagName = nameMatch ? nameMatch[1] : '';
        const afterName = nameMatch ? tagContent.substring(nameMatch[0].length) : tagContent;
        
        const tagParts: React.ReactNode[] = ['<'];
        
        if (isClosingTag) tagParts.push('/');
        
        tagParts.push(
            <span key={`tagname-${keyCounter}`} className="text-blue-600">
                {tagName}
            </span>
        );
        
        // Parse attributes
        if (afterName.trim()) {
            const attrRegex = /(\s+)([a-zA-Z_:][a-zA-Z0-9_:.-]*)(?:=("[^"]*"|'[^']*'))?/g;
            let attrMatch;
            let lastAttrIndex = 0;
            
            while ((attrMatch = attrRegex.exec(afterName)) !== null) {
                const [fullAttrMatch, whitespace, attrName, attrValue] = attrMatch;
                const matchIndex = attrMatch.index;
                
                // Add whitespace before attribute
                if (whitespace) {
                    tagParts.push(whitespace);
                }
                
                // Add attribute name
                tagParts.push(
                    <span key={`attr-${keyCounter}-${attrName}`} className="text-purple-600">
                        {attrName}
                    </span>
                );
                
                // Add attribute value if present
                if (attrValue) {
                    tagParts.push('=');
                    tagParts.push(
                        <span key={`val-${keyCounter}-${attrName}`} className="text-green-600">
                            {attrValue}
                        </span>
                    );
                }
                
                lastAttrIndex = matchIndex + fullAttrMatch.length;
            }
            
            // Add remaining content after last attribute (like trailing / for self-closing)
            if (lastAttrIndex < afterName.length) {
                const remaining = afterName.substring(lastAttrIndex);
                if (remaining.trim() || remaining.includes('/')) {
                    tagParts.push(remaining);
                }
            }
        }
        
        tagParts.push('>');
        
        parts.push(
            <span key={`tag-${keyCounter++}`} className="text-blue-600">
                {tagParts}
            </span>
        );
        
        lastIndex = tagIndex + tag.length;
    }
    
    // Add remaining text after last tag
    if (lastIndex < line.length) {
        parts.push(
            <span key={`text-${keyCounter++}`} className="text-slate-700">
                {line.substring(lastIndex)}
            </span>
        );
    }
    
    return parts.length > 0 ? parts : [line];
}

function BatchResultSummary({ label, data, batchUid, xmlPayload, onDecrypted, resultType = "validate" }: { label: string; data: unknown; batchUid?: string; xmlPayload?: string | null; onDecrypted?: () => void; resultType?: "validate" | "submit" }) {
    const [show, setShow] = useState(false);
    const [showXml, setShowXml] = useState(false);
    const [isDecrypting, setIsDecrypting] = useState(false);
    const lineNumbersRef = useRef<HTMLDivElement>(null);
    const codeRef = useRef<HTMLDivElement>(null);
    const { status, lines, decryptedErrors, parsedErrors } = extractFriendlySummary(data);
    const icon = status === "ok"
        ? <CheckCircle2 className="h-4 w-4 text-green-600" />
        : status === "error"
            ? <AlertCircle className="h-4 w-4 text-destructive" />
            : <Clock className="h-4 w-4 text-yellow-600" />;

    // Check if encrypted errors are still present
    const obj = typeof data === "object" && data !== null ? data as Record<string, unknown> : {};
    const hasEncryptedErrors = !!obj.encryptedxmlerrors;

    // Strip decryptedErrors from the object before showing raw JSON
    const rawForDisplay = typeof data === "object" && data !== null
        ? Object.fromEntries(Object.entries(data as Record<string, unknown>).filter(([k]) => k !== "decryptedErrors"))
        : data;

    const handleDecryptErrors = async () => {
        if (!batchUid) return;
        setIsDecrypting(true);
        try {
            const { decryptStoredValidationErrorsAction } = await import("@/actions/clinics/konsulta-report.action");
            const result = await decryptStoredValidationErrorsAction(batchUid, resultType);
            if (result.data?.decryptedErrors) {
                onDecrypted?.();
            }
        } catch (err) {
            console.error("Decrypt error:", err);
        } finally {
            setIsDecrypting(false);
        }
    };

    // Sync vertical scroll between line numbers and code
    const handleCodeScroll = () => {
        if (codeRef.current && lineNumbersRef.current) {
            lineNumbersRef.current.scrollTop = codeRef.current.scrollTop;
        }
    };

    // Format XML with line numbers for highlighting error lines
    const xmlLines = xmlPayload ? formatXml(xmlPayload).split('\n') : [];

    return (
        <div className="mt-3 rounded-md border px-3 py-2 text-sm">
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 font-medium">
                    {icon}
                    {label}
                </div>
                <div className="flex items-center gap-1 flex-wrap justify-end">
                    {hasEncryptedErrors && batchUid && (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-6 text-xs gap-1 px-1.5"
                            onClick={handleDecryptErrors}
                            disabled={isDecrypting}
                        >
                            {isDecrypting ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                                <Lock className="h-3 w-3" />
                            )}
                            Decrypt Errors
                        </Button>
                    )}
                    {xmlPayload && (
                        <Button type="button" variant="ghost" size="sm" className="h-6 text-xs gap-1 px-1.5" onClick={() => setShowXml(!showXml)}>
                            {showXml ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                            {showXml ? "Hide XML" : "View XML"}
                        </Button>
                    )}
                    {IS_DEV && (
                        <Button type="button" variant="ghost" size="sm" className="h-6 text-xs gap-1 px-1.5" onClick={() => setShow(!show)}>
                            {show ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                            {show ? "Hide JSON" : "Raw JSON"}
                        </Button>
                    )}
                </div>
            </div>

            {parsedErrors && parsedErrors.length > 0 && (
                <div className="mt-2 rounded-md bg-destructive/10 border border-destructive/30 px-3 py-2">
                    <p className="text-xs font-semibold text-destructive mb-2">PhilHealth Validation Errors</p>
                    <ul className="space-y-1 text-xs text-destructive/90">
                        {parsedErrors.map((err, i) => (
                            <li key={i} className="ml-2">• {err}</li>
                        ))}
                    </ul>
                </div>
            )}

            {decryptedErrors && (
                <div className="mt-2 rounded-md bg-destructive/10 border border-destructive/30 px-3 py-2">
                    <p className="text-xs font-semibold text-destructive mb-1">PhilHealth Validation Errors</p>
                    <pre className="text-xs whitespace-pre-wrap break-words text-destructive/90">{decryptedErrors}</pre>
                </div>
            )}

            {showXml && xmlPayload && (
                <div className="mt-2 rounded-md bg-slate-50 border border-slate-200 p-0 overflow-hidden">
                    <div className="sticky top-0 bg-slate-100 border-b border-slate-200 px-3 py-1.5 flex items-center justify-between">
                        <p className="text-xs font-semibold text-slate-700">Generated XML ({xmlLines.length} lines)</p>
                        <Button type="button" variant="ghost" size="sm" className="h-5 text-xs px-1.5" onClick={() => setShowXml(false)}>
                            <EyeOff className="h-3 w-3" />
                        </Button>
                    </div>
                    <div className="max-h-96 bg-white font-mono text-xs leading-6 flex overflow-hidden">
                        {/* Line numbers column */}
                        <div
                            ref={lineNumbersRef}
                            className="bg-slate-100 border-r border-slate-200 text-slate-500 p-0 select-none flex-shrink-0 overflow-hidden"
                        >
                            {xmlLines.map((_, i) => (
                                <div
                                    key={`ln-${i}`}
                                    className="px-3 text-right min-w-12"
                                    style={{ height: '1.5rem' }}
                                >
                                    {i + 1}
                                </div>
                            ))}
                        </div>
                        {/* Code column */}
                        <div
                            ref={codeRef}
                            onScroll={handleCodeScroll}
                            className="flex-1 overflow-auto"
                        >
                            {xmlLines.map((line, i) => (
                                <div
                                    key={i}
                                    className="px-4 hover:bg-blue-50 whitespace-pre transition-colors"
                                    style={{ height: '1.5rem' }}
                                >
                                    {colorizeXmlLine(line)}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {lines.length > 0 && (
                <ul className="mt-1.5 space-y-0.5 text-sm text-muted-foreground">
                    {lines.map((l, i) => <li key={i}>{l}</li>)}
                </ul>
            )}

            {IS_DEV && show && (
                <pre className="mt-2 rounded bg-muted p-2 text-xs whitespace-pre-wrap break-all max-h-48 overflow-y-auto">
                    {JSON.stringify(rawForDisplay, null, 2)}
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
                                <BatchResultSummary
                                    label="Validation Response"
                                    data={selected.validateResult}
                                    batchUid={selected.batchUid}
                                    xmlPayload={selected.xmlPayload}
                                    onDecrypted={() => void load()}
                                    resultType="validate"
                                />
                            )}
                            {selected.submitResult && (
                                <BatchResultSummary
                                    label="Submission Response"
                                    data={selected.submitResult}
                                    batchUid={selected.batchUid}
                                    xmlPayload={selected.xmlPayload}
                                    onDecrypted={() => void load()}
                                    resultType="submit"
                                />
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
