/**
 * PhilHealth Konsulta v1.1 PKA — Minimal PCB XML Builder
 *
 * Builds a structurally valid PCB XML string from provided data.
 * Follows KonsultaData_v1.14.dtd exactly.
 * Uses xmlbuilder2 for automatic attribute escaping and well-formed output.
 */

import { create } from "xmlbuilder2";
type XMLNode = ReturnType<typeof create>;
import type {
    KonsultaHciCredentials,
    KonsultaEnlistmentData,
    KonsultaProfileData,
    KonsultaSoapData,
    ErlAssignment,
} from "./types";

function today(): string {
    return new Date().toISOString().slice(0, 10);
}

/** Formats a DOB string (yyyy-mm-dd) as the PhilHealth age description string. */
function formatAge(dob: string): string {
    if (!dob) return "0 YR(S), 0 MO(S), 0 DAY(S)";
    const d = new Date(dob);
    const now = new Date();
    let y = now.getFullYear() - d.getFullYear();
    let m = now.getMonth() - d.getMonth();
    let days = now.getDate() - d.getDate();
    if (days < 0) { m--; days += 30; }
    if (m < 0) { y--; m += 12; }
    return `${y} YR(S), ${m} MO(S), ${days} DAY(S)`;
}

// ─── Shared sub-element builders (used by both PROFILE and SOAP) ─────────────

function addPepert(parent: XMLNode): void {
    parent.ele("PEPERT", {
        pSystolic: "", pDiastolic: "", pHr: "", pRr: "", pTemp: "",
        pHeight: "", pWeight: "", pBMI: "", pZScore: "",
        pLeftVision: "", pRightVision: "", pLength: "", pHeadCirc: "",
        pSkinfoldThickness: "", pWaist: "", pHip: "", pLimbs: "",
        pMidUpperArmCirc: "", pReportStatus: "U", pDeficiencyRemarks: "",
    });
}

function addPemiscs(parent: XMLNode): void {
    parent.ele("PEMISCS").ele("PEMISC", {
        pSkinId: "", pHeentId: "", pChestId: "", pHeartId: "", pAbdomenId: "",
        pNeuroId: "", pGuId: "", pRectalId: "", pReportStatus: "U", pDeficiencyRemarks: "",
    });
}

function addPespecific(parent: XMLNode): void {
    parent.ele("PESPECIFIC", {
        pSkinRem: "", pHeentRem: "", pChestRem: "", pHeartRem: "", pAbdomenRem: "",
        pNeuroRem: "", pRectalRem: "", pGuRem: "", pReportStatus: "U", pDeficiencyRemarks: "",
    });
}

function addProfileSubElements(profile: XMLNode): void {
    profile.ele("MEDHISTS").ele("MEDHIST", { pMdiseaseCode: "001", pReportStatus: "U", pDeficiencyRemarks: "" });
    profile.ele("MHSPECIFICS").ele("MHSPECIFIC", { pMdiseaseCode: "001", pSpecificDesc: "", pReportStatus: "U", pDeficiencyRemarks: "" });
    profile.ele("SURGHISTS").ele("SURGHIST", { pSurgDesc: "", pSurgDate: "", pReportStatus: "U", pDeficiencyRemarks: "" });
    profile.ele("FAMHISTS").ele("FAMHIST", { pMdiseaseCode: "001", pReportStatus: "U", pDeficiencyRemarks: "" });
    profile.ele("FHSPECIFICS").ele("FHSPECIFIC", { pMdiseaseCode: "", pSpecificDesc: "", pReportStatus: "U", pDeficiencyRemarks: "" });
    profile.ele("SOCHIST", {
        pIsSmoker: "N", pNoCigpk: "", pIsAdrinker: "N", pNoBottles: "", pIllDrugUser: "N",
        pIsSexuallyActive: "N", pReportStatus: "U", pDeficiencyRemarks: "",
    });
    profile.ele("IMMUNIZATIONS").ele("IMMUNIZATION", {
        pChildImmcode: "", pYoungwImmcode: "", pPregwImmcode: "", pElderlyImmcode: "",
        pOtherImm: "", pReportStatus: "U", pDeficiencyRemarks: "",
    });
    profile.ele("MENSHIST", {
        pMenarchePeriod: "", pLastMensPeriod: "", pPeriodDuration: "", pMensInterval: "",
        pPadsPerDay: "", pOnsetSexIc: "", pBirthCtrlMethod: "", pIsMenopause: "",
        pMenopauseAge: "", pIsApplicable: "N", pReportStatus: "U", pDeficiencyRemarks: "",
    });
    profile.ele("PREGHIST", {
        pPregCnt: "", pDeliveryCnt: "", pDeliveryTyp: "", pFullTermCnt: "", pPrematureCnt: "",
        pAbortionCnt: "", pLivChildrenCnt: "", pWPregIndhyp: "", pWFamPlan: "",
        pIsApplicable: "N", pReportStatus: "U", pDeficiencyRemarks: "",
    });
    addPepert(profile);
    profile.ele("BLOODTYPE", { pBloodType: "", pReportStatus: "U", pDeficiencyRemarks: "" });
    profile.ele("PEGENSURVEY", { pGenSurveyId: "", pGenSurveyRem: "", pReportStatus: "U", pDeficiencyRemarks: "" });
    addPemiscs(profile);
    addPespecific(profile);
    profile.ele("NCDQANS", {
        pQid1_Yn: "", pQid2_Yn: "", pQid3_Yn: "", pQid4_Yn: "",
        pQid5_Ynx: "", pQid6_Yn: "", pQid7_Yn: "", pQid8_Yn: "", pQid9_Yn: "",
        pQid10_Yn: "", pQid11_Yn: "", pQid12_Yn: "", pQid13_Yn: "", pQid14_Yn: "",
        pQid15_Yn: "", pQid16_Yn: "", pQid17_Abcde: "", pQid18_Yn: "", pQid19_Yn: "",
        pQid19_Fbsmg: "", pQid19_Fbsmmol: "", pQid19_Fbsdate: "", pQid20_Yn: "",
        pQid20_Choleval: "", pQid20_Choledate: "", pQid21_Yn: "", pQid21_Ketonval: "",
        pQid21_Ketondate: "", pQid22_Yn: "", pQid22_Proteinval: "", pQid22_Proteindate: "",
        pQid23_Yn: "", pQid24_Yn: "", pReportStatus: "U", pDeficiencyRemarks: "",
    });
}

function addSoapSubElements(soap: XMLNode, icdCodes: string[] = []): void {
    soap.ele("SUBJECTIVE", {
        pIllnessHistory: "", pSignsSymptoms: "", pOtherComplaint: "", pPainSite: "",
        pReportStatus: "U", pDeficiencyRemarks: "",
    });
    addPepert(soap);
    addPemiscs(soap);
    addPespecific(soap);
    const icds = soap.ele("ICDS");
    if (icdCodes.length > 0) {
        for (const icdCode of icdCodes) {
            icds.ele("ICD", {
                pIcdCode: icdCode,
                pReportStatus: "U",
                pDeficiencyRemarks: "",
            });
        }
    } else {
        icds.ele("ICD", { pIcdCode: "", pReportStatus: "U", pDeficiencyRemarks: "" });
    }
    soap.ele("DIAGNOSTICS").ele("DIAGNOSTIC", {
        pDiagnosticId: "", pOthRemarks: "", pIsPhysicianRecommendation: "",
        pPatientRemarks: "", pReportStatus: "U", pDeficiencyRemarks: "",
    });
    soap.ele("MANAGEMENTS").ele("MANAGEMENT", {
        pManagementId: "", pOthRemarks: "", pReportStatus: "U", pDeficiencyRemarks: "",
    });
    soap.ele("ADVICE", { pRemarks: "", pReportStatus: "U", pDeficiencyRemarks: "" });
}

