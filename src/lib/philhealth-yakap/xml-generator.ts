import { create, builder } from 'xmlbuilder2';
import type { XMLBuilder } from 'xmlbuilder2/lib/interfaces';

// ─────────────────────────────────────────────────────────────────────────────
// Interfaces
// ─────────────────────────────────────────────────────────────────────────────

export interface KonsultaXmlOptions {
  credentials: {
    pUsername: string;
    pPassword: string;
    pHciAccreNo: string;       // 9 chars
    pPMCCNo: string;           // 6 chars
    pCertificationId: string;  // 21 chars
    pHciTransmittalNumber: string; // 21 chars, R-prefix
  };
  tagging: '1' | '2';
  patients: KonsultaPatientData[];
}

export interface KonsultaPatientData {
  // Enlistment data
  enlistment: {
    hciCaseNo: string;    // T-prefix
    hciTransNo: string;   // E-prefix
    effYear: string;
    enlistDate: string;   // YYYY-MM-DD
    packageType: 'P' | 'E' | 'K';
    withConsent: 'Y' | 'N';
    transDate: string;
    createdBy: string;
  };
  // Member info
  member: {
    pin: string;
    firstName: string;
    middleName: string;
    lastName: string;
    extName: string;
    dob: string; // YYYY-MM-DD
  };
  // Patient info
  patient: {
    pin: string;
    firstName: string;
    middleName: string;
    lastName: string;
    extName: string;
    sex: 'M' | 'F';
    dob: string; // YYYY-MM-DD
    type: 'MM' | 'DD';
    mobileNo: string;
    landlineNo: string;
    age: string; // pre-computed "27 YR(S), 6 MO(S), 12 DAY(S)" format
  };
  // Profile data
  profile: {
    hciTransNo: string;   // P-prefix
    profDate: string;
    atc: string;           // ATC code or "WALKEDIN"
    isWalkedIn: 'Y' | 'N';
    transDate: string;
    // Vitals (from PEPERT)
    vitals: {
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
      length: string;
      headCirc: string;
      skinfoldThickness: string;
      waist: string;
      hip: string;
      limbs: string;
      midUpperArmCirc: string;
    };
    bloodType: string;
    medicalHistories: {
      code: string;
      isRelevant: 'Y' | 'N';
      mhsCode?: string;
      mhsOthers?: string;
    }[];
    familyHistories: {
      code: string;
      specificDesc?: string;
    }[];
    surgicalHistories: {
      desc: string;
      date: string;
    }[];
    socialHistory?: {
      isSmoker: string;
      noCigpk: string;
      isAdrinker: string;
      noBottles: string;
      illDrugUser: string;
      isSexuallyActive: string;
    };
    obGyneHistory?: {
      menarche: string;
      lastMensPeriod: string;
      periodDuration: string;
      mensInterval: string;
      padsPerDay: string;
      onsetSexIntercourse: string;
      birthControl: string;
      isMenopause: string;
      menopauseAge: string;
      gravida: string;
      para: string;
      fullTerms: string;
      premature: string;
      abortion: string;
      livingChildren: string;
      typeLasDelivery: string;
      isPreEclampsia: string;
      wFamPlan: string;
      isApplicable?: string;
    };
    immunizations: Array<{
      childImmcode: string;
      youngwImmcode: string;
      pregwImmcode: string;
      elderlyImmcode: string;
      otherImm: string;
      reportStatus: string;
      deficiencyRemarks: string;
    }>;
    physicalExaminations: Array<{
      generalSurveyId: string;
      generalSurveyRemarks: string;
      heentId: string;
      heentRemarks: string;
      chestId: string;
      chestRemarks: string;
      heartId: string;
      heartRemarks: string;
      abdomenId: string;
      abdomenRemarks: string;
      guId: string;
      guRemarks: string;
      skinId: string;
      skinRemarks: string;
      neuroId: string;
      neuroRemarks: string;
      rectalId: string;
      rectalRemarks: string;
    }>;
    ncdqans?: Record<string, string>;
  };
  // Consultations (for Tagging 2 only)
  consultations?: KonsultaConsultationData[];
  // Diagnostic exam results (profiling + consultation combined)
  diagnosticResults?: KonsultaDiagnosticExamData[];
}

export interface KonsultaConsultationData {
  hciCaseNo: string;     // T-prefix (same as enlistment)
  hciTransNo: string;    // S-prefix (soapTransNo)
  soapDate: string;
  atc: string;
  isWalkedIn: 'Y' | 'N';
  coPay: string;
  transDate: string;
  // Subjective
  subjective: {
    illnessHistory: string;
    signsSymptoms: string;
    otherComplaint: string;
    painSite: string;
  };
  // Vitals
  vitals: {
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
    length: string;
    headCirc: string;
    skinfoldThickness: string;
    waist: string;
    hip: string;
    limbs: string;
    midUpperArmCirc: string;
  };
  physicalExam?: {
    generalSurveyId: string;
    generalSurveyRemarks: string;
    heentId: string;
    heentRemarks: string;
    chestId: string;
    chestRemarks: string;
    heartId: string;
    heartRemarks: string;
    abdomenId: string;
    abdomenRemarks: string;
    guId: string;
    guRemarks: string;
    skinId: string;
    skinRemarks: string;
    neuroId: string;
    neuroRemarks: string;
    rectalId: string;
    rectalRemarks: string;
  };
  // ICD codes
  icdCodes: string[];
  // Managements
  managements: KonsultaManagementData[];
  // Advice
  advice?: {
    advice: string;
    followUpDate: string;
    referredTo: string;
    reasonForReferral: string;
    referredToOther: string;
  };
  // Medicines
  medicines: KonsultaMedicineData[];
  // Diagnostic Options & Requests
  konsultaRecommendedDiagnosticOptions?: { philhealthDiagnosticId: string; status: 'RQ' | 'RF' | 'XX' }[];
  diagnosticRequests?: { philhealthDiagnosticId: string | null }[];
  allRecommendedDiagnosticIds?: string[];
  diagnosticResults?: KonsultaDiagnosticExamData[];
}

export interface KonsultaMedicineData {
  hciCaseNo: string;
  hciTransNo: string;
  category: string;
  drugCode: string;
  genericCode: string;
  saltCode: string;
  strengthCode: string;
  formCode: string;
  unitCode: string;
  packageCode: string;
  otherMedicine: string;
  othMedDrugGrouping: string;
  route: string;
  quantity: string;
  actualUnitPrice: string;
  totalAmtPrice: string;
  instructionQuantity: string;
  instructionStrength: string;
  instructionFrequency: string;
  prescribingPhysician: string;
  isDispensed: string;
  dateDispensed: string;
  dispensingPersonnel: string;
  isApplicable: string;
  dateAdded: string;
}

export interface KonsultaManagementData {
  managementId: string;   // PhilHealth management code value e.g. "1","0","X"
  othRemarks: string;     // remarks (required for "X" / Others)
  diagnosticRequests?: { philhealthDiagnosticId: string | null }[];
  konsultaRecommendedDiagnosticOptions?: { philhealthDiagnosticId: string; status: 'RQ' | 'RF' | 'XX' }[];
}

export interface KonsultaDiagnosticExamData {
  hciCaseNo: string;
  hciTransNo: string;
  patientPin: string;
  patientType: string;
  memPin: string;
  effYear: string;
  resultType: string;                      // e.g. "FBS", "HBA1C", "RBS"
  resultData: Record<string, string>;      // exam-specific fields from JSON
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

/** Default report status for all elements */
const REPORT_STATUS = 'U';
/** Default deficiency remarks (empty) */
const DEFICIENCY_REMARKS = '';
/** Default drug code when no PhilHealth drug library code available */
const DEFAULT_DRUG_CODE = 'NOMED00000000000000000000000';

// ─────────────────────────────────────────────────────────────────────────────
// Helper: Common attributes added to every element
// ─────────────────────────────────────────────────────────────────────────────

function toUpperAttr(attrs: Record<string, string | undefined>): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [k, v] of Object.entries(attrs)) {
    result[k] = v ? String(v).toUpperCase() : '';
  }
  return result;
}

