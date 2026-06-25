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
  };
  // Consultations (for Tagging 2 only)
  consultations?: KonsultaConsultationData[];
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
  // ICD codes
  icdCodes: string[];
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
  // DTD requires at least one MEDHIST - emit placeholder
  medhists.ele('MEDHIST', withStatus({
    pHciTransNo: patient.profile.hciTransNo,
    pMedHistCode: '',
    pIsRelevant: 'N',
  })).up();
  return medhists.up();
}

function buildMhSpecifics(parent: XmlNode, patient: KonsultaPatientData): XmlNode {
  const specifics = parent.ele('MHSPECIFICS');
  specifics.ele('MHSPECIFIC', withStatus({
    pHciTransNo: patient.profile.hciTransNo,
    pMedHistCode: '',
    pMHSCode: '',
    pMHSOthers: '',
  })).up();
  return specifics.up();
}

function buildSurgHists(parent: XmlNode, patient: KonsultaPatientData): XmlNode {
  const surghists = parent.ele('SURGHISTS');
  surghists.ele('SURGHIST', withStatus({
    pHciTransNo: patient.profile.hciTransNo,
    pSurgHistCode: '',
    pIsRelevant: 'N',
  })).up();
  return surghists.up();
}

function buildFamHists(parent: XmlNode, patient: KonsultaPatientData): XmlNode {
  const famhists = parent.ele('FAMHISTS');
  famhists.ele('FAMHIST', withStatus({
    pHciTransNo: patient.profile.hciTransNo,
    pFamHistCode: '',
    pIsRelevant: 'N',
  })).up();
  return famhists.up();
}

function buildFhSpecifics(parent: XmlNode, patient: KonsultaPatientData): XmlNode {
  const specifics = parent.ele('FHSPECIFICS');
  specifics.ele('FHSPECIFIC', withStatus({
    pHciTransNo: patient.profile.hciTransNo,
    pFamHistCode: '',
    pFHSCode: '',
    pFHSOthers: '',
  })).up();
  return specifics.up();
}

function buildSocHist(parent: XmlNode, patient: KonsultaPatientData): XmlNode {
  parent.ele('SOCHIST', withStatus({
    pHciTransNo: patient.profile.hciTransNo,
    pIsSmoker: '',
    pStickPerDay: '',
    pPackPerYear: '',
    pIsDrinker: '',
    pBottlePerDay: '',
    pIsDrugUser: '',
    pIsExposed: '',
    pSpecifyExposure: '',
    pSocHistOther: '',
  })).up();
  return parent;
}

function buildImmunizations(parent: XmlNode, patient: KonsultaPatientData): XmlNode {
  const immunizations = parent.ele('IMMUNIZATIONS');
  immunizations.ele('IMMUNIZATION', withStatus({
    pHciTransNo: patient.profile.hciTransNo,
    pImmunizationCode: '',
    pImmunizationRemarks: '',
    pImmunizationDateGiven: '',
  })).up();
  return immunizations.up();
}

function buildMensHist(parent: XmlNode, patient: KonsultaPatientData): XmlNode {
  parent.ele('MENSHIST', withStatus({
    pHciTransNo: patient.profile.hciTransNo,
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
    pHciTransNo: patient.profile.hciTransNo,
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
    pHciTransNo: patient.profile.hciTransNo,
    pSystolic: v.systolic,
    pDiastolic: v.diastolic,
    pHR: v.hr,
    pRR: v.rr,
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
    pHciTransNo: patient.profile.hciTransNo,
    pBloodType: patient.profile.bloodType,
  })).up();
  return parent;
}

function buildPeGenSurvey(parent: XmlNode, patient: KonsultaPatientData): XmlNode {
  parent.ele('PEGENSURVEY', withStatus({
    pHciTransNo: patient.profile.hciTransNo,
    pGenSurvey: '',
    pGenSurveyRemarks: '',
  })).up();
  return parent;
}

