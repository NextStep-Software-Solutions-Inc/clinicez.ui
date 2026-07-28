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
	createKonsultaBatchAction,
    extractRegistrationListAction,
	deleteKonsultaBatchAction,
	enrollPatientPhilHealthAction,
	generateBatchXmlAction,
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
	searchPrincipalMemberAction,
	getPrincipalMemberByPinAction,
	type PrincipalMemberInfo,
} from "@/actions/clinics/konsulta-report.action";
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
import { ExtractRegistrationPanel } from "./ExtractRegistrationPanel";

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

// ─── Main Component ───────────────────────────────────────────────────────────

const VALID_TABS = [
	"patients",
	"consultations",
	"batches",
	"history",
	"extract-registration",
	"atc-verification",
	"konsulta-validation",
	"xml-import",
] as const;
type KonsultaTab = (typeof VALID_TABS)[number];

export function PhilHealthReportTab({ clinicUid }: PhilHealthReportTabProps) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const rawTab = searchParams.get("konsultaTab");
	const activeTab: KonsultaTab = (VALID_TABS as readonly string[]).includes(
		rawTab ?? "",
	)
		? (rawTab as KonsultaTab)
		: "patients";

	const handleTabChange = (value: string) => {
		const params = new URLSearchParams(searchParams.toString());
		params.set("konsultaTab", value);
		router.replace(`${pathname}?${params.toString()}`, { scroll: false });
	};

	return (
		<Tabs
			value={activeTab}
			onValueChange={handleTabChange}
			className="mt-3 sm:mt-4"
		>
			<div className="mb-4 overflow-x-auto">
				<TabsList className="w-max min-w-full">
					<TabsTrigger value="patients" className="gap-2 whitespace-nowrap">
						<Users className="h-4 w-4" />
						Patient Enrollment
					</TabsTrigger>
					<TabsTrigger
						value="consultations"
						className="gap-2 whitespace-nowrap"
					>
						<ClipboardList className="h-4 w-4" />
						Consultation Records
					</TabsTrigger>
					<TabsTrigger value="batches" className="gap-2 whitespace-nowrap">
						<Send className="h-4 w-4" />
						Report Batch Management
					</TabsTrigger>
					<TabsTrigger value="history" className="gap-2 whitespace-nowrap">
						<History className="h-4 w-4" />
						Submission History
					</TabsTrigger>
					<TabsTrigger
						value="extract-registration"
						className="gap-2 whitespace-nowrap"
					>
						<RefreshCw className="h-4 w-4" />
						Extract Registration List
					</TabsTrigger>
					<TabsTrigger
						value="atc-verification"
						className="gap-2 whitespace-nowrap"
					>
						<ClipboardList className="h-4 w-4" />
						ATC Verification
					</TabsTrigger>
					<TabsTrigger
						value="konsulta-validation"
						className="gap-2 whitespace-nowrap"
					>
						<ShieldCheck className="h-4 w-4" />
						Konsulta Registration Validation
					</TabsTrigger>
					<TabsTrigger value="xml-import" className="gap-2 whitespace-nowrap">
						<FileCode2 className="h-4 w-4" />
						XML Import
					</TabsTrigger>
				</TabsList>
			</div>

			<TabsContent value="patients" className="min-w-0">
				<PatientsPanel clinicUid={clinicUid} />
			</TabsContent>
			<TabsContent value="consultations" className="min-w-0">
				<ConsultationsPanel clinicUid={clinicUid} />
			</TabsContent>
			<TabsContent value="batches" className="min-w-0">
				<BatchesPanel clinicUid={clinicUid} />
			</TabsContent>
			<TabsContent value="history" className="min-w-0">
				<SubmissionHistoryPanel clinicUid={clinicUid} />
			</TabsContent>
			<TabsContent value="extract-registration">
				<ExtractRegistrationPanel clinicUid={clinicUid} />
			</TabsContent>
			<TabsContent value="atc-verification">
				<AtcVerificationPanel clinicUid={clinicUid} />
			</TabsContent>
			<TabsContent value="konsulta-validation">
				<KonsultaValidationPanel clinicUid={clinicUid} />
			</TabsContent>
			<TabsContent value="xml-import">
				<KonsultaXmlImportPanel clinicUid={clinicUid} />
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

function PatientsPanel({ clinicUid }: { clinicUid: string }) {
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
	const [principalMemberInfo, setPrincipalMemberInfo] = useState<PrincipalMemberInfo | null>(null);
	const [principalSearchQuery, setPrincipalSearchQuery] = useState("");
	const [principalSearchResults, setPrincipalSearchResults] = useState<PrincipalMemberInfo[]>([]);
	const [isSearchingPrincipal, setIsSearchingPrincipal] = useState(false);
	const [isLookingUpPin, setIsLookingUpPin] = useState(false);
	const [principalFormDetails, setPrincipalFormDetails] = useState({
		firstName: "",
		lastName: "",
		middleName: "",
		extensionName: "",
		dob: "",
	});

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
		const patientType = patient.konsultaPatientType === "DD" ? "DD" : "MM";
		const memberPin = patient.konsultaMemberPin ?? (patientType === "MM" ? (ph?.pin ?? "") : "");
		setEnrollTarget(patient);
		setEnrollForm({
			pin: ph?.pin ?? "",
			patientType,
			memberPin,
			philSysId: "",
			tin: "",
		});
		setPrincipalMemberInfo(null);
		setPrincipalSearchQuery("");
		setPrincipalSearchResults([]);
		setPrincipalFormDetails({
			firstName: "",
			lastName: "",
			middleName: "",
			extensionName: "",
			dob: "",
		});

		if (patientType === "DD" && memberPin) {
			void getPrincipalMemberByPinAction(memberPin).then((res) => {
				if (res.data) {
					setPrincipalMemberInfo(res.data);
				}
			});
		}
	}

	async function handleSearchPrincipal() {
		if (!principalSearchQuery.trim()) return;
		setIsSearchingPrincipal(true);
		const res = await searchPrincipalMemberAction({ query: principalSearchQuery.trim(), clinicUid });
		setIsSearchingPrincipal(false);
		if (res.data) {
			setPrincipalSearchResults(res.data);
			if (res.data.length === 0) {
				toast.warning("No principal members found matching query.");
			}
		} else {
			toast.error(res.message ?? "Failed to search principal members.");
		}
	}

	async function handleLookupPrincipalPin(pinToLookup: string) {
		const pin = pinToLookup.trim();
		if (!pin) {
			toast.error("Please enter a Principal Member PIN.");
			return;
		}
		setIsLookingUpPin(true);
		const res = await getPrincipalMemberByPinAction(pin);
		setIsLookingUpPin(false);
		if (res.data) {
			setPrincipalMemberInfo(res.data);
			setEnrollForm((f) => ({ ...f, memberPin: res.data!.pin }));
			setPrincipalSearchResults([]);
			toast.success(`Retrieved details for Principal Member: ${res.data.firstName} ${res.data.lastName}`);
		} else {
			setPrincipalMemberInfo(null);
			toast.info("Principal Member not found in system. Please enter their details below.");
		}
	}

	function selectPrincipalMember(member: PrincipalMemberInfo) {
		setPrincipalMemberInfo(member);
		setEnrollForm((f) => ({ ...f, memberPin: member.pin }));
		setPrincipalSearchResults([]);
		toast.success(`Linked Principal Member: ${member.firstName} ${member.lastName} (${member.pin})`);
	}

	async function handleEnroll() {
		if (!enrollTarget) return;
		if (!enrollForm.pin.trim()) {
			toast.error("PhilHealth PIN is required");
			return;
		}

		const pmDetails = principalMemberInfo || (
			principalFormDetails.firstName.trim() && principalFormDetails.lastName.trim() && principalFormDetails.dob
				? {
						pin: enrollForm.memberPin.trim(),
						firstName: principalFormDetails.firstName.trim(),
						lastName: principalFormDetails.lastName.trim(),
						middleName: principalFormDetails.middleName.trim(),
						extensionName: principalFormDetails.extensionName.trim(),
						dob: principalFormDetails.dob,
				  }
				: null
		);

		if (enrollForm.patientType === "DD") {
			if (!enrollForm.memberPin.trim()) {
				toast.error("Principal Member PIN is required for dependent records.");
				return;
			}
			if (enrollForm.memberPin.trim() === enrollForm.pin.trim()) {
				toast.error("Principal Member PIN and Dependent/Patient PIN cannot be the same.");
				return;
			}
			if (!pmDetails) {
				toast.error("Please search/link a Principal Member or fill in the Principal Member's details before submitting.");
				return;
			}
		}

		setEnrollLoading(true);
		const patientName = `${enrollTarget.Patient.firstName} ${enrollTarget.Patient.lastName}`;

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
			principalMemberDetails: pmDetails,
		});
		setEnrollLoading(false);

		if (res.status) {
			if (res.data?.registrationStatus === "REGISTERED") {
				toast.success(`✓ ${patientName} is now registered with PhilHealth Yakap`);
			} else {
				let detailedMessage = `Patient details saved. Status: ${res.data?.registrationStatus ?? "unknown"}.`;
				const result = res.data?.registrationResult as
					| Record<string, unknown>
					| undefined;

				if (result?.error) {
					detailedMessage += ` Error: ${result.error}`;
				} else if (result) {
					const details = Object.entries(result)
						.filter(([key]) => key !== "registrationStatus")
						.map(([key, value]) => `${key}: ${value}`)
						.join(" | ");
					if (details) {
						detailedMessage += ` Details: ${details}`;
					}
				}

				toast.warning(detailedMessage);
			}
			setEnrollTarget(null);
			void reload();
		} else {
			toast.error(res.message ?? "Enrollment failed");
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
								? "Update PhilHealth Yakap Enrollment"
								: "Enroll for PhilHealth Yakap"}
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
								Member Type <span className="text-destructive">*</span>
							</Label>
							<Select
								value={enrollForm.patientType}
								onValueChange={(v: "MM" | "DD") => {
									setEnrollForm((f) => ({
										...f,
										patientType: v,
										memberPin: v === "MM" ? f.pin : f.memberPin,
									}));
									if (v === "MM") {
										setPrincipalMemberInfo(null);
										setPrincipalSearchResults([]);
									}
								}}
							>
								<SelectTrigger id="enroll-patient-type">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="MM">Principal Member</SelectItem>
									<SelectItem value="DD">Dependent</SelectItem>
								</SelectContent>
							</Select>
						</div>

						{enrollForm.patientType === "DD" && (
							<div className="space-y-3 pt-1 border-t">
								<div className="space-y-1.5">
									<Label htmlFor="enroll-member-search">
										Link to Principal Member <span className="text-destructive">*</span>
									</Label>
									<div className="flex gap-2">
										<Input
											id="enroll-member-search"
											placeholder="Search by PIN or Name"
											value={principalSearchQuery || enrollForm.memberPin}
											onChange={(e) => {
												setPrincipalSearchQuery(e.target.value);
												setEnrollForm((f) => ({ ...f, memberPin: e.target.value }));
											}}
										/>
										<Button
											type="button"
											variant="secondary"
											onClick={() => void handleSearchPrincipal()}
											disabled={isSearchingPrincipal}
										>
											{isSearchingPrincipal ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
										</Button>
										<Button
											type="button"
											variant="outline"
											onClick={() => void handleLookupPrincipalPin(enrollForm.memberPin)}
											disabled={isLookingUpPin || !enrollForm.memberPin.trim()}
										>
											{isLookingUpPin ? <Loader2 className="h-4 w-4 animate-spin" /> : "Lookup PIN"}
										</Button>
									</div>
								</div>

								{/* Search Results dropdown */}
								{principalSearchResults.length > 0 && (
									<div className="border rounded-md bg-background shadow-md max-h-40 overflow-y-auto divide-y">
										{principalSearchResults.map((m) => (
											<button
												key={m.pin}
												type="button"
												className="w-full text-left p-2 hover:bg-muted text-xs flex justify-between items-center"
												onClick={() => selectPrincipalMember(m)}
											>
												<div>
													<span className="font-medium text-foreground">{m.firstName} {m.lastName}</span>
													<span className="text-muted-foreground ml-2">DOB: {m.dob}</span>
												</div>
												<span className="font-mono text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">{m.pin}</span>
											</button>
										))}
									</div>
								)}

								{/* Read-Only Principal Member Info Block */}
								{principalMemberInfo ? (
									<div className="border border-primary/20 bg-muted/40 rounded-lg p-3 space-y-2 text-xs">
										<div className="flex items-center justify-between border-b pb-1">
											<span className="font-semibold text-primary flex items-center gap-1">
												<ShieldCheck className="h-3.5 w-3.5" />
												Principal Member Info (Read-Only)
											</span>
											<Badge variant="outline" className="text-[10px]">Linked</Badge>
										</div>
										<div className="grid grid-cols-2 gap-x-4 gap-y-1 text-muted-foreground">
											<div>
												<span className="font-medium text-foreground">PIN:</span>{" "}
												<span className="font-mono text-foreground font-semibold">{principalMemberInfo.pin}</span>
											</div>
											<div>
												<span className="font-medium text-foreground">Date of Birth:</span>{" "}
												<span>{principalMemberInfo.dob}</span>
											</div>
											<div>
												<span className="font-medium text-foreground">First Name:</span>{" "}
												<span>{principalMemberInfo.firstName}</span>
											</div>
											<div>
												<span className="font-medium text-foreground">Last Name:</span>{" "}
												<span>{principalMemberInfo.lastName}</span>
											</div>
											<div>
												<span className="font-medium text-foreground">Middle Name:</span>{" "}
												<span>{principalMemberInfo.middleName || "—"}</span>
											</div>
											<div>
												<span className="font-medium text-foreground">Ext Name:</span>{" "}
												<span>{principalMemberInfo.extensionName || "—"}</span>
											</div>
										</div>
									</div>
								) : (
									<div className="border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 rounded-lg p-3 space-y-3 text-xs">
										<div className="flex items-center gap-1 text-amber-700 dark:text-amber-400 font-semibold border-b pb-1">
											<AlertCircle className="h-3.5 w-3.5" />
											Principal Member Details (Non-Registered Member)
										</div>
										<p className="text-[11px] text-muted-foreground">
											Principal Member not found in system. Fill in their details to auto-register them in ClinicEZ and satisfy PhilHealth enlistment requirements.
										</p>
										<div className="grid grid-cols-2 gap-2">
											<div>
												<Label className="text-[11px]">First Name <span className="text-destructive">*</span></Label>
												<Input
													className="h-8 text-xs mt-1"
													placeholder="First Name"
													value={principalFormDetails.firstName}
													onChange={(e) => setPrincipalFormDetails(f => ({ ...f, firstName: e.target.value }))}
												/>
											</div>
											<div>
												<Label className="text-[11px]">Last Name <span className="text-destructive">*</span></Label>
												<Input
													className="h-8 text-xs mt-1"
													placeholder="Last Name"
													value={principalFormDetails.lastName}
													onChange={(e) => setPrincipalFormDetails(f => ({ ...f, lastName: e.target.value }))}
												/>
											</div>
											<div>
												<Label className="text-[11px]">Middle Name</Label>
												<Input
													className="h-8 text-xs mt-1"
													placeholder="Middle Name"
													value={principalFormDetails.middleName}
													onChange={(e) => setPrincipalFormDetails(f => ({ ...f, middleName: e.target.value }))}
												/>
											</div>
											<div>
												<Label className="text-[11px]">Ext Name / Suffix</Label>
												<Input
													className="h-8 text-xs mt-1"
													placeholder="e.g. Jr, III"
													value={principalFormDetails.extensionName}
													onChange={(e) => setPrincipalFormDetails(f => ({ ...f, extensionName: e.target.value }))}
												/>
											</div>
											<div className="col-span-2">
												<Label className="text-[11px]">Date of Birth <span className="text-destructive">*</span></Label>
												<Input
													type="date"
													className="h-8 text-xs mt-1"
													value={principalFormDetails.dob}
													onChange={(e) => setPrincipalFormDetails(f => ({ ...f, dob: e.target.value }))}
												/>
											</div>
										</div>
									</div>
								)}
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

// ─── Consultations Panel ──────────────────────────────────────────────────────

function ConsultationsPanel({ clinicUid }: { clinicUid: string }) {
	const [consultations, setConsultations] = useState<Consultation[]>([]);
	const [loading, setLoading] = useState(true);
	const [atcTarget, setAtcTarget] = useState<Consultation | null>(null);
	const [atc, setAtc] = useState("");
	const [atcLoading, setAtcLoading] = useState(false);
	const [isWalkIn, setIsWalkIn] = useState(false);
	const [generateTarget, setGenerateTarget] = useState<Consultation | null>(
		null,
	);

	console.log({atcTarget})
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
			to: new Date(`${to}T23:59:59`),
		});
		if (res.status && res.data) setConsultations(res.data);
		else toast.error(res.message ?? "Failed to load consultations");
		setLoading(false);
	}, [clinicUid, from, to]);

	useEffect(() => {
		void load();
	}, [load]);

	async function handleValidateAtc() {
		if (!atcTarget) return;
		if (!isWalkIn && !atc.trim()) {
			toast.error("ATC code is required if not a walk-in patient");
			return;
		}
		setAtcLoading(true);
		const res = await validateKonsultaAtcAction({
			clinicUid,
			consultationTicketId: atcTarget.id,
			atc: isWalkIn ? "WALKEDIN" : atc.trim(),
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
				toast.success(
					`Generated: ${res.data.konsultaHciCaseNo} / ${res.data.konsultaHciTransNo}`,
				);
				setGenerateTarget(null);
				void load();
			} else {
				toast.error(res.message ?? "Failed to generate numbers");
			}
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Failed to generate numbers",
			);
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
								Consultations from patients with REGISTERED status in the
								current effectivity year, within the selected date range.
							</CardDescription>
						</div>
						<Button
							variant="ghost"
							size="sm"
							onClick={() => void load()}
							disabled={loading}
						>
							<RefreshCw
								className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
							/>
						</Button>
					</div>
					<div className="mt-2 flex flex-wrap items-end gap-3">
						<div>
							<Label className="text-xs">From</Label>
							<Input
								type="date"
								value={from}
								onChange={(e) => setFrom(e.target.value)}
								className="w-36"
							/>
						</div>
						<div>
							<Label className="text-xs">To</Label>
							<Input
								type="date"
								value={to}
								onChange={(e) => setTo(e.target.value)}
								className="w-36"
							/>
						</div>
						<Button
							size="sm"
							variant="outline"
							onClick={() => void load()}
							disabled={loading}
						>
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
						<div className="overflow-x-auto">
							<Table className="min-w-[920px]">
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
										const patient =
											c.ClinicPatient?.Patient ??
											c.Appointment?.Requesters[0]?.User;
										const cp = c.ClinicPatient ?? c.Appointment?.Requesters[0]?.User?.ClinicPatients?.[0];
										const pin = cp?.konsultaPatientPin || patient?.PhilHealthRecords[0]?.pin;
										const primary = c.ConsultationDiagnoses.find(
											(d) => d.type === "PRIMARY",
										);
										console.log({patient, pin, c})
										const hp =
											c.ConsultationTicketHPs[0]?.HealthCareProvider?.User;
										const ready =
											!!c.konsultaHciCaseNo &&
											!!c.konsultaHciTransNo &&
											c.konsultaAtcValidationStatus === "VALID";
										const hasValidCaseAndTrans =
											!!c.konsultaHciCaseNo && !!c.konsultaHciTransNo;
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
															<code className="text-xs">
																{primary.icd10Code}
															</code>{" "}
															{primary.description.slice(0, 30)}
															{primary.description.length > 30 ? "…" : ""}
														</span>
													) : (
														<span className="text-muted-foreground">—</span>
													)}
												</TableCell>
												<TableCell className="text-sm">
													{hp
														? `${hp.firstName ?? ""} ${hp.lastName ?? ""}`.trim()
														: "—"}
												</TableCell>
												<TableCell>
													<Badge
														variant={
															c.konsultaIsWalkedIn
																? "default"
																: c.konsultaAtcValidationStatus === "VALID"
																	? "default"
																	: c.konsultaAtcValidationStatus === "INVALID"
																		? "destructive"
																		: "outline"
														}
														className="text-xs"
													>
														{c.konsultaIsWalkedIn
															? "Walked In"
															: c.konsultaAtcValidationStatus ??
																(c.konsultaAtc ? "Pending" : "No ATC")}
													</Badge>
												</TableCell>
												<TableCell>
													<Badge
														variant={ready ? "default" : "outline"}
														className="text-xs"
													>
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
															onClick={() => {
																console.log({c})
																setAtcTarget(c);
																setAtc(c.konsultaAtc === "WALKEDIN" ? "" : (c.konsultaAtc ?? ""));
																setIsWalkIn(c.konsultaIsWalkedIn || c.Appointment?.AppointmentAttribute?.isWalkIn || false);
															}}
														>
															Validate
														</Button>
													)}
												</TableCell>
											</TableRow>
										);
									})}
								</TableBody>
							</Table>
						</div>
					)}
				</CardContent>
			</Card>
			<Dialog
				open={!!atcTarget}
				onOpenChange={(open) => {
					if (!open) setAtcTarget(null);
				}}
			>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle>Validate Authorization Transaction Code</DialogTitle>
						<DialogDescription>
							The ATC is checked against the member/dependent PIN and the
							appointment date.
						</DialogDescription>
					</DialogHeader>
					{(() => {
						const cp = atcTarget?.ClinicPatient ?? atcTarget?.Appointment?.Requesters[0]?.User?.ClinicPatients?.[0];
						if (cp?.konsultaPatientType) {
							const isDependent = cp.konsultaPatientType === "DD";
							const patientPin = cp.konsultaPatientPin || atcTarget?.Appointment?.Requesters[0]?.User?.PhilHealthRecords?.[0]?.pin || atcTarget?.ClinicPatient?.Patient?.PhilHealthRecords?.[0]?.pin || "Not specified";
							return (
								<div className="rounded-md border p-3 bg-muted/50 text-sm space-y-1 mt-2">
									{isDependent && (
										<div className="flex justify-between items-center">
											<span className="text-muted-foreground">Dependent PIN:</span>
											<span className="font-mono font-medium">{patientPin}</span>
										</div>
									)}
									<div className="flex justify-between items-center">
										<span className="text-muted-foreground">{isDependent ? "Primary/Member PIN:" : "Member PIN:"}</span>
										<span className="font-mono font-medium">{cp.konsultaMemberPin || (!isDependent ? patientPin : "Not specified")}</span>
									</div>
								</div>
							);
						}
						return null;
					})()}
					<div className="space-y-4 py-2">
						<div className="flex items-center space-x-2">
							<Checkbox
								id="walkin-patient"
								checked={isWalkIn}
								onCheckedChange={(checked) => {
									setIsWalkIn(!!checked);
									if (checked) setAtc("");
								}}
							/>
							<Label htmlFor="walkin-patient" className="font-medium">
								Patient is a Walk-in (No ATC)
							</Label>
						</div>
						<div className="space-y-2">
							<Label
								htmlFor="konsulta-atc"
								className={isWalkIn ? "text-muted-foreground" : ""}
							>
								ATC Code
							</Label>
							<Input
								id="konsulta-atc"
								value={atc}
								onChange={(e) => setAtc(e.target.value.toUpperCase())}
								placeholder="12-character ATC"
								disabled={isWalkIn}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setAtcTarget(null)}
							disabled={atcLoading}
						>
							Cancel
						</Button>
						<Button
							onClick={() => void handleValidateAtc()}
							disabled={atcLoading}
						>
							{atcLoading ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Validating…
								</>
							) : (
								"Validate"
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog
				open={!!generateTarget}
				onOpenChange={(open) => {
					if (!open) setGenerateTarget(null);
				}}
			>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle>Generate Case & Transaction Numbers</DialogTitle>
						<DialogDescription>
							This will generate the HCI Case Number and HCI Transaction Number
							for this consultation. These are required for reporting.
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
								<Label className="text-xs font-semibold">
									Current HCI Case No
								</Label>
								<div className="font-mono text-sm bg-muted px-2 py-1 rounded">
									{generateTarget.konsultaHciCaseNo ?? "Not set"}
								</div>
							</div>
							<div>
								<Label className="text-xs font-semibold">
									Current HCI Trans No
								</Label>
								<div className="font-mono text-sm bg-muted px-2 py-1 rounded">
									{generateTarget.konsultaHciTransNo ?? "Not set"}
								</div>
							</div>
							<p className="text-xs text-muted-foreground mt-3">
								Generation of these numbers requires valid clinic HCI
								credentials and sequence management. Please ensure the clinic
								Konsulta settings are configured.
							</p>
						</div>
					)}
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setGenerateTarget(null)}
							disabled={generateLoading}
						>
							Cancel
						</Button>
						<Button
							onClick={() => void handleGenerateCaseTransNumbers()}
							disabled={generateLoading}
						>
							{generateLoading ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Generating…
								</>
							) : (
								"Generate"
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}

