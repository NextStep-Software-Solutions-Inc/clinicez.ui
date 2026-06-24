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

import { PatientsPanel } from "./philhealth/PatientsPanel";
import { ConsultationsPanel } from "./philhealth/ConsultationsPanel";
import { BatchesPanel } from "./philhealth/BatchesPanel";
import { SubmissionHistoryPanel } from "./philhealth/SubmissionHistoryPanel";
import { AtcVerificationPanel } from "./philhealth/AtcVerificationPanel";
import { KonsultaValidationPanel } from "./philhealth/KonsultaValidationPanel";
import { KonsultaXmlImportPanel } from "./philhealth/KonsultaXmlImportPanel";

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
