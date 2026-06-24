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
import { BatchDeficiencyPanel, BatchResultSummary } from "./BatchesPanel";
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

// ─── Submission History Panel ─────────────────────────────────────────────────

export function SubmissionHistoryPanel({ clinicUid }: { clinicUid: string }) {
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
