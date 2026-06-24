"use client";

import {
	AlertCircle,
	CheckCircle2,
	CheckSquare,
	ChevronDown,
	ChevronRight,
	ClipboardList,
	Clock,
	Eye,
	EyeOff,
	FileCode2,
	History,
	Loader2,
	Lock,
	Pencil,
	Plus,
	RefreshCw,
	Send,
	ShieldCheck,
	ShieldQuestion,
	Square,
	Trash2,
	Upload,
	UserMinus,
	Users,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
	useCallback,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
	useTransition,
} from "react";
import { toast } from "sonner";
import type {
	GetAllClinicPatientsWithPhilHealthStatus,
	GetKonsultaBatches,
	GetPhilHealthConsultations,
	GetPhilHealthPatients,
} from "@/actions/clinics/konsulta-report.action";
import {
	checkEnrolledPatientsRegistrationBatchAction,
	checkKonsultaPatientRegistrationAction,
	enrollPatientPhilHealthAction,
	generateConsultationCaseTransNumbersAction,
	getAllClinicPatientsWithPhilHealthStatusAction,
	getKonsultaBatchesAction,
	getPhilHealthConsultationsAction,
	getPhilHealthPatientsAction,
	importKonsultaAssignmentsAction,
	submitKonsultaBatchAction,
	toggleKonsultaEntryAction,
	unenrollKonsultaPatientAction,
	validateKonsultaAtcAction,
	validateKonsultaBatchAction,
	verifyKonsultaAtcByPinAction,
	verifyKonsultaMemberDependentRegistrationAction,
    deleteKonsultaBatchAction,
    extractRegistrationListAction,
} from "@/actions/clinics/konsulta-report.action";
import {
	createKonsultaBatchV2Action,
	generateBatchXmlV2Action,
} from "@/actions/clinics/konsulta-report-v2.action";
import {
    extractGeneratedKonsultaBatchDeficiencies,
    type StructuredKonsultaBatchDeficiency,
} from "@/lib/konsulta-batch-deficiencies";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";


// ─── Types ────────────────────────────────────────────────────────────────────

type Patient = NonNullable<GetPhilHealthPatients["data"]>[number];
type ClinicPatientRow = NonNullable<
	NonNullable<GetAllClinicPatientsWithPhilHealthStatus["data"]>["patients"]
>[number];
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
	DRAFT:
		"Batch is being prepared. Add patients and generate the XML report when ready.",
	GENERATED:
		"The PCB XML report has been generated. Run validation before submitting to PhilHealth.",
	VALIDATED: "The XML report passed PhilHealth validation. Ready to submit.",
	SUBMITTED: "Successfully submitted to PhilHealth. Awaiting acknowledgment.",
	FAILED:
		"An error occurred during validation or submission. Review the response and regenerate.",
};

const ENTRY_STATUS_DESCRIPTIONS: Record<string, string> = {
	PENDING: "Queued for inclusion in the next batch XML.",
	INCLUDED: "Included in the generated XML report.",
	EXCLUDED: "Manually excluded from this batch.",
	FAILED: "Could not be processed. Review the patient data.",
};

const BATCH_STATUS_VARIANTS: Record<
	string,
	"default" | "secondary" | "destructive" | "outline"
> = {
	DRAFT: "outline",
	GENERATED: "secondary",
	VALIDATED: "secondary",
	SUBMITTED: "default",
	FAILED: "destructive",
};

type GeneratedBatchDeficiency = StructuredKonsultaBatchDeficiency;

function groupGeneratedDeficiencies(deficiencies: GeneratedBatchDeficiency[]) {
    return Array.from(
        deficiencies.reduce<
            Map<
                string,
                {
                    domainKey: string;
                    domainLabel: string;
                    entries: Map<
                        number,
                        {
                            batchEntryId: number;
                            patientName: string;
                            philHealthPin: string;
                            items: GeneratedBatchDeficiency[];
                        }
                    >;
                }
            >
        >((groups, deficiency) => {
            const domainGroup = groups.get(deficiency.domainKey) ?? {
                domainKey: deficiency.domainKey,
                domainLabel: deficiency.domainLabel,
                entries: new Map(),
            };
            const entryGroup = domainGroup.entries.get(deficiency.batchEntryId) ?? {
                batchEntryId: deficiency.batchEntryId,
                patientName: deficiency.patientName,
                philHealthPin: deficiency.philHealthPin,
                items: [],
            };

            entryGroup.items.push(deficiency);
            domainGroup.entries.set(deficiency.batchEntryId, entryGroup);
            groups.set(deficiency.domainKey, domainGroup);
            return groups;
        }, new Map()),
    ).map(([, domainGroup]) => ({
        ...domainGroup,
        entries: Array.from(domainGroup.entries.values()),
    }));
}

