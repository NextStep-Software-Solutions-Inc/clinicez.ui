import { create } from "xmlbuilder2";
import type { 
  PcbXmlData, ProfileXmlData, SoapXmlData,
} from "./types";

// ─── Dummy fallback values per element — based on official sample XMLs ───────
// Reference: Annex B & C, PhilHealth_Konsulta_Implementation_Guide_for_PKA_v1.1.md

// MEDHIST: pMdiseaseCode is a library code — use "" when no history (sample uses real codes only when present)
const DUMMY_MEDHIST    = { pMdiseaseCode: "",  pReportStatus: "U", pDeficiencyRemarks: "" };
// MHSPECIFIC: same pattern — empty strings when no specific
const DUMMY_MHSPECIFIC = { pMdiseaseCode: "",  pSpecificDesc: "", pReportStatus: "U", pDeficiencyRemarks: "" };
// SURGHIST: empty strings per sample
const DUMMY_SURGHIST   = { pSurgDesc: "",        pSurgDate: "",     pReportStatus: "U", pDeficiencyRemarks: "" };
// FAMHIST: empty string for pMdiseaseCode per sample
const DUMMY_FAMHIST    = { pMdiseaseCode: "",  pReportStatus: "U", pDeficiencyRemarks: "" };
// FHSPECIFIC: empty strings per sample (Annex B: pMdiseaseCode="" pSpecificDesc="")
const DUMMY_FHSPECIFIC = { pMdiseaseCode: "",  pSpecificDesc: "", pReportStatus: "U", pDeficiencyRemarks: "" };
// IMMUNIZATION: all empty strings per sample (code fields empty when not applicable)
const DUMMY_IMMUNIZATION = {
  pChildImmcode: "", pYoungwImmcode: "", pPregwImmcode: "", pElderlyImmcode: "", pOtherImm: "",
  pReportStatus: "U", pDeficiencyRemarks: ""
};
// SOCHIST: pNoCigpk and pNoBottles are empty strings when pIsSmoker/pIsAdrinker="N" (per sample Annex B)
const DUMMY_SOCHIST = {
  pIsSmoker: "N", pNoCigpk: "", pIsAdrinker: "N", pNoBottles: "",
  pIllDrugUser: "N", pIsSexuallyActive: "N", pReportStatus: "U", pDeficiencyRemarks: ""
};
// MENSHIST: pMenarchePeriod/pPeriodDuration etc. use "0" per sample; pIsApplicable="N" for non-female dummy
const DUMMY_MENSHIST = {
  pMenarchePeriod: "0", pLastMensPeriod: "", pPeriodDuration: "0", pMensInterval: "0",
  pPadsPerDay: "0", pOnsetSexIc: "0", pBirthCtrlMethod: "", pIsMenopause: "",
  pMenopauseAge: "", pIsApplicable: "N", pReportStatus: "U", pDeficiencyRemarks: ""
};
// PREGHIST: sample uses "0" for counts, "X" for pDeliveryTyp when not applicable, pIsApplicable="N"
const DUMMY_PREGHIST = {
  pPregCnt: "0", pDeliveryCnt: "0", pDeliveryTyp: "X", pFullTermCnt: "0",
  pPrematureCnt: "0", pAbortionCnt: "0", pLivChildrenCnt: "0",
  pWPregIndhyp: "N", pWFamPlan: "N", pIsApplicable: "N", pReportStatus: "U", pDeficiencyRemarks: ""
};
// PEPERT: all empty strings per sample (Annex B first-tranche SOAP PEPERT uses all "")
const DUMMY_PEPERT = {
  pSystolic: "", pDiastolic: "", pHr: "", pRr: "", pTemp: "",
  pHeight: "", pWeight: "", pBMI: "", pZScore: "",
  pLeftVision: "", pRightVision: "", pLength: "", pHeadCirc: "",
  pSkinfoldThickness: "", pWaist: "", pHip: "", pLimbs: "", pMidUpperArmCirc: "",
  pReportStatus: "U", pDeficiencyRemarks: ""
};
// BLOODTYPE: empty string per first-tranche sample SOAP (not applicable when no data)
const DUMMY_BLOODTYPE = { pBloodType: "", pReportStatus: "U", pDeficiencyRemarks: "" };
// PEGENSURVEY: pGenSurveyId="1" (Awake and Alert) is the safe default; pGenSurveyRem="" per sample
const DUMMY_PEGENSURVEY = { pGenSurveyId: "1", pGenSurveyRem: "", pReportStatus: "U", pDeficiencyRemarks: "" };
// PEMISC: all empty strings per sample (each PEMISC row fills in only one column at a time)
const DUMMY_PEMISC = {
  pSkinId: "", pHeentId: "", pChestId: "", pHeartId: "", pAbdomenId: "",
  pNeuroId: "", pGuId: "", pRectalId: "", pReportStatus: "U", pDeficiencyRemarks: ""
};
// PESPECIFIC: all empty strings per sample
const DUMMY_PESPECIFIC = {
  pSkinRem: "", pHeentRem: "", pChestRem: "", pHeartRem: "",
  pAbdomenRem: "", pNeuroRem: "", pRectalRem: "", pGuRem: "",
  pReportStatus: "U", pDeficiencyRemarks: ""
};
// NCDQANS: all empty strings per Annex B (first tranche) — not validated in tranche 1
const DUMMY_NCDQANS = {
  pQid1_Yn: "", pQid2_Yn: "", pQid3_Yn: "", pQid4_Yn: "", pQid5_Ynx: "",
  pQid6_Yn: "", pQid7_Yn: "", pQid8_Yn: "", pQid9_Yn: "", pQid10_Yn: "",
  pQid11_Yn: "", pQid12_Yn: "", pQid13_Yn: "", pQid14_Yn: "", pQid15_Yn: "",
  pQid16_Yn: "", pQid17_Abcde: "", pQid18_Yn: "", pQid19_Yn: "",
  pQid19_Fbsmg: "", pQid19_Fbsmmol: "", pQid19_Fbsdate: "",
  pQid20_Yn: "", pQid20_Choleval: "", pQid20_Choledate: "",
  pQid21_Yn: "", pQid21_Ketonval: "", pQid21_Ketondate: "",
  pQid22_Yn: "", pQid22_Proteinval: "", pQid22_Proteindate: "",
  pQid23_Yn: "", pQid24_Yn: "", pReportStatus: "U", pDeficiencyRemarks: ""
};
// SUBJECTIVE: all empty strings per Annex B first-tranche SOAP sample
const DUMMY_SUBJECTIVE = {
  pIllnessHistory: "", pSignsSymptoms: "", pOtherComplaint: "", pPainSite: "",
  pReportStatus: "U", pDeficiencyRemarks: ""
};
// ICD: empty string per Annex B sample
const DUMMY_ICD       = { pIcdCode: "", pReportStatus: "U", pDeficiencyRemarks: "" };
// DIAGNOSTIC: data dictionary specifies:
//   pDiagnosticId default "0" = Not Applicable
//   pIsPhysicianRecommendation valid: "Y"|"N"|"X" — use "X" (None/Not Applicable)
//   pPatientRemarks valid: "RQ"|"RF"|"XX" — use "XX" (None/Not Applicable)
const DUMMY_DIAGNOSTIC = {
  pDiagnosticId: "0", pOthRemarks: "", pIsPhysicianRecommendation: "X",
  pPatientRemarks: "XX", pReportStatus: "U", pDeficiencyRemarks: ""
};
// MANAGEMENT: data dictionary specifies pManagementId default "0" = Not Applicable
const DUMMY_MANAGEMENT = { pManagementId: "0", pOthRemarks: "", pReportStatus: "U", pDeficiencyRemarks: "" };
// ADVICE: "NOT APPLICABLE" per data dictionary (§ADVICE pRemarks default value)
const DUMMY_ADVICE     = { pRemarks: "NOT APPLICABLE", pReportStatus: "U", pDeficiencyRemarks: "" };
// MEDICINE: data dictionary specifies exact fallback codes when no medicine record:
//   pDrugCode="NOMED00000000000000000000000", pGenericCode="NOMED", salt/strength/form/unit/package="00000"
//   pQuantity=0, pActualUnitPrice=0.00, pTotalAmtPrice=0.00, pIsApplicable="N"
const DUMMY_MEDICINE   = {
  pHciCaseNo: "", pHciTransNo: "", pCategory: "",
  pDrugCode: "NOMED00000000000000000000000", pGenericCode: "NOMED",
  pSaltCode: "00000", pStrengthCode: "00000", pFormCode: "00000",
  pUnitCode: "00000", pPackageCode: "00000", pOtherMedicine: "",
  pRoute: "", pQuantity: "0", pActualUnitPrice: "0.00", pTotalAmtPrice: "0.00",
  pInstructionQuantity: "", pInstructionStrength: "", pInstructionFrequency: "",
  pPrescribingPhysician: "", pIsDispensed: "", pDateDispensed: "",
  pDispensingPersonnel: "", pIsApplicable: "N", pDateAdded: "",
  pReportStatus: "U", pDeficiencyRemarks: ""
};


