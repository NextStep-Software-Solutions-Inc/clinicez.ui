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

export function AtcVerificationPanel({ clinicUid }: { clinicUid: string }) {
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