function buildProfilePeMiscs(parent: XmlNode, patient: KonsultaPatientData): XmlNode {
  const pemiscs = parent.ele('PEMISCS');
  // DTD requires at least one PEMISC
  pemiscs.ele('PEMISC', withStatus({
    pHciTransNo: patient.profile.hciTransNo,
    pPEMiscCode: '',
    pPEMiscFindings: '',
    pPEMiscRemarks: '',
  })).up();
  return pemiscs.up();
}

function buildProfilePeSpecific(parent: XmlNode, patient: KonsultaPatientData): XmlNode {
  parent.ele('PESPECIFIC', withStatus({
    pHciTransNo: patient.profile.hciTransNo,
    pPEMiscCode: '',
    pPESCode: '',
    pPESOthers: '',
  })).up();
  return parent;
}

function buildNcdQAns(parent: XmlNode, patient: KonsultaPatientData): XmlNode {
  // NCD Risk Assessment has 24 questions (Q1-Q24), all default empty
  const attrs: Record<string, string> = {
    pHciTransNo: patient.profile.hciTransNo,
  };
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
    pHciTransNo: consultation.hciTransNo,
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
    pHciTransNo: consultation.hciTransNo,
    pSystolic: v.systolic,
    pDiastolic: v.diastolic,
    pHR: v.hr,
    pRR: v.rr,
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
  const pemiscs = parent.ele('PEMISCS');
  pemiscs.ele('PEMISC', withStatus({
    pHciTransNo: consultation.hciTransNo,
    pPEMiscCode: '',
    pPEMiscFindings: '',
    pPEMiscRemarks: '',
  })).up();
  return pemiscs.up();
}

function buildSoapPeSpecific(parent: XmlNode, consultation: KonsultaConsultationData): XmlNode {
  parent.ele('PESPECIFIC', withStatus({
    pHciTransNo: consultation.hciTransNo,
    pPEMiscCode: '',
    pPESCode: '',
    pPESOthers: '',
  })).up();
  return parent;
}

function buildSoapIcds(parent: XmlNode, consultation: KonsultaConsultationData): XmlNode {
  const icds = parent.ele('ICDS');
  if (consultation.icdCodes.length > 0) {
    for (const code of consultation.icdCodes) {
      icds.ele('ICD', withStatus({
        pHciTransNo: consultation.hciTransNo,
        pICDCode: code,
      })).up();
    }
  } else {
    // DTD requires at least one ICD
    icds.ele('ICD', withStatus({
      pHciTransNo: consultation.hciTransNo,
      pICDCode: '',
    })).up();
  }
  return icds.up();
}

function buildSoapDiagnostics(parent: XmlNode, consultation: KonsultaConsultationData): XmlNode {
  const diagnostics = parent.ele('DIAGNOSTICS');
  // DTD requires at least one DIAGNOSTIC
  diagnostics.ele('DIAGNOSTIC', withStatus({
    pHciTransNo: consultation.hciTransNo,
    pDiagLabCode: '',
    pDiagLabResult: '',
    pDiagLabDate: '',
    pDiagLabFacilityCode: '',
  })).up();
  return diagnostics.up();
}

function buildSoapManagements(parent: XmlNode, consultation: KonsultaConsultationData): XmlNode {
  const managements = parent.ele('MANAGEMENTS');
  // DTD requires at least one MANAGEMENT
  managements.ele('MANAGEMENT', withStatus({
    pHciTransNo: consultation.hciTransNo,
    pManagementCode: '',
    pManagementRemarks: '',
  })).up();
  return managements.up();
}

