"use client";

import {
	AlertCircle,
	CheckCircle2,
	CheckSquare,
	ChevronDown,
	ChevronRight,
	ClipboardList,
	Clock,
	ExternalLink,
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
	getAllClinicPatientsWithPhilHealthStatusAction,
	getKonsultaBatchesAction,
	getPhilHealthConsultationsAction,
	getPhilHealthPatientsAction,
	importKonsultaAssignmentsAction,
	submitKonsultaBatchAction,
	toggleKonsultaEntryAction,
	getConsultationsForEntryAction,
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

// ─── Batches Panel ────────────────────────────────────────────────────────────

export function BatchesPanel({ clinicUid }: { clinicUid: string }) {
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
			const res = await generateBatchXmlV2Action(batchUid);
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
											reportTagging={batch.reportTagging}
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

export function BatchDeficiencyPanel({
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
	reportTagging,
}: {
	entries: EntryRow[];
	batchUid: string;
	readOnly: boolean;
	onToggle: (entryId: number, included: boolean, batchUid: string) => void;
	deficiencies: GeneratedBatchDeficiency[];
	reportTagging?: string;
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
					{reportTagging === "2" && <TableHead className="w-8"></TableHead>}
					<TableHead className="w-8">{!readOnly && "Include"}</TableHead>
					<TableHead>Patient</TableHead>
					<TableHead>Type</TableHead>
					<TableHead>HCI Case</TableHead>
					<TableHead>HCI Trans</TableHead>
					{reportTagging !== "1" && <TableHead>Consults</TableHead>}
					<TableHead>Status</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{entries.map((e) => (
					<BatchEntryRow
						key={e.id}
						e={e}
						batchUid={batchUid}
						readOnly={readOnly}
						onToggle={onToggle}
						deficiencyCount={deficiencyCountByEntryId.get(e.id) ?? 0}
						reportTagging={reportTagging}
					/>
				))}
			</TableBody>
		</Table>
	);
}

function BatchEntryRow({
	e,
	batchUid,
	readOnly,
	onToggle,
	deficiencyCount,
	reportTagging,
}: {
	e: EntryRow;
	batchUid: string;
	readOnly: boolean;
	onToggle: (entryId: number, included: boolean, batchUid: string) => void;
	deficiencyCount: number;
	reportTagging?: string;
}) {
	const [expanded, setExpanded] = useState(false);
	const [loading, setLoading] = useState(false);
	const [consultations, setConsultations] = useState<any[]>([]);
	const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
	const [toggling, setToggling] = useState(false);

	const isTagging2 = reportTagging === "2";
	const pathname = usePathname();
	const clinicUid = pathname.split("/")[3];

	const handleExpand = async () => {
		if (expanded) {
			setExpanded(false);
			return;
		}
		setExpanded(true);
		if (consultations.length === 0) {
			setLoading(true);
			const res = await getConsultationsForEntryAction({ entryId: e.id });
			if (res.data) {
				setConsultations(res.data.consultations || []);
				setSelectedIds(new Set(res.data.selectedIds || []));
			}
			setLoading(false);
		}
	};

	const handleToggleConsultation = async (cId: number, checked: boolean) => {
		if (readOnly || toggling) return;
		setToggling(true);
		const next = new Set(selectedIds);
		if (checked) next.add(cId);
		else next.delete(cId);
		
		setSelectedIds(next);
		
		const res = await toggleKonsultaEntryAction({
			entryId: e.id,
			included: e.included,
			consultationIds: Array.from(next),
		});
		
		if (!res?.status) {
			toast.error("Failed to update consultation selection");
			setSelectedIds(new Set(selectedIds));
		}
		setToggling(false);
	};

	const name = [e.Patient?.firstName, e.Patient?.lastName].filter(Boolean).join(" ") || "—";
	const consultCount = e.consultationIds?.length ?? 0;

	return (
		<>
			<TableRow className={e.included ? "" : "opacity-50"}>
				{isTagging2 && (
					<TableCell>
						<Button
							variant="ghost"
							size="sm"
							className="h-6 w-6 p-0"
							onClick={handleExpand}
						>
							{expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
						</Button>
					</TableCell>
				)}
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
							{e.Patient.PhilHealthRecords?.[0]?.pin ?? "No PIN"}
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
						{e.Patient.ClinicPatients?.[0]?.YakapRegistrations?.[0]?.patientType === "DD" ? "Dependent" : "Member"}
					</Badge>
				</TableCell>
				<TableCell>
					<code className="text-xs">{e.Patient.ClinicPatients?.[0]?.YakapRegistrations?.[0]?.hciCaseNo ?? "—"}</code>
				</TableCell>
				<TableCell>
					<code className="text-xs">{e.Patient.ClinicPatients?.[0]?.YakapRegistrations?.[0]?.hciEnlistmentTransNo ?? "—"}</code>
				</TableCell>
				{reportTagging !== "1" && (
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
				)}
				<TableCell>
					<EntryStatusChip status={e.status} />
				</TableCell>
			</TableRow>
			{expanded && isTagging2 && (
				<TableRow className="bg-muted/30">
					<TableCell colSpan={8} className="p-0">
						<div className="p-4 pl-14">
							{loading ? (
								<div className="flex items-center gap-2 text-muted-foreground text-xs">
									<Loader2 className="h-4 w-4 animate-spin" />
									Loading consultations...
								</div>
							) : consultations.length === 0 ? (
								<p className="text-xs text-muted-foreground">No consultations found in this period.</p>
							) : (
								<div className="space-y-2">
									<p className="text-xs font-medium text-slate-700">Select Consultations to Include</p>
									<div className="border rounded-md divide-y bg-white max-h-[300px] overflow-y-auto">
										{consultations.map((c) => {
											const isChecked = selectedIds.has(c.id);
											const hasProfile = !!c.ConsultationKonsultaData;
											return (
												<label
													key={c.id}
													className={`flex items-center gap-3 px-3 py-2 text-sm ${readOnly || toggling ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-slate-50"}`}
												>
													<Checkbox
														checked={isChecked}
														disabled={readOnly || toggling}
														onCheckedChange={(v) => handleToggleConsultation(c.id, !!v)}
													/>
													<div className="flex-1">
														<div className="flex items-center gap-2">
															<span className="font-medium">{new Date(c.createdAt).toLocaleDateString()}</span>
															<code className="text-xs text-muted-foreground">{c.caseNumber}</code>
															{hasProfile && <Badge variant="secondary" className="text-[10px]">Profiled</Badge>}
														</div>
														{c.subject && (
															<p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
																{c.subject}
															</p>
														)}
													</div>
													<a
														href={`/v2/clinic/${clinicUid}/consultations/${c.id}`}
														target="_blank"
														rel="noopener noreferrer"
														onClick={(e) => e.stopPropagation()}
														className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 shrink-0 ml-4"
													>
														Open Workspace <ExternalLink className="h-3 w-3" />
													</a>
												</label>
											);
										})}
									</div>
								</div>
							)}
						</div>
					</TableCell>
				</TableRow>
			)}
		</>
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

export function BatchResultSummary({
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
	const [patients, setPatients] = useState<GetPhilHealthPatients["data"]>([]);
	const [loading, setLoading] = useState(true);
	const [selected, setSelected] = useState<Set<number>>(new Set());
	const [period, setPeriod] = useState("");
	const [reportTagging, setReportTagging] = useState<"1" | "2">("1");
	const [notes, setNotes] = useState("");
	const [submitting, setSubmitting] = useState(false);

	useEffect(() => {
		void (async () => {
			setLoading(true);
			const res = await getPhilHealthPatientsAction(clinicUid);
			if (res.status && res.data) {
				setPatients(res.data);
			} else {
				setPatients([]);
			}
			setLoading(false);
		})();
	}, [clinicUid]);

	const safePatients = patients || [];

	const toggleAll = () => {
		if (selected.size === safePatients.length) {
			setSelected(new Set());
		} else {
			setSelected(new Set(safePatients.map((p) => p.Patient.id)));
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
		const res = await createKonsultaBatchV2Action({
			clinicUid,
			period,
			reportTagging,
			notes: notes || "",
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
						{!loading && safePatients.length > 0 && (
							<button
								type="button"
								className="text-xs text-primary underline-offset-2 hover:underline"
								onClick={toggleAll}
							>
								{selected.size === safePatients.length
									? "Deselect all"
									: `Select all (${safePatients.length})`}
							</button>
						)}
					</div>

					{loading ? (
						<div className="flex justify-center py-6">
							<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
						</div>
					) : safePatients.length === 0 ? (
						<p className="text-sm text-muted-foreground text-center py-4">
							No enrolled patients found.
						</p>
					) : (
						<div className="border rounded-md max-h-56 overflow-y-auto divide-y">
							{safePatients.map((p) => {
								const isChecked = selected.has(p.Patient.id);
								const ph = p.Patient.PhilHealthRecords?.[0];
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
											{p.YakapRegistrations?.[0]?.patientType === "DD" || p.YakapRegistrations?.[0]?.patientType === "DEPENDENT" ? "Dependent" : "Member"}
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