function formatPeriod(period: string): string {
	if (period.length !== 6) return period;
	const months = [
		"Jan",
		"Feb",
		"Mar",
		"Apr",
		"May",
		"Jun",
		"Jul",
		"Aug",
		"Sep",
		"Oct",
		"Nov",
		"Dec",
	];
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

// ─── Patients Panel ───────────────────────────────────────────────────────────

type EnrollForm = {
	pin: string;
	patientType: "MM" | "DD";
	memberPin: string;
	philSysId: string;
	tin: string;
};

const EMPTY_ENROLL_FORM: EnrollForm = {
	pin: "",
	patientType: "MM",
	memberPin: "",
	philSysId: "",
	tin: "",
};

type PatientFeed = {
	rows: ClinicPatientRow[];
	loading: boolean;
	loadingMore: boolean;
	hasMore: boolean;
	total: number;
};

const EMPTY_FEED: PatientFeed = {
	rows: [],
	loading: true,
	loadingMore: false,
	hasMore: false,
	total: 0,
};

function registrationBadge(status?: string | null) {
	if (status === "REGISTERED")
		return <Badge className="text-xs">Registered</Badge>;
	if (status === "NOT_REGISTERED")
		return (
			<Badge variant="destructive" className="text-xs">
				Not Registered
			</Badge>
		);
	if (status === "FAILED")
		return (
			<Badge variant="destructive" className="text-xs">
				Check Failed
			</Badge>
		);
	return (
		<Badge variant="outline" className="text-xs">
			Pending
		</Badge>
	);
}

function patientDisplayName(patient: ClinicPatientRow["Patient"]): string {
	return `${patient.lastName ?? ""}, ${patient.firstName ?? ""}${patient.middleName ? ` ${patient.middleName[0]}.` : ""}`.trim();
}

export function PatientsPanel({ clinicUid }: { clinicUid: string }) {
	const PAGE_SIZE = 25;
	const [enrolledFeed, setEnrolledFeed] = useState<PatientFeed>(EMPTY_FEED);
	const [unenrolledFeed, setUnenrolledFeed] = useState<PatientFeed>(EMPTY_FEED);
	const [search, setSearch] = useState("");
	const [enrollTarget, setEnrollTarget] = useState<ClinicPatientRow | null>(
		null,
	);
	const [enrollForm, setEnrollForm] = useState<EnrollForm>(EMPTY_ENROLL_FORM);
	const [enrollLoading, setEnrollLoading] = useState(false);
	const [selectedEnrolledIds, setSelectedEnrolledIds] = useState<Set<number>>(
		new Set(),
	);

	const loadFeed = useCallback(
		async (kind: "ENROLLED" | "UNENROLLED", skip: number, replace: boolean) => {
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
		},
		[clinicUid, search],
	);

	const reload = useCallback(() => {
		void loadFeed("ENROLLED", 0, true);
		void loadFeed("UNENROLLED", 0, true);
	}, [loadFeed]);

	useEffect(() => {
		void reload();
	}, [reload]);

	const handleScroll = (
		kind: "ENROLLED" | "UNENROLLED",
		event: React.UIEvent<HTMLDivElement>,
	) => {
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
		if (!enrollForm.pin.trim()) {
			toast.error("PhilHealth PIN is required");
			return;
		}
		if (enrollForm.patientType === "DD" && !enrollForm.memberPin.trim()) {
			toast.error("Primary member PIN is required for dependents");
			return;
		}

		setEnrollLoading(true);
		const patientName = `${enrollTarget.Patient.firstName} ${enrollTarget.Patient.lastName}`;
		console.log(
			`[Enrollment] Starting enrollment for ${patientName} (ID: ${enrollTarget.id})`,
			{
				pin: `${enrollForm.pin.substring(0, 6)}****`,
				patientType: enrollForm.patientType,
				memberPin:
					enrollForm.patientType === "DD"
						? `${enrollForm.memberPin.substring(0, 6)}****`
						: "(same as patient PIN)",
			},
		);

		const res = await enrollPatientPhilHealthAction({
			clinicUid,
			clinicPatientId: enrollTarget.id,
			pin: enrollForm.pin.trim(),
			patientType: enrollForm.patientType,
			memberPin:
				enrollForm.patientType === "DD"
					? enrollForm.memberPin.trim()
					: enrollForm.pin.trim(),
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
				const result = res.data?.registrationResult as
					| Record<string, unknown>
					| undefined;

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
				console.warn(
					`[Enrollment] Partial success: Registration not confirmed.`,
					{
						status: res.data?.registrationStatus,
						result: res.data?.registrationResult,
						message: res.message,
					},
				);
			}
			setEnrollTarget(null);
			void reload();
		} else {
			toast.error(res.message ?? "Enrollment failed");
			console.error(`[Enrollment] Failed:`, res.message);
		}
	}

	async function handleUnenroll(patient: ClinicPatientRow) {
		const res = await unenrollKonsultaPatientAction({
			clinicUid,
			clinicPatientId: patient.id,
		});
		if (res.status) {
			toast.success("Patient removed from enrolled list");
			reload();
		} else {
			toast.error(res.message ?? "Unable to unenroll patient");
		}
	}

	async function handleCheck(patient: ClinicPatientRow) {
		const res = await checkKonsultaPatientRegistrationAction({
			clinicUid,
			clinicPatientId: patient.id,
		});
		if (res.status) {
			if (res.data?.registrationStatus === "REGISTERED") {
				toast.success("Konsulta registration confirmed");
			} else {
				toast.warning(
					"PhilHealth did not confirm this patient for this provider.",
				);
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
			const idsToCheck =
				selectedEnrolledIds.size > 0
					? Array.from(selectedEnrolledIds)
					: undefined;
			const res = await checkEnrolledPatientsRegistrationBatchAction({
				clinicUid,
				clinicPatientIds: idsToCheck,
			});
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

	function PatientRow({
		patient,
		enrolled,
		isSelected,
		onToggleSelect,
	}: {
		patient: ClinicPatientRow;
		enrolled: boolean;
		isSelected?: boolean;
		onToggleSelect?: (id: number) => void;
	}) {
		const ph = patient.Patient.PhilHealthRecords[0];
		return (
			<div className="border-b px-3 py-3 sm:px-4 last:border-b-0">
				<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
					<div className="flex items-start gap-2">
						{enrolled && onToggleSelect && (
							<div className="mt-0.5 flex items-center">
								<Checkbox
									checked={isSelected ?? false}
									onCheckedChange={() => onToggleSelect(patient.id)}
								/>
							</div>
						)}
						<div className="min-w-0">
							<p className="font-medium text-sm truncate">
								{patientDisplayName(patient.Patient)}
							</p>
							<div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
								<code className="rounded bg-muted px-1.5 py-0.5">
									{ph?.pin ?? "No PIN"}
								</code>
								<Badge variant="outline" className="text-xs">
									{patient.konsultaPatientType === "DD"
										? "Dependent"
										: "Member"}
								</Badge>
								{registrationBadge(patient.konsultaRegistrationStatus)}
							</div>
							<p className="mt-1 text-xs text-muted-foreground">
								{patient.Patient.dob
									? new Date(patient.Patient.dob).toLocaleDateString("en-PH")
									: "No DOB"}
								{patient.Patient.mobile ? ` • ${patient.Patient.mobile}` : ""}
							</p>
						</div>
					</div>
					<div className="flex w-full flex-wrap gap-1.5 sm:w-auto sm:justify-end">
						<Button
							variant="outline"
							size="sm"
							className="h-8 min-w-[84px] justify-center gap-1 px-2 text-xs"
							onClick={() => openEnrollDialog(patient)}
						>
							{enrolled ? (
								<Pencil className="h-3.5 w-3.5" />
							) : (
								<Plus className="h-3.5 w-3.5" />
							)}
							{enrolled ? "Update" : "Enroll"}
						</Button>
						{enrolled && (
							<>
								<Button
									variant="ghost"
									size="sm"
									className="h-8 min-w-[84px] justify-center gap-1 px-2 text-xs"
									onClick={() => void handleCheck(patient)}
								>
									<ShieldQuestion className="h-3.5 w-3.5" />
									Check
								</Button>
								<Button
									variant="ghost"
									size="sm"
									className="h-8 min-w-[92px] justify-center gap-1 px-2 text-xs text-destructive"
									onClick={() => void handleUnenroll(patient)}
								>
									<UserMinus className="h-3.5 w-3.5" />
									Unenroll
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
				console.log(
					`[Scroll] Restored after load complete: ${savedScrollRef.current}px`,
				);
			} else if (!wasLoading && isLoading) {
				// Load starting, save current scroll position
				savedScrollRef.current = node.scrollTop;
				console.log(
					`[Scroll] Saving position ${savedScrollRef.current}px before load`,
				);
			}

			wasLoadingMoreRef.current = isLoading;
		}, [feed.loadingMore]);

		return (
			<Card>
				<CardHeader className="pb-3">
					<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
						<CardTitle className="flex items-center gap-2 text-sm">
							{icon}
							{title}
						</CardTitle>
						<div className="flex flex-wrap items-center justify-end gap-2">
							{kind === "ENROLLED" && feed.rows.length > 0 && (
								<>
									{selectedIds && onToggleSelectAll && (
										<Button
											variant="ghost"
											size="sm"
											onClick={onToggleSelectAll}
											className="h-7 gap-1 px-2 text-xs"
										>
											{selectedIds.size > 0 &&
											selectedIds.size === feed.rows.length ? (
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
							<Badge variant="outline" className="text-xs">
								{feed.rows.length}/{feed.total}
							</Badge>
						</div>
					</div>
				</CardHeader>
				<CardContent className="p-0">
					<div
						ref={scrollRef}
						className="h-[620px] overflow-y-auto"
						onScroll={(e) => handleScroll(kind, e)}
					>
						{feed.loading ? (
							<div className="flex h-full items-center justify-center">
								<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
							</div>
						) : feed.rows.length === 0 ? (
							<div className="px-4 py-10 text-center text-sm text-muted-foreground">
								{search
									? "No patients match your search."
									: kind === "ENROLLED"
										? "No registered Konsulta patients."
										: "No unenrolled patients."}
							</div>
						) : (
							<>
								{feed.rows.map((patient) => (
									<PatientRow
										key={patient.id}
										patient={patient}
										enrolled={kind === "ENROLLED"}
										isSelected={
											kind === "ENROLLED"
												? selectedIds?.has(patient.id)
												: undefined
										}
										onToggleSelect={
											kind === "ENROLLED" ? onToggleSelect : undefined
										}
									/>
								))}
								{feed.loadingMore && (
									<div className="flex justify-center py-4">
										<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
									</div>
								)}
								{feed.hasMore && !feed.loadingMore && (
									<div className="py-4 text-center text-xs text-muted-foreground">
										Scroll for more
									</div>
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
								Enrolled means registered to this HCI for the current
								effectivity year.
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
			<Dialog
				open={!!enrollTarget}
				onOpenChange={(o) => {
					if (!o) setEnrollTarget(null);
				}}
			>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<ShieldCheck className="h-4 w-4 text-primary" />
							{enrollTarget?.konsultaRegistrationStatus === "REGISTERED"
								? "Update Konsulta Enrollment"
								: "Enroll for Konsulta"}
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
									setEnrollForm((f) => ({
										...f,
										patientType: v,
										memberPin: v === "MM" ? f.pin : f.memberPin,
									}))
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
									PhilSys ID{" "}
									<span className="text-muted-foreground">(optional)</span>
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
						<Button
							variant="outline"
							onClick={() => setEnrollTarget(null)}
							disabled={enrollLoading}
						>
							Cancel
						</Button>
						<Button
							onClick={() => void handleEnroll()}
							disabled={enrollLoading}
						>
							{enrollLoading ? (
								<>
									<Loader2 className="h-4 w-4 animate-spin mr-2" />
									Enrolling…
								</>
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