// ─── Public API ───────────────────────────────────────────────────────────────

export interface BuildPcbXmlOptions {
    credentials: KonsultaHciCredentials;
    transmittalNumber: string;
    enlistments?: KonsultaEnlistmentData[];
    profiles?: KonsultaProfileData[];
    soaps?: KonsultaSoapData[];
}

/**
 * Builds a complete, DTD-valid PCB XML string using xmlbuilder2.
 *
 * All sections are required by the DTD, so empty placeholder elements are
 * generated when no real data is provided.
 */
export function buildPcbXml(options: BuildPcbXmlOptions): string {
    const {
        credentials,
        transmittalNumber,
        enlistments = [],
        profiles = [],
        soaps = [],
    } = options;

    const doc = create({ version: "1.0", encoding: "UTF-8" });
    const pcb = doc.ele("PCB", {
        pUsername: credentials.username,
        pPassword: credentials.password,
        pHciAccreNo: credentials.hciAccreNo,
        pPMCCNo: credentials.pmccNumber,
        pEnlistTotalCnt: String(enlistments.length > 0 ? enlistments.length : 1),
        pProfileTotalCnt: String(profiles.length > 0 ? profiles.length : 1),
        pSoapTotalCnt: String(soaps.length > 0 ? soaps.length : 1),
        pCertificationId: credentials.certificationId,
        pHciTransmittalNumber: transmittalNumber,
    });

    // ── ENLISTMENTS ──────────────────────────────────────────────────────────
    const enlistmentsEle = pcb.ele("ENLISTMENTS");
    if (enlistments.length > 0) {
        for (const e of enlistments) {
            enlistmentsEle.ele("ENLISTMENT", {
                pHciCaseNo: e.pHciCaseNo, pHciTransNo: e.pHciTransNo,
                pEffYear: e.pEffYear, pEnlistStat: e.pEnlistStat,
                pEnlistDate: e.pEnlistDate, pPackageType: e.pPackageType,
                pMemPin: e.pMemPin, pMemFname: e.pMemFname,
                pMemMname: e.pMemMname, pMemLname: e.pMemLname,
                pMemExtname: e.pMemExtname, pMemDob: e.pMemDob,
                pPatientPin: e.pPatientPin, pPatientFname: e.pPatientFname,
                pPatientMname: e.pPatientMname, pPatientLname: e.pPatientLname,
                pPatientExtname: e.pPatientExtname, pPatientSex: e.pPatientSex,
                pPatientDob: e.pPatientDob, pPatientType: e.pPatientType,
                pPatientMobileNo: e.pPatientMobileNo,
                pPatientLandlineNo: e.pPatientLandlineNo,
                pWithConsent: e.pWithConsent, pTransDate: e.pTransDate,
                pCreatedBy: e.pCreatedBy, pReportStatus: e.pReportStatus,
                pDeficiencyRemarks: e.pDeficiencyRemarks,
            });
        }
    } else {
        enlistmentsEle.ele("ENLISTMENT", {
            pHciCaseNo: "", pHciTransNo: "", pEffYear: "", pEnlistStat: "",
            pEnlistDate: "", pPackageType: "", pMemPin: "", pMemFname: "",
            pMemMname: "", pMemLname: "", pMemExtname: "", pMemDob: "",
            pPatientPin: "", pPatientFname: "", pPatientMname: "", pPatientLname: "",
            pPatientExtname: "", pPatientSex: "", pPatientDob: "", pPatientType: "",
            pPatientMobileNo: "", pPatientLandlineNo: "", pWithConsent: "",
            pTransDate: "", pCreatedBy: "", pReportStatus: "U", pDeficiencyRemarks: "",
        });
    }

    // ── PROFILING ────────────────────────────────────────────────────────────
    const profilingEle = pcb.ele("PROFILING");
    if (profiles.length > 0) {
        for (const p of profiles) {
            const profile = profilingEle.ele("PROFILE", {
                pHciTransNo: p.pHciTransNo, pHciCaseNo: p.pHciCaseNo,
                pProfDate: p.pProfDate, pPatientPin: p.pPatientPin,
                pPatientType: p.pPatientType, pPatientAge: p.pPatientAge,
                pMemPin: p.pMemPin, pEffYear: p.pEffYear,
                pATC: p.pATC, pIsWalkedIn: p.pIsWalkedIn,
                pTransDate: p.pTransDate, pReportStatus: p.pReportStatus,
                pDeficiencyRemarks: p.pDeficiencyRemarks,
            });
            addProfileSubElements(profile);
        }
    } else {
        const profile = profilingEle.ele("PROFILE", {
            pHciTransNo: "", pHciCaseNo: "", pProfDate: "", pPatientPin: "",
            pPatientType: "", pPatientAge: "", pMemPin: "", pEffYear: "",
            pATC: "", pIsWalkedIn: "", pTransDate: "", pReportStatus: "U",
            pDeficiencyRemarks: "",
        });
        addProfileSubElements(profile);
    }

    // ── SOAPS ────────────────────────────────────────────────────────────────
    const soapsEle = pcb.ele("SOAPS");
    if (soaps.length > 0) {
        for (const s of soaps) {
            const soap = soapsEle.ele("SOAP", {
                pHciCaseNo: s.pHciCaseNo, pHciTransNo: s.pHciTransNo,
                pSoapDate: s.pSoapDate, pPatientPin: s.pPatientPin,
                pPatientType: s.pPatientType, pMemPin: s.pMemPin,
                pEffYear: s.pEffYear, pATC: s.pATC,
                pIsWalkedIn: s.pIsWalkedIn, pCoPay: s.pCoPay,
                pTransDate: s.pTransDate, pReportStatus: s.pReportStatus,
                pDeficiencyRemarks: s.pDeficiencyRemarks,
            });
            addSoapSubElements(soap, s.icdCodes ?? []);
        }
    } else {
        const soap = soapsEle.ele("SOAP", {
            pHciCaseNo: "", pHciTransNo: "", pSoapDate: "", pPatientPin: "",
            pPatientType: "", pMemPin: "", pEffYear: "", pATC: "",
            pIsWalkedIn: "", pCoPay: "", pTransDate: "", pReportStatus: "U",
            pDeficiencyRemarks: "",
        });
        addSoapSubElements(soap);
    }

    // ── DIAGNOSTICEXAMRESULTS (omitted when empty — DTD requires DIAGNOSTICEXAMRESULT+ if present)
    // pcb.ele("DIAGNOSTICEXAMRESULTS") is intentionally skipped

    // ── MEDICINES ────────────────────────────────────────────────────────────
    pcb.ele("MEDICINES").ele("MEDICINE", {
        pHciCaseNo: "", pHciTransNo: "", pCategory: "", pDrugCode: "",
        pGenericCode: "", pSaltCode: "", pStrengthCode: "", pFormCode: "",
        pUnitCode: "", pPackageCode: "", pOtherMedicine: "", pRoute: "",
        pQuantity: "", pActualUnitPrice: "", pTotalAmtPrice: "",
        pInstructionQuantity: "", pInstructionStrength: "", pInstructionFrequency: "",
        pPrescribingPhysician: "", pIsDispensed: "", pDateDispensed: "",
        pDispensingPersonnel: "", pIsApplicable: "N", pDateAdded: "",
        pReportStatus: "U", pDeficiencyRemarks: "",
    });

    // ── DOCUMENTS ────────────────────────────────────────────────────────────
    pcb.ele("DOCUMENTS").ele("DOCUMENT", {
        pHciCaseNo: "", pHciTransNo: "", pPatientPin: "", pPatientType: "",
        pMemPin: "", pDocumentType: "", pDocumentUrl: "", pTransDate: "",
        pReportStatus: "U", pDeficiencyRemarks: "",
    });

    return doc.end({ headless: true });
}