function AtcVerificationPanel({ clinicUid }: { clinicUid: string }) {
	const [pin, setPin] = useState("");
	const [atc, setAtc] = useState("");
	const [validityDate, setValidityDate] = useState("");
	const [isVerifying, startVerificationTransition] = useTransition();
	const [verificationStatus, setVerificationStatus] = useState<
		"VALID" | "INVALID" | null
	>(null);
	const [verificationMessage, setVerificationMessage] = useState<string | null>(
		null,
	);

	const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!pin.trim() || !atc.trim() || !validityDate) {
			toast.error("PIN, ATC, and validity date are required.");
			return;
		}
		startVerificationTransition(async () => {
			const res = await verifyKonsultaAtcByPinAction({
				clinicUid,
				pin: pin.trim(),
				atc: atc.trim(),
				effectivityDate: validityDate,
			});
			if (res.status && res.data) {
				setVerificationStatus(
					res.data.validationStatus === "VALID" ? "VALID" : "INVALID",
				);
				const resultText =
					typeof res.data.validationResult.result === "string"
						? res.data.validationResult.result
						: JSON.stringify(res.data.validationResult);
				setVerificationMessage(resultText);
				if (res.data.validationStatus === "VALID")
					toast.success("ATC is valid.");
				else toast.warning("ATC is invalid.");
			} else {
				setVerificationStatus(null);
				setVerificationMessage(null);
				toast.error(res.message ?? "ATC verification failed.");
			}
		});
	};

	return (
		<Card className="border-primary/20 shadow-sm backdrop-blur-sm bg-background/95">
			<CardHeader>
				<CardTitle className="text-xl flex items-center gap-2">
					<ShieldCheck className="h-5 w-5 text-primary" />
					ATC Verification
				</CardTitle>
				<CardDescription>
					Verify ATC using Konsulta Kit 1.1 SOAP method{" "}
					<code>isATCValid(pPIN, pATC, pEffectivityDate)</code>.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<form
					onSubmit={handleSubmit}
					className="flex flex-col md:flex-row items-end gap-4 max-w-4xl"
				>
					<div className="flex flex-col md:flex-row items-end gap-4 w-full flex-1">
						<div className="space-y-1.5 flex-1 w-full">
							<Label htmlFor="atc-pin" className="text-muted-foreground font-medium">Patient PIN</Label>
							<Input
								id="atc-pin"
								value={pin}
								onChange={(event) => setPin(event.target.value)}
								placeholder="Enter patient PIN"
								className="w-full shadow-sm"
							/>
						</div>
						<div className="space-y-1.5 flex-1 w-full">
							<Label htmlFor="atc-code" className="text-muted-foreground font-medium">ATC</Label>
							<Input
								id="atc-code"
								value={atc}
								onChange={(event) => setAtc(event.target.value.toUpperCase())}
								placeholder="Enter ATC code"
								className="w-full shadow-sm"
							/>
						</div>
						<div className="space-y-1.5 flex-1 w-full">
							<Label htmlFor="atc-validity" className="text-muted-foreground font-medium">Validity Date</Label>
							<Input
								id="atc-validity"
								type="date"
								value={validityDate}
								onChange={(event) => setValidityDate(event.target.value)}
								className="w-full shadow-sm"
							/>
						</div>
					</div>
					<Button
						type="submit"
						className="w-full md:w-auto min-w-[140px] shadow-sm"
						disabled={isVerifying}
					>
						{isVerifying ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Verifying...
							</>
						) : (
							"Verify"
						)}
					</Button>
				</form>
				{verificationStatus ? (
					<div className="mx-auto mt-4 w-full max-w-2xl rounded-md border p-3 text-sm">
						<div className="flex items-center gap-2">
							<span className="font-medium">Result:</span>
							<Badge
								variant={
									verificationStatus === "VALID" ? "default" : "destructive"
								}
							>
								{verificationStatus}
							</Badge>
						</div>
						{verificationMessage ? (
							<p className="mt-2 text-xs text-muted-foreground break-words">
								SOAP response: {verificationMessage}
							</p>
						) : null}
					</div>
				) : null}
			</CardContent>
		</Card>
	);
}