// ─── Main Builder ─────────────────────────────────────────────────────────────

/**
 * Converts PcbXmlData into a well-formed PhilHealth XML string.
 * Strictly follows KonsultaData_v1.14.dtd content models.
 * 
 * DTD Root: PCB (ENLISTMENTS+, PROFILING+, SOAPS+, DIAGNOSTICEXAMRESULTS*, MEDICINES+, DOCUMENTS*)
 */
export function buildPcbXml(data: PcbXmlData): string {
  const root = create({ version: "1.0", encoding: "UTF-8" }).ele("PCB", {
    pUsername: data.pUsername,
    pPassword: data.pPassword,
    pHciAccreNo: data.pHciAccreNo,
    pPMCCNo: data.pPMCCNo,
    pEnlistTotalCnt: String(data.pEnlistTotalCnt),
    pProfileTotalCnt: String(data.pProfileTotalCnt),
    pSoapTotalCnt: String(data.pSoapTotalCnt),
    pCertificationId: data.pCertificationId,
    pHciTransmittalNumber: data.pHciTransmittalNumber,
  });

  // ── ENLISTMENTS+ ──────────────────────────────────────────────────────────
  // DTD: ENLISTMENTS (ENLISTMENT)+  |  ENLISTMENT EMPTY
  const enlistments = root.ele("ENLISTMENTS");
  if (data.ENLISTMENT && data.ENLISTMENT.length > 0) {
    for (const en of data.ENLISTMENT) {
      enlistments.ele("ENLISTMENT", cleanupParams(en));
    }
  } else {
    // Dummy ENLISTMENT to satisfy DTD ENLISTMENTS+ requirement
    enlistments.ele("ENLISTMENT", {
      pHciCaseNo: "NONE", pHciTransNo: "NONE", pEffYear: String(new Date().getFullYear()),
      pEnlistStat: "1", pEnlistDate: "", pPackageType: "K",
      pMemPin: "000000000000", pMemFname: "N", pMemMname: "", pMemLname: "A",
      pMemExtname: "", pMemDob: "", pPatientPin: "000000000000",
      pPatientFname: "N", pPatientMname: "", pPatientLname: "A", pPatientExtname: "",
      pPatientSex: "M", pPatientDob: "", pPatientType: "MM",
      pPatientMobileNo: "09000000000", pPatientLandlineNo: "",
      pWithConsent: "Y", pTransDate: "", pCreatedBy: data.pHciAccreNo,
      pReportStatus: "U", pDeficiencyRemarks: ""
    });
  }

  // ── PROFILING+ ────────────────────────────────────────────────────────────
  // DTD: PROFILING (PROFILE)+
  // DTD: PROFILE (MEDHISTS, MHSPECIFICS, SURGHISTS, FAMHISTS, FHSPECIFICS,
  //               SOCHIST, IMMUNIZATIONS, MENSHIST, PREGHIST, PEPERT,
  //               BLOODTYPE, PEGENSURVEY, PEMISCS, PESPECIFIC, NCDQANS)
  const profiling = root.ele("PROFILING");
  if (data.PROFILE && data.PROFILE.length > 0) {
    for (const prof of data.PROFILE) {
      buildProfileNode(profiling, prof);
    }
  } else {
    // Dummy PROFILE to satisfy DTD PROFILING+ requirement
    buildDummyProfileNode(profiling, data);
  }

  // ── SOAPS+ ────────────────────────────────────────────────────────────────
  // DTD: SOAPS (SOAP)+
  // DTD: SOAP (SUBJECTIVE, PEPERT, PEMISCS, PESPECIFIC, ICDS, DIAGNOSTICS, MANAGEMENTS, ADVICE)
  const soaps = root.ele("SOAPS");
  if (data.SOAP && data.SOAP.length > 0) {
    for (const soap of data.SOAP) {
      buildSoapNode(soaps, soap);
    }
  } else {
    // Dummy SOAP to satisfy DTD SOAPS+ requirement
    buildDummySoapNode(soaps);
  }

  // ── DIAGNOSTICEXAMRESULTS* ────────────────────────────────────────────────
  // DTD: DIAGNOSTICEXAMRESULTS (DIAGNOSTICEXAMRESULT)+
  // Optional (*), only emit if present
  if (data.DIAGNOSTICEXAMRESULT && data.DIAGNOSTICEXAMRESULT.length > 0) {
    const dxResultsNode = root.ele("DIAGNOSTICEXAMRESULTS");
    for (const dxResult of data.DIAGNOSTICEXAMRESULT) {
      const dxNode = dxResultsNode.ele("DIAGNOSTICEXAMRESULT", cleanupParams({
        pHciCaseNo: dxResult.pHciCaseNo,
        pHciTransNo: dxResult.pHciTransNo,
        pPatientPin: dxResult.pPatientPin,
        pPatientType: dxResult.pPatientType,
        pMemPin: dxResult.pMemPin,
        pEffYear: dxResult.pEffYear,
      }));
      // DTD container names (exact — note URINALYSISS, FECALYSISS, HbA1cs, PPDTests)
      addArrayNode(dxNode, "CBCS",          "CBC",          dxResult.CBC);
      addArrayNode(dxNode, "URINALYSISS",   "URINALYSIS",   dxResult.URINALYSIS);
      addArrayNode(dxNode, "CHESTXRAYS",    "CHESTXRAY",    dxResult.CHESTXRAY);
      addArrayNode(dxNode, "SPUTUMS",       "SPUTUM",       dxResult.SPUTUM);
      addArrayNode(dxNode, "LIPIDPROFILES", "LIPIDPROFILE", dxResult.LIPIDPROFILE);
      addArrayNode(dxNode, "FBSS",          "FBS",          dxResult.FBS);
      addArrayNode(dxNode, "RBSS",          "RBS",          (dxResult as any).RBS);
      addArrayNode(dxNode, "ECGS",          "ECG",          dxResult.ECG);
      addArrayNode(dxNode, "FECALYSISS",    "FECALYSIS",    dxResult.FECALYSIS);
      addArrayNode(dxNode, "PAPSMEARS",     "PAPSMEAR",     dxResult.PAPSMEAR);
      addArrayNode(dxNode, "OGTTS",         "OGTT",         dxResult.OGTT);
      addArrayNode(dxNode, "FOBTS",         "FOBT",         dxResult.FOBT);
      addArrayNode(dxNode, "CREATININES",   "CREATININE",   dxResult.CREATININE);
      addArrayNode(dxNode, "PPDTests",      "PPDTest",      (dxResult as any).PPDTest);
      addArrayNode(dxNode, "HbA1cs",        "HbA1c",        dxResult.HBA1C);
      addArrayNode(dxNode, "OTHERDIAGEXAMS","OTHERDIAGEXAM",(dxResult as any).OTHERDIAGEXAM);
    }
  }

  // ── MEDICINES+ ────────────────────────────────────────────────────────────
  // DTD: MEDICINES (MEDICINE)+  — required, always emit at least one
  const medsNode = root.ele("MEDICINES");
  if (data.MEDICINE && data.MEDICINE.length > 0) {
    for (const med of data.MEDICINE) {
      medsNode.ele("MEDICINE", cleanupParams(med));
    }
  } else {
    medsNode.ele("MEDICINE", DUMMY_MEDICINE);
  }

  // ── DOCUMENTS* ────────────────────────────────────────────────────────────
  // DTD: DOCUMENTS (DOCUMENT)* — optional, only emit if present
  if (data.DOCUMENT && data.DOCUMENT.length > 0) {
    const docsNode = root.ele("DOCUMENTS");
    for (const doc of data.DOCUMENT) {
      docsNode.ele("DOCUMENT", cleanupParams(doc));
    }
  }

  // headless: true — do not output <?xml ...?> declaration
  return root.end({ prettyPrint: false, headless: true });
}