/**
 * Generates a PhilHealth-compliant transmittal reference number.
 * Format: R + accreditation no (9 chars, padded/trimmed) + yyyymm (6) + seq (5) = 21 chars total.
 */
export function generateTransmittalNumber(hciAccreNo: string, seq = 1): string {
    const accre = hciAccreNo.padStart(9, "0").slice(-9);
    const yyyymm = new Date().toISOString().slice(0, 7).replace("-", "");
    const seqPadded = String(seq).padStart(5, "0");
    return `R${accre}${yyyymm}${seqPadded}`;
}

// ─── PhilHealth-issued YNXTSTP staging test data ──────────────────────────────

/** Converts a PhilHealth Oracle date string ("DD-MON-YY") to ISO "YYYY-MM-DD". */
function parseOracleDate(d: string): string {
    const MON: Record<string, string> = {
        JAN: "01", FEB: "02", MAR: "03", APR: "04", MAY: "05", JUN: "06",
        JUL: "07", AUG: "08", SEP: "09", OCT: "10", NOV: "11", DEC: "12",
    };
    const [day, mon, yy] = d.split("-");
    const yr = parseInt(yy, 10) < 50 ? `20${yy}` : `19${yy}`;
    return `${yr}-${MON[mon]}-${day.padStart(2, "0")}`;
}

// Compact row: [type, pin, firstName, middleName, lastName, birthday, sex]
type RawTestRow = ["MM" | "DD", string, string, string, string, string, "M" | "F"];

