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
import { XmlImportTrancheType, ParsedXmlRow, ImportResult, parseEnlistmentRowsFromXml, ProfileDetailPanel } from "./KonsultaValidationPanel";
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

export function KonsultaXmlImportPanel({ clinicUid }: { clinicUid: string }) {
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
