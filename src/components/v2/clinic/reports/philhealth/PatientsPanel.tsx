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
	Hash,
	History,
	Loader2,
	Lock,
	MoreHorizontal,
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
	Wand2,
} from "lucide-react";
import Link from "next/link";
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
    generateYakapEnlistmentNumbersAction,
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
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
	const [detailPatient, setDetailPatient] = useState<ClinicPatientRow | null>(null);

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
			patientType: patient.YakapRegistrations?.[0]?.patientType === "DD" ? "DD" : "MM",
			memberPin: patient.memberPin ?? ph?.pin ?? "",
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

	function GenerateNumbersButton({
		clinicUid,
		patient,
		onSuccess,
	}: {
		clinicUid: string;
		patient: ClinicPatientRow;
		onSuccess: (updated: { konsultaHciCaseNo: string | null; konsultaHciTransNo: string | null }) => void;
	}) {
		const [loading, setLoading] = useState(false);

		async function handleGenerate() {
			setLoading(true);
			const res = await generateYakapEnlistmentNumbersAction({
				clinicUid,
				clinicPatientId: patient.id,
			});
			setLoading(false);
			if (res.status && res.data) {
				toast.success("Enlistment numbers generated.");
				onSuccess({
					konsultaHciCaseNo: res.data.hciCaseNo,
					konsultaHciTransNo: res.data.hciEnlistmentTransNo,
				});
			} else {
				toast.error(res.message ?? "Failed to generate numbers.");
			}
		}

		return (
			<Button
				size="sm"
				variant="secondary"
				className="gap-1.5"
				disabled={loading}
				onClick={() => void handleGenerate()}
			>
				{loading ? (
					<Loader2 className="h-3.5 w-3.5 animate-spin" />
				) : (
					<Wand2 className="h-3.5 w-3.5" />
				)}
				Generate Numbers
			</Button>
		);
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
				<div className="flex items-center justify-between gap-2">
					<div className="flex items-center gap-2 min-w-0">
						{enrolled && onToggleSelect && (
							<Checkbox
								checked={isSelected ?? false}
								onCheckedChange={() => onToggleSelect(patient.id)}
								className="shrink-0"
							/>
						)}
						{/* Enroll button for unenrolled; name-as-button for enrolled */}
						{!enrolled ? (
							<div className="min-w-0">
								<p className="font-medium text-sm truncate">
									{patientDisplayName(patient.Patient)}
								</p>
								<div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
									<code className="rounded bg-muted px-1.5 py-0.5">
										{ph?.pin ?? "No PIN"}
									</code>
									{patient.Patient.dob && (
										<span>{new Date(patient.Patient.dob).toLocaleDateString("en-PH")}</span>
									)}
								</div>
							</div>
						) : (
							<div className="min-w-0">
								{/* Clickable name → navigates to patient profile */}
								<Link
									href={`/v2/clinic/${clinicUid}/patients/${patient.Patient.id}`}
									target="_blank"
									rel="noopener noreferrer"
									className="font-medium text-sm truncate text-left hover:underline hover:text-primary transition-colors"
								>
									{patientDisplayName(patient.Patient)}
								</Link>
								<div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
									<code className="rounded bg-muted px-1.5 py-0.5">
										{ph?.pin ?? "No PIN"}
									</code>
									<Badge variant="outline" className="text-xs">
										{patient.YakapRegistrations?.[0]?.patientType === "DD" ? "Dependent" : "Member"}
									</Badge>
									{registrationBadge(patient.YakapRegistrations?.[0]?.registrationStatus)}
								</div>
								{/* Generate button when numbers are missing */}
								{(!patient.YakapRegistrations?.[0]?.hciCaseNo || !patient.YakapRegistrations?.[0]?.hciEnlistmentTransNo) && (
									<button
										type="button"
										className="mt-1.5 flex items-center gap-1 text-[11px] text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 transition-colors"
										onClick={() => setDetailPatient(patient)}
									>
										<Hash className="h-3 w-3" />
										No enlistment numbers — click to generate
									</button>
								)}
							</div>
						)}
					</div>

					{/* Actions */}
					<div className="shrink-0">
						{enrolled ? (
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button variant="ghost" size="sm" className="h-8 w-8 p-0">
										<MoreHorizontal className="h-4 w-4" />
										<span className="sr-only">Actions</span>
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end" className="w-44">
									<DropdownMenuItem onClick={() => setDetailPatient(patient)}>
										<ClipboardList className="mr-2 h-3.5 w-3.5" />
										View Details
									</DropdownMenuItem>
									<DropdownMenuItem onClick={() => openEnrollDialog(patient)}>
										<Pencil className="mr-2 h-3.5 w-3.5" />
										Update Enrollment
									</DropdownMenuItem>
									<DropdownMenuItem onClick={() => void handleCheck(patient)}>
										<ShieldQuestion className="mr-2 h-3.5 w-3.5" />
										Check Registration
									</DropdownMenuItem>
									<DropdownMenuSeparator />
									<DropdownMenuItem
										className="text-destructive focus:text-destructive"
										onClick={() => void handleUnenroll(patient)}
									>
										<UserMinus className="mr-2 h-3.5 w-3.5" />
										Unenroll
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						) : (
							<Button
								variant="outline"
								size="sm"
								className="h-8 gap-1 px-3 text-xs"
								onClick={() => openEnrollDialog(patient)}
							>
								<Plus className="h-3.5 w-3.5" />
								Enroll
							</Button>
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
							{enrollTarget?.YakapRegistrations?.[0]?.registrationStatus === "REGISTERED"
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

			{/* ── Enlistment Detail Dialog ── */}
			<Dialog open={!!detailPatient} onOpenChange={(o) => { if (!o) setDetailPatient(null); }}>
				<DialogContent className="max-w-sm">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<ClipboardList className="h-4 w-4 text-primary" />
							Enlistment Details
						</DialogTitle>
						<DialogDescription>
							{detailPatient ? patientDisplayName(detailPatient.Patient) : ""}
						</DialogDescription>
					</DialogHeader>

					{detailPatient && (() => {
						const ph = detailPatient.Patient.PhilHealthRecords[0];
						const yr = detailPatient.YakapRegistrations?.[0];
						return (
							<div className="space-y-3 py-1 text-sm">
								<div className="grid grid-cols-[120px_1fr] gap-y-2.5 gap-x-3 items-start">
									<span className="text-muted-foreground text-xs pt-0.5">PhilHealth PIN</span>
									<code className="rounded bg-muted px-2 py-0.5 text-xs font-mono break-all">
										{ph?.pin ?? "—"}
									</code>

									<span className="text-muted-foreground text-xs pt-0.5">Patient Type</span>
									<span>
										<Badge variant="outline" className="text-xs">
											{yr?.patientType === "DD" ? "Dependent" : "Member"}
										</Badge>
									</span>

									{yr?.patientType === "DD" && detailPatient.memberPin && (
										<>
											<span className="text-muted-foreground text-xs pt-0.5">Member PIN</span>
											<code className="rounded bg-muted px-2 py-0.5 text-xs font-mono break-all">
												{detailPatient.memberPin}
											</code>
										</>
									)}

									<span className="text-muted-foreground text-xs pt-0.5">Registration</span>
									<span>{registrationBadge(yr?.registrationStatus)}</span>

									<span className="text-muted-foreground text-xs pt-0.5">Eff. Year</span>
									<span className="font-medium">{yr?.effYear ?? "—"}</span>

									{yr?.registeredAt && (
										<>
											<span className="text-muted-foreground text-xs pt-0.5">Enrolled At</span>
											<span>{new Date(yr.registeredAt).toLocaleString("en-PH")}</span>
										</>
									)}

									{yr?.hciCaseNo && (
										<>
											<span className="text-muted-foreground text-xs pt-0.5">Case No.</span>
											<code className="rounded bg-muted px-2 py-0.5 text-xs font-mono break-all">
												{yr.hciCaseNo}
											</code>
										</>
									)}

									{yr?.hciEnlistmentTransNo && (
										<>
											<span className="text-muted-foreground text-xs pt-0.5">Enlistment Trans No.</span>
											<code className="rounded bg-muted px-2 py-0.5 text-xs font-mono break-all">
												{yr.hciEnlistmentTransNo}
											</code>
										</>
									)}

									{yr?.hciProfilingTransNo && (
										<>
											<span className="text-muted-foreground text-xs pt-0.5">Profiling Trans No.</span>
											<code className="rounded bg-muted px-2 py-0.5 text-xs font-mono break-all">
												{yr.hciProfilingTransNo}
											</code>
										</>
									)}
								</div>
							</div>
						);
					})()}

					<DialogFooter className="gap-2 pt-2 flex-wrap">
						{/* Generate button — only shown when numbers are missing */}
						{detailPatient && (!detailPatient.YakapRegistrations?.[0]?.hciCaseNo || !detailPatient.YakapRegistrations?.[0]?.hciEnlistmentTransNo) && (
							<GenerateNumbersButton
								clinicUid={clinicUid}
								patient={detailPatient}
								onSuccess={(updated) => {
									setDetailPatient((prev) => {
										if (!prev) return prev;
										const yrs = prev.YakapRegistrations ? [...prev.YakapRegistrations] : [];
										if (yrs.length > 0) {
											yrs[0] = {
												...yrs[0],
												hciCaseNo: updated.konsultaHciCaseNo,
												hciEnlistmentTransNo: updated.konsultaHciTransNo,
											};
										}
										return { ...prev, YakapRegistrations: yrs };
									});
									void reload();
								}}
							/>
						)}
						<Button variant="outline" size="sm" onClick={() => { setDetailPatient(null); openEnrollDialog(detailPatient!); }}>
							<Pencil className="mr-1.5 h-3.5 w-3.5" />
							Update Enrollment
						</Button>
						<Button size="sm" variant="ghost" onClick={() => setDetailPatient(null)}>
							Close
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
