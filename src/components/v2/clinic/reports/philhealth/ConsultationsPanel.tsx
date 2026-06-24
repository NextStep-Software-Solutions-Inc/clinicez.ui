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

// ─── Consultations Panel ──────────────────────────────────────────────────────

export function ConsultationsPanel({ clinicUid }: { clinicUid: string }) {
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