function KonsultaValidationPanel({ clinicUid }: { clinicUid: string }) {
	const [memberType, setMemberType] = useState<"MM" | "DD">("MM");
	const [memberPin, setMemberPin] = useState("");
	const [dependentPin, setDependentPin] = useState("");
	const [isVerifying, startVerificationTransition] = useTransition();
	const [registrationStatus, setRegistrationStatus] = useState<
		"REGISTERED" | "NOT_REGISTERED" | null
	>(null);
	const [registrationMessage, setRegistrationMessage] = useState<string | null>(
		null,
	);

	const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!memberPin.trim()) {
			toast.error("Member PIN is required.");
			return;
		}
		if (memberType === "DD" && !dependentPin.trim()) {
			toast.error("Dependent PIN is required for dependent type.");
			return;
		}
		startVerificationTransition(async () => {
			const res = await verifyKonsultaMemberDependentRegistrationAction({
				clinicUid,
				memberType,
				memberPin: memberPin.trim(),
				dependentPin: memberType === "DD" ? dependentPin.trim() : null,
			});

			if (res.status && res.data) {
				setRegistrationStatus(
					res.data.registrationStatus === "REGISTERED"
						? "REGISTERED"
						: "NOT_REGISTERED",
				);
				const resultText =
					typeof res.data.registrationResult.result === "string"
						? res.data.registrationResult.result
						: JSON.stringify(res.data.registrationResult);
				setRegistrationMessage(resultText);
				if (res.data.registrationStatus === "REGISTERED")
					toast.success("PIN is registered to this Konsulta provider.");
				else toast.warning("PIN is not registered to this Konsulta provider.");
			} else {
				setRegistrationStatus(null);
				setRegistrationMessage(null);
				toast.error(
					res.message ?? "Konsulta registration verification failed.",
				);
			}
		});
	};

	return (
		<Card className="border-primary/20 shadow-sm backdrop-blur-sm bg-background/95">
			<CardHeader>
				<CardTitle className="text-xl flex items-center gap-2">
					<ShieldCheck className="h-5 w-5 text-primary" />
					PhilHealth Yakap Registration Validation
				</CardTitle>
				<CardDescription>
					Verify registration using PhilHealth Yakap Kit 1.1 SOAP method{" "}
					<code>isMemberDependentRegistered(pPin, pType)</code>.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<form
					onSubmit={handleSubmit}
					className="flex flex-col md:flex-row items-end gap-4 max-w-4xl"
				>
					<div className="flex flex-col md:flex-row items-end gap-4 w-full flex-1">
						<div className="space-y-1.5 flex-1 w-full">
							<Label htmlFor="konsulta-member-type" className="text-muted-foreground font-medium">Member Type</Label>
							<Select
								value={memberType}
								onValueChange={(value: "MM" | "DD") => setMemberType(value)}
							>
								<SelectTrigger id="konsulta-member-type" className="w-full shadow-sm">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="MM">Principal Member</SelectItem>
									<SelectItem value="DD">Dependent</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-1.5 flex-1 w-full">
							<Label htmlFor="konsulta-member-pin" className="text-muted-foreground font-medium">Member PIN</Label>
							<Input
								id="konsulta-member-pin"
								value={memberPin}
								onChange={(event) => setMemberPin(event.target.value)}
								placeholder="Enter member PIN"
								className="w-full shadow-sm"
							/>
						</div>
						{memberType === "DD" && (
							<div className="space-y-1.5 flex-1 w-full">
								<Label htmlFor="konsulta-dependent-pin" className="text-muted-foreground font-medium">Dependent PIN</Label>
								<Input
									id="konsulta-dependent-pin"
									value={dependentPin}
									onChange={(event) => setDependentPin(event.target.value)}
									placeholder="Enter dependent PIN"
									className="w-full shadow-sm"
								/>
							</div>
						)}
					</div>
					<Button
						type="submit"
						className="w-full md:w-auto min-w-[140px] shadow-sm"
						disabled={isVerifying}
					>
						{isVerifying ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Verifying...
							</>
						) : (
							"Verify"
						)}
					</Button>
				</form>
				{registrationStatus ? (
					<div className="mx-auto mt-4 w-full max-w-2xl rounded-md border p-3 text-sm">
						<div className="flex items-center gap-2">
							<span className="font-medium">Result:</span>
							<Badge
								variant={
									registrationStatus === "REGISTERED"
										? "default"
										: "destructive"
								}
							>
								{registrationStatus}
							</Badge>
						</div>
						{registrationMessage ? (
							<p className="mt-2 text-xs text-muted-foreground break-words">
								SOAP response: {registrationMessage}
							</p>
						) : null}
					</div>
				) : null}
			</CardContent>
		</Card>
	);
}

type XmlImportTrancheType = "FIRST_TRANCHE" | "SECOND_TRANCHE";

type ParsedSurgicalHist = { desc: string; date: string };

/** All data that can be reverse-mapped from a PCB PROFILE block. */
type ParsedProfileData = {
	// PROFILE element attributes
	profDate: string;
	patientAge: string;
	atc: string;
	isWalkedIn: string;
	// PEPERT — vitals + physical measurements
	systolic: string;
	diastolic: string;
	hr: string;
	rr: string;
	temp: string;
	height: string;
	weight: string;
	bmi: string;
	zScore: string;
	leftVision: string;
	rightVision: string;
	// Pediatric measurements
	length: string;
	headCirc: string;
	skinfoldThickness: string;
	waist: string;
	hip: string;
	limbs: string;
	midUpperArmCirc: string;
	// BLOODTYPE
	bloodType: string;
	// SOCHIST — social history
	isSmoker: string;
	noCigpk: string;
	isAdrinker: string;
	noBottles: string;
	illDrugUser: string;
	isSexuallyActive: string;
	// MENSHIST
	menarchePeriod: string;
	lastMensPeriod: string;
	periodDuration: string;
	mensInterval: string;
	padsPerDay: string;
	onsetSexIc: string;
	birthCtrlMethod: string;
	isMenopause: string;
	menopauseAge: string;
	mensIsApplicable: string;
	// PREGHIST
	pregCnt: string;
	deliveryCnt: string;
	deliveryTyp: string;
	fullTermCnt: string;
	prematureCnt: string;
	abortionCnt: string;
	livChildrenCnt: string;
	wPregIndhyp: string;
	wFamPlan: string;
	pregIsApplicable: string;
	// PESPECIFIC — physical exam findings
	skinRem: string;
	heentRem: string;
	chestRem: string;
	heartRem: string;
	abdomenRem: string;
	neuroRem: string;
	rectalRem: string;
	guRem: string;
	// Arrayed histories
	medHistCodes: string[];
	famHistCodes: string[];
	surgHists: ParsedSurgicalHist[];
};

type ParsedXmlRow = {
	key: string;
	// Patient info
	pin: string;
	firstName: string;
	middleName: string;
	lastName: string;
	suffix: string;
	dob: string;
	sex: string;
	mobile: string;
	landline: string;
	patientType: "MM" | "DD";
	// Member info (for DD, member is the primary; for MM member == patient)
	memberPin: string;
	memberFirstName: string;
	memberMiddleName: string;
	memberLastName: string;
	memberSuffix: string;
	memberDob: string;
	// Enlistment info
	hciCaseNo: string;
	hciTransNo: string;
	effYear: string;
	enlistStat: string;
	enlistDate: string;
	packageType: string;
	withConsent: string;
	transDate: string;
	createdBy: string;
	reportStatus: string;
	selected: boolean;
	// Profile data (optional — only present if PROFILING section exists in XML)
	profile?: ParsedProfileData;
};

type ImportResult = {
	pin: string;
	status: "IMPORTED" | "REJECTED";
	reason: string;
};

/** Extract the value of a named XML attribute from a string of attribute text. */
function getXmlAttr(name: string, attrs: string): string {
	return new RegExp(`${name}="([^"]*)"`, "i").exec(attrs)?.[1]?.trim() ?? "";
}

/**
 * Parse all PROFILE blocks from the PCB XML and return a map keyed by
 * pHciCaseNo (primary) and pPatientPin (fallback) so ENLISTMENTs can look
 * up their corresponding profile.
 */