const _RAW_TEST_ROWS: RawTestRow[] = [
    // ── MM members (HCI P10038831, registered 08-APR-26) ────────────────────
    ["MM", "190270938837", "YNXTSTP FN ONE", "YNXTSTP MN ONE", "YNXTSTP LN ONE", "02-JAN-84", "M"],
    ["MM", "190270938845", "YNXTSTP FN TWO", "YNXTSTP MN TWO", "YNXTSTP LN TWO", "03-JAN-84", "F"],
    ["MM", "190270938853", "YNXTSTP FN THREE", "YNXTSTP MN THREE", "YNXTSTP LN THREE", "04-JAN-84", "M"],
    ["MM", "190270938861", "YNXTSTP FN FOUR", "YNXTSTP MN FOUR", "YNXTSTP LN FOUR", "05-JAN-84", "F"],
    ["MM", "190270938888", "YNXTSTP FN FIVE", "YNXTSTP MN FIVE", "YNXTSTP LN FIVE", "06-JAN-84", "M"],
    ["MM", "190270938896", "YNXTSTP FN SIX", "YNXTSTP MN SIX", "YNXTSTP LN SIX", "07-JAN-84", "F"],
    ["MM", "190270938918", "YNXTSTP FN SEVEN", "YNXTSTP MN SEVEN", "YNXTSTP LN SEVEN", "08-JAN-84", "M"],
    ["MM", "190270938926", "YNXTSTP FN EIGHT", "YNXTSTP MN EIGHT", "YNXTSTP LN EIGHT", "09-JAN-84", "F"],
    ["MM", "190270938934", "YNXTSTP FN NINE", "YNXTSTP MN NINE", "YNXTSTP LN NINE", "10-JAN-84", "M"],
    ["MM", "190270938942", "YNXTSTP FN TEN", "YNXTSTP MN TEN", "YNXTSTP LN TEN", "11-JAN-84", "F"],
    ["MM", "190270938950", "YNXTSTP FN ELEVEN", "YNXTSTP MN ELEVEN", "YNXTSTP LN ELEVEN", "12-JAN-84", "M"],
    ["MM", "190270938969", "YNXTSTP FN TWELVE", "YNXTSTP MN TWELVE", "YNXTSTP LN TWELVE", "13-JAN-84", "F"],
    ["MM", "190270938977", "YNXTSTP FN THIRTEEN", "YNXTSTP MN THIRTEEN", "YNXTSTP LN THIRTEEN", "14-JAN-84", "M"],
    ["MM", "190270938985", "YNXTSTP FN FOURTEEN", "YNXTSTP MN FOURTEEN", "YNXTSTP LN FOURTEEN", "15-JAN-84", "F"],
    ["MM", "190270938993", "YNXTSTP FN FIFTEEN", "YNXTSTP MN FIFTEEN", "YNXTSTP LN FIFTEEN", "16-JAN-84", "M"],
    ["MM", "190270939000", "YNXTSTP FN SIXTEEN", "YNXTSTP MN SIXTEEN", "YNXTSTP LN SIXTEEN", "17-JAN-84", "F"],
    ["MM", "190270939019", "YNXTSTP FN SEVENTEEN", "YNXTSTP MN SEVENTEEN", "YNXTSTP LN SEVENTEEN", "18-JAN-84", "M"],
    ["MM", "190270939027", "YNXTSTP FN EIGHTEEN", "YNXTSTP MN EIGHTEEN", "YNXTSTP LN EIGHTEEN", "19-JAN-84", "F"],
    ["MM", "190270939035", "YNXTSTP FN NINETEEN", "YNXTSTP MN NINETEEN", "YNXTSTP LN NINETEEN", "20-JAN-84", "M"],
    ["MM", "190270939043", "YNXTSTP FN TWENTY", "YNXTSTP MN TWENTY", "YNXTSTP LN TWENTY", "21-JAN-84", "F"],
    ["MM", "190270939051", "YNXTSTP FN TWENTY ONE", "YNXTSTP MN TWENTY ONE", "YNXTSTP LN TWENTY ONE", "22-JAN-84", "M"],
    ["MM", "190270939078", "YNXTSTP FN TWENTY TWO", "YNXTSTP MN TWENTY TWO", "YNXTSTP LN TWENTY TWO", "23-JAN-84", "F"],
    ["MM", "190270939086", "YNXTSTP FN TWENTY THREE", "YNXTSTP MN TWENTY THREE", "YNXTSTP LN TWENTY THREE", "24-JAN-84", "M"],
    ["MM", "190270939094", "YNXTSTP FN TWENTY FOUR", "YNXTSTP MN TWENTY FOUR", "YNXTSTP LN TWENTY FOUR", "25-JAN-84", "F"],
    ["MM", "190270939108", "YNXTSTP FN TWENTY FIVE", "YNXTSTP MN TWENTY FIVE", "YNXTSTP LN TWENTY FIVE", "26-JAN-84", "M"],
    ["MM", "190270939116", "YNXTSTP FN TWENTY SIX", "YNXTSTP MN TWENTY SIX", "YNXTSTP LN TWENTY SIX", "27-JAN-84", "F"],
    ["MM", "190270939124", "YNXTSTP FN TWENTY SEVEN", "YNXTSTP MN TWENTY SEVEN", "YNXTSTP LN TWENTY SEVEN", "28-JAN-84", "M"],
    ["MM", "190270939132", "YNXTSTP FN TWENTY EIGHT", "YNXTSTP MN TWENTY EIGHT", "YNXTSTP LN TWENTY EIGHT", "29-JAN-84", "F"],
    ["MM", "190270939140", "YNXTSTP FN TWENTY NINE", "YNXTSTP MN TWENTY NINE", "YNXTSTP LN TWENTY NINE", "30-JAN-84", "M"],
    ["MM", "190270939159", "YNXTSTP FN THIRTY", "YNXTSTP MN THIRTY", "YNXTSTP LN THIRTY", "31-JAN-84", "F"],
    ["MM", "190270939167", "YNXTSTP FN THIRTY ONE", "YNXTSTP MN THIRTY ONE", "YNXTSTP LN THIRTY ONE", "01-FEB-84", "M"],
    ["MM", "190270939175", "YNXTSTP FN THIRTY TWO", "YNXTSTP MN THIRTY TWO", "YNXTSTP LN THIRTY TWO", "02-FEB-84", "F"],
    ["MM", "190270939183", "YNXTSTP FN THIRTY THREE", "YNXTSTP MN THIRTY THREE", "YNXTSTP LN THIRTY THREE", "03-FEB-84", "M"],
    ["MM", "190270939191", "YNXTSTP FN THIRTY FOUR", "YNXTSTP MN THIRTY FOUR", "YNXTSTP LN THIRTY FOUR", "04-FEB-84", "F"],
    ["MM", "190270939205", "YNXTSTP FN THIRTY FIVE", "YNXTSTP MN THIRTY FIVE", "YNXTSTP LN THIRTY FIVE", "05-FEB-84", "M"],
    ["MM", "190270939213", "YNXTSTP FN THIRTY SIX", "YNXTSTP MN THIRTY SIX", "YNXTSTP LN THIRTY SIX", "06-FEB-84", "F"],
    ["MM", "190270939221", "YNXTSTP FN THIRTY SEVEN", "YNXTSTP MN THIRTY SEVEN", "YNXTSTP LN THIRTY SEVEN", "07-FEB-84", "M"],
    ["MM", "190270939248", "YNXTSTP FN THIRTY EIGHT", "YNXTSTP MN THIRTY EIGHT", "YNXTSTP LN THIRTY EIGHT", "08-FEB-84", "F"],
    ["MM", "190270939256", "YNXTSTP FN THIRTY NINE", "YNXTSTP MN THIRTY NINE", "YNXTSTP LN THIRTY NINE", "09-FEB-84", "M"],
    ["MM", "190270939264", "YNXTSTP FN FORTY", "YNXTSTP MN FORTY", "YNXTSTP LN FORTY", "10-FEB-84", "F"],
    ["MM", "190270939272", "YNXTSTP FN FORTY ONE", "YNXTSTP MN FORTY ONE", "YNXTSTP LN FORTY ONE", "11-FEB-84", "M"],
    ["MM", "190270939280", "YNXTSTP FN FORTY TWO", "YNXTSTP MN FORTY TWO", "YNXTSTP LN FORTY TWO", "12-FEB-84", "F"],
    ["MM", "190270939299", "YNXTSTP FN FORTY THREE", "YNXTSTP MN FORTY THREE", "YNXTSTP LN FORTY THREE", "13-FEB-84", "M"],
    ["MM", "190270939302", "YNXTSTP FN FORTY FOUR", "YNXTSTP MN FORTY FOUR", "YNXTSTP LN FORTY FOUR", "14-FEB-84", "F"],
    ["MM", "190270939310", "YNXTSTP FN FORTY FIVE", "YNXTSTP MN FORTY FIVE", "YNXTSTP LN FORTY FIVE", "15-FEB-84", "M"],
    ["MM", "190270939329", "YNXTSTP FN FORTY SIX", "YNXTSTP MN FORTY SIX", "YNXTSTP LN FORTY SIX", "16-FEB-84", "F"],
    ["MM", "190270939337", "YNXTSTP FN FORTY SEVEN", "YNXTSTP MN FORTY SEVEN", "YNXTSTP LN FORTY SEVEN", "17-FEB-84", "M"],
    ["MM", "190270939345", "YNXTSTP FN FORTY EIGHT", "YNXTSTP MN FORTY EIGHT", "YNXTSTP LN FORTY EIGHT", "18-FEB-84", "F"],
    ["MM", "190270939353", "YNXTSTP FN FORTY NINE", "YNXTSTP MN FORTY NINE", "YNXTSTP LN FORTY NINE", "19-FEB-84", "M"],
    ["MM", "190270939361", "YNXTSTP FN FIFTY", "YNXTSTP MN FIFTY", "YNXTSTP LN FIFTY", "20-FEB-84", "F"],
    ["MM", "190270939388", "YNXTSTP FN FIFTY ONE", "YNXTSTP MN FIFTY ONE", "YNXTSTP LN FIFTY ONE", "21-FEB-84", "M"],
    ["MM", "190270939396", "YNXTSTP FN FIFTY TWO", "YNXTSTP MN FIFTY TWO", "YNXTSTP LN FIFTY TWO", "22-FEB-84", "F"],
    ["MM", "190270939418", "YNXTSTP FN FIFTY THREE", "YNXTSTP MN FIFTY THREE", "YNXTSTP LN FIFTY THREE", "23-FEB-84", "M"],
    ["MM", "190270939426", "YNXTSTP FN FIFTY FOUR", "YNXTSTP MN FIFTY FOUR", "YNXTSTP LN FIFTY FOUR", "24-FEB-84", "F"],
    ["MM", "190270939434", "YNXTSTP FN FIFTY FIVE", "YNXTSTP MN FIFTY FIVE", "YNXTSTP LN FIFTY FIVE", "25-FEB-84", "M"],
    ["MM", "190270939442", "YNXTSTP FN FIFTY SIX", "YNXTSTP MN FIFTY SIX", "YNXTSTP LN FIFTY SIX", "26-FEB-84", "F"],
    ["MM", "190270939450", "YNXTSTP FN FIFTY SEVEN", "YNXTSTP MN FIFTY SEVEN", "YNXTSTP LN FIFTY SEVEN", "27-FEB-84", "M"],
    ["MM", "190270939469", "YNXTSTP FN FIFTY EIGHT", "YNXTSTP MN FIFTY EIGHT", "YNXTSTP LN FIFTY EIGHT", "28-FEB-84", "F"],
    ["MM", "190270939477", "YNXTSTP FN FIFTY NINE", "YNXTSTP MN FIFTY NINE", "YNXTSTP LN FIFTY NINE", "29-FEB-84", "M"],
    ["MM", "190270939485", "YNXTSTP FN SIXTY", "YNXTSTP MN SIXTY", "YNXTSTP LN SIXTY", "01-MAR-84", "F"],
    ["MM", "190270939493", "YNXTSTP FN SIXTY ONE", "YNXTSTP MN SIXTY ONE", "YNXTSTP LN SIXTY ONE", "02-MAR-84", "M"],
    ["MM", "190270939507", "YNXTSTP FN SIXTY TWO", "YNXTSTP MN SIXTY TWO", "YNXTSTP LN SIXTY TWO", "03-MAR-84", "F"],
    ["MM", "190270939515", "YNXTSTP FN SIXTY THREE", "YNXTSTP MN SIXTY THREE", "YNXTSTP LN SIXTY THREE", "04-MAR-84", "M"],
    ["MM", "190270939523", "YNXTSTP FN SIXTY FOUR", "YNXTSTP MN SIXTY FOUR", "YNXTSTP LN SIXTY FOUR", "05-MAR-84", "F"],
    ["MM", "190270939531", "YNXTSTP FN SIXTY FIVE", "YNXTSTP MN SIXTY FIVE", "YNXTSTP LN SIXTY FIVE", "06-MAR-84", "M"],
    ["MM", "190270939558", "YNXTSTP FN SIXTY SIX", "YNXTSTP MN SIXTY SIX", "YNXTSTP LN SIXTY SIX", "07-MAR-84", "F"],
    ["MM", "190270939566", "YNXTSTP FN SIXTY SEVEN", "YNXTSTP MN SIXTY SEVEN", "YNXTSTP LN SIXTY SEVEN", "08-MAR-84", "M"],
    ["MM", "190270939574", "YNXTSTP FN SIXTY EIGHT", "YNXTSTP MN SIXTY EIGHT", "YNXTSTP LN SIXTY EIGHT", "09-MAR-84", "F"],
    ["MM", "190270939582", "YNXTSTP FN SIXTY NINE", "YNXTSTP MN SIXTY NINE", "YNXTSTP LN SIXTY NINE", "10-MAR-84", "M"],
    ["MM", "190270939590", "YNXTSTP FN SEVENTY", "YNXTSTP MN SEVENTY", "YNXTSTP LN SEVENTY", "11-MAR-84", "F"],
    ["MM", "190270939604", "YNXTSTP FN SEVENTY ONE", "YNXTSTP MN SEVENTY ONE", "YNXTSTP LN SEVENTY ONE", "12-MAR-84", "M"],
    ["MM", "190270939612", "YNXTSTP FN SEVENTY TWO", "YNXTSTP MN SEVENTY TWO", "YNXTSTP LN SEVENTY TWO", "13-MAR-84", "F"],
    ["MM", "190270939620", "YNXTSTP FN SEVENTY THREE", "YNXTSTP MN SEVENTY THREE", "YNXTSTP LN SEVENTY THREE", "14-MAR-84", "M"],
    ["MM", "190270939639", "YNXTSTP FN SEVENTY FOUR", "YNXTSTP MN SEVENTY FOUR", "YNXTSTP LN SEVENTY FOUR", "15-MAR-84", "F"],
    ["MM", "190270939647", "YNXTSTP FN SEVENTY FIVE", "YNXTSTP MN SEVENTY FIVE", "YNXTSTP LN SEVENTY FIVE", "16-MAR-84", "M"],
    ["MM", "190270939655", "YNXTSTP FN SEVENTY SIX", "YNXTSTP MN SEVENTY SIX", "YNXTSTP LN SEVENTY SIX", "17-MAR-84", "F"],
    ["MM", "190270939663", "YNXTSTP FN SEVENTY SEVEN", "YNXTSTP MN SEVENTY SEVEN", "YNXTSTP LN SEVENTY SEVEN", "18-MAR-84", "M"],
    ["MM", "190270939671", "YNXTSTP FN SEVENTY EIGHT", "YNXTSTP MN SEVENTY EIGHT", "YNXTSTP LN SEVENTY EIGHT", "19-MAR-84", "F"],
    ["MM", "190270939698", "YNXTSTP FN SEVENTY NINE", "YNXTSTP MN SEVENTY NINE", "YNXTSTP LN SEVENTY NINE", "20-MAR-84", "M"],
    ["MM", "190270939701", "YNXTSTP FN EIGHTY", "YNXTSTP MN EIGHTY", "YNXTSTP LN EIGHTY", "21-MAR-84", "F"],
    ["MM", "190270939728", "YNXTSTP FN EIGHTY ONE", "YNXTSTP MN EIGHTY ONE", "YNXTSTP LN EIGHTY ONE", "22-MAR-84", "M"],
    ["MM", "190270939736", "YNXTSTP FN EIGHTY TWO", "YNXTSTP MN EIGHTY TWO", "YNXTSTP LN EIGHTY TWO", "23-MAR-84", "F"],
    ["MM", "190270939744", "YNXTSTP FN EIGHTY THREE", "YNXTSTP MN EIGHTY THREE", "YNXTSTP LN EIGHTY THREE", "24-MAR-84", "M"],
    ["MM", "190270939752", "YNXTSTP FN EIGHTY FOUR", "YNXTSTP MN EIGHTY FOUR", "YNXTSTP LN EIGHTY FOUR", "25-MAR-84", "F"],
    ["MM", "190270939760", "YNXTSTP FN EIGHTY FIVE", "YNXTSTP MN EIGHTY FIVE", "YNXTSTP LN EIGHTY FIVE", "26-MAR-84", "M"],
    ["MM", "190270939779", "YNXTSTP FN EIGHTY SIX", "YNXTSTP MN EIGHTY SIX", "YNXTSTP LN EIGHTY SIX", "27-MAR-84", "F"],
    ["MM", "190270939787", "YNXTSTP FN EIGHTY SEVEN", "YNXTSTP MN EIGHTY SEVEN", "YNXTSTP LN EIGHTY SEVEN", "28-MAR-84", "M"],
    ["MM", "190270939795", "YNXTSTP FN EIGHTY EIGHT", "YNXTSTP MN EIGHTY EIGHT", "YNXTSTP LN EIGHTY EIGHT", "29-MAR-84", "F"],
    ["MM", "190270939809", "YNXTSTP FN EIGHTY NINE", "YNXTSTP MN EIGHTY NINE", "YNXTSTP LN EIGHTY NINE", "30-MAR-84", "M"],
    ["MM", "190270939817", "YNXTSTP FN NINETY", "YNXTSTP MN NINETY", "YNXTSTP LN NINETY", "31-MAR-84", "F"],
    // ── DD dependents ────────────────────────────────────────────────────────
    ["DD", "012523472354", "DEPENDENT", "ONE", "YNXTSTP LN ONE", "01-MAR-26", "M"],
    ["DD", "012523472362", "DEPENDENT", "TWO", "YNXTSTP LN TWO", "01-MAR-26", "F"],
    ["DD", "012523472370", "DEPENDENT", "THREE", "YNXTSTP LN THREE", "01-MAR-26", "M"],
    ["DD", "012523472389", "DEPENDENT", "FOUR", "YNXTSTP LN FOUR", "01-NOV-24", "F"],
    ["DD", "012523472397", "DEPENDENT", "FIVE", "YNXTSTP LN FIVE", "01-NOV-13", "M"],
    ["DD", "012523472400", "DEPENDENT", "SIX", "YNXTSTP LN SIX", "01-NOV-23", "F"],
    ["DD", "012523472419", "DEPENDENT", "SEVEN", "YNXTSTP LN SEVEN", "01-NOV-55", "M"],
    ["DD", "012523472427", "DEPENDENT", "EIGHT", "YNXTSTP LN EIGHT", "01-NOV-55", "F"],
    ["DD", "012523472435", "DEPENDENT", "NINE", "YNXTSTP LN NINE", "01-NOV-85", "F"],
    ["DD", "012523472443", "DEPENDENT", "TEN", "YNXTSTP LN TEN", "01-NOV-85", "M"],
    ["DD", "012523472451", "DEPENDENT", "ELEVEN", "YNXTSTP LN ELEVEN", "01-NOV-55", "M"],
    ["DD", "012523472478", "DEPENDENT", "TWELVE", "YNXTSTP LN TWELVE", "01-NOV-55", "F"],
    ["DD", "012523472486", "DEPENDENT", "THIRTEEN", "YNXTSTP LN THIRTEEN", "01-NOV-85", "M"],
    ["DD", "012523472494", "DEPENDENT", "FOURTEEN", "YNXTSTP LN FOURTEEN", "01-NOV-85", "F"],
];