function buildSoapAdvice(parent: XmlNode, consultation: KonsultaConsultationData): XmlNode {
  parent.ele('ADVICE', withStatus({
    pHciTransNo: consultation.hciTransNo,
    pAdvice: '',
    pFollowUpDate: '',
    pReferredTo: '',
    pReasonForReferral: '',
    pReferredToOther: '',
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
    pPatientPIN: '',
    pMemberPIN: '',
    pSOAPDate: '',
    pPatientAge: '',
    pATC: '',
    pIsWalkedIn: '',
    pCoPay: '',
    pTransDate: '',
    pCreatedBy: '',
  }));

  // SUBJECTIVE stub
  soap.ele('SUBJECTIVE', withStatus({
    pHciTransNo: '',
    pIllnessHistory: '',
    pSignsSymptoms: '',
    pOtherComplaint: '',
    pPainSite: '',
  })).up();

  // PEPERT stub
  soap.ele('PEPERT', withStatus({
    pHciTransNo: '',
    pSystolic: '',
    pDiastolic: '',
    pHR: '',
    pRR: '',
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

  // PEMISCS stub
  const pemiscs = soap.ele('PEMISCS');
  pemiscs.ele('PEMISC', withStatus({
    pHciTransNo: '',
    pPEMiscCode: '',
    pPEMiscFindings: '',
    pPEMiscRemarks: '',
  })).up();
  pemiscs.up();

  // PESPECIFIC stub
  soap.ele('PESPECIFIC', withStatus({
    pHciTransNo: '',
    pPEMiscCode: '',
    pPESCode: '',
    pPESOthers: '',
  })).up();

  // ICDS stub
  const icds = soap.ele('ICDS');
  icds.ele('ICD', withStatus({
    pHciTransNo: '',
    pICDCode: '',
  })).up();
  icds.up();

  // DIAGNOSTICS stub
  const diagnostics = soap.ele('DIAGNOSTICS');
  diagnostics.ele('DIAGNOSTIC', withStatus({
    pHciTransNo: '',
    pDiagLabCode: '',
    pDiagLabResult: '',
    pDiagLabDate: '',
    pDiagLabFacilityCode: '',
  })).up();
  diagnostics.up();

  // MANAGEMENTS stub
  const managements = soap.ele('MANAGEMENTS');
  managements.ele('MANAGEMENT', withStatus({
    pHciTransNo: '',
    pManagementCode: '',
    pManagementRemarks: '',
  })).up();
  managements.up();

  // ADVICE stub
  soap.ele('ADVICE', withStatus({
    pHciTransNo: '',
    pAdvice: '',
    pFollowUpDate: '',
    pReferredTo: '',
    pReasonForReferral: '',
    pReferredToOther: '',
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
      pPackageType: e.packageType,
      pWithConsent: e.withConsent,
      pMemberPIN: m.pin,
      pMemberLastName: m.lastName,
      pMemberFirstName: m.firstName,
      pMemberMiddleName: m.middleName,
      pMemberExtName: m.extName,
      pMemberDOB: m.dob,
      pPatientPIN: p.pin,
      pPatientLastName: p.lastName,
      pPatientFirstName: p.firstName,
      pPatientMiddleName: p.middleName,
      pPatientExtName: p.extName,
      pPatientSex: p.sex,
      pPatientDOB: p.dob,
      pPatientType: p.type,
      pPatientMobileNo: p.mobileNo,
      pPatientLandLineNo: p.landlineNo,
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
      pPatientPIN: p.pin,
      pMemberPIN: m.pin,
      pProfDate: pr.profDate,
      pPatientAge: p.age,
      pATC: pr.atc,
      pIsWalkedIn: pr.isWalkedIn,
      pTransDate: pr.transDate,
      pCreatedBy: patient.enlistment.createdBy,
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
          pPatientPIN: patient.patient.pin,
          pMemberPIN: patient.member.pin,
          pSOAPDate: consultation.soapDate,
          pPatientAge: patient.patient.age,
          pATC: consultation.atc,
          pIsWalkedIn: consultation.isWalkedIn,
          pCoPay: consultation.coPay,
          pTransDate: consultation.transDate,
          pCreatedBy: patient.enlistment.createdBy,
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

  // ── DIAGNOSTICEXAMRESULTS (optional) ──────────────────────────────────────
  const diagResults = doc.ele('DIAGNOSTICEXAMRESULTS');
  // No data — emit empty container. DTD allows 0 children (DIAGNOSTICEXAMRESULT*)
  diagResults.up();

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