function parseProfilesFromXml(xml: string): Map<string, ParsedProfileData> {
	const profileMap = new Map<string, ParsedProfileData>();
	const blocks = [...xml.matchAll(/<PROFILE\s([\s\S]*?)>([\s\S]*?)<\/PROFILE>/gi)];

	for (const block of blocks) {
		const tagAttrs = block[1];
		const innerXml = block[2];

		const pepertAttrs = /<PEPERT\s([\s\S]*?)\/>/i.exec(innerXml)?.[1] ?? "";
		const bloodAttrs = /<BLOODTYPE\s([\s\S]*?)\/>/i.exec(innerXml)?.[1] ?? "";
		const socAttrs = /<SOCHIST\s([\s\S]*?)\/>/i.exec(innerXml)?.[1] ?? "";
		const mensAttrs = /<MENSHIST\s([\s\S]*?)\/>/i.exec(innerXml)?.[1] ?? "";
		const pregAttrs = /<PREGHIST\s([\s\S]*?)\/>/i.exec(innerXml)?.[1] ?? "";
		const pespecAttrs = /<PESPECIFIC\s([\s\S]*?)\/>/i.exec(innerXml)?.[1] ?? "";

		const medHistCodes: string[] = [];
		for (const m of innerXml.matchAll(/<MEDHIST\s([\s\S]*?)\/>/gi)) {
			const code = getXmlAttr("pMdiseaseCode", m[1]);
			if (code) medHistCodes.push(code);
		}
		const famHistCodes: string[] = [];
		for (const m of innerXml.matchAll(/<FAMHIST\s([\s\S]*?)\/>/gi)) {
			const code = getXmlAttr("pMdiseaseCode", m[1]);
			if (code) famHistCodes.push(code);
		}
		const surgHists: ParsedSurgicalHist[] = [];
		for (const m of innerXml.matchAll(/<SURGHIST\s([\s\S]*?)\/>/gi)) {
			surgHists.push({
				desc: getXmlAttr("pSurgDesc", m[1]),
				date: getXmlAttr("pSurgDate", m[1]),
			});
		}

		const profile: ParsedProfileData = {
			profDate: getXmlAttr("pProfDate", tagAttrs),
			patientAge: getXmlAttr("pPatientAge", tagAttrs),
			atc: getXmlAttr("pATC", tagAttrs),
			isWalkedIn: getXmlAttr("pIsWalkedIn", tagAttrs),
			systolic: getXmlAttr("pSystolic", pepertAttrs),
			diastolic: getXmlAttr("pDiastolic", pepertAttrs),
			hr: getXmlAttr("pHr", pepertAttrs),
			rr: getXmlAttr("pRr", pepertAttrs),
			temp: getXmlAttr("pTemp", pepertAttrs),
			height: getXmlAttr("pHeight", pepertAttrs),
			weight: getXmlAttr("pWeight", pepertAttrs),
			bmi: getXmlAttr("pBMI", pepertAttrs),
			zScore: getXmlAttr("pZScore", pepertAttrs),
			leftVision: getXmlAttr("pLeftVision", pepertAttrs),
			rightVision: getXmlAttr("pRightVision", pepertAttrs),
			length: getXmlAttr("pLength", pepertAttrs),
			headCirc: getXmlAttr("pHeadCirc", pepertAttrs),
			skinfoldThickness: getXmlAttr("pSkinfoldThickness", pepertAttrs),
			waist: getXmlAttr("pWaist", pepertAttrs),
			hip: getXmlAttr("pHip", pepertAttrs),
			limbs: getXmlAttr("pLimbs", pepertAttrs),
			midUpperArmCirc: getXmlAttr("pMidUpperArmCirc", pepertAttrs),
			bloodType: getXmlAttr("pBloodType", bloodAttrs),
			isSmoker: getXmlAttr("pIsSmoker", socAttrs),
			noCigpk: getXmlAttr("pNoCigpk", socAttrs),
			isAdrinker: getXmlAttr("pIsAdrinker", socAttrs),
			noBottles: getXmlAttr("pNoBottles", socAttrs),
			illDrugUser: getXmlAttr("pIllDrugUser", socAttrs),
			isSexuallyActive: getXmlAttr("pIsSexuallyActive", socAttrs),
			menarchePeriod: getXmlAttr("pMenarchePeriod", mensAttrs),
			lastMensPeriod: getXmlAttr("pLastMensPeriod", mensAttrs),
			periodDuration: getXmlAttr("pPeriodDuration", mensAttrs),
			mensInterval: getXmlAttr("pMensInterval", mensAttrs),
			padsPerDay: getXmlAttr("pPadsPerDay", mensAttrs),
			onsetSexIc: getXmlAttr("pOnsetSexIc", mensAttrs),
			birthCtrlMethod: getXmlAttr("pBirthCtrlMethod", mensAttrs),
			isMenopause: getXmlAttr("pIsMenopause", mensAttrs),
			menopauseAge: getXmlAttr("pMenopauseAge", mensAttrs),
			mensIsApplicable: getXmlAttr("pIsApplicable", mensAttrs),
			pregCnt: getXmlAttr("pPregCnt", pregAttrs),
			deliveryCnt: getXmlAttr("pDeliveryCnt", pregAttrs),
			deliveryTyp: getXmlAttr("pDeliveryTyp", pregAttrs),
			fullTermCnt: getXmlAttr("pFullTermCnt", pregAttrs),
			prematureCnt: getXmlAttr("pPrematureCnt", pregAttrs),
			abortionCnt: getXmlAttr("pAbortionCnt", pregAttrs),
			livChildrenCnt: getXmlAttr("pLivChildrenCnt", pregAttrs),
			wPregIndhyp: getXmlAttr("pWPregIndhyp", pregAttrs),
			wFamPlan: getXmlAttr("pWFamPlan", pregAttrs),
			pregIsApplicable: getXmlAttr("pIsApplicable", pregAttrs),
			skinRem: getXmlAttr("pSkinRem", pespecAttrs),
			heentRem: getXmlAttr("pHeentRem", pespecAttrs),
			chestRem: getXmlAttr("pChestRem", pespecAttrs),
			heartRem: getXmlAttr("pHeartRem", pespecAttrs),
			abdomenRem: getXmlAttr("pAbdomenRem", pespecAttrs),
			neuroRem: getXmlAttr("pNeuroRem", pespecAttrs),
			rectalRem: getXmlAttr("pRectalRem", pespecAttrs),
			guRem: getXmlAttr("pGuRem", pespecAttrs),
			medHistCodes,
			famHistCodes,
			surgHists,
		};

		const caseNo = getXmlAttr("pHciCaseNo", tagAttrs);
		const pin = getXmlAttr("pPatientPin", tagAttrs);
		if (caseNo) profileMap.set(caseNo, profile);
		if (pin && !profileMap.has(pin)) profileMap.set(pin, profile);
	}

	return profileMap;
}

function parseEnlistmentRowsFromXml(xml: string): ParsedXmlRow[] {
	const profileMap = parseProfilesFromXml(xml);
	const matches = [...xml.matchAll(/<ENLISTMENT\s([\s\S]*?)(?:\/>|>)/gi)];

	return matches.map((match, index) => {
		const attributes = match[1];

		const pin = getXmlAttr("pPatientPin", attributes);
		const memberPin = getXmlAttr("pMemPin", attributes);
		const patientType: "MM" | "DD" =
			getXmlAttr("pPatientType", attributes) === "DD" ? "DD" : "MM";
		const hciCaseNo = getXmlAttr("pHciCaseNo", attributes);
		const rowKey = `${pin || "unknown"}-${index}`;

		// Match to profile: prefer by HCI case number, fall back to PIN
		const profile = profileMap.get(hciCaseNo) ?? profileMap.get(pin);

		return {
			key: rowKey,
			pin,
			firstName: getXmlAttr("pPatientFname", attributes),
			middleName: getXmlAttr("pPatientMname", attributes),
			lastName: getXmlAttr("pPatientLname", attributes),
			suffix: getXmlAttr("pPatientExtname", attributes),
			dob: getXmlAttr("pPatientDob", attributes),
			sex: getXmlAttr("pPatientSex", attributes),
			mobile: getXmlAttr("pPatientMobileNo", attributes),
			landline: getXmlAttr("pPatientLandlineNo", attributes),
			patientType,
			memberPin: memberPin || pin,
			memberFirstName: getXmlAttr("pMemFname", attributes),
			memberMiddleName: getXmlAttr("pMemMname", attributes),
			memberLastName: getXmlAttr("pMemLname", attributes),
			memberSuffix: getXmlAttr("pMemExtname", attributes),
			memberDob: getXmlAttr("pMemDob", attributes),
			hciCaseNo,
			hciTransNo: getXmlAttr("pHciTransNo", attributes),
			effYear: getXmlAttr("pEffYear", attributes),
			enlistStat: getXmlAttr("pEnlistStat", attributes),
			enlistDate: getXmlAttr("pEnlistDate", attributes),
			packageType: getXmlAttr("pPackageType", attributes),
			withConsent: getXmlAttr("pWithConsent", attributes),
			transDate: getXmlAttr("pTransDate", attributes),
			createdBy: getXmlAttr("pCreatedBy", attributes),
			reportStatus: getXmlAttr("pReportStatus", attributes),
			selected: true,
			profile,
		};
	});
}

/** Renders a labelled value; shows "—" when the value is empty or "0". */
function InfoField({
	label,
	value,
	mono = false,
}: {
	label: string;
	value: string;
	mono?: boolean;
}) {
	const display =
		!value || value === "0" ? (
			<span className="text-muted-foreground">—</span>
		) : (
			<span className={mono ? "font-mono" : undefined}>{value}</span>
		);
	return (
		<div className="flex flex-col gap-0.5">
			<span className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</span>
			<span className="text-xs">{display}</span>
		</div>
	);
}

/** Expandable detail panel showing all parsed PROFILE data for one row. */
function ProfileDetailPanel({ profile }: { profile: ParsedProfileData }) {
	const yn = (v: string) =>
		v.toUpperCase() === "Y" ? "Yes" : v.toUpperCase() === "N" ? "No" : v || "—";

	const hasVitals = [
		profile.systolic, profile.diastolic, profile.hr, profile.rr,
		profile.temp, profile.height, profile.weight,
	].some((v) => v && v !== "0");

	const hasPediatric = [
		profile.length, profile.headCirc, profile.skinfoldThickness,
		profile.waist, profile.hip, profile.limbs, profile.midUpperArmCirc,
	].some((v) => v && v !== "0");

	const hasSocial = [
		profile.isSmoker, profile.isAdrinker, profile.illDrugUser, profile.isSexuallyActive,
	].some((v) => v);

	const hasMens = profile.mensIsApplicable?.toUpperCase() === "Y";
	const hasPreg = profile.pregIsApplicable?.toUpperCase() === "Y";

	const hasPhysExam = [
		profile.skinRem, profile.heentRem, profile.chestRem, profile.heartRem,
		profile.abdomenRem, profile.neuroRem, profile.rectalRem, profile.guRem,
	].some((v) => v && v !== "0");

	return (
		<div className="p-4 bg-muted/30 space-y-4 text-sm">
			{/* ── Profile header ── */}
			<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
				<InfoField label="Profile Date" value={profile.profDate} />
				<InfoField label="Patient Age" value={profile.patientAge} />
				<InfoField label="ATC" value={profile.atc} mono />
				<InfoField label="Walk-in" value={yn(profile.isWalkedIn)} />
			</div>

			{/* ── Vitals ── */}
			{hasVitals && (
				<div className="space-y-1.5">
					<p className="text-xs font-semibold text-primary">Vitals (PEPERT)</p>
					<div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
						<InfoField label="BP Systolic" value={profile.systolic} />
						<InfoField label="BP Diastolic" value={profile.diastolic} />
						<InfoField label="Heart Rate" value={profile.hr} />
						<InfoField label="Resp Rate" value={profile.rr} />
						<InfoField label="Temp (°C)" value={profile.temp} />
						<InfoField label="BMI" value={profile.bmi} />
					</div>
					<div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
						<InfoField label="Height (cm)" value={profile.height} />
						<InfoField label="Weight (kg)" value={profile.weight} />
						<InfoField label="Z-Score" value={profile.zScore} />
						<InfoField label="Vision L" value={profile.leftVision} />
						<InfoField label="Vision R" value={profile.rightVision} />
						<InfoField label="Blood Type" value={profile.bloodType} />
					</div>
				</div>
			)}

			{/* ── Pediatric measurements ── */}
			{hasPediatric && (
				<div className="space-y-1.5">
					<p className="text-xs font-semibold text-primary">Pediatric Measurements</p>
					<div className="grid grid-cols-3 gap-3 sm:grid-cols-7">
						<InfoField label="Length (cm)" value={profile.length} />
						<InfoField label="Head Circ." value={profile.headCirc} />
						<InfoField label="Skinfold" value={profile.skinfoldThickness} />
						<InfoField label="Waist" value={profile.waist} />
						<InfoField label="Hip" value={profile.hip} />
						<InfoField label="Limbs" value={profile.limbs} />
						<InfoField label="Mid-Upper Arm" value={profile.midUpperArmCirc} />
					</div>
				</div>
			)}

			{/* ── Social history ── */}
			{hasSocial && (
				<div className="space-y-1.5">
					<p className="text-xs font-semibold text-primary">Social History</p>
					<div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
						<InfoField label="Smoker" value={yn(profile.isSmoker)} />
						<InfoField label="Packs/year" value={profile.noCigpk} />
						<InfoField label="Drinker" value={yn(profile.isAdrinker)} />
						<InfoField label="Bottles/day" value={profile.noBottles} />
						<InfoField label="Illicit Drugs" value={yn(profile.illDrugUser)} />
						<InfoField label="Sexually Active" value={yn(profile.isSexuallyActive)} />
					</div>
				</div>
			)}

			{/* ── Menstrual & OB-Gyne history ── */}
			{(hasMens || hasPreg) && (
				<div className="space-y-2">
					{hasMens && (
						<div className="space-y-1.5">
							<p className="text-xs font-semibold text-primary">Menstrual History</p>
							<div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
								<InfoField label="Menarche" value={profile.menarchePeriod} />
								<InfoField label="Last Mens Period" value={profile.lastMensPeriod} />
								<InfoField label="Duration (days)" value={profile.periodDuration} />
								<InfoField label="Interval (days)" value={profile.mensInterval} />
								<InfoField label="Pads/day" value={profile.padsPerDay} />
							</div>
							<div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
								<InfoField label="Onset Sex. Activity" value={profile.onsetSexIc} />
								<InfoField label="Birth Control" value={profile.birthCtrlMethod} />
								<InfoField label="Menopause" value={yn(profile.isMenopause)} />
								<InfoField label="Menopause Age" value={profile.menopauseAge} />
							</div>
						</div>
					)}
					{hasPreg && (
						<div className="space-y-1.5">
							<p className="text-xs font-semibold text-primary">Pregnancy History</p>
							<div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
								<InfoField label="Gravidity" value={profile.pregCnt} />
								<InfoField label="Parity" value={profile.deliveryCnt} />
								<InfoField label="Delivery Type" value={profile.deliveryTyp} />
								<InfoField label="Full Term" value={profile.fullTermCnt} />
								<InfoField label="Premature" value={profile.prematureCnt} />
							</div>
							<div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
								<InfoField label="Abortion" value={profile.abortionCnt} />
								<InfoField label="Living Children" value={profile.livChildrenCnt} />
								<InfoField label="Pre-eclampsia Hx" value={yn(profile.wPregIndhyp)} />
								<InfoField label="Family Planning" value={yn(profile.wFamPlan)} />
							</div>
						</div>
					)}
				</div>
			)}

			{/* ── Medical / Family / Surgical histories ── */}
			{(profile.medHistCodes.length > 0 || profile.famHistCodes.length > 0 || profile.surgHists.length > 0) && (
				<div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
					{profile.medHistCodes.length > 0 && (
						<div className="space-y-1">
							<p className="text-xs font-semibold text-primary">Medical History Codes</p>
							<div className="flex flex-wrap gap-1">
								{profile.medHistCodes.map((code) => (
									<Badge key={code} variant="outline" className="text-xs font-mono">{code}</Badge>
								))}
							</div>
						</div>
					)}
					{profile.famHistCodes.length > 0 && (
						<div className="space-y-1">
							<p className="text-xs font-semibold text-primary">Family History Codes</p>
							<div className="flex flex-wrap gap-1">
								{profile.famHistCodes.map((code) => (
									<Badge key={code} variant="outline" className="text-xs font-mono">{code}</Badge>
								))}
							</div>
						</div>
					)}
					{profile.surgHists.length > 0 && (
						<div className="space-y-1">
							<p className="text-xs font-semibold text-primary">Surgical Histories</p>
							<ul className="space-y-0.5 text-xs">
								{profile.surgHists.map((sh) => (
									<li key={`${sh.date}-${sh.desc}`} className="flex gap-2">
										<span className="font-mono text-muted-foreground">{sh.date || "—"}</span>
										<span>{sh.desc || "—"}</span>
									</li>
								))}
							</ul>
						</div>
					)}
				</div>
			)}

			{/* ── Physical Exam findings ── */}
			{hasPhysExam && (
				<div className="space-y-1.5">
					<p className="text-xs font-semibold text-primary">Physical Examination Findings</p>
					<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
						<InfoField label="Skin" value={profile.skinRem} />
						<InfoField label="HEENT" value={profile.heentRem} />
						<InfoField label="Chest / Lungs" value={profile.chestRem} />
						<InfoField label="Heart" value={profile.heartRem} />
						<InfoField label="Abdomen" value={profile.abdomenRem} />
						<InfoField label="Neuro" value={profile.neuroRem} />
						<InfoField label="GU" value={profile.guRem} />
						<InfoField label="Rectal" value={profile.rectalRem} />
					</div>
				</div>
			)}
		</div>
	);
}