// Primary MM member used as the sponsor for all DD entries
const _PRIMARY_MM_PIN = "190270938837";
const _PRIMARY_MM_DOB = parseOracleDate("02-JAN-84"); // "1984-01-02"
const _PRIMARY_MM_FN = "YNXTSTP FN ONE";
const _PRIMARY_MM_MN = "YNXTSTP MN ONE";
const _PRIMARY_MM_LN = "YNXTSTP LN ONE";
const _ASSIGNED_DATE = parseOracleDate("08-APR-26"); // "2026-04-08"

/**
 * PhilHealth-issued YNXTSTP staging test members for HCI P10038831.
 * 90 principal members (MM) and 14 dependents (DD), registered 08-APR-26.
 * Use as fallback when extractRegistrationList is unavailable.
 */
export const STAGING_TEST_MEMBERS: ErlAssignment[] = _RAW_TEST_ROWS.map(
    ([type, pin, fn, mn, ln, bday, sex]) => {
        const isMM = type === "MM";
        const dob = parseOracleDate(bday);
        return {
            pAssignedPin: pin,
            pAssignedLastName: ln,
            pAssignedFirstName: fn,
            pAssignedMiddleName: mn,
            pAssignedExtName: "",
            pAssignedDateOfBirth: dob,
            pAssignedSex: sex,
            pAssignedType: type,
            pPrimaryPIN: isMM ? pin : _PRIMARY_MM_PIN,
            pPrimaryLastName: isMM ? ln : _PRIMARY_MM_LN,
            pPrimaryFirstName: isMM ? fn : _PRIMARY_MM_FN,
            pPrimaryMiddleName: isMM ? mn : _PRIMARY_MM_MN,
            pPrimaryExtName: "",
            pPrimaryDateOfBirth: isMM ? dob : _PRIMARY_MM_DOB,
            pMobileNumber: "",
            pPackageType: "K",
            pEffYear: "2026",
            pAssignedDate: _ASSIGNED_DATE,
        };
    }
);