// ─── Profile Node Builder ─────────────────────────────────────────────────────

function buildProfileNode(parent: any, prof: ProfileXmlData) {
  const profNode = parent.ele("PROFILE", cleanupParams({
    pHciTransNo:        prof.pHciTransNo,
    pHciCaseNo:         prof.pHciCaseNo,
    pProfDate:          prof.pProfDate,
    pPatientPin:        prof.pPatientPin,
    pPatientType:       prof.pPatientType,
    pPatientAge:        prof.pPatientAge,
    pMemPin:            prof.pMemPin,
    pEffYear:           prof.pEffYear,
    pATC:               prof.pATC,
    pIsWalkedIn:        prof.pIsWalkedIn,
    pTransDate:         prof.pTransDate,
    pReportStatus:      prof.pReportStatus,
    pDeficiencyRemarks: prof.pDeficiencyRemarks,
  }));

  // Strict DTD order:
  // MEDHISTS, MHSPECIFICS, SURGHISTS, FAMHISTS, FHSPECIFICS,
  // SOCHIST, IMMUNIZATIONS, MENSHIST, PREGHIST,
  // PEPERT, BLOODTYPE, PEGENSURVEY, PEMISCS, PESPECIFIC, NCDQANS

  // All of MEDHISTS/MHSPECIFICS/SURGHISTS/FAMHISTS/FHSPECIFICS/IMMUNIZATIONS
  // require (child)+ so always emit at least one dummy
  addArrayNodeRequired(profNode, "MEDHISTS",    "MEDHIST",    prof.MEDHIST,    DUMMY_MEDHIST);
  addArrayNodeRequired(profNode, "MHSPECIFICS", "MHSPECIFIC", prof.MHSPECIFIC, DUMMY_MHSPECIFIC);
  addArrayNodeRequired(profNode, "SURGHISTS",   "SURGHIST",   prof.SURGHIST,   DUMMY_SURGHIST);
  addArrayNodeRequired(profNode, "FAMHISTS",    "FAMHIST",    prof.FAMHIST,    DUMMY_FAMHIST);
  addArrayNodeRequired(profNode, "FHSPECIFICS", "FHSPECIFIC", prof.FHSPECIFIC, DUMMY_FHSPECIFIC);

  profNode.ele("SOCHIST", cleanupParams(prof.SOCHIST || DUMMY_SOCHIST));
  addArrayNodeRequired(profNode, "IMMUNIZATIONS", "IMMUNIZATION", prof.IMMUNIZATION, DUMMY_IMMUNIZATION);
  profNode.ele("MENSHIST",    cleanupParams(prof.MENSHIST    || DUMMY_MENSHIST));
  profNode.ele("PREGHIST",    cleanupParams(prof.PREGHIST    || DUMMY_PREGHIST));
  profNode.ele("PEPERT",      cleanupParams(prof.PEPERT      || DUMMY_PEPERT));
  profNode.ele("BLOODTYPE",   cleanupParams(prof.BLOODTYPE   || DUMMY_BLOODTYPE));
  profNode.ele("PEGENSURVEY", cleanupParams(prof.PEGENSURVEY || DUMMY_PEGENSURVEY));

  // PEMISCS (PEMISC)+ — required, at least 1 child
  const pemiscs = profNode.ele("PEMISCS");
  if (prof.PEMISC) {
    pemiscs.ele("PEMISC", cleanupParams(prof.PEMISC));
  } else {
    pemiscs.ele("PEMISC", DUMMY_PEMISC);
  }

  profNode.ele("PESPECIFIC", cleanupParams(prof.PESPECIFIC || DUMMY_PESPECIFIC));
  profNode.ele("NCDQANS",    cleanupParams(prof.NCDQANS    || DUMMY_NCDQANS));
}

