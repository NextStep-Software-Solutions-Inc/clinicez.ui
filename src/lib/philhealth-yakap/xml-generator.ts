import { create } from 'xmlbuilder2';

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

function withStatus(attrs: Record<string, string>): Record<string, string> {
  return {
    ...attrs,
    pReportStatus: REPORT_STATUS,
    pDeficiencyRemarks: DEFICIENCY_REMARKS,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Builder helpers for Profile child elements
// ─────────────────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type XmlNode = any;

function buildMedHists(parent: XmlNode, patient: KonsultaPatientData): XmlNode {
  const medhists = parent.ele('MEDHISTS');
  const hists = patient.profile.medicalHistories;
  
  if (hists.length > 0) {
    for (const h of hists) {
      medhists.ele('MEDHIST', withStatus({
        pMdiseaseCode: h.code,
      })).up();
    }
  } else {
    // DTD requires at least one MEDHIST - emit placeholder (999 None)
    medhists.ele('MEDHIST', withStatus({
      pMdiseaseCode: '999',
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
        pMdiseaseCode: h.code,
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
        pMdiseaseCode: h.code,
      })).up();
    }
  } else {
    famhists.ele('FAMHIST', withStatus({
      pMdiseaseCode: '999',
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
        pMdiseaseCode: h.code,
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

function buildSocHist(parent: XmlNode, patient: KonsultaPatientData): XmlNode {
  const soc = patient.profile.socialHistory;
  parent.ele('SOCHIST', withStatus({
    pIsSmoker: soc?.isSmoker || '',
    pNoCigpk: soc?.noCigpk || '',
    pIsAdrinker: soc?.isAdrinker || '',
    pNoBottles: soc?.noBottles || '',
    pIllDrugUser: soc?.illDrugUser || '',
    pIsSexuallyActive: soc?.isSexuallyActive || '',
  })).up();
  return parent;
}

function buildImmunizations(parent: XmlNode, patient: KonsultaPatientData): XmlNode {
  const immunizations = parent.ele('IMMUNIZATIONS');
  immunizations.ele('IMMUNIZATION', withStatus({
    pImmunizationCode: '',
    pImmunizationRemarks: '',
    pImmunizationDateGiven: '',
  })).up();
  return immunizations.up();
}

function buildMensHist(parent: XmlNode, patient: KonsultaPatientData): XmlNode {
  parent.ele('MENSHIST', withStatus({
    pMenarche: '',
    pLastMensPeriod: '',
    pPeriodDuration: '',
    pPadsPerDay: '',
    pOnsetSexIntercourse: '',
    pBirthControl: '',
    pIsMenopause: '',
    pMenopauseAge: '',
  })).up();
  return parent;
}

function buildPregHist(parent: XmlNode, patient: KonsultaPatientData): XmlNode {
  parent.ele('PREGHIST', withStatus({
    pGravida: '',
    pPara: '',
    pT: '',
    pP: '',
    pA: '',
    pL: '',
    pFullTerms: '',
    pPremature: '',
    pAbortion: '',
    pLivingChildren: '',
    pDateLastDelivery: '',
    pTypeLasDelivery: '',
    pLastChildBirthWeight: '',
  })).up();
  return parent;
}

function buildProfilePepert(parent: XmlNode, patient: KonsultaPatientData): XmlNode {
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
    pZScore: v.zScore,
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
    pBloodType: patient.profile.bloodType,
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

function buildProfilePeMiscs(parent: XmlNode, patient: KonsultaPatientData): XmlNode {
  const pes = patient.profile.physicalExaminations || [];
  const pemiscs = parent.ele('PEMISCS');
  
  if (pes.length === 0) {
    // Generate exactly 1 dummy PEMISC
    pemiscs.ele('PEMISC', withStatus({
      pSkinId: '', pHeentId: '', pChestId: '', pHeartId: '',
      pAbdomenId: '', pNeuroId: '', pRectalId: '', pGuId: '',
    })).up();
  } else {
    // Generate 1 PEMISC per historical Physical Examination
    for (const pe of pes) {
      pemiscs.ele('PEMISC', withStatus({
        pSkinId: pe.skinId || '',
        pHeentId: pe.heentId || '',
        pChestId: pe.chestId || '',
        pHeartId: pe.heartId || '',
        pAbdomenId: pe.abdomenId || '',
        pNeuroId: pe.neuroId || '',
        pRectalId: pe.rectalId || '',
        pGuId: pe.guId || '',
      })).up();
    }
  }

  pemiscs.up();
  return parent;
}

function buildProfilePeSpecific(parent: XmlNode, patient: KonsultaPatientData): XmlNode {
  const pes = patient.profile.physicalExaminations || [];
  if (pes.length === 0) {
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
  } else {
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
  }
  return parent;
}

function buildNcdQAns(parent: XmlNode, patient: KonsultaPatientData): XmlNode {
  // NCD Risk Assessment has 24 questions (Q1-Q24), all default empty
  const attrs: Record<string, string> = {};
  for (let i = 1; i <= 24; i++) {
    attrs[`pQ${i}`] = '';
  }
  parent.ele('NCDQANS', withStatus(attrs)).up();
  return parent;
}

// ─────────────────────────────────────────────────────────────────────────────
// Builder helpers for SOAP child elements
// ─────────────────────────────────────────────────────────────────────────────

function buildSoapSubjective(parent: XmlNode, consultation: KonsultaConsultationData): XmlNode {
  parent.ele('SUBJECTIVE', withStatus({
    pIllnessHistory: consultation.subjective.illnessHistory,
    pSignsSymptoms: consultation.subjective.signsSymptoms,
    pOtherComplaint: consultation.subjective.otherComplaint,
    pPainSite: consultation.subjective.painSite,
  })).up();
  return parent;
}

function buildSoapPepert(parent: XmlNode, consultation: KonsultaConsultationData): XmlNode {
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
    pZScore: v.zScore,
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
  const fields = [
    { key: 'pHeentId', val: pe?.heentId },
    { key: 'pChestId', val: pe?.chestId },
    { key: 'pHeartId', val: pe?.heartId },
    { key: 'pAbdomenId', val: pe?.abdomenId },
    { key: 'pGuId', val: pe?.guId },
    { key: 'pRectalId', val: pe?.rectalId },
    { key: 'pSkinId', val: pe?.skinId },
    { key: 'pNeuroId', val: pe?.neuroId },
  ];

  const validFields = fields.filter(f => !!f.val);

  const pemiscs = parent.ele('PEMISCS');
  
  if (validFields.length === 0) {
    // Generate exactly 1 dummy PEMISC
    pemiscs.ele('PEMISC', withStatus({
      pSkinId: '', pHeentId: '', pChestId: '', pHeartId: '',
      pAbdomenId: '', pNeuroId: '', pRectalId: '', pGuId: '',
    })).up();
  } else {
    // Generate 1 PEMISC per populated field
    for (const f of validFields) {
      const attrs: any = {
        pSkinId: '', pHeentId: '', pChestId: '', pHeartId: '',
        pAbdomenId: '', pNeuroId: '', pRectalId: '', pGuId: '',
      };
      attrs[f.key] = f.val;
      pemiscs.ele('PEMISC', withStatus(attrs)).up();
    }
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
  if (consultation.icdCodes.length > 0) {
    for (const code of consultation.icdCodes) {
      icds.ele('ICD', withStatus({
        pIcdCode: code,
      })).up();
    }
  } else {
    // DTD requires at least one ICD
    icds.ele('ICD', withStatus({
      pIcdCode: '',
    })).up();
  }
  return icds.up();
}

function buildSoapDiagnostics(parent: XmlNode, consultation: KonsultaConsultationData): XmlNode {
  const diagnostics = parent.ele('DIAGNOSTICS');
  // DTD requires at least one DIAGNOSTIC
  diagnostics.ele('DIAGNOSTIC', withStatus({
    pDiagnosticId: '',
    pOthRemarks: '',
    pIsPhysicianRecommendation: 'N',
    pPatientRemarks: '',
  })).up();
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
    // DTD requires at least one MANAGEMENT
    managements.ele('MANAGEMENT', withStatus({
      pManagementId: '0',
      pOthRemarks: '',
    })).up();
  }
  return managements.up();
}

function buildSoapAdvice(parent: XmlNode, consultation: KonsultaConsultationData): XmlNode {
  parent.ele('ADVICE', withStatus({
    pRemarks: consultation.advice?.advice || '',
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
  soap.ele('PEMISC', withStatus({
    pHciTransNo: '',
    pSkinId: '',
    pHeentId: '',
    pChestId: '',
    pHeartId: '',
    pAbdomenId: '',
    pNeuroId: '',
    pRectalId: '',
    pGuId: '',
  })).up();

  // PESPECIFIC stub
  soap.ele('PESPECIFIC', withStatus({
    pHciTransNo: '',
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
 * Generate a PhilHealth Konsulta XML string conforming to KonsultaData_v1.14.dtd.
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
  if (tagging === '2') {
    for (const p of patients) {
      soapCount += p.consultations?.length ?? 0;
    }
  }
  // For Tagging 1, we still emit 1 stub SOAP per patient
  if (tagging === '1') {
    soapCount = patients.length;
  }

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
      pHciAccreNo: credentials.pHciAccreNo,
      pPMCCNo: credentials.pPMCCNo,
      pEnlistTotalCnt: String(enlistCount),
      pProfileTotalCnt: String(profileCount),
      pSoapTotalCnt: String(soapCount),
      pCertificationId: credentials.pCertificationId,
      pHciTransmittalNumber: credentials.pHciTransmittalNumber,
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
      pEnlistStat: 'A',
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
    buildProfilePepert(profile, patient);
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
  if (tagging === '1') {
    // Tagging 1: emit one stub SOAP per patient (all attrs empty)
    for (const patient of patients) {
      buildStubSoap(soaps, patient);
    }
  } else {
    // Tagging 2: emit populated SOAPs from consultations
    for (const patient of patients) {
      for (const consultation of patient.consultations ?? []) {
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
        buildSoapPepert(soapNode, consultation);
        buildSoapPeMiscs(soapNode, consultation);
        buildSoapPeSpecific(soapNode, consultation);
        buildSoapIcds(soapNode, consultation);
        buildSoapDiagnostics(soapNode, consultation);
        buildSoapManagements(soapNode, consultation);
        buildSoapAdvice(soapNode, consultation);

        soapNode.up();
      }
    }
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
    FBS:          { container: 'FBSS',          child: 'FBS' },
    RBS:          { container: 'RBSS',          child: 'RBS' },
    CBC:          { container: 'CBCS',          child: 'CBC' },
    URINALYSIS:   { container: 'URINALYSISS',   child: 'URINALYSIS' },
    CHESTXRAY:    { container: 'CHESTXRAYS',    child: 'CHESTXRAY' },
    SPUTUM:       { container: 'SPUTUMS',       child: 'SPUTUM' },
    LIPIDPROFILE: { container: 'LIPIDPROFILES', child: 'LIPIDPROFILE' },
    ECG:          { container: 'ECGS',          child: 'ECG' },
    FECALYSIS:    { container: 'FECALYSISS',    child: 'FECALYSIS' },
    PAPSMEAR:     { container: 'PAPSMEARS',     child: 'PAPSMEAR' },
    OGTT:         { container: 'OGTTS',         child: 'OGTT' },
    FOBT:         { container: 'FOBTS',         child: 'FOBT' },
    CREATININE:   { container: 'CREATININES',   child: 'CREATININE' },
    PPDTest:      { container: 'PPDTests',      child: 'PPDTest' },
    HbA1c:        { container: 'HbA1cs',        child: 'HbA1c' },
  };

  // Build type-specific attributes per exam type
  function diagExamAttrs(type: DiagExamType | string, d: Record<string, string>): Record<string, string> {
    const base: Record<BaseAttr, string> = {
      pReferralFacility: d.referralFacility || '',
      pLabDate:          d.labDate          || '',
      pDateAdded:        d.dateAdded        || '',
      pStatus:           d.status           || 'D',
      pDiagnosticLabFee: d.diagnosticLabFee || '0.00',
    };
    switch (type) {
      case 'FBS':
      case 'RBS':
        return { ...base,
          pGlucoseMg:   d.glucoseMg   || '',
          pGlucoseMmol: d.glucoseMmol || '',
        };
      case 'CBC':
        return { ...base,
          pHematocrit:     d.hematocrit     || '',
          pHemoglobinG:    d.hemoglobinG    || '',
          pHemoglobinMmol: d.hemoglobinMmol || '',
          pMhcPg:          d.mhcPg          || '',
          pMhcFmol:        d.mhcFmol        || '',
          pMchcGhb:        d.mchcGhb        || '',
          pMchcMmol:       d.mchcMmol       || '',
          pMcvUm:          d.mcvUm          || '',
          pMcvFl:          d.mcvFl          || '',
          pWbc1000:        d.wbc1000        || '',
          pWbc10:          d.wbc10          || '',
          pMyelocyte:      d.myelocyte      || '',
          pNeutrophilsBnd: d.neutrophilsBnd || '',
          pNeutrophilsSeg: d.neutrophilsSeg || '',
          pLymphocytes:    d.lymphocytes    || '',
          pMonocytes:      d.monocytes      || '',
          pEosinophils:    d.eosinophils    || '',
          pBasophils:      d.basophils      || '',
          pPlatelet:       d.platelet       || '',
        };
      case 'URINALYSIS':
        return { ...base,
          pGravity:       d.gravity       || '',
          pAppearance:    d.appearance    || '',
          pColor:         d.color         || '',
          pGlucose:       d.glucose       || '',
          pProteins:      d.proteins      || '',
          pKetones:       d.ketones       || '',
          pPh:            d.ph            || '',
          pRbCells:       d.rbCells       || '',
          pWbCells:       d.wbCells       || '',
          pBacteria:      d.bacteria      || '',
          pCrystals:      d.crystals      || '',
          pBladderCell:   d.bladderCell   || '',
          pSquamousCell:  d.squamousCell  || '',
          pTubularCell:   d.tubularCell   || '',
          pBroadCasts:    d.broadCasts    || '',
          pEpithelialCast:d.epithelialCast|| '',
          pGranularCast:  d.granularCast  || '',
          pHyalineCast:   d.hyalineCast   || '',
          pRbcCast:       d.rbcCast       || '',
          pWaxyCast:      d.waxyCast      || '',
          pWcCast:        d.wcCast        || '',
          pAlbumin:       d.albumin       || '',
          pPusCells:      d.pusCells      || '',
        };
      case 'CHESTXRAY':
        return { ...base,
          pFindings:           d.findings           || '',
          pRemarksFindings:    d.remarksFindings    || '',
          pObservation:        d.observation        || '',
          pRemarksObservation: d.remarksObservation || '',
        };
      case 'SPUTUM':
        return { ...base,
          pDataCollection: d.dataCollection || '',
          pFindings:       d.findings       || '',
          pRemarks:        d.remarks        || '',
          pNoPlusses:      d.noPlusses      || '',
        };
      case 'LIPIDPROFILE':
        return { ...base,
          pLdl:          d.ldl          || '',
          pHdl:          d.hdl          || '',
          pTotal:        d.total        || '',
          pCholesterol:  d.cholesterol  || '',
          pTriglycerides:d.triglycerides|| '',
        };
      case 'ECG':
        return { ...base,
          pFindings: d.findings || '',
          pRemarks:  d.remarks  || '',
        };
      case 'FECALYSIS':
        return { ...base,
          pColor:       d.color       || '',
          pConsistency: d.consistency || '',
          pRbc:         d.rbc         || '',
          pWbc:         d.wbc         || '',
          pOva:         d.ova         || '',
          pParasite:    d.parasite    || '',
          pBlood:       d.blood       || '',
          pPusCells:    d.pusCells    || '',
        };
      case 'PAPSMEAR':
        return { ...base,
          pFindings:   d.findings   || '',
          pImpression: d.impression || '',
        };
      case 'OGTT':
        return { ...base,
          pExamFastingMg:      d.examFastingMg      || '',
          pExamFastingMmol:    d.examFastingMmol    || '',
          pExamOgttOneHrMg:    d.examOgttOneHrMg    || '',
          pExamOgttOneHrMmol:  d.examOgttOneHrMmol  || '',
          pExamOgttTwoHrMg:    d.examOgttTwoHrMg    || '',
          pExamOgttTwoHrMmol:  d.examOgttTwoHrMmol  || '',
        };
      case 'FOBT':
      case 'CREATININE':
      case 'PPDTest':
      case 'HbA1c':   // DTD uses pFindings, NOT pHba1c
        return { ...base, pFindings: d.findings || d.result || '' };
      default:        // OTHERDIAGEXAM
        return { ...base,
          pOthDiagExam: d.othDiagExam || type,
          pFindings:    d.findings    || d.result || '',
        };
    }
  }

  const allDiagResults: KonsultaDiagnosticExamData[] = [];
  for (const p of patients) {
    if (p.diagnosticResults) {
      allDiagResults.push(...p.diagnosticResults);
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
      const examResult = diagResultsEl.ele('DIAGNOSTICEXAMRESULT', {
        pHciCaseNo:   first.hciCaseNo,
        pHciTransNo:  first.hciTransNo,
        pPatientPin:  first.patientPin,
        pPatientType: first.patientType,
        pMemPin:      first.memPin,
        pEffYear:     first.effYear,
      });

      // Backward-compat: remap old uppercase DB values to exact DTD casing
      const CASING_COMPAT: Partial<Record<string, DiagExamType>> = {
        HBA1C:   'HbA1c',
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
    diagResultsEl.ele('DIAGNOSTICEXAMRESULT', {
      pHciCaseNo:   '',
      pHciTransNo:  '',
      pPatientPin:  '',
      pPatientType: '',
      pMemPin:      '',
      pEffYear:     '',
    }).up();
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
          pDispensingPersonnel: med.dispensingPersonnel,
          pIsApplicable: med.isApplicable,
          pDateAdded: med.dateAdded,
        })).up();
      }
    } else {
      // DTD requires at least one MEDICINE — emit stub
      buildStubMedicine(medicines);
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