/**
 * Builds a staging test PCB XML using the given HCI credentials.
 * When an `erlMember` is supplied (from extractRegistrationList), the
 * real member/patient data is used; otherwise falls back to
 * STAGING_TEST_MEMBERS[0] (first YNXTSTP test member).
 *
 * Encrypt the output with credentials.cipherKey.
 *
 * @param credentials       - Real HCI credentials.
 * @param transmittalNumber - Optional override; defaults to a fresh number.
 * @param _testPin          - Unused; kept for call-site compatibility.
 * @param erlMember         - ASSIGNMENT from an ERL response; overrides the
 *                            YNXTSTP fallback when provided.
 */
export function buildStagingTestPcbXml(
    credentials: KonsultaHciCredentials,
    transmittalNumber?: string,
    _testPin?: string,
    erlMember?: ErlAssignment
): string {
    const transmittalNum = transmittalNumber ?? generateTransmittalNumber(credentials.hciAccreNo);
    const accre = credentials.hciAccreNo.padStart(9, "0").slice(-9);
    const _now = new Date();
    const sampleYYYY = _now.getFullYear().toString();
    const sampleMM = String(_now.getMonth() + 1).padStart(2, "0");
    const sampleDate = `${sampleYYYY}-${sampleMM}-01`;
    const sampleCaseNo = `T${accre}${sampleYYYY}${sampleMM}00001`;
    const sampleTransNo = `P${accre}${sampleYYYY}${sampleMM}00001`;

    // ── Use YNXTSTP test data when no ERL member was retrieved ──────────────
    const member = erlMember ?? STAGING_TEST_MEMBERS[0];
    const isMM = member.pAssignedType === "MM";

    const memPin = isMM ? member.pAssignedPin : member.pPrimaryPIN;
    const memFname = isMM ? member.pAssignedFirstName : member.pPrimaryFirstName;
    const memMname = isMM ? member.pAssignedMiddleName : member.pPrimaryMiddleName;
    const memLname = isMM ? member.pAssignedLastName : member.pPrimaryLastName;
    const memExtname = isMM ? member.pAssignedExtName : member.pPrimaryExtName;
    const memDob = isMM ? member.pAssignedDateOfBirth : member.pPrimaryDateOfBirth;

    const patientPin = member.pAssignedPin;
    const patientFname = member.pAssignedFirstName;
    const patientMname = member.pAssignedMiddleName;
    const patientLname = member.pAssignedLastName;
    const patientExtname = member.pAssignedExtName;
    const patientSex = member.pAssignedSex;
    const patientDob = member.pAssignedDateOfBirth;
    const patientType = member.pAssignedType;
    // Generate a deterministic fake PH mobile (09XXXXXXXXX) from the last 9
    // digits of the PIN when the ERL/test data does not supply a real number.
    const patientMobile = member.pMobileNumber || `09${member.pAssignedPin.slice(-9)}`;
    const effYear = member.pEffYear || sampleYYYY;
    const packageType = member.pPackageType || "K";
    const enlistDate = member.pAssignedDate || today();
    const patientAge = formatAge(patientDob);
    // ─────────────────────────────────────────────────────────────────────────

    const doc = create({ version: "1.0", encoding: "UTF-8" });
    const pcb = doc.ele("PCB", {
        pUsername: credentials.username,
        pPassword: credentials.password,
        pHciAccreNo: credentials.hciAccreNo,
        pPMCCNo: credentials.pmccNumber,
        pEnlistTotalCnt: "1",
        pProfileTotalCnt: "1",
        pSoapTotalCnt: "1",
        pCertificationId: credentials.certificationId,
        pHciTransmittalNumber: transmittalNum,
    });

    // ── ENLISTMENTS ──────────────────────────────────────────────────────────
    pcb.ele("ENLISTMENTS").ele("ENLISTMENT", {
        pHciCaseNo: sampleCaseNo,
        pHciTransNo: sampleTransNo,
        pEffYear: effYear,
        pEnlistStat: "1",
        pEnlistDate: enlistDate,
        pPackageType: packageType,
        pMemPin: memPin,
        pMemFname: memFname,
        pMemMname: memMname,
        pMemLname: memLname,
        pMemExtname: memExtname,
        pMemDob: memDob,
        pPatientPin: patientPin,
        pPatientFname: patientFname,
        pPatientMname: patientMname,
        pPatientLname: patientLname,
        pPatientExtname: patientExtname,
        pPatientSex: patientSex,
        pPatientDob: patientDob,
        pPatientType: patientType,
        pPatientMobileNo: patientMobile,
        pPatientLandlineNo: "",
        pWithConsent: "Y",
        pTransDate: enlistDate,
        pCreatedBy: "TEST01",
        pReportStatus: "U",
        pDeficiencyRemarks: "",
    });

    // ── PROFILING ────────────────────────────────────────────────────────────
    const profile = pcb.ele("PROFILING").ele("PROFILE", {
        pHciTransNo: sampleTransNo,
        pHciCaseNo: sampleCaseNo,
        pProfDate: enlistDate,
        pPatientPin: patientPin,
        pPatientType: patientType,
        pPatientAge: patientAge,
        pMemPin: memPin,
        pEffYear: effYear,
        pATC: "JruBaQ2Y",
        pIsWalkedIn: "N",
        pTransDate: "2022-08-27",
        pReportStatus: "U",
        pDeficiencyRemarks: "",
    });

    const medhists = profile.ele("MEDHISTS");
    medhists.ele("MEDHIST", { pMdiseaseCode: "001", pReportStatus: "U", pDeficiencyRemarks: "" });
    medhists.ele("MEDHIST", { pMdiseaseCode: "002", pReportStatus: "U", pDeficiencyRemarks: "" });

    profile.ele("MHSPECIFICS").ele("MHSPECIFIC", {
        pMdiseaseCode: "001", pSpecificDesc: "SAMPLE ALLERGY", pReportStatus: "U", pDeficiencyRemarks: "",
    });

    profile.ele("SURGHISTS").ele("SURGHIST", {
        pSurgDesc: "SAMPLE OPERATION", pSurgDate: "2022-06-01", pReportStatus: "U", pDeficiencyRemarks: "",
    });

    const famhists = profile.ele("FAMHISTS");
    famhists.ele("FAMHIST", { pMdiseaseCode: "002", pReportStatus: "U", pDeficiencyRemarks: "" });
    famhists.ele("FAMHIST", { pMdiseaseCode: "006", pReportStatus: "U", pDeficiencyRemarks: "" });

    profile.ele("FHSPECIFICS").ele("FHSPECIFIC", {
        pMdiseaseCode: "", pSpecificDesc: "", pReportStatus: "U", pDeficiencyRemarks: "",
    });

    profile.ele("SOCHIST", {
        pIsSmoker: "N", pNoCigpk: "", pIsAdrinker: "N", pNoBottles: "",
        pIllDrugUser: "N", pIsSexuallyActive: "N", pReportStatus: "U", pDeficiencyRemarks: "",
    });

    const immunizations = profile.ele("IMMUNIZATIONS");
    for (const attrs of [
        { pChildImmcode: "C01", pYoungwImmcode: "", pPregwImmcode: "", pElderlyImmcode: "" },
        { pChildImmcode: "C02", pYoungwImmcode: "", pPregwImmcode: "", pElderlyImmcode: "" },
        { pChildImmcode: "C04", pYoungwImmcode: "", pPregwImmcode: "", pElderlyImmcode: "" },
        { pChildImmcode: "C08", pYoungwImmcode: "", pPregwImmcode: "", pElderlyImmcode: "" },
        { pChildImmcode: "C09", pYoungwImmcode: "", pPregwImmcode: "", pElderlyImmcode: "" },
        { pChildImmcode: "C13", pYoungwImmcode: "", pPregwImmcode: "", pElderlyImmcode: "" },
        { pChildImmcode: "", pYoungwImmcode: "999", pPregwImmcode: "", pElderlyImmcode: "" },
        { pChildImmcode: "", pYoungwImmcode: "", pPregwImmcode: "999", pElderlyImmcode: "" },
        { pChildImmcode: "", pYoungwImmcode: "", pPregwImmcode: "", pElderlyImmcode: "999" },
    ]) {
        immunizations.ele("IMMUNIZATION", { ...attrs, pOtherImm: "", pReportStatus: "U", pDeficiencyRemarks: "" });
    }

    profile.ele("MENSHIST", {
        pMenarchePeriod: "0", pLastMensPeriod: "", pPeriodDuration: "0", pMensInterval: "0",
        pPadsPerDay: "0", pOnsetSexIc: "0", pBirthCtrlMethod: "", pIsMenopause: "",
        pMenopauseAge: "", pIsApplicable: "N", pReportStatus: "U", pDeficiencyRemarks: "",
    });

    profile.ele("PREGHIST", {
        pPregCnt: "0", pDeliveryCnt: "0", pDeliveryTyp: "X", pFullTermCnt: "0",
        pPrematureCnt: "0", pAbortionCnt: "0", pLivChildrenCnt: "0",
        pWPregIndhyp: "N", pWFamPlan: "N", pIsApplicable: "N", pReportStatus: "U", pDeficiencyRemarks: "",
    });

    profile.ele("PEPERT", {
        pSystolic: "95", pDiastolic: "58", pHr: "110", pRr: "30", pTemp: "36.10",
        pHeight: "0", pWeight: "8.9", pBMI: "0", pZScore: "> +3SD",
        pLeftVision: "20", pRightVision: "20", pLength: "63", pHeadCirc: "46",
        pSkinfoldThickness: "46", pWaist: "48", pHip: "50", pLimbs: "40",
        pMidUpperArmCirc: "14.0", pReportStatus: "U", pDeficiencyRemarks: "",
    });

    profile.ele("BLOODTYPE", { pBloodType: "B+", pReportStatus: "U", pDeficiencyRemarks: "" });
    profile.ele("PEGENSURVEY", { pGenSurveyId: "1", pGenSurveyRem: "", pReportStatus: "U", pDeficiencyRemarks: "" });

    const pemiscs = profile.ele("PEMISCS");
    for (const attrs of [
        { pSkinId: "", pHeentId: "11", pChestId: "", pHeartId: "", pAbdomenId: "", pNeuroId: "", pRectalId: "", pGuId: "" },
        { pSkinId: "", pHeentId: "", pChestId: "8", pHeartId: "", pAbdomenId: "", pNeuroId: "", pRectalId: "", pGuId: "" },
        { pSkinId: "", pHeentId: "", pChestId: "", pHeartId: "5", pAbdomenId: "", pNeuroId: "", pRectalId: "", pGuId: "" },
        { pSkinId: "", pHeentId: "", pChestId: "", pHeartId: "", pAbdomenId: "7", pNeuroId: "", pRectalId: "", pGuId: "" },
        { pSkinId: "", pHeentId: "", pChestId: "", pHeartId: "", pAbdomenId: "", pNeuroId: "", pRectalId: "", pGuId: "99" },
        { pSkinId: "", pHeentId: "", pChestId: "", pHeartId: "", pAbdomenId: "", pNeuroId: "", pRectalId: "3", pGuId: "" },
        { pSkinId: "1", pHeentId: "", pChestId: "", pHeartId: "", pAbdomenId: "", pNeuroId: "", pRectalId: "", pGuId: "" },
        { pSkinId: "", pHeentId: "", pChestId: "", pHeartId: "", pAbdomenId: "", pNeuroId: "6", pRectalId: "", pGuId: "" },
    ]) {
        pemiscs.ele("PEMISC", { ...attrs, pReportStatus: "U", pDeficiencyRemarks: "" });
    }

    profile.ele("PESPECIFIC", {
        pSkinRem: "", pHeentRem: "", pChestRem: "", pHeartRem: "", pAbdomenRem: "",
        pNeuroRem: "", pRectalRem: "", pGuRem: "SAMPLE REMARKS", pReportStatus: "U", pDeficiencyRemarks: "",
    });

    profile.ele("NCDQANS", {
        pQid1_Yn: "", pQid2_Yn: "", pQid3_Yn: "", pQid4_Yn: "",
        pQid5_Ynx: "", pQid6_Yn: "", pQid7_Yn: "", pQid8_Yn: "", pQid9_Yn: "",
        pQid10_Yn: "", pQid11_Yn: "", pQid12_Yn: "", pQid13_Yn: "", pQid14_Yn: "",
        pQid15_Yn: "", pQid16_Yn: "", pQid17_Abcde: "", pQid18_Yn: "", pQid19_Yn: "",
        pQid19_Fbsmg: "", pQid19_Fbsmmol: "", pQid19_Fbsdate: "", pQid20_Yn: "",
        pQid20_Choleval: "", pQid20_Choledate: "", pQid21_Yn: "", pQid21_Ketonval: "",
        pQid21_Ketondate: "", pQid22_Yn: "", pQid22_Proteinval: "", pQid22_Proteindate: "",
        pQid23_Yn: "", pQid24_Yn: "", pReportStatus: "U", pDeficiencyRemarks: "",
    });

    // ── SOAPS ────────────────────────────────────────────────────────────────
    const soap = pcb.ele("SOAPS").ele("SOAP", {
        pHciCaseNo: "", pHciTransNo: "", pSoapDate: "", pPatientPin: "",
        pPatientType: "", pMemPin: "", pEffYear: "", pATC: "",
        pIsWalkedIn: "", pCoPay: "", pTransDate: "", pReportStatus: "U", pDeficiencyRemarks: "",
    });
    soap.ele("SUBJECTIVE", { pIllnessHistory: "", pSignsSymptoms: "", pOtherComplaint: "", pPainSite: "", pReportStatus: "U", pDeficiencyRemarks: "" });
    soap.ele("PEPERT", {
        pSystolic: "", pDiastolic: "", pHr: "", pRr: "", pTemp: "", pHeight: "",
        pWeight: "", pBMI: "", pZScore: "", pLeftVision: "", pRightVision: "",
        pLength: "", pHeadCirc: "", pSkinfoldThickness: "", pWaist: "", pHip: "",
        pLimbs: "", pMidUpperArmCirc: "", pReportStatus: "U", pDeficiencyRemarks: "",
    });
    soap.ele("PEMISCS").ele("PEMISC", {
        pSkinId: "", pHeentId: "", pChestId: "", pHeartId: "", pAbdomenId: "",
        pNeuroId: "", pGuId: "", pRectalId: "", pReportStatus: "U", pDeficiencyRemarks: "",
    });
    soap.ele("PESPECIFIC", { pSkinRem: "", pHeentRem: "", pChestRem: "", pHeartRem: "", pAbdomenRem: "", pNeuroRem: "", pRectalRem: "", pGuRem: "", pReportStatus: "U", pDeficiencyRemarks: "" });
    soap.ele("ICDS").ele("ICD", { pIcdCode: "", pReportStatus: "U", pDeficiencyRemarks: "" });
    soap.ele("DIAGNOSTICS").ele("DIAGNOSTIC", { pDiagnosticId: "", pOthRemarks: "", pIsPhysicianRecommendation: "", pPatientRemarks: "", pReportStatus: "U", pDeficiencyRemarks: "" });
    soap.ele("MANAGEMENTS").ele("MANAGEMENT", { pManagementId: "", pOthRemarks: "", pReportStatus: "U", pDeficiencyRemarks: "" });
    soap.ele("ADVICE", { pRemarks: "", pReportStatus: "U", pDeficiencyRemarks: "" });

    // ── DIAGNOSTICEXAMRESULTS ─────────────────────────────────────────────────
    const diagResult = pcb.ele("DIAGNOSTICEXAMRESULTS").ele("DIAGNOSTICEXAMRESULT", {
        pHciCaseNo: sampleCaseNo,
        pHciTransNo: sampleTransNo,
        pPatientPin: patientPin,
        pPatientType: patientType,
        pMemPin: memPin,
        pEffYear: effYear,
    });
    diagResult.ele("FBSS").ele("FBS", {
        pReferralFacility: "SAMPLE REFERRAL FACILITY", pLabDate: sampleDate,
        pGlucoseMg: "45", pGlucoseMmol: "7.8", pDateAdded: sampleDate,
        pStatus: "D", pDiagnosticLabFee: "0.00", pReportStatus: "U", pDeficiencyRemarks: "",
    });
    diagResult.ele("RBSS").ele("RBS", {
        pReferralFacility: "", pLabDate: sampleDate,
        pGlucoseMg: "45", pGlucoseMmol: "7.8", pDateAdded: sampleDate,
        pStatus: "D", pDiagnosticLabFee: "0.00", pReportStatus: "U", pDeficiencyRemarks: "",
    });

    // ── MEDICINES ────────────────────────────────────────────────────────────
    pcb.ele("MEDICINES").ele("MEDICINE", {
        pHciCaseNo: "", pHciTransNo: "", pCategory: "", pDrugCode: "",
        pGenericCode: "", pSaltCode: "", pStrengthCode: "", pFormCode: "",
        pUnitCode: "", pPackageCode: "", pOtherMedicine: "", pRoute: "",
        pQuantity: "", pActualUnitPrice: "", pTotalAmtPrice: "",
        pInstructionQuantity: "", pInstructionStrength: "", pInstructionFrequency: "",
        pPrescribingPhysician: "", pIsDispensed: "", pDateDispensed: "",
        pDispensingPersonnel: "", pIsApplicable: "", pDateAdded: "",
        pReportStatus: "U", pDeficiencyRemarks: "",
    });

    return doc.end({ headless: true });
}