function buildDummyProfileNode(parent: any, data: PcbXmlData) {
  const profNode = parent.ele("PROFILE", {
    pHciTransNo: "NONE", pHciCaseNo: "NONE",
    pProfDate: "", pPatientPin: "000000000000",
    pPatientType: "MM", pPatientAge: "0",
    pMemPin: "000000000000", pEffYear: String(new Date().getFullYear()),
    pATC: "WALKEDIN", pIsWalkedIn: "Y",
    pTransDate: "", pReportStatus: "U", pDeficiencyRemarks: ""
  });
  addArrayNodeRequired(profNode, "MEDHISTS",    "MEDHIST",    [], DUMMY_MEDHIST);
  addArrayNodeRequired(profNode, "MHSPECIFICS", "MHSPECIFIC", [], DUMMY_MHSPECIFIC);
  addArrayNodeRequired(profNode, "SURGHISTS",   "SURGHIST",   [], DUMMY_SURGHIST);
  addArrayNodeRequired(profNode, "FAMHISTS",    "FAMHIST",    [], DUMMY_FAMHIST);
  addArrayNodeRequired(profNode, "FHSPECIFICS", "FHSPECIFIC", [], DUMMY_FHSPECIFIC);
  profNode.ele("SOCHIST",      DUMMY_SOCHIST);
  addArrayNodeRequired(profNode, "IMMUNIZATIONS", "IMMUNIZATION", [], DUMMY_IMMUNIZATION);
  profNode.ele("MENSHIST",     DUMMY_MENSHIST);
  profNode.ele("PREGHIST",     DUMMY_PREGHIST);
  profNode.ele("PEPERT",       DUMMY_PEPERT);
  profNode.ele("BLOODTYPE",    DUMMY_BLOODTYPE);
  profNode.ele("PEGENSURVEY",  DUMMY_PEGENSURVEY);
  profNode.ele("PEMISCS").ele("PEMISC", DUMMY_PEMISC);
  profNode.ele("PESPECIFIC",   DUMMY_PESPECIFIC);
  profNode.ele("NCDQANS",      DUMMY_NCDQANS);
}

