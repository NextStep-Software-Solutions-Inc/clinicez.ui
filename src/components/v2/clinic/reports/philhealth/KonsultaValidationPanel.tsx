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

export function KonsultaValidationPanel({ clinicUid }: { clinicUid: string }) {
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
					Konsulta Registration Validation
				</CardTitle>
				<CardDescription>
					Verify registration using Konsulta Kit 1.1 SOAP method{" "}
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
									<SelectItem value="MM">Member</SelectItem>
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

export type XmlImportTrancheType = "FIRST_TRANCHE" | "SECOND_TRANCHE";

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

export type ParsedXmlRow = {
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

export type ImportResult = {
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
export function parseProfilesFromXml(xml: string): Map<string, ParsedProfileData> {
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

export function parseEnlistmentRowsFromXml(xml: string): ParsedXmlRow[] {
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
			memberLastName: getXmlAttr("pMemLastName", attributes),
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
export function ProfileDetailPanel({ profile }: { profile: ParsedProfileData }) {
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