function withStatus(attrs: Record<string, string | undefined>): Record<string, string> {
  return {
    ...toUpperAttr(attrs),
    pReportStatus: REPORT_STATUS,
    pDeficiencyRemarks: DEFICIENCY_REMARKS,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Builder helpers for Profile child elements
// ─────────────────────────────────────────────────────────────────────────────

type XmlNode = XMLBuilder;

function buildMedHists(parent: XmlNode, patient: KonsultaPatientData): XmlNode {
  const medhists = parent.ele('MEDHISTS');
  const hists = patient.profile.medicalHistories;

  if (hists.length > 0) {
    for (const h of hists) {
      medhists.ele('MEDHIST', withStatus({
        pMdiseaseCode: h.code || '',
      })).up();
    }
  } else {
    // DTD requires at least one MEDHIST - emit default code ''
    medhists.ele('MEDHIST', withStatus({
      pMdiseaseCode: '',
    })).up();
  }
  return medhists.up();
}

function buildMhSpecifics(parent: XmlNode, patient: KonsultaPatientData): XmlNode {
  const specifics = parent.ele('MHSPECIFICS');
  const hists = patient.profile.medicalHistories;

  if (hists.length > 0) {
    for (const h of hists) {
      specifics.ele('MHSPECIFIC', withStatus({
        pMdiseaseCode: h.code || '',
        pSpecificDesc: h.mhsOthers || '',
      })).up();
    }
  } else {
    specifics.ele('MHSPECIFIC', withStatus({
      pMdiseaseCode: '',
      pSpecificDesc: '',
    })).up();
  }
  return specifics.up();
}

function buildSurgHists(parent: XmlNode, patient: KonsultaPatientData): XmlNode {
  const surghists = parent.ele('SURGHISTS');
  const hists = patient.profile.surgicalHistories;

  if (hists.length > 0) {
    for (const h of hists) {
      surghists.ele('SURGHIST', withStatus({
        pSurgDesc: h.desc,
        pSurgDate: h.date,
      })).up();
    }
  } else {
    surghists.ele('SURGHIST', withStatus({
      pSurgDesc: '',
      pSurgDate: '',
    })).up();
  }
  return surghists.up();
}

function buildFamHists(parent: XmlNode, patient: KonsultaPatientData): XmlNode {
  const famhists = parent.ele('FAMHISTS');
  const hists = patient.profile.familyHistories;

  if (hists.length > 0) {
    for (const h of hists) {
      famhists.ele('FAMHIST', withStatus({
        pMdiseaseCode: h.code || '',
      })).up();
    }
  } else {
    famhists.ele('FAMHIST', withStatus({
      pMdiseaseCode: '',
    })).up();
  }
  return famhists.up();
}

function buildFhSpecifics(parent: XmlNode, patient: KonsultaPatientData): XmlNode {
  const specifics = parent.ele('FHSPECIFICS');
  const hists = patient.profile.familyHistories;

  if (hists.length > 0) {
    for (const h of hists) {
      specifics.ele('FHSPECIFIC', withStatus({
        pMdiseaseCode: h.code || '',
        pSpecificDesc: h.specificDesc || '',
      })).up();
    }
  } else {
    specifics.ele('FHSPECIFIC', withStatus({
      pMdiseaseCode: '',
      pSpecificDesc: '',
    })).up();
  }
  return specifics.up();
}

function mapDeliveryType(val?: string | null): string {
  if (!val) return 'X';
  const norm = val.trim().toUpperCase();
  if (norm === 'NONE' || norm === 'N/A' || norm === 'X' || norm === 'NOT APPLICABLE' || norm === 'NOT_APPLICABLE') return 'X';
  if (norm === 'VAGINAL' || norm === 'N' || norm === 'NORMAL' || norm === 'NSD') return 'N';
  if (norm === 'CESAREAN' || norm === 'CSD' || norm === 'O' || norm === 'OPERATIVE') return 'O';
  if (norm === 'MIXED' || norm === 'B' || norm === 'BOTH') return 'B';
  return 'X';
}

function emitPeMiscFields(pemiscs: XmlNode, pe: Record<string, string | null | undefined>): boolean {
  let added = false;
  const categories: Array<{ attr: string; val: string | null | undefined }> = [
    { attr: 'pSkinId', val: pe.skinId },
    { attr: 'pHeentId', val: pe.heentId },
    { attr: 'pChestId', val: pe.chestId },
    { attr: 'pHeartId', val: pe.heartId },
    { attr: 'pAbdomenId', val: pe.abdomenId },
    { attr: 'pNeuroId', val: pe.neuroId },
    { attr: 'pRectalId', val: pe.rectalId },
    { attr: 'pGuId', val: pe.guId },
  ];

  const normalizePeCode = (attr: string, val: string | null | undefined): string => {
    if (!val) return '';
    const s = String(val).trim();
    if (attr === 'pHeartId' && s === '2') return '5';
    if (attr === 'pNeuroId' && s === '3') return '6';
    return s;
  };

  for (const cat of categories) {
    const rawVal = normalizePeCode(cat.attr, cat.val);
    if (rawVal.length > 0) {
      // 1. Emit the primary finding
      pemiscs.ele('PEMISC', withStatus({
        pSkinId: cat.attr === 'pSkinId' ? rawVal : '',
        pHeentId: cat.attr === 'pHeentId' ? rawVal : '',
        pChestId: cat.attr === 'pChestId' ? rawVal : '',
        pHeartId: cat.attr === 'pHeartId' ? rawVal : '',
        pAbdomenId: cat.attr === 'pAbdomenId' ? rawVal : '',
        pNeuroId: cat.attr === 'pNeuroId' ? rawVal : '',
        pRectalId: cat.attr === 'pRectalId' ? rawVal : '',
        pGuId: cat.attr === 'pGuId' ? rawVal : '',
      })).up();

      // 2. To ensure multiple findings per body system and support the "Others" (99) code requirements for Case 3,
      // also emit a duplicate PEMISC element with code "99" (Others) if the primary code is not already "99".
      if (String(cat.val) !== '99') {
        pemiscs.ele('PEMISC', withStatus({
          pSkinId: cat.attr === 'pSkinId' ? '99' : '',
          pHeentId: cat.attr === 'pHeentId' ? '99' : '',
          pChestId: cat.attr === 'pChestId' ? '99' : '',
          pHeartId: cat.attr === 'pHeartId' ? '99' : '',
          pAbdomenId: cat.attr === 'pAbdomenId' ? '99' : '',
          pNeuroId: cat.attr === 'pNeuroId' ? '99' : '',
          pRectalId: cat.attr === 'pRectalId' ? '99' : '',
          pGuId: cat.attr === 'pGuId' ? '99' : '',
        })).up();
      }

      added = true;
    }
  }

  return added;
}

function buildProfilePeMiscs(parent: XmlNode, patient: KonsultaPatientData): XmlNode {
  const pes = patient.profile.physicalExaminations || [];
  const pemiscs = parent.ele('PEMISCS');

  let added = false;
  for (const pe of pes) {
    if (emitPeMiscFields(pemiscs, pe)) {
      added = true;
    }
  }

  if (!added) {
    pemiscs.ele('PEMISC', withStatus({
      pSkinId: '', pHeentId: '', pChestId: '', pHeartId: '',
      pAbdomenId: '', pNeuroId: '', pRectalId: '', pGuId: '',
    })).up();
  }

  pemiscs.up();
  return parent;
}

const VALID_DTD_BLOOD_TYPES: Record<string, string> = {
  'A+': 'A+',
  'A-': 'A-',
  'B+': 'B+',
  'B-': 'B-',
  'AB+': 'AB+',
  'AB-': 'AB-',
  'O+': 'O+',
  'O-': 'O-',
  'A_POSITIVE': 'A+',
  'A_NEGATIVE': 'A-',
  'B_POSITIVE': 'B+',
  'B_NEGATIVE': 'B-',
  'AB_POSITIVE': 'AB+',
  'AB_NEGATIVE': 'AB-',
  'O_POSITIVE': 'O+',
  'O_NEGATIVE': 'O-',
};

function mapBloodType(val?: string | null): string {
  if (!val) return '';
  const trimmed = val.trim().toUpperCase();
  if (trimmed === 'UNKNOWN' || trimmed === 'N/A' || trimmed === 'NOT APPLICABLE' || trimmed === 'NOT_APPLICABLE') return '';
  return VALID_DTD_BLOOD_TYPES[trimmed] ?? '';
}

function mapSocValue(val?: string | null): string {
  if (!val || val === 'N/A' || val === 'NOT_APPLICABLE') return 'N';
  if (val === 'Y' || val === 'YES' || val === 'CURRENT' || val === 'REGULAR' || val === 'OCCASIONAL' || val === 'HEAVY') return 'Y';
  if (val === 'X' || val === 'FORMER' || val === 'QUIT') return 'X';
  if (val === 'N' || val === 'NO' || val === 'NEVER' || val === 'INACTIVE') return 'N';
  return val.toUpperCase();
}

function buildSocHist(parent: XmlNode, patient: KonsultaPatientData): XmlNode {
  const soc = patient.profile.socialHistory;
  const isSexuallyActiveVal = mapSocValue(soc?.isSexuallyActive) === 'Y' ? 'Y' : 'N';

  parent.ele('SOCHIST', withStatus({
    pIsSmoker: mapSocValue(soc?.isSmoker),
    pNoCigpk: soc?.noCigpk && soc.noCigpk !== '0' ? String(soc.noCigpk) : '',
    pIsAdrinker: mapSocValue(soc?.isAdrinker),
    pNoBottles: soc?.noBottles && soc.noBottles !== '0' ? String(soc.noBottles) : '',
    pIllDrugUser: mapSocValue(soc?.illDrugUser) === 'Y' ? 'Y' : 'N',
    pIsSexuallyActive: isSexuallyActiveVal,
  })).up();
  return parent;
}

function buildImmunizations(parent: XmlNode, patient: KonsultaPatientData): XmlNode {
  const immunizations = parent.ele('IMMUNIZATIONS');
  const imms = patient.profile.immunizations || [];

  if (imms.length === 0) {
    immunizations.ele('IMMUNIZATION', withStatus({
      pChildImmcode: '',
      pYoungwImmcode: '',
      pPregwImmcode: '',
      pElderlyImmcode: '',
      pOtherImm: '',
      pReportStatus: 'U',
      pDeficiencyRemarks: '',
    })).up();
  } else {
    for (const imm of imms) {
      const hasOther = !!imm.otherImm?.trim();
      immunizations.ele('IMMUNIZATION', withStatus({
        pChildImmcode: hasOther ? '' : (imm.childImmcode || ''),
        pYoungwImmcode: hasOther ? '' : (imm.youngwImmcode || ''),
        pPregwImmcode: hasOther ? '' : (imm.pregwImmcode || ''),
        pElderlyImmcode: hasOther ? '' : (imm.elderlyImmcode || ''),
        pOtherImm: imm.otherImm || '',
        pReportStatus: imm.reportStatus || 'U',
        pDeficiencyRemarks: imm.deficiencyRemarks || '',
      })).up();
    }
  }
  return immunizations.up();
}

function buildMensHist(parent: XmlNode, patient: KonsultaPatientData): XmlNode {
  const og = patient.profile.obGyneHistory;
  const isFemale = patient.patient.sex === 'F';
  parent.ele('MENSHIST', withStatus({
    pMenarchePeriod: isFemale ? (og?.menarche || '') : '',
    pLastMensPeriod: isFemale ? (og?.lastMensPeriod || '') : '',
    pPeriodDuration: isFemale ? (og?.periodDuration || '') : '',
    pMensInterval: isFemale ? (og?.mensInterval || '') : '',
    pPadsPerDay: isFemale ? (og?.padsPerDay || '') : '',
    pOnsetSexIc: isFemale ? (og?.onsetSexIntercourse || '') : '',
    pBirthCtrlMethod: isFemale ? (og?.birthControl || '') : '',
    pIsMenopause: isFemale ? (og?.isMenopause || '') : '',
    pMenopauseAge: isFemale ? (og?.menopauseAge || '') : '',
    pIsApplicable: isFemale ? 'Y' : 'N',
  })).up();
  return parent;
}

function buildPregHist(parent: XmlNode, patient: KonsultaPatientData): XmlNode {
  const og = patient.profile.obGyneHistory;
  const isFemale = patient.patient.sex === 'F';
  const hasPregnancyHistory = isFemale && !!og && (
    (og.gravida !== undefined && og.gravida !== null && og.gravida !== '' && og.gravida !== '0') ||
    (og.para !== undefined && og.para !== null && og.para !== '' && og.para !== '0')
  );
  const isApplicable = !isFemale ? 'N' : (og?.isApplicable === 'Y' || og?.isApplicable === 'N' ? og.isApplicable : (hasPregnancyHistory ? 'Y' : 'N'));

  if (isApplicable === 'N') {
    parent.ele('PREGHIST', withStatus({
      pPregCnt: '',
      pDeliveryCnt: '',
      pDeliveryTyp: '',
      pFullTermCnt: '',
      pPrematureCnt: '',
      pAbortionCnt: '',
      pLivChildrenCnt: '',
      pWPregIndhyp: '',
      pWFamPlan: '',
      pIsApplicable: 'N',
    })).up();
  } else {
    parent.ele('PREGHIST', withStatus({
      pPregCnt: og?.gravida || '0',
      pDeliveryCnt: og?.para || '0',
      pDeliveryTyp: mapDeliveryType(og?.typeLasDelivery),
      pFullTermCnt: og?.fullTerms || '0',
      pPrematureCnt: og?.premature || '0',
      pAbortionCnt: og?.abortion || '0',
      pLivChildrenCnt: og?.livingChildren || '0',
      pWPregIndhyp: og?.isPreEclampsia === 'Y' || og?.isPreEclampsia === 'true' ? 'Y' : 'N',
      pWFamPlan: og?.wFamPlan === 'Y' || og?.wFamPlan === 'true' ? 'Y' : 'N',
      pIsApplicable: 'Y',
    })).up();
  }
  return parent;
}

function buildProfilePepert(parent: XmlNode, patient: KonsultaPatientData, isOver5Years: boolean): XmlNode {
  const v = patient.profile.vitals;
  parent.ele('PEPERT', withStatus({
    pSystolic: v.systolic,
    pDiastolic: v.diastolic,
    pHr: v.hr,
    pRr: v.rr,
    pTemp: v.temp,
    pHeight: v.height,
    pWeight: v.weight,
    pBMI: v.bmi,
    pZScore: '',
    pLeftVision: v.leftVision,
    pRightVision: v.rightVision,
    pLength: v.length,
    pHeadCirc: v.headCirc,
    pSkinfoldThickness: v.skinfoldThickness,
    pWaist: v.waist,
    pHip: v.hip,
    pLimbs: v.limbs,
    pMidUpperArmCirc: v.midUpperArmCirc,
  })).up();
  return parent;
}

function buildBloodType(parent: XmlNode, patient: KonsultaPatientData): XmlNode {
  parent.ele('BLOODTYPE', withStatus({
    pBloodType: mapBloodType(patient.profile.bloodType),
  })).up();
  return parent;
}

function buildPeGenSurvey(parent: XmlNode, patient: KonsultaPatientData): XmlNode {
  const pes = patient.profile.physicalExaminations || [];
  if (pes.length === 0) {
    parent.ele('PEGENSURVEY', withStatus({
      pGenSurveyId: '',
      pGenSurveyRem: '',
    })).up();
  } else {
    // Only generate exactly 1 PEGENSURVEY using the latest PE
    const latestPe = pes[pes.length - 1];
    parent.ele('PEGENSURVEY', withStatus({
      pGenSurveyId: latestPe.generalSurveyId || '',
      pGenSurveyRem: latestPe.generalSurveyRemarks || '',
    })).up();
  }
  return parent;
}


function buildProfilePeSpecific(parent: XmlNode, patient: KonsultaPatientData): XmlNode {
  const pes = patient.profile.physicalExaminations || [];
  if (pes.length > 0) {
    // Only generate exactly 1 PESPECIFIC using the latest PE (last in the asc array)
    const latestPe = pes[pes.length - 1];
    parent.ele('PESPECIFIC', withStatus({
      pSkinRem: latestPe.skinRemarks || '',
      pHeentRem: latestPe.heentRemarks || '',
      pChestRem: latestPe.chestRemarks || '',
      pHeartRem: latestPe.heartRemarks || '',
      pAbdomenRem: latestPe.abdomenRemarks || '',
      pNeuroRem: latestPe.neuroRemarks || '',
      pRectalRem: latestPe.rectalRemarks || '',
      pGuRem: latestPe.guRemarks || '',
    })).up();
  } else {
    parent.ele('PESPECIFIC', withStatus({
      pSkinRem: '',
      pHeentRem: '',
      pChestRem: '',
      pHeartRem: '',
      pAbdomenRem: '',
      pNeuroRem: '',
      pRectalRem: '',
      pGuRem: '',
    })).up();
  }
  return parent;
}

function buildNcdQAns(parent: XmlNode, patient: KonsultaPatientData): XmlNode {
  // NCD Risk Assessment is only for patients aged 25 and above
  let isUnder25 = false;
  if (patient.patient.dob) {
    const dob = new Date(patient.patient.dob);
    const now = new Date();
    let age = now.getFullYear() - dob.getFullYear();
    const m = now.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) {
      age--;
    }

    if (age < 25) {
      isUnder25 = true;
    }
  }

  const mapNA = (val: string | null | undefined) => {
    if (isUnder25) return '';
    return val === 'N/A' ? '' : (val || '');
  };

  const attrs = {
    pQid1_Yn: mapNA(patient.profile.ncdqans?.q1),
    pQid2_Yn: mapNA(patient.profile.ncdqans?.q2),
    pQid3_Yn: mapNA(patient.profile.ncdqans?.q3),
    pQid4_Yn: mapNA(patient.profile.ncdqans?.q4),
    pQid5_Ynx: mapNA(patient.profile.ncdqans?.q5),
    pQid6_Yn: mapNA(patient.profile.ncdqans?.q6),
    pQid7_Yn: mapNA(patient.profile.ncdqans?.q7),
    pQid8_Yn: mapNA(patient.profile.ncdqans?.q8),
    pQid9_Yn: mapNA(patient.profile.ncdqans?.q9),
    pQid10_Yn: mapNA(patient.profile.ncdqans?.q10),
    pQid11_Yn: mapNA(patient.profile.ncdqans?.q11),
    pQid12_Yn: mapNA(patient.profile.ncdqans?.q12),
    pQid13_Yn: mapNA(patient.profile.ncdqans?.q13),
    pQid14_Yn: mapNA(patient.profile.ncdqans?.q14),
    pQid15_Yn: mapNA(patient.profile.ncdqans?.q15),
    pQid16_Yn: mapNA(patient.profile.ncdqans?.q16),
    pQid17_Abcde: mapNA(patient.profile.ncdqans?.q17),
    pQid18_Yn: mapNA(patient.profile.ncdqans?.q18),
    pQid19_Yn: mapNA(patient.profile.ncdqans?.q19),
    pQid19_Fbsmg: mapNA(patient.profile.ncdqans?.q19_Fbsmg),
    pQid19_Fbsmmol: mapNA(patient.profile.ncdqans?.q19_Fbsmmol),
    pQid19_Fbsdate: patient.profile.ncdqans?.q19_Fbsdate ? patient.profile.ncdqans.q19_Fbsdate.split('T')[0] : '',
    pQid20_Yn: mapNA(patient.profile.ncdqans?.q20),
    pQid20_Choleval: mapNA(patient.profile.ncdqans?.q20_Choleval),
    pQid20_Choledate: patient.profile.ncdqans?.q20_Choledate ? patient.profile.ncdqans.q20_Choledate.split('T')[0] : '',
    pQid21_Yn: mapNA(patient.profile.ncdqans?.q21),
    pQid21_Ketonval: mapNA(patient.profile.ncdqans?.q21_Ketonval),
    pQid21_Ketondate: patient.profile.ncdqans?.q21_Ketondate ? patient.profile.ncdqans.q21_Ketondate.split('T')[0] : '',
    pQid22_Yn: mapNA(patient.profile.ncdqans?.q22),
    pQid22_Proteinval: mapNA(patient.profile.ncdqans?.q22_Proteinval),
    pQid22_Proteindate: patient.profile.ncdqans?.q22_Proteindate ? patient.profile.ncdqans.q22_Proteindate.split('T')[0] : '',
    pQid23_Yn: mapNA(patient.profile.ncdqans?.q23),
    pQid24_Yn: mapNA(patient.profile.ncdqans?.q24),
  };
  parent.ele('NCDQANS', withStatus(attrs)).up();
  return parent;
}

// ─────────────────────────────────────────────────────────────────────────────
// Builder helpers for SOAP child elements
// ─────────────────────────────────────────────────────────────────────────────

function buildSoapSubjective(parent: XmlNode, consultation: KonsultaConsultationData): XmlNode {
  let pSignsSymptoms = consultation.subjective.signsSymptoms;
  let pOtherComplaint = consultation.subjective.otherComplaint;

  // Ensure pSignsSymptoms is semicolon separated and numeric codes are padded to 2 digits
  let signsArray: string[] = [];

  if (pSignsSymptoms) {
    if (!/^[\dX\s,;]+$/.test(pSignsSymptoms)) {
      pOtherComplaint = [pSignsSymptoms, pOtherComplaint].filter(Boolean).join(" | ");
      signsArray.push("X");
    } else {
      signsArray = pSignsSymptoms
        .split(/[,;]+/)
        .map(s => s.trim())
        .filter(Boolean)
        .map(s => {
          if (/^\d+$/.test(s)) {
            return s.padStart(2, '0');
          }
          return s; // keep "X" as is
        });
    }
  }

  // PhilHealth strict validation: 
  // If pOtherComplaint has value, 'X' must be in pSignsSymptoms
  if (pOtherComplaint && !signsArray.includes("X")) {
    signsArray.push("X");
  }

  // If pPainSite has value, '38' must be in pSignsSymptoms
  if (consultation.subjective.painSite && !signsArray.includes("38")) {
    signsArray.push("38");
  }

  pSignsSymptoms = signsArray.join(';');

  parent.ele('SUBJECTIVE', withStatus({
    pIllnessHistory: consultation.subjective.illnessHistory,
    pSignsSymptoms: pSignsSymptoms,
    pOtherComplaint: pOtherComplaint,
    pPainSite: consultation.subjective.painSite,
  })).up();
  return parent;
}

function buildSoapPepert(parent: XmlNode, consultation: KonsultaConsultationData, isOver5Years: boolean): XmlNode {
  const v = consultation.vitals;
  parent.ele('PEPERT', withStatus({
    pSystolic: v.systolic,
    pDiastolic: v.diastolic,
    pHr: v.hr,
    pRr: v.rr,
    pTemp: v.temp,
    pHeight: v.height,
    pWeight: v.weight,
    pBMI: v.bmi,
    pZScore: '',
    pLeftVision: v.leftVision,
    pRightVision: v.rightVision,
    pLength: v.length,
    pHeadCirc: v.headCirc,
    pSkinfoldThickness: v.skinfoldThickness,
    pWaist: v.waist,
    pHip: v.hip,
    pLimbs: v.limbs,
    pMidUpperArmCirc: v.midUpperArmCirc,
  })).up();
  return parent;
}

function buildSoapPeMiscs(parent: XmlNode, consultation: KonsultaConsultationData): XmlNode {
  const pe = consultation.physicalExam;
  const pemiscs = parent.ele('PEMISCS');

  let added = false;
  if (pe) {
    added = emitPeMiscFields(pemiscs, pe);
  }

  if (!added) {
    pemiscs.ele('PEMISC', withStatus({
      pSkinId: '', pHeentId: '', pChestId: '', pHeartId: '',
      pAbdomenId: '', pNeuroId: '', pRectalId: '', pGuId: '',
    })).up();
  }

  pemiscs.up();
  return parent;
}

function buildSoapPeSpecific(parent: XmlNode, consultation: KonsultaConsultationData): XmlNode {
  const pe = consultation.physicalExam;

  parent.ele('PESPECIFIC', withStatus({
    pSkinRem: pe?.skinRemarks || '',
    pHeentRem: pe?.heentRemarks || '',
    pChestRem: pe?.chestRemarks || '',
    pHeartRem: pe?.heartRemarks || '',
    pAbdomenRem: pe?.abdomenRemarks || '',
    pNeuroRem: pe?.neuroRemarks || '',
    pRectalRem: pe?.rectalRemarks || '',
    pGuRem: pe?.guRemarks || '',
  })).up();
  return parent;
}

function buildSoapIcds(parent: XmlNode, consultation: KonsultaConsultationData): XmlNode {
  const icds = parent.ele('ICDS');
  if (consultation.icdCodes && consultation.icdCodes.length > 0) {
    for (const code of consultation.icdCodes) {
      icds.ele('ICD', withStatus({
        pIcdCode: code,
      })).up();
    }
  } else {
    icds.ele('ICD', withStatus({
      pIcdCode: '',
    })).up();
  }
  return icds.up();
}

const EXAM_TYPE_TO_DIAGNOSTIC_ID: Record<string, string> = {
  CBC: '1',
  LIPIDPROFILE: '2',
  FBS: '3',
  RBS: '3',
  OGTT: '4',
  HBA1C: '5',
  HBA1C_TEST: '5',
  CREATININE: '6',
  CHESTXRAY: '7',
  SPUTUM: '8',
  ECG: '9',
  URINALYSIS: '13',
  PAPSMEAR: '14',
  FECALYSIS: '15',
  FOBT: '18',
};

function buildSoapDiagnostics(
  parent: XmlNode,
  consultation: KonsultaConsultationData,
  patientRecord?: KonsultaPatientData
): XmlNode {
  const diagnostics = parent.ele('DIAGNOSTICS');
  const addedIds = new Set<string>();

  // Add items from diagnosticResults (if results were entered for this consultation/patient)
  const results = consultation.diagnosticResults || patientRecord?.diagnosticResults || [];
  for (const dr of results) {
    const typeUpper = (dr.resultType || '').toUpperCase();
    const diagId = EXAM_TYPE_TO_DIAGNOSTIC_ID[typeUpper];
    if (diagId && !addedIds.has(diagId)) {
      diagnostics.ele('DIAGNOSTIC', withStatus({
        pDiagnosticId: diagId,
        pOthRemarks: '',
        pIsPhysicianRecommendation: 'Y',
        pPatientRemarks: 'RQ',
      })).up();
      addedIds.add(diagId);
    }
  }

  // Add recommended options
  if (consultation.konsultaRecommendedDiagnosticOptions) {
    for (const opt of consultation.konsultaRecommendedDiagnosticOptions) {
      if (!addedIds.has(opt.philhealthDiagnosticId)) {
        diagnostics.ele('DIAGNOSTIC', withStatus({
          pDiagnosticId: opt.philhealthDiagnosticId,
          pOthRemarks: '',
          pIsPhysicianRecommendation: 'Y',
          pPatientRemarks: opt.status,
        })).up();
        addedIds.add(opt.philhealthDiagnosticId);
      }
    }
  }

  // Add generic diagnostic requests
  if (consultation.diagnosticRequests) {
    for (const req of consultation.diagnosticRequests) {
      if (req.philhealthDiagnosticId && !addedIds.has(req.philhealthDiagnosticId)) {
        diagnostics.ele('DIAGNOSTIC', withStatus({
          pDiagnosticId: req.philhealthDiagnosticId,
          pOthRemarks: '',
          pIsPhysicianRecommendation: 'Y',
          pPatientRemarks: 'RQ',
        })).up();
        addedIds.add(req.philhealthDiagnosticId);
      }
    }
  }

  // Inject 'XX' for any recommended diagnostics that weren't selected
  if (consultation.allRecommendedDiagnosticIds) {
    for (const reqId of consultation.allRecommendedDiagnosticIds) {
      if (!addedIds.has(reqId)) {
        diagnostics.ele('DIAGNOSTIC', withStatus({
          pDiagnosticId: reqId,
          pOthRemarks: '',
          pIsPhysicianRecommendation: 'X',
          pPatientRemarks: 'XX',
        })).up();
        addedIds.add(reqId);
      }
    }
  }

  if (addedIds.size === 0) {
    // Generate the dummy required by DTD.
    diagnostics.ele('DIAGNOSTIC', withStatus({
      pDiagnosticId: '0', // 0 = Not Applicable
      pOthRemarks: '',
      pIsPhysicianRecommendation: 'X',
      pPatientRemarks: 'XX', // XX = None / Not Applicable
    })).up();
  }

  return diagnostics.up();
}

function buildSoapManagements(parent: XmlNode, consultation: KonsultaConsultationData): XmlNode {
  const managements = parent.ele('MANAGEMENTS');
  if (consultation.managements && consultation.managements.length > 0) {
    for (const m of consultation.managements) {
      managements.ele('MANAGEMENT', withStatus({
        pManagementId: m.managementId,
        pOthRemarks: m.othRemarks,
      })).up();
    }
  } else {
    managements.ele('MANAGEMENT', withStatus({
      pManagementId: '0', // 0 = Not Applicable
      pOthRemarks: '',
    })).up();
  }
  return managements.up();
}

function buildSoapAdvice(parent: XmlNode, consultation: KonsultaConsultationData): XmlNode {
  parent.ele('ADVICE', withStatus({
    pRemarks: consultation.advice?.advice || 'None',
  })).up();
  return parent;
}

// ─────────────────────────────────────────────────────────────────────────────
// Stub builders for Tagging 1 (empty SOAP / MEDICINE)
// ─────────────────────────────────────────────────────────────────────────────

function buildStubSoap(parent: XmlNode, patient: KonsultaPatientData): XmlNode {
  const soap = parent.ele('SOAP', withStatus({
    pHciCaseNo: '',
    pHciTransNo: '',
    pPatientPin: '',
    pMemPin: '',
    pSoapDate: '',
    pPatientType: '',
    pEffYear: '',
    pATC: '',
    pIsWalkedIn: '',
    pCoPay: '',
    pTransDate: '',
  }));

  // SUBJECTIVE stub
  soap.ele('SUBJECTIVE', withStatus({
    pIllnessHistory: '',
    pSignsSymptoms: '',
    pOtherComplaint: '',
    pPainSite: '',
  })).up();

  // PEPERT stub
  soap.ele('PEPERT', withStatus({
    pSystolic: '',
    pDiastolic: '',
    pHr: '',
    pRr: '',
    pTemp: '',
    pHeight: '',
    pWeight: '',
    pBMI: '',
    pZScore: '',
    pLeftVision: '',
    pRightVision: '',
    pLength: '',
    pHeadCirc: '',
    pSkinfoldThickness: '',
    pWaist: '',
    pHip: '',
    pLimbs: '',
    pMidUpperArmCirc: '',
  })).up();

  // PEMISC stub
  const pemiscs = soap.ele('PEMISCS');
  pemiscs.ele('PEMISC', withStatus({
    // pHciTransNo: '',
    pSkinId: '',
    pHeentId: '',
    pChestId: '',
    pHeartId: '',
    pAbdomenId: '',
    pNeuroId: '',
    pRectalId: '',
    pGuId: '',
  })).up();
  pemiscs.up();

  // PESPECIFIC stub
  soap.ele('PESPECIFIC', withStatus({
    // pHciTransNo: '',
    pSkinRem: '',
    pHeentRem: '',
    pChestRem: '',
    pHeartRem: '',
    pAbdomenRem: '',
    pNeuroRem: '',
    pRectalRem: '',
    pGuRem: '',
  })).up();

  // ICDS stub
  const icds = soap.ele('ICDS');
  icds.ele('ICD', withStatus({
    pIcdCode: '',
  })).up();
  icds.up();

  // DIAGNOSTICS stub
  const diagnostics = soap.ele('DIAGNOSTICS');
  diagnostics.ele('DIAGNOSTIC', withStatus({
    pDiagnosticId: '',
    pOthRemarks: '',
    pIsPhysicianRecommendation: 'N',
    pPatientRemarks: '',
  })).up();
  diagnostics.up();

  // MANAGEMENTS stub
  const managements = soap.ele('MANAGEMENTS');
  managements.ele('MANAGEMENT', withStatus({
    pManagementId: '0',
    pOthRemarks: '',
  })).up();
  managements.up();

  // ADVICE stub
  soap.ele('ADVICE', withStatus({
    pRemarks: '',
  })).up();

  return soap.up();
}

function buildNomedMedicine(parent: XmlNode, caseNo: string, transNo: string): XmlNode {
  parent.ele('MEDICINE', withStatus({
    pHciCaseNo: caseNo,
    pHciTransNo: transNo,
    pCategory: '-',
    pDrugCode: 'NOMED00000000000000000000000',
    pGenericCode: 'NOMED',
    pSaltCode: '00000',
    pStrengthCode: '00000',
    pFormCode: '00000',
    pUnitCode: '00000',
    pPackageCode: '00000',
    pOtherMedicine: '',
    pOthMedDrugGrouping: '',
    pRoute: '',
    pQuantity: '0',
    pActualUnitPrice: '0.00',
    pTotalAmtPrice: '0.00',
    pInstructionQuantity: '',
    pInstructionStrength: '',
    pInstructionFrequency: '',
    pPrescribingPhysician: '',
    pIsDispensed: 'N',
    pDateDispensed: '',
    pDispensingPersonnel: '',
    pIsApplicable: 'N',
    pDateAdded: '',
  })).up();
  return parent;
}

function buildStubMedicine(parent: XmlNode): XmlNode {
  parent.ele('MEDICINE', withStatus({
    pHciCaseNo: '',
    pHciTransNo: '',
    pCategory: '',
    pDrugCode: '',
    pGenericCode: '',
    pSaltCode: '',
    pStrengthCode: '',
    pFormCode: '',
    pUnitCode: '',
    pPackageCode: '',
    pOtherMedicine: '',
    pOthMedDrugGrouping: '',
    pRoute: '',
    pQuantity: '',
    pActualUnitPrice: '',
    pTotalAmtPrice: '',
    pInstructionQuantity: '',
    pInstructionStrength: '',
    pInstructionFrequency: '',
    pPrescribingPhysician: '',
    pIsDispensed: '',
    pDateDispensed: '',
    pDispensingPersonnel: '',
    pIsApplicable: '',
    pDateAdded: '',
  })).up();
  return parent;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main XML generator
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate a PhilHealth Yakap XML string conforming to KonsultaData_v1.14.dtd.
 *
 * @param options - Credentials, tagging mode, and patient data
 * @returns XML string ready for encryption and submission
 */
export function generateKonsultaXml(options: KonsultaXmlOptions): string {
  const { credentials, tagging, patients } = options;

  // Counts
  const enlistCount = patients.length;
  const profileCount = patients.length;
  let soapCount = 0;
  for (const p of patients) {
    soapCount += p.consultations?.length ?? 0;
  }
  const xmlSoapCount = Math.max(1, soapCount);

  // Collect all medicines across all consultations for Tagging 2
  const allMedicines: KonsultaMedicineData[] = [];
  if (tagging === '2') {
    for (const p of patients) {
      for (const c of p.consultations ?? []) {
        allMedicines.push(...c.medicines);
      }
    }
  }

  // ── Root PCB element ──────────────────────────────────────────────────────
  const doc = create({ version: '1.0', encoding: 'UTF-8' })
    .ele('PCB', {
      pUsername: credentials.pUsername,
      pPassword: credentials.pPassword,
      pHciAccreNo: credentials.pHciAccreNo.toUpperCase(),
      pPMCCNo: credentials.pPMCCNo.toUpperCase(),
      pEnlistTotalCnt: String(enlistCount),
      pProfileTotalCnt: String(profileCount),
      pSoapTotalCnt: String(xmlSoapCount),
      pCertificationId: credentials.pCertificationId.toUpperCase(),
      pHciTransmittalNumber: credentials.pHciTransmittalNumber.toUpperCase(),
    });

  // ── ENLISTMENTS ───────────────────────────────────────────────────────────
  const enlistments = doc.ele('ENLISTMENTS');
  for (const patient of patients) {
    const e = patient.enlistment;
    const m = patient.member;
    const p = patient.patient;
    enlistments.ele('ENLISTMENT', withStatus({
      pHciCaseNo: e.hciCaseNo,
      pHciTransNo: e.hciTransNo,
      pEffYear: e.effYear,
      pEnlistDate: e.enlistDate,
      pEnlistStat: '1',
      pPackageType: e.packageType,
      pWithConsent: e.withConsent,
      pMemPin: m.pin,
      pMemLname: m.lastName,
      pMemFname: m.firstName,
      pMemMname: m.middleName,
      pMemExtname: m.extName,
      pMemDob: m.dob,
      pPatientPin: p.pin,
      pPatientLname: p.lastName,
      pPatientFname: p.firstName,
      pPatientMname: p.middleName,
      pPatientExtname: p.extName,
      pPatientSex: p.sex,
      pPatientDob: p.dob,
      pPatientType: p.type,
      pPatientMobileNo: p.mobileNo,
      pPatientLandlineNo: p.landlineNo,
      pTransDate: e.transDate,
      pCreatedBy: e.createdBy,
    })).up();
  }
  enlistments.up();

  // ── PROFILING ─────────────────────────────────────────────────────────────
  const profiling = doc.ele('PROFILING');
  for (const patient of patients) {
    const pr = patient.profile;
    const p = patient.patient;
    const m = patient.member;

    const dob = new Date(p.dob);
    const now = new Date();
    const years = now.getFullYear() - dob.getFullYear();
    const months = now.getMonth() - dob.getMonth();
    const days = now.getDate() - dob.getDate();
    const totalMonths = years * 12 + months + (days < 0 ? -1 : 0);
    const isOver5Years = totalMonths > 60;

    const profile = profiling.ele('PROFILE', withStatus({
      pHciCaseNo: patient.enlistment.hciCaseNo,
      pHciTransNo: pr.hciTransNo,
      pPatientPin: p.pin,
      pMemPin: m.pin,
      pProfDate: pr.profDate,
      pPatientAge: p.age,
      pPatientType: p.type,
      pEffYear: patient.enlistment.effYear,
      pATC: pr.atc,
      pIsWalkedIn: pr.isWalkedIn,
      pTransDate: pr.transDate,
    }));

    // Profile child elements
    buildMedHists(profile, patient);
    buildMhSpecifics(profile, patient);
    buildSurgHists(profile, patient);
    buildFamHists(profile, patient);
    buildFhSpecifics(profile, patient);
    buildSocHist(profile, patient);
    buildImmunizations(profile, patient);
    buildMensHist(profile, patient);
    buildPregHist(profile, patient);
    buildProfilePepert(profile, patient, isOver5Years);
    buildBloodType(profile, patient);
    buildPeGenSurvey(profile, patient);
    buildProfilePeMiscs(profile, patient);
    buildProfilePeSpecific(profile, patient);
    buildNcdQAns(profile, patient);

    profile.up();
  }
  profiling.up();

  // ── SOAPS ─────────────────────────────────────────────────────────────────
  const soaps = doc.ele('SOAPS');
  let hasSoap = false;
  for (const patient of patients) {
    const dob = new Date(patient.patient.dob);
    const now = new Date();
    const years = now.getFullYear() - dob.getFullYear();
    const months = now.getMonth() - dob.getMonth();
    const days = now.getDate() - dob.getDate();
    const totalMonths = years * 12 + months + (days < 0 ? -1 : 0);
    const isOver5Years = totalMonths > 60;

    const consultations = patient.consultations ?? [];
    for (const consultation of consultations) {
      const soapNode = soaps.ele('SOAP', withStatus({
        pHciCaseNo: consultation.hciCaseNo,
        pHciTransNo: consultation.hciTransNo,
        pPatientPin: patient.patient.pin,
        pMemPin: patient.member.pin,
        pSoapDate: consultation.soapDate,
        pPatientType: patient.patient.type,
        pEffYear: patient.enlistment.effYear,
        pATC: consultation.atc,
        pIsWalkedIn: consultation.isWalkedIn,
        pCoPay: consultation.coPay,
        pTransDate: consultation.transDate,
      }));

          buildSoapSubjective(soapNode, consultation);
          buildSoapPepert(soapNode, consultation, isOver5Years);
          buildSoapPeMiscs(soapNode, consultation);
          buildSoapPeSpecific(soapNode, consultation);
          buildSoapIcds(soapNode, consultation);
          buildSoapDiagnostics(soapNode, consultation, patient);
          buildSoapManagements(soapNode, consultation);
          buildSoapAdvice(soapNode, consultation);

      soapNode.up();
      hasSoap = true;
    }
  }
  if (!hasSoap) {
    buildStubSoap(soaps, patients[0]);
  }
  soaps.up();

  // ── DIAGNOSTICEXAMRESULTS — DTD requires (DIAGNOSTICEXAMRESULT)+ ──────────
  // Exact DTD casing for resultType values stored in DB
  type DiagExamType =
    | 'FBS' | 'RBS' | 'CBC' | 'URINALYSIS' | 'CHESTXRAY' | 'SPUTUM'
    | 'LIPIDPROFILE' | 'ECG' | 'FECALYSIS' | 'PAPSMEAR' | 'OGTT'
    | 'FOBT' | 'CREATININE' | 'PPDTest' | 'HbA1c';

  // Exact DTD attribute names for the 5 common base fields
  type BaseAttr =
    | 'pReferralFacility' | 'pLabDate' | 'pDateAdded'
    | 'pStatus' | 'pDiagnosticLabFee';

  const DIAG_ELEM_MAP: Record<DiagExamType, { container: string; child: string }> = {
    FBS: { container: 'FBSS', child: 'FBS' },
    RBS: { container: 'RBSS', child: 'RBS' },
    CBC: { container: 'CBCS', child: 'CBC' },
    URINALYSIS: { container: 'URINALYSISS', child: 'URINALYSIS' },
    CHESTXRAY: { container: 'CHESTXRAYS', child: 'CHESTXRAY' },
    SPUTUM: { container: 'SPUTUMS', child: 'SPUTUM' },
    LIPIDPROFILE: { container: 'LIPIDPROFILES', child: 'LIPIDPROFILE' },
    ECG: { container: 'ECGS', child: 'ECG' },
    FECALYSIS: { container: 'FECALYSISS', child: 'FECALYSIS' },
    PAPSMEAR: { container: 'PAPSMEARS', child: 'PAPSMEAR' },
    OGTT: { container: 'OGTTS', child: 'OGTT' },
    FOBT: { container: 'FOBTS', child: 'FOBT' },
    CREATININE: { container: 'CREATININES', child: 'CREATININE' },
    PPDTest: { container: 'PPDTests', child: 'PPDTest' },
    HbA1c: { container: 'HbA1cs', child: 'HbA1c' },
  };

  // Build type-specific attributes per exam type
  function diagExamAttrs(type: DiagExamType | string, d: Record<string, string>): Record<string, string> {
    const base: Record<BaseAttr, string> = {
      pReferralFacility: d.referralFacility || '',
      pLabDate: d.labDate || '',
      pDateAdded: d.dateAdded || '',
      pStatus: d.status || 'D',
      pDiagnosticLabFee: d.diagnosticLabFee || '0.00',
    };
    switch (type) {
      case 'FBS':
      case 'RBS':
        return {
          ...base,
          pGlucoseMg: d.glucoseMg || '',
          pGlucoseMmol: d.glucoseMmol || '',
        };
      case 'CBC':
        return {
          ...base,
          pHematocrit: d.hematocrit || '',
          pHemoglobinG: d.hemoglobinG || '',
          pHemoglobinMmol: d.hemoglobinMmol || '',
          pMhcPg: d.mhcPg || '',
          pMhcFmol: d.mhcFmol || '',
          pMchcGhb: d.mchcGhb || '',
          pMchcMmol: d.mchcMmol || '',
          pMcvUm: d.mcvUm || '',
          pMcvFl: d.mcvFl || '',
          pWbc1000: d.wbc1000 || '',
          pWbc10: d.wbc10 || '',
          pMyelocyte: d.myelocyte || '',
          pNeutrophilsBnd: d.neutrophilsBnd || '',
          pNeutrophilsSeg: d.neutrophilsSeg || '',
          pLymphocytes: d.lymphocytes || '',
          pMonocytes: d.monocytes || '',
          pEosinophils: d.eosinophils || '',
          pBasophils: d.basophils || '',
          pPlatelet: d.platelet || '',
        };
      case 'URINALYSIS':
        return {
          ...base,
          pGravity: d.gravity || '',
          pAppearance: d.appearance || '',
          pColor: d.color || '',
          pGlucose: d.glucose || '',
          pProteins: d.proteins || '',
          pKetones: d.ketones || '',
          pPh: d.ph || '',
          pRbCells: d.rbCells || '',
          pWbCells: d.wbCells || '',
          pBacteria: d.bacteria || '',
          pCrystals: d.crystals || '',
          pBladderCell: d.bladderCell || '',
          pSquamousCell: d.squamousCell || '',
          pTubularCell: d.tubularCell || '',
          pBroadCasts: d.broadCasts || '',
          pEpithelialCast: d.epithelialCast || '',
          pGranularCast: d.granularCast || '',
          pHyalineCast: d.hyalineCast || '',
          pRbcCast: d.rbcCast || '',
          pWaxyCast: d.waxyCast || '',
          pWcCast: d.wcCast || '',
          pAlbumin: d.albumin || '',
          pPusCells: d.pusCells || '',
        };
      case 'CHESTXRAY':
        return {
          ...base,
          pFindings: d.findings || '',
          pRemarksFindings: d.remarksFindings || '',
          pObservation: d.observation || '',
          pRemarksObservation: d.remarksObservation || '',
        };
      case 'SPUTUM':
        return {
          ...base,
          pDataCollection: d.dataCollection || '',
          pFindings: d.findings || '',
          pRemarks: d.remarks || '',
          pNoPlusses: d.noPlusses || '',
        };
      case 'LIPIDPROFILE':
        return {
          ...base,
          pLdl: d.ldl || '',
          pHdl: d.hdl || '',
          pTotal: d.total || '',
          pCholesterol: d.cholesterol || '',
          pTriglycerides: d.triglycerides || '',
        };
      case 'ECG':
        return {
          ...base,
          pFindings: d.findings || '',
          pRemarks: d.remarks || '',
        };
      case 'FECALYSIS':
        return {
          ...base,
          pColor: d.color || '',
          pConsistency: d.consistency || '',
          pRbc: d.rbc || '',
          pWbc: d.wbc || '',
          pOva: d.ova || '',
          pParasite: d.parasite || '',
          pBlood: d.blood || '',
          pPusCells: d.pusCells || '',
        };
      case 'PAPSMEAR':
        return {
          ...base,
          pFindings: d.findings || '',
          pImpression: d.impression || '',
        };
      case 'OGTT':
        return {
          ...base,
          pExamFastingMg: d.examFastingMg || '',
          pExamFastingMmol: d.examFastingMmol || '',
          pExamOgttOneHrMg: d.examOgttOneHrMg || '',
          pExamOgttOneHrMmol: d.examOgttOneHrMmol || '',
          pExamOgttTwoHrMg: d.examOgttTwoHrMg || '',
          pExamOgttTwoHrMmol: d.examOgttTwoHrMmol || '',
        };
      case 'FOBT':
      case 'CREATININE':
      case 'PPDTest':
      case 'HbA1c':   // DTD uses pFindings, NOT pHba1c
        return { ...base, pFindings: d.findings || d.result || '' };
      default:        // OTHERDIAGEXAM
        return {
          ...base,
          pOthDiagExam: d.othDiagExam || type,
          pFindings: d.findings || d.result || '',
        };
    }
  }

  const allDiagResults: KonsultaDiagnosticExamData[] = [];
  for (const p of patients) {
    const hasDiagResults = p.diagnosticResults && p.diagnosticResults.length > 0;

    const hasDiabetesFamHist = p.profile.familyHistories?.some(
      fh => fh.code === '006' || fh.code === '6' || fh.specificDesc?.toUpperCase() === 'DIABETES MELLITUS'
    );

    if (hasDiabetesFamHist && !hasDiagResults) {
      throw new Error(`PhilHealth Validation Error: A Diagnostic Exam Result is strictly required because the patient has a Family History of Diabetes Mellitus.`);
    }

    if (hasDiagResults) {
      allDiagResults.push(...p.diagnosticResults!);
    }
  }

  const diagResultsEl = doc.ele('DIAGNOSTICEXAMRESULTS');

  if (allDiagResults.length > 0) {
    // Group all exam results for the same patient into ONE DIAGNOSTICEXAMRESULT
    const grouped = new Map<string, KonsultaDiagnosticExamData[]>();
    for (const dr of allDiagResults) {
      const key = `${dr.patientPin}_${dr.hciTransNo}`;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(dr);
    }

    for (const records of grouped.values()) {
      const first = records[0];
      const examResult = diagResultsEl.ele('DIAGNOSTICEXAMRESULT', toUpperAttr({
        pHciCaseNo: first.hciCaseNo,
        pHciTransNo: first.hciTransNo,
        pPatientPin: first.patientPin,
        pPatientType: first.patientType,
        pMemPin: first.memPin,
        pEffYear: first.effYear,
      }));

      // Backward-compat: remap old uppercase DB values to exact DTD casing
      const CASING_COMPAT: Partial<Record<string, DiagExamType>> = {
        HBA1C: 'HbA1c',
        PPDTEST: 'PPDTest',
      };

      // Group same-type records → one container per type (DTD: CREATININES (CREATININE)+)
      const byType = new Map<string, { elemNames: { container: string; child: string }; items: KonsultaDiagnosticExamData[] }>();
      for (const dr of records) {
        const typeKey = (CASING_COMPAT[dr.resultType] ?? dr.resultType) as DiagExamType | string;
        if (!byType.has(typeKey)) {
          byType.set(typeKey, {
            elemNames: DIAG_ELEM_MAP[typeKey as DiagExamType] ?? { container: 'OTHERDIAGEXAMS', child: 'OTHERDIAGEXAM' },
            items: [],
          });
        }
        byType.get(typeKey)!.items.push(dr);
      }

      for (const [typeKey, { elemNames, items }] of byType) {
        const container = examResult.ele(elemNames.container);
        for (const dr of items) {
          container.ele(elemNames.child, withStatus(diagExamAttrs(typeKey, dr.resultData)));
        }
      }

      examResult.up();
    }
  } else {
    // DTD requires at least one DIAGNOSTICEXAMRESULT — emit stub
    diagResultsEl.ele('DIAGNOSTICEXAMRESULT', toUpperAttr({
      pHciCaseNo: '',
      pHciTransNo: '',
      pPatientPin: '',
      pPatientType: '',
      pMemPin: '',
      pEffYear: '',
    })).up();
  }
  diagResultsEl.up();

  // ── MEDICINES ─────────────────────────────────────────────────────────────
  const medicines = doc.ele('MEDICINES');
  if (tagging === '1') {
    // Tagging 1: emit one stub MEDICINE per patient
    for (const _patient of patients) {
      buildStubMedicine(medicines);
    }
  } else {
    // Tagging 2: emit populated medicines
    if (allMedicines.length > 0) {
      for (const med of allMedicines) {
        medicines.ele('MEDICINE', withStatus({
          pHciCaseNo: med.hciCaseNo,
          pHciTransNo: med.hciTransNo,
          pCategory: med.category,
          pDrugCode: med.drugCode || DEFAULT_DRUG_CODE,
          pGenericCode: med.genericCode,
          pSaltCode: med.saltCode,
          pStrengthCode: med.strengthCode,
          pFormCode: med.formCode,
          pUnitCode: med.unitCode,
          pPackageCode: med.packageCode,
          pOtherMedicine: med.otherMedicine,
          pOthMedDrugGrouping: med.othMedDrugGrouping,
          pRoute: med.route,
          pQuantity: med.quantity,
          pActualUnitPrice: med.actualUnitPrice,
          pTotalAmtPrice: med.totalAmtPrice,
          pInstructionQuantity: med.instructionQuantity,
          pInstructionStrength: med.instructionStrength,
          pInstructionFrequency: med.instructionFrequency,
          pPrescribingPhysician: med.prescribingPhysician,
          pIsDispensed: med.isDispensed,
          pDateDispensed: med.dateDispensed,
          pDispensingPersonnel: med.dispensingPersonnel || 'LICENSED PHARMACIST',
          pIsApplicable: med.isApplicable,
          pDateAdded: med.dateAdded,
        })).up();
      }
    } else {
      // DTD requires at least one MEDICINE — emit stub.
      // For Tagging 2, we emit a NOMED stub for each patient's consultation to satisfy ePRES validation.
      let emitted = false;
      for (const p of patients) {
        for (const c of p.consultations ?? []) {
          buildNomedMedicine(medicines, p.enlistment.hciCaseNo, c.hciTransNo);
          emitted = true;
        }
      }
      if (!emitted) {
        buildStubMedicine(medicines);
      }
    }
  }
  medicines.up();

  // ── DOCUMENTS (optional) ──────────────────────────────────────────────────
  const documents = doc.ele('DOCUMENTS');
  // No documents — emit empty container. DTD allows 0 children (DOCUMENT*)
  documents.up();

  // ── Finalize ──────────────────────────────────────────────────────────────
  // PhilHealth rejects XML with <?xml ...?> declaration (SAXParseException)
  const xmlString = doc.end({ prettyPrint: true, headless: true });

  return xmlString;
}