// ─── SOAP Node Builder ────────────────────────────────────────────────────────

function buildSoapNode(parent: any, soap: SoapXmlData) {
  const soapNode = parent.ele("SOAP", cleanupParams({
    pHciCaseNo:         soap.pHciCaseNo,
    pHciTransNo:        soap.pHciTransNo,
    pSoapDate:          soap.pSoapDate,
    pPatientPin:        soap.pPatientPin,
    pPatientType:       soap.pPatientType,
    pMemPin:            soap.pMemPin,
    pEffYear:           soap.pEffYear,
    pATC:               soap.pATC,
    pIsWalkedIn:        soap.pIsWalkedIn,
    pCoPay:             soap.pCoPay,
    pTransDate:         soap.pTransDate,
    pReportStatus:      soap.pReportStatus,
    pDeficiencyRemarks: soap.pDeficiencyRemarks,
  }));

  // Strict DTD order: SUBJECTIVE, PEPERT, PEMISCS, PESPECIFIC, ICDS, DIAGNOSTICS, MANAGEMENTS, ADVICE
  soapNode.ele("SUBJECTIVE", cleanupParams(soap.SUBJECTIVE || DUMMY_SUBJECTIVE));
  soapNode.ele("PEPERT",     cleanupParams(soap.PEPERT     || DUMMY_PEPERT));

  // PEMISCS (PEMISC)+ — required, at least 1 child
  const pemiscs = soapNode.ele("PEMISCS");
  if (soap.PEMISC && soap.PEMISC.length > 0) {
    for (const pemisc of soap.PEMISC) {
      pemiscs.ele("PEMISC", cleanupParams(pemisc));
    }
  } else {
    pemiscs.ele("PEMISC", DUMMY_PEMISC);
  }

  soapNode.ele("PESPECIFIC", cleanupParams(soap.PESPECIFIC || DUMMY_PESPECIFIC));

  // ICDS (ICD)+ — required, at least 1
  addArrayNodeRequired(soapNode, "ICDS",        "ICD",        soap.ICD,        DUMMY_ICD);
  // DIAGNOSTICS (DIAGNOSTIC)+ — required, at least 1
  addArrayNodeRequired(soapNode, "DIAGNOSTICS", "DIAGNOSTIC", soap.DIAGNOSTIC, DUMMY_DIAGNOSTIC);
  // MANAGEMENTS (MANAGEMENT)+ — required, at least 1
  addArrayNodeRequired(soapNode, "MANAGEMENTS", "MANAGEMENT", soap.MANAGEMENT, DUMMY_MANAGEMENT);

  soapNode.ele("ADVICE", cleanupParams(soap.ADVICE || DUMMY_ADVICE));
}