function KonsultaXmlImportPanel({ clinicUid }: { clinicUid: string }) {
	const [trancheType, setTrancheType] =
		useState<XmlImportTrancheType>("FIRST_TRANCHE");
	const [xmlInput, setXmlInput] = useState("");
	const [rows, setRows] = useState<ParsedXmlRow[]>([]);
	const [warnings, setWarnings] = useState<string[]>([]);
	const [isImporting, startImportTransition] = useTransition();
	const [importResults, setImportResults] = useState<ImportResult[] | null>(null);
	const [expandedKey, setExpandedKey] = useState<string | null>(null);

	const onFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const selectedFile = event.target.files?.[0];
		if (!selectedFile) return;
		const text = await selectedFile.text();
		setXmlInput(text);
	};

	const handleParse = () => {
		if (!xmlInput.trim()) {
			toast.error("Upload or paste XML before parsing.");
			return;
		}

		const parsedRows = parseEnlistmentRowsFromXml(xmlInput);
		const nextWarnings: string[] = [];

		if (parsedRows.length === 0) {
			nextWarnings.push("No ENLISTMENT records found in the XML.");
		}

		const missingPinCount = parsedRows.filter((row) => !row.pin).length;
		if (missingPinCount > 0) {
			nextWarnings.push(`${missingPinCount} record(s) have missing patient PIN.`);
		}

		const withProfile = parsedRows.filter((r) => r.profile).length;
		if (parsedRows.length > 0 && withProfile === 0) {
			nextWarnings.push("No PROFILE data found — only enlistment info is available.");
		}

		if (
			trancheType === "FIRST_TRANCHE" &&
			(/second tranche/i.test(xmlInput) || /2nd tranche/i.test(xmlInput))
		) {
			nextWarnings.push(
				"Selected First Tranche, but XML content appears to contain Second Tranche marker text.",
			);
		}
		if (
			trancheType === "SECOND_TRANCHE" &&
			(/first tranche/i.test(xmlInput) || /1st tranche/i.test(xmlInput))
		) {
			nextWarnings.push(
				"Selected Second Tranche, but XML content appears to contain First Tranche marker text.",
			);
		}

		setRows(parsedRows);
		setWarnings(nextWarnings);
		setImportResults(null);
		setExpandedKey(null);
		toast.success(
			`Parsed ${parsedRows.length} ENLISTMENT record(s)${withProfile > 0 ? ` with ${withProfile} PROFILE(s)` : ""}.`,
		);
	};

	const allSelected = rows.length > 0 && rows.every((r) => r.selected);
	const someSelected = rows.some((r) => r.selected) && !allSelected;

	const toggleAll = (checked: boolean) => {
		setRows((prev) => prev.map((row) => ({ ...row, selected: checked })));
	};

	const toggleRow = (key: string, checked: boolean) => {
		setRows((prev) =>
			prev.map((row) => (row.key === key ? { ...row, selected: checked } : row)),
		);
	};

	const toggleExpand = (key: string) => {
		setExpandedKey((prev) => (prev === key ? null : key));
	};

	const selectedRows = rows.filter((r) => r.selected);

	const handleImport = () => {
		if (selectedRows.length === 0) {
			toast.error("Select at least one record to import.");
			return;
		}
		startImportTransition(async () => {
			const res = await importKonsultaAssignmentsAction({
				clinicUid,
				assignments: selectedRows.map((r) => ({
					pin: r.pin,
					patientType: r.patientType,
					memberPin: r.patientType === "DD" ? r.memberPin : undefined,
					firstName: r.firstName,
					lastName: r.lastName,
					middleName: r.middleName || undefined,
					effYear: r.effYear || undefined,
					profileData: r.profile
						? {
								profDate: r.profile.profDate || undefined,
								systolic: r.profile.systolic || undefined,
								diastolic: r.profile.diastolic || undefined,
								hr: r.profile.hr || undefined,
								rr: r.profile.rr || undefined,
								temp: r.profile.temp || undefined,
								height: r.profile.height || undefined,
								weight: r.profile.weight || undefined,
								bmi: r.profile.bmi || undefined,
								zScore: r.profile.zScore || undefined,
								leftVision: r.profile.leftVision || undefined,
								rightVision: r.profile.rightVision || undefined,
								length: r.profile.length || undefined,
								headCirc: r.profile.headCirc || undefined,
								skinfoldThickness: r.profile.skinfoldThickness || undefined,
								waist: r.profile.waist || undefined,
								hip: r.profile.hip || undefined,
								limbs: r.profile.limbs || undefined,
								midUpperArmCirc: r.profile.midUpperArmCirc || undefined,
								isSmoker: r.profile.isSmoker || undefined,
								noCigpk: r.profile.noCigpk || undefined,
								isAdrinker: r.profile.isAdrinker || undefined,
								noBottles: r.profile.noBottles || undefined,
								illDrugUser: r.profile.illDrugUser || undefined,
								isSexuallyActive: r.profile.isSexuallyActive || undefined,
								mensIsApplicable: r.profile.mensIsApplicable || undefined,
								menarchePeriod: r.profile.menarchePeriod || undefined,
								lastMensPeriod: r.profile.lastMensPeriod || undefined,
								periodDuration: r.profile.periodDuration || undefined,
								mensInterval: r.profile.mensInterval || undefined,
								padsPerDay: r.profile.padsPerDay || undefined,
								onsetSexIc: r.profile.onsetSexIc || undefined,
								birthCtrlMethod: r.profile.birthCtrlMethod || undefined,
								isMenopause: r.profile.isMenopause || undefined,
								menopauseAge: r.profile.menopauseAge || undefined,
								pregIsApplicable: r.profile.pregIsApplicable || undefined,
								pregCnt: r.profile.pregCnt || undefined,
								deliveryCnt: r.profile.deliveryCnt || undefined,
								deliveryTyp: r.profile.deliveryTyp || undefined,
								fullTermCnt: r.profile.fullTermCnt || undefined,
								prematureCnt: r.profile.prematureCnt || undefined,
								abortionCnt: r.profile.abortionCnt || undefined,
								livChildrenCnt: r.profile.livChildrenCnt || undefined,
								wPregIndhyp: r.profile.wPregIndhyp || undefined,
								surgHists: r.profile.surgHists,
							}
						: undefined,
				})),
			});
			if (res.status && res.data) {
				setImportResults(res.data.results);
				toast.success(
					`Import complete — ${res.data.imported} imported, ${res.data.rejected} rejected.`,
				);
			} else {
				toast.error(res.message ?? "Import failed.");
			}
		});
	};

	// Column count = expand + select + 16 data cols = 18
	const COL_SPAN = 18;

	return (
		<Card>
			<CardHeader className="pb-3">
				<CardTitle className="text-sm flex items-center gap-2">
					<FileCode2 className="h-4 w-4 text-primary" />
					Konsulta XML Import
				</CardTitle>
				<CardDescription className="mt-1">
					Upload or paste a PCB XML file. Both ENLISTMENT and PROFILE data will
					be parsed and reverse-mapped to the database on import.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				{/* ── Tranche type ── */}
				<div className="space-y-2">
					<Label>XML Tranche Type</Label>
					<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
						<label className="flex items-center gap-2 text-sm">
							<input
								type="radio"
								name="xml-tranche"
								checked={trancheType === "FIRST_TRANCHE"}
								onChange={() => setTrancheType("FIRST_TRANCHE")}
							/>
							First Tranche (Enlistment + Profile)
						</label>
						<label className="flex items-center gap-2 text-sm">
							<input
								type="radio"
								name="xml-tranche"
								checked={trancheType === "SECOND_TRANCHE"}
								onChange={() => setTrancheType("SECOND_TRANCHE")}
							/>
							Second Tranche (SOAP / Consultation)
						</label>
					</div>
				</div>

				{/* ── File upload + parse ── */}
				<div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
					<Input
						type="file"
						accept=".xml,text/xml"
						onChange={(event) => void onFileUpload(event)}
					/>
					<Button type="button" onClick={handleParse} className="w-full sm:w-auto">
						Parse XML
					</Button>
				</div>

				{/* ── Paste area ── */}
				<div className="space-y-2">
					<Label htmlFor="konsulta-xml-input">Paste XML</Label>
					<Textarea
						id="konsulta-xml-input"
						value={xmlInput}
						onChange={(event) => setXmlInput(event.target.value)}
						className="min-h-36 font-mono text-xs"
						placeholder="Paste PCB XML payload here..."
					/>
				</div>

				{/* ── Parse warnings ── */}
				{warnings.length > 0 && (
					<Alert variant="destructive">
						<AlertCircle className="h-4 w-4" />
						<AlertTitle>XML Parsing Warning</AlertTitle>
						<AlertDescription>
							<ul className="list-disc pl-4 space-y-1 text-xs">
								{warnings.map((warning) => (
									<li key={warning}>{warning}</li>
								))}
							</ul>
						</AlertDescription>
					</Alert>
				)}

				{/* ── Parsed records table ── */}
				{rows.length > 0 && (
					<div className="space-y-3">
						{/* Toolbar */}
						<div className="flex flex-wrap items-center justify-between gap-3">
							<p className="text-sm text-muted-foreground">
								<span className="font-medium text-foreground">{rows.length}</span> record(s) parsed
								{" · "}
								<span className="font-medium text-foreground">
									{rows.filter((r) => r.profile).length}
								</span> with profile
								{" · "}
								<span className="font-medium text-foreground">{selectedRows.length}</span> selected
							</p>
							<div className="flex gap-2">
								<Button type="button" size="sm" variant="outline" onClick={() => toggleAll(true)}>
									<CheckSquare className="h-3.5 w-3.5 mr-1" />Select all
								</Button>
								<Button type="button" size="sm" variant="outline" onClick={() => toggleAll(false)}>
									<Square className="h-3.5 w-3.5 mr-1" />Clear all
								</Button>
								<Button
									type="button"
									size="sm"
									onClick={handleImport}
									disabled={isImporting || selectedRows.length === 0}
									className="gap-1"
								>
									{isImporting
										? <Loader2 className="h-3.5 w-3.5 animate-spin" />
										: <Upload className="h-3.5 w-3.5" />}
									Import {selectedRows.length > 0 ? `(${selectedRows.length})` : ""}
								</Button>
							</div>
						</div>

						<div className="overflow-x-auto rounded-md border">
							<Table>
								<TableHeader>
									<TableRow className="bg-muted/40">
										{/* expand toggle placeholder */}
										<TableHead className="w-8 px-1" />
										{/* select-all checkbox */}
										<TableHead className="w-10 px-3">
											<Checkbox
												checked={allSelected}
												data-state={someSelected ? "indeterminate" : undefined}
												onCheckedChange={(checked) => toggleAll(checked === true)}
												aria-label="Select all"
											/>
										</TableHead>
										<TableHead className="whitespace-nowrap">Patient PIN</TableHead>
										<TableHead className="whitespace-nowrap">Patient Name</TableHead>
										<TableHead className="whitespace-nowrap">DOB</TableHead>
										<TableHead className="whitespace-nowrap">Sex</TableHead>
										<TableHead className="whitespace-nowrap">Type</TableHead>
										<TableHead className="whitespace-nowrap">Mobile</TableHead>
										<TableHead className="whitespace-nowrap">Member PIN</TableHead>
										<TableHead className="whitespace-nowrap">Member Name</TableHead>
										<TableHead className="whitespace-nowrap">Member DOB</TableHead>
										<TableHead className="whitespace-nowrap">HCI Case No</TableHead>
										<TableHead className="whitespace-nowrap">HCI Trans No</TableHead>
										<TableHead className="whitespace-nowrap">Package</TableHead>
										<TableHead className="whitespace-nowrap">Enlist Date</TableHead>
										<TableHead className="whitespace-nowrap">Eff Year</TableHead>
										<TableHead className="whitespace-nowrap">Status</TableHead>
										<TableHead className="whitespace-nowrap">Profile</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{rows.map((row) => {
										const importResult = importResults?.find((r) => r.pin === row.pin);
										const isExpanded = expandedKey === row.key;

										return (
											<>
												<TableRow
													key={row.key}
													data-state={row.selected ? "selected" : undefined}
													className={
														importResult?.status === "IMPORTED"
															? "bg-green-50"
															: importResult?.status === "REJECTED"
																? "bg-red-50"
																: undefined
													}
												>
													{/* Expand toggle */}
													<TableCell className="px-1">
														{row.profile && (
															<Button
																type="button"
																size="icon"
																variant="ghost"
																className="h-6 w-6"
																onClick={() => toggleExpand(row.key)}
																aria-label={isExpanded ? "Collapse profile" : "Expand profile"}
															>
																{isExpanded
																	? <ChevronDown className="h-3.5 w-3.5" />
																	: <ChevronRight className="h-3.5 w-3.5" />}
															</Button>
														)}
													</TableCell>
													<TableCell className="px-3">
														<Checkbox
															checked={row.selected}
															onCheckedChange={(checked) =>
																toggleRow(row.key, checked === true)
															}
														/>
													</TableCell>
													<TableCell className="font-mono text-xs whitespace-nowrap">
														{row.pin || "—"}
													</TableCell>
													<TableCell className="whitespace-nowrap text-sm">
														<span className="font-medium">
															{[row.lastName, row.firstName, row.middleName].filter(Boolean).join(", ")}
														</span>
														{row.suffix ? <span className="text-muted-foreground ml-1 text-xs">{row.suffix}</span> : null}
														{importResult ? (
															<div className={`text-xs mt-0.5 ${importResult.status === "IMPORTED" ? "text-green-700" : "text-red-600"}`}>
																{importResult.status === "IMPORTED" ? "✓ Imported" : `✗ ${importResult.reason}`}
															</div>
														) : null}
													</TableCell>
													<TableCell className="font-mono text-xs whitespace-nowrap">
														{row.dob || "—"}
													</TableCell>
													<TableCell className="whitespace-nowrap">
														{row.sex === "M" ? "Male" : row.sex === "F" ? "Female" : row.sex || "—"}
													</TableCell>
													<TableCell className="whitespace-nowrap">
														<Badge variant={row.patientType === "DD" ? "secondary" : "outline"} className="text-xs">
															{row.patientType === "DD" ? "Dependent" : "Member"}
														</Badge>
													</TableCell>
													<TableCell className="font-mono text-xs whitespace-nowrap">
														{row.mobile || "—"}
													</TableCell>
													<TableCell className="font-mono text-xs whitespace-nowrap">
														{row.memberPin || "—"}
													</TableCell>
													<TableCell className="whitespace-nowrap text-sm">
														{row.patientType === "DD"
															? [row.memberLastName, row.memberFirstName, row.memberMiddleName].filter(Boolean).join(", ")
															: <span className="text-muted-foreground text-xs">—</span>}
														{row.memberSuffix ? <span className="text-muted-foreground ml-1 text-xs">{row.memberSuffix}</span> : null}
													</TableCell>
													<TableCell className="font-mono text-xs whitespace-nowrap">
														{row.memberDob || "—"}
													</TableCell>
													<TableCell className="font-mono text-xs whitespace-nowrap">
														{row.hciCaseNo || "—"}
													</TableCell>
													<TableCell className="font-mono text-xs whitespace-nowrap">
														{row.hciTransNo || "—"}
													</TableCell>
													<TableCell className="text-xs whitespace-nowrap">
														{row.packageType || "—"}
													</TableCell>
													<TableCell className="font-mono text-xs whitespace-nowrap">
														{row.enlistDate || "—"}
													</TableCell>
													<TableCell className="text-xs whitespace-nowrap">
														{row.effYear || "—"}
													</TableCell>
													<TableCell className="text-xs whitespace-nowrap">
														{row.reportStatus || "—"}
													</TableCell>
													<TableCell className="text-xs whitespace-nowrap">
														{row.profile
															? <Badge variant="secondary" className="text-xs">Available</Badge>
															: <span className="text-muted-foreground">—</span>}
													</TableCell>
												</TableRow>

												{/* ── Expandable profile detail row ── */}
												{isExpanded && row.profile && (
													<TableRow key={`${row.key}-profile`} className="hover:bg-transparent">
														<TableCell colSpan={COL_SPAN} className="p-0">
															<ProfileDetailPanel profile={row.profile} />
														</TableCell>
													</TableRow>
												)}
											</>
										);
									})}
								</TableBody>
							</Table>
						</div>

						{/* ── Import results summary ── */}
						{importResults && (
							<div className="rounded-md border p-3 space-y-2">
								<p className="text-sm font-semibold">Import Results</p>
								<div className="flex gap-4 text-sm">
									<span className="text-green-700 font-medium">
										✓ {importResults.filter((r) => r.status === "IMPORTED").length} imported
									</span>
									<span className="text-red-600 font-medium">
										✗ {importResults.filter((r) => r.status === "REJECTED").length} rejected
									</span>
								</div>
								{importResults.some((r) => r.status === "REJECTED") && (
									<ul className="text-xs text-red-600 space-y-0.5 list-disc pl-4">
										{importResults
											.filter((r) => r.status === "REJECTED")
											.map((r) => (
												<li key={r.pin}><span className="font-mono">{r.pin}</span> — {r.reason}</li>
											))}
									</ul>
								)}
							</div>
						)}
					</div>
				)}
			</CardContent>
		</Card>
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
	const refreshBatch = useCallback(
		async (batchUid: string) => {
			const res = await getKonsultaBatchesAction(clinicUid);
			if (res.status && res.data) {
				const updated = res.data.find((b) => b.batchUid === batchUid);
				if (updated) {
					setBatches((prev) =>
						prev.map((b) => (b.batchUid === batchUid ? updated : b)),
					);
				}
			}
		},
		[clinicUid],
	);

	useEffect(() => {
		void load();
	}, [load]);

	// Helper function to parse and format error messages for toast
	const showErrorToast = (
		message: string | undefined,
		defaultMessage: string = "An error occurred",
	) => {
		if (!message) {
			toast.error(defaultMessage);
			return;
		}

		try {
			// Try to parse as JSON
			const parsed = JSON.parse(message);

			// If it has an errors array, extract and display them
			if (
				parsed.errors &&
				Array.isArray(parsed.errors) &&
				parsed.errors.length > 0
			) {
				const errors = parsed.errors.map((e: unknown) =>
					typeof e === "string" ? e : JSON.stringify(e),
				);

				// Clean summary in title, all errors in description
				const title = `PhilHealth validation failed (${errors.length} error${errors.length > 1 ? "s" : ""})`;
				const description = errors
					.map((e: string, i: number) => `${i + 1}. ${e}`)
					.join("\n");

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
		setPendingAction(`${batchUid}:generate`);
		startTransition(async () => {
			const res = await generateBatchXmlAction(batchUid);
			if (res.status) {
				toast.success(
					`XML generated — transmittal: ${(res.data as { transmittalNo: string }).transmittalNo}`,
				);
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
		setPendingAction(`${batchUid}:validate`);
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
		setPendingAction(`${batchUid}:submit`);
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
		setPendingAction(`${batchUid}:delete`);
		startTransition(async () => {
			const res = await deleteKonsultaBatchAction(batchUid);
			if (res.status) {
				toast.success("Batch deleted");
				await load(); // Properly await the load to ensure data is refreshed
			} else {
				toast.error(res.message ?? "Delete failed");
			}
			setPendingAction(null);
		});
	};

	const handleToggleEntry = (
		entryId: number,
		included: boolean,
		batchUid: string,
	) => {
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
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h3 className="text-sm font-semibold flex items-center gap-2">
						<Send className="h-4 w-4 text-primary" />
						Report Batches
					</h3>
					<p className="text-xs text-muted-foreground mt-0.5">
						Group patients into a batch, generate PCB XML, encrypt, and submit
						to PhilHealth.
					</p>
				</div>
				<div className="flex flex-wrap gap-2">
					<Button
						variant="ghost"
						size="sm"
						onClick={() => void load()}
						disabled={loading}
					>
						<RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
					</Button>
					<Button
						size="sm"
						onClick={() => setShowCreate(true)}
						className="gap-1"
					>
						<Plus className="h-4 w-4" />
						New Batch
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
						const isGenerating = pendingAction === `${batch.batchUid}:generate`;
						const isValidating = pendingAction === `${batch.batchUid}:validate`;
						const isSubmitting = pendingAction === `${batch.batchUid}:submit`;
						const isDeleting = pendingAction === `${batch.batchUid}:delete`;
						const canGenerate = ["DRAFT", "GENERATED", "FAILED"].includes(
							batch.status,
						);
						const canValidate = ["GENERATED", "FAILED"].includes(batch.status);
						const canSubmit = batch.status === "VALIDATED";
						const canDelete = batch.status !== "SUBMITTED";
						const generatedDeficiencies = extractGeneratedKonsultaBatchDeficiencies(
							batch.validateResult,
						);

						return (
							<Card key={batch.batchUid}>
								<CardHeader className="pb-2">
									<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
										<button
											type="button"
											className="flex min-w-0 items-center gap-2 text-left"
											onClick={() =>
												setExpandedBatch(isExpanded ? null : batch.batchUid)
											}
										>
											{isExpanded ? (
												<ChevronDown className="h-4 w-4 text-muted-foreground" />
											) : (
												<ChevronRight className="h-4 w-4 text-muted-foreground" />
											)}
											<span className="font-semibold text-sm">
												{formatPeriod(batch.period)}
											</span>
											<span title={BATCH_STATUS_DESCRIPTIONS[batch.status]}>
												<Badge
													variant={
														BATCH_STATUS_VARIANTS[batch.status] ?? "outline"
													}
												>
													{BATCH_STATUS_LABELS[batch.status] ?? batch.status}
												</Badge>
											</span>
											<span className="max-w-full truncate text-xs text-muted-foreground">
												Tagging {batch.reportTagging} ·{" "}
												{batch.KonsultaEntries.length} patient(s)
											</span>
										</button>

										<div className="flex w-full flex-wrap gap-1 sm:w-auto sm:shrink-0 sm:justify-end">
											{canGenerate && (
												<Button
													type="button"
													size="sm"
													variant="outline"
													disabled={isGenerating}
													onClick={() => handleGenerateXml(batch.batchUid)}
													title={
														batch.xmlPayload
															? "Regenerate PCB XML report"
															: "Generate PCB XML report"
													}
												>
													{isGenerating ? (
														<>
															<Loader2 className="h-3.5 w-3.5 animate-spin" />
															<span className="ml-1 text-xs">Generating…</span>
														</>
													) : (
														<>
															<FileCode2 className="h-3.5 w-3.5" />
															<span className="ml-1 text-xs">
																{batch.xmlPayload
																	? "Regenerate XML"
																	: "Generate XML"}
															</span>
														</>
													)}
												</Button>
											)}
											{canValidate && (
												<Button
													type="button"
													size="sm"
													variant="outline"
													disabled={isValidating}
													onClick={() => handleValidate(batch.batchUid)}
													title="Validate report with PhilHealth"
												>
													{isValidating ? (
														<>
															<Loader2 className="h-3.5 w-3.5 animate-spin" />
															<span className="ml-1 text-xs">Validating…</span>
														</>
													) : (
														<>
															<ShieldCheck className="h-3.5 w-3.5" />
															<span className="ml-1 text-xs">Validate</span>
														</>
													)}
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
													{isSubmitting ? (
														<>
															<Loader2 className="h-3.5 w-3.5 animate-spin" />
															<span className="ml-1 text-xs">Submitting…</span>
														</>
													) : (
														<>
															<Upload className="h-3.5 w-3.5" />
															<span className="ml-1 text-xs">Submit</span>
														</>
													)}
												</Button>
											)}
											{canDelete && (
												<Button
													type="button"
													size="sm"
													variant="ghost"
													disabled={isDeleting}
													onClick={() => handleDelete(batch.batchUid)}
													title="Delete batch"
													className="text-destructive hover:text-destructive"
												>
													{isDeleting ? (
														<Loader2 className="h-3.5 w-3.5 animate-spin" />
													) : (
														<Trash2 className="h-3.5 w-3.5" />
													)}
												</Button>
											)}
										</div>
									</div>

									{batch.transmittalNo && (
										<div className="mt-1 ml-6 text-xs text-muted-foreground">
											Transmittal:{" "}
											<code className="font-mono">{batch.transmittalNo}</code>
										</div>
									)}
								</CardHeader>

								{isExpanded && (
									<CardContent>
										{batch.errorMessage && (
											<Alert className="mb-4">
												<AlertCircle className="h-4 w-4" />
												<AlertTitle>
													{generatedDeficiencies.length > 0
														? "Mapping deficiencies to review"
														: "Batch issue"}
												</AlertTitle>
												<AlertDescription className="space-y-1 whitespace-pre-wrap">
													{batch.errorMessage.trim()}
												</AlertDescription>
											</Alert>
										)}
										{generatedDeficiencies.length > 0 && (
											<BatchDeficiencyPanel
												deficiencies={generatedDeficiencies}
											/>
										)}
										<BatchEntryTable
											entries={batch.KonsultaEntries}
											batchUid={batch.batchUid}
											readOnly={batch.status === "SUBMITTED"}
											onToggle={handleToggleEntry}
											deficiencies={generatedDeficiencies}
										/>
										{batch.xmlPayload &&
											!batch.validateResult &&
											!batch.submitResult && (
												<div className="mt-4">
													<BatchResultSummary
														label="Generated XML"
														data={{
															status: "XML generated successfully",
															length: batch.xmlPayload.length,
														}}
														batchUid={batch.batchUid}
														xmlPayload={batch.xmlPayload}
														onDecrypted={() =>
															void refreshBatch(batch.batchUid)
														}
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
					onCreated={() => {
						setShowCreate(false);
						void load();
					}}
				/>
			)}
		</div>
	);
}

// ─── Batch Entry Table ────────────────────────────────────────────────────────

type EntryRow = Batch["KonsultaEntries"][number];

function BatchDeficiencyPanel({
    deficiencies,
}: {
    deficiencies: GeneratedBatchDeficiency[];
}) {
    const [selectedDomain, setSelectedDomain] = useState<string>("all");
    const [patientQuery, setPatientQuery] = useState("");

    const groupedDeficiencies = useMemo(() => {
        const normalizedPatientQuery = patientQuery.trim().toLowerCase();
        const filtered = deficiencies.filter((deficiency) => {
            const matchesDomain =
                selectedDomain === "all" || deficiency.domainKey === selectedDomain;
            const matchesPatient =
                normalizedPatientQuery.length === 0 ||
                deficiency.patientName.toLowerCase().includes(normalizedPatientQuery) ||
                deficiency.philHealthPin.toLowerCase().includes(normalizedPatientQuery);
            return matchesDomain && matchesPatient;
        });
        return groupGeneratedDeficiencies(filtered);
    }, [deficiencies, patientQuery, selectedDomain]);

    return (
        <div className="mb-4 rounded-lg border bg-muted/20 p-4">
            <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <h4 className="text-sm font-semibold text-foreground">
                        Grouped mapping deficiencies
                    </h4>
                    <p className="text-xs text-muted-foreground">
                        Review missing mappings by domain and affected batch entry before validation.
                    </p>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                    <div className="space-y-1">
                        <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">
                            Domain
                        </Label>
                        <Select value={selectedDomain} onValueChange={setSelectedDomain}>
                            <SelectTrigger className="h-8 text-xs">
                                <SelectValue placeholder="All domains" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All domains</SelectItem>
                                {Array.from(
                                    new Map(
                                        deficiencies.map((deficiency) => [
                                            deficiency.domainKey,
                                            deficiency.domainLabel,
                                        ]),
                                    ).entries(),
                                ).map(([domainKey, domainLabel]) => (
                                    <SelectItem key={domainKey} value={domainKey}>
                                        {domainLabel}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">
                            Patient / PIN
                        </Label>
                        <Input
                            value={patientQuery}
                            onChange={(event) => setPatientQuery(event.target.value)}
                            placeholder="Filter by patient or PIN"
                            className="h-8 text-xs"
                        />
                    </div>
                </div>
            </div>

            {groupedDeficiencies.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                    No deficiencies match the current filters.
                </p>
            ) : (
                <div className="space-y-3">
                    {groupedDeficiencies.map((group: any) => (
                        <div key={group.domainKey} className="rounded-md border bg-background">
                            <div className="flex items-center justify-between border-b px-3 py-2">
                                <div className="text-sm font-medium">{group.domainLabel}</div>
                                <Badge variant="secondary" className="text-[10px]">
                                    {group.entries.reduce(
                                        (count: number, entry: any) => count + entry.items.length,
                                        0,
                                    )}{" "}
                                    issue(s)
                                </Badge>
                            </div>
                            <div className="divide-y">
                                {group.entries.map((entry: any) => (
                                    <div key={entry.batchEntryId} className="space-y-2 px-3 py-3">
                                        <div className="flex flex-wrap items-center gap-2 text-xs">
                                            <span className="font-medium text-foreground">
                                                {entry.patientName}
                                            </span>
                                            <code className="rounded bg-muted px-1.5 py-0.5 text-[11px]">
                                                {entry.philHealthPin}
                                            </code>
                                            <Badge variant="outline" className="text-[10px]">
                                                Entry #{entry.batchEntryId}
                                            </Badge>
                                        </div>
                                        <ul className="space-y-1 text-xs text-muted-foreground">
                                            {entry.items.map((item: any, index: number) => (
                                                <li key={`${item.batchEntryId}-${index}`}>
                                                    <span className="font-medium text-foreground">
                                                        {item.itemLabel}
                                                    </span>
                                                    {": "}
                                                    {item.message}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function BatchEntryTable({
	entries,
	batchUid,
	readOnly,
	onToggle,
	deficiencies,
}: {
	entries: EntryRow[];
	batchUid: string;
	readOnly: boolean;
	onToggle: (entryId: number, included: boolean, batchUid: string) => void;
	deficiencies: GeneratedBatchDeficiency[];
}) {
	const deficiencyCountByEntryId = deficiencies.reduce<Map<number, number>>(
		(counts, deficiency) => {
			counts.set(
				deficiency.batchEntryId,
				(counts.get(deficiency.batchEntryId) ?? 0) + 1,
			);
			return counts;
		},
		new Map(),
	);
	if (entries.length === 0) {
		return (
			<p className="text-sm text-muted-foreground">No entries in this batch.</p>
		);
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
					const name =
						[e.Patient?.firstName, e.Patient?.lastName]
							.filter(Boolean)
							.join(" ") || "—";
					const consultCount = e.consultationIds?.length ?? 0;
					const deficiencyCount = deficiencyCountByEntryId.get(e.id) ?? 0;
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
								<div className="flex flex-wrap items-center gap-2">
									<code className="text-xs text-muted-foreground">
										{e.philHealthPin}
									</code>
									{deficiencyCount > 0 && (
										<Badge
											variant="outline"
											className="text-[10px] text-amber-700"
										>
											{deficiencyCount} mapping issue
											{deficiencyCount !== 1 ? "s" : ""}
										</Badge>
									)}
								</div>
							</TableCell>
							<TableCell>
								<Badge variant="outline" className="text-xs">
									{e.memberType}
								</Badge>
							</TableCell>
							<TableCell>
								<code className="text-xs">{e.hciCaseNo ?? "—"}</code>
							</TableCell>
							<TableCell>
								<code className="text-xs">{e.hciTransNo ?? "—"}</code>
							</TableCell>
							<TableCell className="text-xs">
								{e.included ? (
									<span
										className={
											consultCount === 0 ? "text-muted-foreground" : ""
										}
									>
										{consultCount} consult{consultCount !== 1 ? "s" : ""}
									</span>
								) : (
									<span className="text-muted-foreground">excluded</span>
								)}
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
		if (status === "PENDING")
			return (
				<Badge variant="outline" className="text-xs gap-1">
					<Clock className="h-3 w-3" />
					Pending
				</Badge>
			);
		if (status === "INCLUDED")
			return (
				<Badge variant="default" className="text-xs gap-1">
					<CheckCircle2 className="h-3 w-3" />
					Included
				</Badge>
			);
		if (status === "FAILED")
			return (
				<Badge variant="destructive" className="text-xs gap-1">
					<AlertCircle className="h-3 w-3" />
					Failed
				</Badge>
			);
		return (
			<Badge variant="secondary" className="text-xs">
				{status}
			</Badge>
		);
	})();
	return desc ? <span title={desc}>{chip}</span> : chip;
}

// ─── Batch Result Summary ─────────────────────────────────────────────────────

function extractFriendlySummary(data: unknown): {
	status: "ok" | "warn" | "error";
	lines: string[];
	decryptedErrors: string | null;
	parsedErrors: string[] | null;
} {
	const str = JSON.stringify(data ?? {}).toLowerCase();
	const lines: string[] = [];

	const obj =
		typeof data === "object" && data !== null
			? (data as Record<string, unknown>)
			: {};

	// Surface decrypted PhilHealth errors first
	let decryptedErrors =
		typeof obj.decryptedErrors === "string" ? obj.decryptedErrors : null;
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
						typeof e === "string"
							? e
							: typeof e === "object"
								? JSON.stringify(e)
								: String(e),
					);
					// Don't show the raw decryptedErrors string if we have parsed errors
					decryptedErrors = null;
				} else if (Array.isArray(parsed)) {
					// If the parsed result is directly an array
					parsedErrors = parsed.map((e: unknown) =>
						typeof e === "string"
							? e
							: typeof e === "object"
								? JSON.stringify(e)
								: String(e),
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
		if (upload.responsecode)
			lines.push(`Response Code: ${String(upload.responsecode)}`);
		if (upload.responsemessage)
			lines.push(`Message: ${String(upload.responsemessage)}`);
		if (upload.transmittalid)
			lines.push(`Transmittal ID: ${String(upload.transmittalid)}`);
		if (upload.referencenumber)
			lines.push(`Reference No: ${String(upload.referencenumber)}`);
		const errors = upload.errors;
		if (errors && typeof errors === "object") {
			const errorArr = Array.isArray(errors) ? errors : Object.values(errors);
			errorArr.slice(0, 5).forEach((e) => {
				if (typeof e === "object" && e !== null) {
					const er = e as Record<string, unknown>;
					lines.push(
						`• ${er.errordescription ?? er.message ?? JSON.stringify(e)}`,
					);
				} else {
					lines.push(`• ${String(e)}`);
				}
			});
		}
	}

	// Flat validate response
	if (!lines.length) {
		if (obj.responsecode)
			lines.push(`Response Code: ${String(obj.responsecode)}`);
		if (obj.responsemessage)
			lines.push(`Message: ${String(obj.responsemessage)}`);
		if (obj.message) lines.push(`Message: ${String(obj.message)}`);
		if (obj.result) lines.push(`Result: ${String(obj.result)}`);
		if (obj.raw) lines.push(String(obj.raw).slice(0, 200));
	}

	if (!lines.length && !decryptedErrors && !parsedErrors)
		lines.push("No details available.");

	const isError =
		str.includes("failed") || str.includes("error") || str.includes("invalid");
	const isOk =
		str.includes("success") || str.includes("valid") || str.includes('"v"');
	const status = isError ? "error" : isOk ? "ok" : "warn";

	return { status, lines, decryptedErrors, parsedErrors };
}

const IS_DEV = process.env.NODE_ENV === "development";

// Helper function to format XML with proper indentation
function formatXml(xml: string): string {
	// Remove existing extra whitespace but preserve text content
	const formatted = xml.replace(/>\s+</g, "><");

	// Add newlines and indentation
	let indent = 0;
	const lines: string[] = [];
	let currentLine = "";
	let i = 0;

	while (i < formatted.length) {
		const char = formatted[i];

		if (char === "<") {
			// Check if this is a closing tag or self-closing tag
			const tagEnd = formatted.indexOf(">", i);
			if (tagEnd === -1) break;

			const tag = formatted.substring(i, tagEnd + 1);
			const isClosing = tag.startsWith("</");
			const isSelfClosing = tag.endsWith("/>");

			// Decrease indent for closing tags
			if (isClosing) indent = Math.max(0, indent - 1);

			// Add current line if it has content
			if (currentLine.trim()) {
				lines.push("  ".repeat(indent) + currentLine.trim());
				currentLine = "";
			}

			// Add the tag
			lines.push("  ".repeat(indent) + tag);

			// Increase indent for opening tags (not self-closing)
			if (!isClosing && !isSelfClosing) indent++;

			i = tagEnd + 1;
		} else if (char === " " || char === "\n" || char === "\t") {
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
		lines.push("  ".repeat(indent) + currentLine.trim());
	}

	return lines.join("\n");
}

// Helper function to colorize XML syntax
function colorizeXmlLine(line: string): React.ReactNode[] {
	const parts: React.ReactNode[] = [];

	// Split by tags: match anything between < and >
	const tagRegex = /<[^>]*>/g;
	let lastIndex = 0;
	let keyCounter = 0;

	let match = tagRegex.exec(line);
	while (match !== null) {
		const tag = match[0];
		const tagIndex = match.index;

		// Add text before the tag
		if (tagIndex > lastIndex) {
			parts.push(
				<span key={`text-${keyCounter++}`} className="text-slate-700">
					{line.substring(lastIndex, tagIndex)}
				</span>,
			);
		}

		// Parse and colorize the tag
		const tagContent = tag.substring(1, tag.length - 1); // Remove < and >
		const isClosingTag = tagContent.startsWith("/");

		// Extract tag name (first word after < or </)
		const nameMatch = tagContent.match(/^\/?\s*([a-zA-Z_:][a-zA-Z0-9_:.-]*)/);
		const tagName = nameMatch ? nameMatch[1] : "";
		const afterName = nameMatch
			? tagContent.substring(nameMatch[0].length)
			: tagContent;

		const tagParts: React.ReactNode[] = ["<"];

		if (isClosingTag) tagParts.push("/");

		tagParts.push(
			<span key={`tagname-${keyCounter}`} className="text-blue-600">
				{tagName}
			</span>,
		);

		// Parse attributes
		if (afterName.trim()) {
			const attrRegex =
				/(\s+)([a-zA-Z_:][a-zA-Z0-9_:.-]*)(?:=("[^"]*"|'[^']*'))?/g;
			let lastAttrIndex = 0;

			let attrMatch = attrRegex.exec(afterName);
			while (attrMatch !== null) {
				const [fullAttrMatch, whitespace, attrName, attrValue] = attrMatch;
				const matchIndex = attrMatch.index;

				// Add whitespace before attribute
				if (whitespace) {
					tagParts.push(whitespace);
				}

				// Add attribute name
				tagParts.push(
					<span
						key={`attr-${keyCounter}-${attrName}`}
						className="text-purple-600"
					>
						{attrName}
					</span>,
				);

				// Add attribute value if present
				if (attrValue) {
					tagParts.push("=");
					tagParts.push(
						<span
							key={`val-${keyCounter}-${attrName}`}
							className="text-green-600"
						>
							{attrValue}
						</span>,
					);
				}

				lastAttrIndex = matchIndex + fullAttrMatch.length;
				attrMatch = attrRegex.exec(afterName);
			}

			// Add remaining content after last attribute (like trailing / for self-closing)
			if (lastAttrIndex < afterName.length) {
				const remaining = afterName.substring(lastAttrIndex);
				if (remaining.trim() || remaining.includes("/")) {
					tagParts.push(remaining);
				}
			}
		}

		tagParts.push(">");

		parts.push(
			<span key={`tag-${keyCounter++}`} className="text-blue-600">
				{tagParts}
			</span>,
		);

		lastIndex = tagIndex + tag.length;
		match = tagRegex.exec(line);
	}

	// Add remaining text after last tag
	if (lastIndex < line.length) {
		parts.push(
			<span key={`text-${keyCounter++}`} className="text-slate-700">
				{line.substring(lastIndex)}
			</span>,
		);
	}

	return parts.length > 0 ? parts : [line];
}

function BatchResultSummary({
	label,
	data,
	batchUid,
	xmlPayload,
	onDecrypted,
	resultType = "validate",
}: {
	label: string;
	data: unknown;
	batchUid?: string;
	xmlPayload?: string | null;
	onDecrypted?: () => void;
	resultType?: "validate" | "submit";
}) {
	const [show, setShow] = useState(false);
	const [showXml, setShowXml] = useState(false);
	const [isDecrypting, setIsDecrypting] = useState(false);
	const lineNumbersRef = useRef<HTMLDivElement>(null);
	const codeRef = useRef<HTMLDivElement>(null);
	const { status, lines, decryptedErrors, parsedErrors } =
		extractFriendlySummary(data);
	const icon =
		status === "ok" ? (
			<CheckCircle2 className="h-4 w-4 text-green-600" />
		) : status === "error" ? (
			<AlertCircle className="h-4 w-4 text-destructive" />
		) : (
			<Clock className="h-4 w-4 text-yellow-600" />
		);

	// Check if encrypted errors are still present
	const obj =
		typeof data === "object" && data !== null
			? (data as Record<string, unknown>)
			: {};
	const hasEncryptedErrors = !!obj.encryptedxmlerrors;

	// Strip decryptedErrors from the object before showing raw JSON
	const rawForDisplay =
		typeof data === "object" && data !== null
			? Object.fromEntries(
					Object.entries(data as Record<string, unknown>).filter(
						([k]) => k !== "decryptedErrors",
					),
				)
			: data;

	const handleDecryptErrors = async () => {
		if (!batchUid) return;
		setIsDecrypting(true);
		try {
			const { decryptStoredValidationErrorsAction } = await import(
				"@/actions/clinics/konsulta-report.action"
			);
			const result = await decryptStoredValidationErrorsAction(
				batchUid,
				resultType,
			);
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
	const xmlLines = xmlPayload ? formatXml(xmlPayload).split("\n") : [];

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
						<Button
							type="button"
							variant="ghost"
							size="sm"
							className="h-6 text-xs gap-1 px-1.5"
							onClick={() => setShowXml(!showXml)}
						>
							{showXml ? (
								<EyeOff className="h-3 w-3" />
							) : (
								<Eye className="h-3 w-3" />
							)}
							{showXml ? "Hide XML" : "View XML"}
						</Button>
					)}
					{IS_DEV && (
						<Button
							type="button"
							variant="ghost"
							size="sm"
							className="h-6 text-xs gap-1 px-1.5"
							onClick={() => setShow(!show)}
						>
							{show ? (
								<EyeOff className="h-3 w-3" />
							) : (
								<Eye className="h-3 w-3" />
							)}
							{show ? "Hide JSON" : "Raw JSON"}
						</Button>
					)}
				</div>
			</div>

			{parsedErrors && parsedErrors.length > 0 && (
				<div className="mt-2 rounded-md bg-destructive/10 border border-destructive/30 px-3 py-2">
					<p className="text-xs font-semibold text-destructive mb-2">
						PhilHealth Validation Errors
					</p>
					<ul className="space-y-1 text-xs text-destructive/90">
						{parsedErrors.map((err) => (
							<li key={err} className="ml-2">
								• {err}
							</li>
						))}
					</ul>
				</div>
			)}

			{decryptedErrors && (
				<div className="mt-2 rounded-md bg-destructive/10 border border-destructive/30 px-3 py-2">
					<p className="text-xs font-semibold text-destructive mb-1">
						PhilHealth Validation Errors
					</p>
					<pre className="text-xs whitespace-pre-wrap break-words text-destructive/90">
						{decryptedErrors}
					</pre>
				</div>
			)}

			{showXml && xmlPayload && (
				<div className="mt-2 rounded-md bg-slate-50 border border-slate-200 p-0 overflow-hidden">
					<div className="sticky top-0 bg-slate-100 border-b border-slate-200 px-3 py-1.5 flex items-center justify-between">
						<p className="text-xs font-semibold text-slate-700">
							Generated XML ({xmlLines.length} lines)
						</p>
						<Button
							type="button"
							variant="ghost"
							size="sm"
							className="h-5 text-xs px-1.5"
							onClick={() => setShowXml(false)}
						>
							<EyeOff className="h-3 w-3" />
						</Button>
					</div>
					<div className="max-h-96 bg-white font-mono text-xs leading-6 flex overflow-hidden">
						{/* Line numbers column */}
						<div
							ref={lineNumbersRef}
							className="bg-slate-100 border-r border-slate-200 text-slate-500 p-0 select-none flex-shrink-0 overflow-hidden"
						>
							{Array.from({ length: xmlLines.length }, (_, i) => i + 1).map(
								(n) => (
									<div
										key={n}
										className="px-3 text-right min-w-12"
										style={{ height: "1.5rem" }}
									>
										{n}
									</div>
								),
							)}
						</div>
						{/* Code column */}
						<div
							ref={codeRef}
							onScroll={handleCodeScroll}
							className="flex-1 overflow-auto"
						>
							{xmlLines
								.map((line, i) => ({ line, n: i + 1 }))
								.map(({ line, n }) => (
									<div
										key={n}
										className="px-4 hover:bg-blue-50 whitespace-pre transition-colors"
										style={{ height: "1.5rem" }}
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
					{lines.map((l) => (
						<li key={l}>{l}</li>
					))}
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
	clinicUid,
	onClose,
	onCreated,
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
		if (selected.size === 0) {
			toast.error("Select at least one patient.");
			return;
		}
		if (!period.match(/^\d{6}$/)) {
			toast.error("Period must be YYYYMM format.");
			return;
		}
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
		<Dialog
			open
			onOpenChange={(open) => {
				if (!open) onClose();
			}}
		>
			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Lock className="h-4 w-4" />
						New PhilHealth Report Batch
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
								type="button"
								className="text-xs text-primary underline-offset-2 hover:underline"
								onClick={toggleAll}
							>
								{selected.size === patients.length
									? "Deselect all"
									: `Select all (${patients.length})`}
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
										{isChecked ? (
											<CheckSquare className="h-4 w-4 text-primary shrink-0" />
										) : (
											<Square className="h-4 w-4 text-muted-foreground shrink-0" />
										)}
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
					<p className="text-xs text-muted-foreground mt-1">
						{selected.size} selected
					</p>
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={onClose} disabled={submitting}>
						Cancel
					</Button>
					<Button
						onClick={() => void handleCreate()}
						disabled={submitting || selected.size === 0}
					>
						{submitting ? (
							<Loader2 className="h-4 w-4 animate-spin mr-2" />
						) : null}
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
	const selectedGeneratedDeficiencies = useMemo(
		() =>
			selected
				? extractGeneratedKonsultaBatchDeficiencies(selected.validateResult)
				: [],
		[selected],
	);

	const load = useCallback(async () => {
		setLoading(true);
		const res = await getKonsultaBatchesAction(clinicUid);
		if (res.status && res.data) {
			setBatches(res.data.filter((b) => b.status === "SUBMITTED"));
		}
		setLoading(false);
	}, [clinicUid]);

	useEffect(() => {
		void load();
	}, [load]);

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
					<Button
						variant="ghost"
						size="sm"
						onClick={() => void load()}
						disabled={loading}
					>
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
					<div className="overflow-x-auto">
						<Table className="min-w-[760px]">
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
											<code className="text-xs font-mono">
												{b.transmittalNo ?? "—"}
											</code>
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
														year: "numeric",
														month: "short",
														day: "numeric",
														hour: "2-digit",
														minute: "2-digit",
													})
												: "—"}
										</TableCell>
										<TableCell>
											<Button
												size="sm"
												variant="ghost"
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
					</div>
				)}
			</CardContent>

			{selected && (
				<Dialog
					open
					onOpenChange={(open) => {
						if (!open) setSelected(null);
					}}
				>
					<DialogContent className="max-w-2xl">
						<DialogHeader>
							<DialogTitle>
								Submission Detail — {formatPeriod(selected.period)}
							</DialogTitle>
							<DialogDescription>
								Transmittal:{" "}
								<code className="font-mono">{selected.transmittalNo}</code>
							</DialogDescription>
						</DialogHeader>
						<div className="space-y-3 max-h-[60vh] overflow-y-auto">
							{selectedGeneratedDeficiencies.length > 0 && (
								<BatchDeficiencyPanel
									deficiencies={selectedGeneratedDeficiencies}
								/>
							)}
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
							<Button variant="outline" onClick={() => setSelected(null)}>
								Close
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			)}
		</Card>
	);
}