function buildDummySoapNode(parent: any) {
  const today = new Date().toISOString().split("T")[0];
  const soapNode = parent.ele("SOAP", {
    pHciCaseNo: "NONE", pHciTransNo: "NONE", pSoapDate: today,
    pPatientPin: "000000000000", pPatientType: "MM",
    pMemPin: "000000000000", pEffYear: String(new Date().getFullYear()),
    pATC: "WALKEDIN", pIsWalkedIn: "Y", pCoPay: "0",
    pTransDate: today, pReportStatus: "U", pDeficiencyRemarks: ""
  });
  soapNode.ele("SUBJECTIVE",  DUMMY_SUBJECTIVE);
  soapNode.ele("PEPERT",      DUMMY_PEPERT);
  soapNode.ele("PEMISCS").ele("PEMISC", DUMMY_PEMISC);
  soapNode.ele("PESPECIFIC",  DUMMY_PESPECIFIC);
  soapNode.ele("ICDS").ele("ICD",               DUMMY_ICD);
  soapNode.ele("DIAGNOSTICS").ele("DIAGNOSTIC", DUMMY_DIAGNOSTIC);
  soapNode.ele("MANAGEMENTS").ele("MANAGEMENT", DUMMY_MANAGEMENT);
  soapNode.ele("ADVICE",      DUMMY_ADVICE);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Remove undefined/null properties and stringify all values for XML attributes */
function cleanupParams(obj: Record<string, any>): Record<string, string> {
  const clean: Record<string, string> = {};
  for (const key of Object.keys(obj)) {
    if (obj[key] !== undefined && obj[key] !== null) {
      clean[key] = String(obj[key]);
    }
  }
  return clean;
}

/** Emit a parent container and its children — only if list is non-empty */
function addArrayNode<T>(parent: any, parentTag: string, childTag: string, list?: T[]) {
  if (list && list.length > 0) {
    const parentEle = parent.ele(parentTag);
    for (const item of list) {
      parentEle.ele(childTag, cleanupParams(item as any));
    }
  }
}

/** Emit a parent container with at least one child (dummy if list is empty/absent) */
function addArrayNodeRequired<T>(
  parent: any,
  parentTag: string,
  childTag: string,
  list?: T[],
  dummy?: Record<string, string>
) {
  const parentEle = parent.ele(parentTag);
  if (list && list.length > 0) {
    for (const item of list) {
      parentEle.ele(childTag, cleanupParams(item as any));
    }
  } else if (dummy) {
    parentEle.ele(childTag, dummy);
  }
}
