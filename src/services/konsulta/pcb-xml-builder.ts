/**
 * PhilHealth Konsulta v1.1 PKA — Minimal PCB XML Builder
 *
 * Builds a structurally valid PCB XML string from provided data.
 * Follows KonsultaData_v1.14.dtd exactly.
 *
 * Phase 1 scope: generates the minimum required structure for staging
 * connectivity testing. All optional sub-elements are included as empty
 * placeholders per DTD requirements (DTD mandates at least one child element
 * per container even when the container data is empty).
 */

import type {
    KonsultaHciCredentials,
    KonsultaEnlistmentData,
    KonsultaProfileData,
    KonsultaSoapData,
} from "./types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function attr(value: string): string {
    return value
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function a(name: string, value: string): string {
    return ` ${name}="${attr(value)}"`;
}

function today(): string {
    return new Date().toISOString().slice(0, 10);
}

// ─── Empty placeholder elements required by DTD ──────────────────────────────

const EMPTY_ENLISTMENT = `<ENLISTMENT${a("pHciCaseNo", "")}${a("pHciTransNo", "")}${a("pEffYear", "")}${a("pEnlistStat", "")}${a("pEnlistDate", "")}${a("pPackageType", "")}${a("pMemPin", "")}${a("pMemFname", "")}${a("pMemMname", "")}${a("pMemLname", "")}${a("pMemExtname", "")}${a("pMemDob", "")}${a("pPatientPin", "")}${a("pPatientFname", "")}${a("pPatientMname", "")}${a("pPatientLname", "")}${a("pPatientExtname", "")}${a("pPatientSex", "")}${a("pPatientDob", "")}${a("pPatientType", "")}${a("pPatientMobileNo", "")}${a("pPatientLandlineNo", "")}${a("pWithConsent", "")}${a("pTransDate", "")}${a("pCreatedBy", "")}${a("pReportStatus", "")}${a("pDeficiencyRemarks", "")}/>`;

function buildEmptySoapElement(): string {
    return `<SOAP${a("pHciCaseNo", "")}${a("pHciTransNo", "")}${a("pSoapDate", "")}${a("pPatientPin", "")}${a("pPatientType", "")}${a("pMemPin", "")}${a("pEffYear", "")}${a("pATC", "")}${a("pIsWalkedIn", "")}${a("pCoPay", "")}${a("pTransDate", "")}${a("pReportStatus", "")}${a("pDeficiencyRemarks", "")}>
      <SUBJECTIVE${a("pIllnessHistory", "")}${a("pSignsSymptoms", "")}${a("pOtherComplaint", "")}${a("pPainSite", "")}${a("pReportStatus", "")}${a("pDeficiencyRemarks", "")}/>
      <PEPERT${a("pSystolic", "")}${a("pDiastolic", "")}${a("pHr", "")}${a("pRr", "")}${a("pTemp", "")}${a("pHeight", "")}${a("pWeight", "")}${a("pBMI", "")}${a("pZScore", "")}${a("pLeftVision", "")}${a("pRightVision", "")}${a("pLength", "")}${a("pHeadCirc", "")}${a("pSkinfoldThickness", "")}${a("pWaist", "")}${a("pHip", "")}${a("pLimbs", "")}${a("pMidUpperArmCirc", "")}${a("pReportStatus", "")}${a("pDeficiencyRemarks", "")}/>
      <PEMISCS>
        <PEMISC${a("pSkinId", "")}${a("pHeentId", "")}${a("pChestId", "")}${a("pHeartId", "")}${a("pAbdomenId", "")}${a("pNeuroId", "")}${a("pGuId", "")}${a("pRectalId", "")}${a("pReportStatus", "")}${a("pDeficiencyRemarks", "")}/>
      </PEMISCS>
      <PESPECIFIC${a("pSkinRem", "")}${a("pHeentRem", "")}${a("pChestRem", "")}${a("pHeartRem", "")}${a("pAbdomenRem", "")}${a("pNeuroRem", "")}${a("pRectalRem", "")}${a("pGuRem", "")}${a("pReportStatus", "")}${a("pDeficiencyRemarks", "")}/>
      <ICDS>
        <ICD${a("pIcdCode", "")}${a("pReportStatus", "")}${a("pDeficiencyRemarks", "")}/>
      </ICDS>
      <DIAGNOSTICS>
        <DIAGNOSTIC${a("pDiagnosticId", "")}${a("pOthRemarks", "")}${a("pIsPhysicianRecommendation", "")}${a("pPatientRemarks", "")}${a("pReportStatus", "")}${a("pDeficiencyRemarks", "")}/>
      </DIAGNOSTICS>
      <MANAGEMENTS>
        <MANAGEMENT${a("pManagementId", "")}${a("pOthRemarks", "")}${a("pReportStatus", "")}${a("pDeficiencyRemarks", "")}/>
      </MANAGEMENTS>
      <ADVICE${a("pRemarks", "")}${a("pReportStatus", "")}${a("pDeficiencyRemarks", "")}/>
    </SOAP>`;
}

function buildEmptyProfileElement(): string {
    return `<PROFILE${a("pHciTransNo", "")}${a("pHciCaseNo", "")}${a("pProfDate", "")}${a("pPatientPin", "")}${a("pPatientType", "")}${a("pPatientAge", "")}${a("pMemPin", "")}${a("pEffYear", "")}${a("pATC", "")}${a("pIsWalkedIn", "")}${a("pTransDate", "")}${a("pReportStatus", "")}${a("pDeficiencyRemarks", "")}>
      <MEDHISTS>
        <MEDHIST${a("pMdiseaseCode", "")}${a("pReportStatus", "")}${a("pDeficiencyRemarks", "")}/>
      </MEDHISTS>
      <MHSPECIFICS>
        <MHSPECIFIC${a("pMdiseaseCode", "")}${a("pSpecificDesc", "")}${a("pReportStatus", "")}${a("pDeficiencyRemarks", "")}/>
      </MHSPECIFICS>
      <SURGHISTS>
        <SURGHIST${a("pSurgDesc", "")}${a("pSurgDate", "")}${a("pReportStatus", "")}${a("pDeficiencyRemarks", "")}/>
      </SURGHISTS>
      <FAMHISTS>
        <FAMHIST${a("pMdiseaseCode", "")}${a("pReportStatus", "")}${a("pDeficiencyRemarks", "")}/>
      </FAMHISTS>
      <FHSPECIFICS>
        <FHSPECIFIC${a("pMdiseaseCode", "")}${a("pSpecificDesc", "")}${a("pReportStatus", "")}${a("pDeficiencyRemarks", "")}/>
      </FHSPECIFICS>
      <SOCHIST${a("pIsSmoker", "")}${a("pNoCigpk", "")}${a("pIsAdrinker", "")}${a("pNoBottles", "")}${a("pIllDrugUser", "")}${a("pIsSexuallyActive", "")}${a("pReportStatus", "")}${a("pDeficiencyRemarks", "")}/>
      <IMMUNIZATIONS>
        <IMMUNIZATION${a("pChildImmcode", "")}${a("pYoungwImmcode", "")}${a("pPregwImmcode", "")}${a("pElderlyImmcode", "")}${a("pOtherImm", "")}${a("pReportStatus", "")}${a("pDeficiencyRemarks", "")}/>
      </IMMUNIZATIONS>
      <MENSHIST${a("pMenarchePeriod", "")}${a("pLastMensPeriod", "")}${a("pPeriodDuration", "")}${a("pMensInterval", "")}${a("pPadsPerDay", "")}${a("pOnsetSexIc", "")}${a("pBirthCtrlMethod", "")}${a("pIsMenopause", "")}${a("pMenopauseAge", "")}${a("pIsApplicable", "")}${a("pReportStatus", "")}${a("pDeficiencyRemarks", "")}/>
      <PREGHIST${a("pPregCnt", "")}${a("pDeliveryCnt", "")}${a("pDeliveryTyp", "")}${a("pFullTermCnt", "")}${a("pPrematureCnt", "")}${a("pAbortionCnt", "")}${a("pLivChildrenCnt", "")}${a("pWPregIndhyp", "")}${a("pWFamPlan", "")}${a("pIsApplicable", "")}${a("pReportStatus", "")}${a("pDeficiencyRemarks", "")}/>
      <PEPERT${a("pSystolic", "")}${a("pDiastolic", "")}${a("pHr", "")}${a("pRr", "")}${a("pTemp", "")}${a("pHeight", "")}${a("pWeight", "")}${a("pBMI", "")}${a("pZScore", "")}${a("pLeftVision", "")}${a("pRightVision", "")}${a("pLength", "")}${a("pHeadCirc", "")}${a("pSkinfoldThickness", "")}${a("pWaist", "")}${a("pHip", "")}${a("pLimbs", "")}${a("pMidUpperArmCirc", "")}${a("pReportStatus", "")}${a("pDeficiencyRemarks", "")}/>
      <BLOODTYPE${a("pBloodType", "")}${a("pReportStatus", "")}${a("pDeficiencyRemarks", "")}/>
      <PEGENSURVEY${a("pGenSurveyId", "")}${a("pGenSurveyRem", "")}${a("pReportStatus", "")}${a("pDeficiencyRemarks", "")}/>
      <PEMISCS>
        <PEMISC${a("pSkinId", "")}${a("pHeentId", "")}${a("pChestId", "")}${a("pHeartId", "")}${a("pAbdomenId", "")}${a("pNeuroId", "")}${a("pGuId", "")}${a("pRectalId", "")}${a("pReportStatus", "")}${a("pDeficiencyRemarks", "")}/>
      </PEMISCS>
      <PESPECIFIC${a("pSkinRem", "")}${a("pHeentRem", "")}${a("pChestRem", "")}${a("pHeartRem", "")}${a("pAbdomenRem", "")}${a("pNeuroRem", "")}${a("pRectalRem", "")}${a("pGuRem", "")}${a("pReportStatus", "")}${a("pDeficiencyRemarks", "")}/>
      <NCDQANS${a("pQid1_Yn", "")}${a("pQid2_Yn", "")}${a("pQid3_Yn", "")}${a("pQid4_Yn", "")}${a("pQid5_Yn", "")}${a("pQid5_Ynx", "")}${a("pQid6_Yn", "")}${a("pQid7_Yn", "")}${a("pQid8_Yn", "")}${a("pQid9_Yn", "")}${a("pQid10_Yn", "")}${a("pQid11_Yn", "")}${a("pQid12_Yn", "")}${a("pQid13_Yn", "")}${a("pQid14_Yn", "")}${a("pQid15_Yn", "")}${a("pQid16_Yn", "")}${a("pQid17_Abcde", "")}${a("pQid18_Yn", "")}${a("pQid19_Yn", "")}${a("pQid19_Fbsmg", "")}${a("pQid19_Fbsmmol", "")}${a("pQid19_Fbsdate", "")}${a("pQid20_Yn", "")}${a("pQid20_Choleval", "")}${a("pQid20_Choledate", "")}${a("pQid21_Yn", "")}${a("pQid21_Ketonval", "")}${a("pQid21_Ketondate", "")}${a("pQid22_Yn", "")}${a("pQid22_Proteinval", "")}${a("pQid22_Proteindate", "")}${a("pQid23_Yn", "")}${a("pQid24_Yn", "")}${a("pReportStatus", "")}${a("pDeficiencyRemarks", "")}/>
    </PROFILE>`;
}

// ─── Enlistment builder ───────────────────────────────────────────────────────

function buildEnlistment(e: KonsultaEnlistmentData): string {
    return `<ENLISTMENT${a("pHciCaseNo", e.pHciCaseNo)}${a("pHciTransNo", e.pHciTransNo)}${a("pEffYear", e.pEffYear)}${a("pEnlistStat", e.pEnlistStat)}${a("pEnlistDate", e.pEnlistDate)}${a("pPackageType", e.pPackageType)}${a("pMemPin", e.pMemPin)}${a("pMemFname", e.pMemFname)}${a("pMemMname", e.pMemMname)}${a("pMemLname", e.pMemLname)}${a("pMemExtname", e.pMemExtname)}${a("pMemDob", e.pMemDob)}${a("pPatientPin", e.pPatientPin)}${a("pPatientFname", e.pPatientFname)}${a("pPatientMname", e.pPatientMname)}${a("pPatientLname", e.pPatientLname)}${a("pPatientExtname", e.pPatientExtname)}${a("pPatientSex", e.pPatientSex)}${a("pPatientDob", e.pPatientDob)}${a("pPatientType", e.pPatientType)}${a("pPatientMobileNo", e.pPatientMobileNo)}${a("pPatientLandlineNo", e.pPatientLandlineNo)}${a("pWithConsent", e.pWithConsent)}${a("pTransDate", e.pTransDate)}${a("pCreatedBy", e.pCreatedBy)}${a("pReportStatus", e.pReportStatus)}${a("pDeficiencyRemarks", e.pDeficiencyRemarks)}/>`;
}

// ─── Profile builder ──────────────────────────────────────────────────────────

function buildProfile(p: KonsultaProfileData): string {
    return `<PROFILE${a("pHciTransNo", p.pHciTransNo)}${a("pHciCaseNo", p.pHciCaseNo)}${a("pProfDate", p.pProfDate)}${a("pPatientPin", p.pPatientPin)}${a("pPatientType", p.pPatientType)}${a("pPatientAge", p.pPatientAge)}${a("pMemPin", p.pMemPin)}${a("pEffYear", p.pEffYear)}${a("pATC", p.pATC)}${a("pIsWalkedIn", p.pIsWalkedIn)}${a("pTransDate", p.pTransDate)}${a("pReportStatus", p.pReportStatus)}${a("pDeficiencyRemarks", p.pDeficiencyRemarks)}>
      <MEDHISTS>
        <MEDHIST${a("pMdiseaseCode", "")}${a("pReportStatus", "")}${a("pDeficiencyRemarks", "")}/>
      </MEDHISTS>
      <MHSPECIFICS>
        <MHSPECIFIC${a("pMdiseaseCode", "")}${a("pSpecificDesc", "")}${a("pReportStatus", "")}${a("pDeficiencyRemarks", "")}/>
      </MHSPECIFICS>
      <SURGHISTS>
        <SURGHIST${a("pSurgDesc", "")}${a("pSurgDate", "")}${a("pReportStatus", "")}${a("pDeficiencyRemarks", "")}/>
      </SURGHISTS>
      <FAMHISTS>
        <FAMHIST${a("pMdiseaseCode", "")}${a("pReportStatus", "")}${a("pDeficiencyRemarks", "")}/>
      </FAMHISTS>
      <FHSPECIFICS>
        <FHSPECIFIC${a("pMdiseaseCode", "")}${a("pSpecificDesc", "")}${a("pReportStatus", "")}${a("pDeficiencyRemarks", "")}/>
      </FHSPECIFICS>
      <SOCHIST${a("pIsSmoker", "")}${a("pNoCigpk", "")}${a("pIsAdrinker", "")}${a("pNoBottles", "")}${a("pIllDrugUser", "")}${a("pIsSexuallyActive", "")}${a("pReportStatus", "")}${a("pDeficiencyRemarks", "")}/>
      <IMMUNIZATIONS>
        <IMMUNIZATION${a("pChildImmcode", "")}${a("pYoungwImmcode", "")}${a("pPregwImmcode", "")}${a("pElderlyImmcode", "")}${a("pOtherImm", "")}${a("pReportStatus", "")}${a("pDeficiencyRemarks", "")}/>
      </IMMUNIZATIONS>
      <MENSHIST${a("pMenarchePeriod", "")}${a("pLastMensPeriod", "")}${a("pPeriodDuration", "")}${a("pMensInterval", "")}${a("pPadsPerDay", "")}${a("pOnsetSexIc", "")}${a("pBirthCtrlMethod", "")}${a("pIsMenopause", "")}${a("pMenopauseAge", "")}${a("pIsApplicable", "")}${a("pReportStatus", "")}${a("pDeficiencyRemarks", "")}/>
      <PREGHIST${a("pPregCnt", "")}${a("pDeliveryCnt", "")}${a("pDeliveryTyp", "")}${a("pFullTermCnt", "")}${a("pPrematureCnt", "")}${a("pAbortionCnt", "")}${a("pLivChildrenCnt", "")}${a("pWPregIndhyp", "")}${a("pWFamPlan", "")}${a("pIsApplicable", "")}${a("pReportStatus", "")}${a("pDeficiencyRemarks", "")}/>
      <PEPERT${a("pSystolic", "")}${a("pDiastolic", "")}${a("pHr", "")}${a("pRr", "")}${a("pTemp", "")}${a("pHeight", "")}${a("pWeight", "")}${a("pBMI", "")}${a("pZScore", "")}${a("pLeftVision", "")}${a("pRightVision", "")}${a("pLength", "")}${a("pHeadCirc", "")}${a("pSkinfoldThickness", "")}${a("pWaist", "")}${a("pHip", "")}${a("pLimbs", "")}${a("pMidUpperArmCirc", "")}${a("pReportStatus", "")}${a("pDeficiencyRemarks", "")}/>
      <BLOODTYPE${a("pBloodType", "")}${a("pReportStatus", "")}${a("pDeficiencyRemarks", "")}/>
      <PEGENSURVEY${a("pGenSurveyId", "")}${a("pGenSurveyRem", "")}${a("pReportStatus", "")}${a("pDeficiencyRemarks", "")}/>
      <PEMISCS>
        <PEMISC${a("pSkinId", "")}${a("pHeentId", "")}${a("pChestId", "")}${a("pHeartId", "")}${a("pAbdomenId", "")}${a("pNeuroId", "")}${a("pGuId", "")}${a("pRectalId", "")}${a("pReportStatus", "")}${a("pDeficiencyRemarks", "")}/>
      </PEMISCS>
      <PESPECIFIC${a("pSkinRem", "")}${a("pHeentRem", "")}${a("pChestRem", "")}${a("pHeartRem", "")}${a("pAbdomenRem", "")}${a("pNeuroRem", "")}${a("pRectalRem", "")}${a("pGuRem", "")}${a("pReportStatus", "")}${a("pDeficiencyRemarks", "")}/>
      <NCDQANS${a("pQid1_Yn", "")}${a("pQid2_Yn", "")}${a("pQid3_Yn", "")}${a("pQid4_Yn", "")}${a("pQid5_Yn", "")}${a("pQid5_Ynx", "")}${a("pQid6_Yn", "")}${a("pQid7_Yn", "")}${a("pQid8_Yn", "")}${a("pQid9_Yn", "")}${a("pQid10_Yn", "")}${a("pQid11_Yn", "")}${a("pQid12_Yn", "")}${a("pQid13_Yn", "")}${a("pQid14_Yn", "")}${a("pQid15_Yn", "")}${a("pQid16_Yn", "")}${a("pQid17_Abcde", "")}${a("pQid18_Yn", "")}${a("pQid19_Yn", "")}${a("pQid19_Fbsmg", "")}${a("pQid19_Fbsmmol", "")}${a("pQid19_Fbsdate", "")}${a("pQid20_Yn", "")}${a("pQid20_Choleval", "")}${a("pQid20_Choledate", "")}${a("pQid21_Yn", "")}${a("pQid21_Ketonval", "")}${a("pQid21_Ketondate", "")}${a("pQid22_Yn", "")}${a("pQid22_Proteinval", "")}${a("pQid22_Proteindate", "")}${a("pQid23_Yn", "")}${a("pQid24_Yn", "")}${a("pReportStatus", "")}${a("pDeficiencyRemarks", "")}/>
    </PROFILE>`;
}

// ─── SOAP builder ─────────────────────────────────────────────────────────────

function buildSoap(s: KonsultaSoapData): string {
    return `<SOAP${a("pHciCaseNo", s.pHciCaseNo)}${a("pHciTransNo", s.pHciTransNo)}${a("pSoapDate", s.pSoapDate)}${a("pPatientPin", s.pPatientPin)}${a("pPatientType", s.pPatientType)}${a("pMemPin", s.pMemPin)}${a("pEffYear", s.pEffYear)}${a("pATC", s.pATC)}${a("pIsWalkedIn", s.pIsWalkedIn)}${a("pCoPay", s.pCoPay)}${a("pTransDate", s.pTransDate)}${a("pReportStatus", s.pReportStatus)}${a("pDeficiencyRemarks", s.pDeficiencyRemarks)}>
      <SUBJECTIVE${a("pIllnessHistory", "")}${a("pSignsSymptoms", "")}${a("pOtherComplaint", "")}${a("pPainSite", "")}${a("pReportStatus", "")}${a("pDeficiencyRemarks", "")}/>
      <PEPERT${a("pSystolic", "")}${a("pDiastolic", "")}${a("pHr", "")}${a("pRr", "")}${a("pTemp", "")}${a("pHeight", "")}${a("pWeight", "")}${a("pBMI", "")}${a("pZScore", "")}${a("pLeftVision", "")}${a("pRightVision", "")}${a("pLength", "")}${a("pHeadCirc", "")}${a("pSkinfoldThickness", "")}${a("pWaist", "")}${a("pHip", "")}${a("pLimbs", "")}${a("pMidUpperArmCirc", "")}${a("pReportStatus", "")}${a("pDeficiencyRemarks", "")}/>
      <PEMISCS>
        <PEMISC${a("pSkinId", "")}${a("pHeentId", "")}${a("pChestId", "")}${a("pHeartId", "")}${a("pAbdomenId", "")}${a("pNeuroId", "")}${a("pGuId", "")}${a("pRectalId", "")}${a("pReportStatus", "")}${a("pDeficiencyRemarks", "")}/>
      </PEMISCS>
      <PESPECIFIC${a("pSkinRem", "")}${a("pHeentRem", "")}${a("pChestRem", "")}${a("pHeartRem", "")}${a("pAbdomenRem", "")}${a("pNeuroRem", "")}${a("pRectalRem", "")}${a("pGuRem", "")}${a("pReportStatus", "")}${a("pDeficiencyRemarks", "")}/>
      <ICDS>
        <ICD${a("pIcdCode", "")}${a("pReportStatus", "")}${a("pDeficiencyRemarks", "")}/>
      </ICDS>
      <DIAGNOSTICS>
        <DIAGNOSTIC${a("pDiagnosticId", "")}${a("pOthRemarks", "")}${a("pIsPhysicianRecommendation", "")}${a("pPatientRemarks", "")}${a("pReportStatus", "")}${a("pDeficiencyRemarks", "")}/>
      </DIAGNOSTICS>
      <MANAGEMENTS>
        <MANAGEMENT${a("pManagementId", "")}${a("pOthRemarks", "")}${a("pReportStatus", "")}${a("pDeficiencyRemarks", "")}/>
      </MANAGEMENTS>
      <ADVICE${a("pRemarks", "")}${a("pReportStatus", "")}${a("pDeficiencyRemarks", "")}/>
    </SOAP>`;
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
 * Builds a complete, DTD-valid PCB XML string.
 *
 * All sections are required in the DTD, so empty placeholders are included
 * when actual data is not provided (e.g. SOAPS during First Tranche).
 */
export function buildPcbXml(options: BuildPcbXmlOptions): string {
    const {
        credentials,
        transmittalNumber,
        enlistments = [],
        profiles = [],
        soaps = [],
    } = options;

    const enlistTotalCnt = String(enlistments.length);
    const profileTotalCnt = String(profiles.length);
    const soapTotalCnt = String(soaps.length);

    const enlistmentElements =
        enlistments.length > 0
            ? enlistments.map(buildEnlistment).join("\n    ")
            : EMPTY_ENLISTMENT;

    const profileElements =
        profiles.length > 0
            ? profiles.map(buildProfile).join("\n    ")
            : buildEmptyProfileElement();

    const soapElements =
        soaps.length > 0
            ? soaps.map(buildSoap).join("\n    ")
            : buildEmptySoapElement();

    return `<?xml version="1.0" encoding="UTF-8"?>
<PCB${a("pUsername", credentials.username)}${a("pPassword", credentials.password)}${a("pHciAccreNo", credentials.hciAccreNo)}${a("pPMCCNo", credentials.pmccNumber)}${a("pEnlistTotalCnt", enlistTotalCnt)}${a("pProfileTotalCnt", profileTotalCnt)}${a("pSoapTotalCnt", soapTotalCnt)}${a("pCertificationId", credentials.certificationId)}${a("pHciTransmittalNumber", transmittalNumber)}>
  <ENLISTMENTS>
    ${enlistmentElements}
  </ENLISTMENTS>
  <PROFILING>
    ${profileElements}
  </PROFILING>
  <SOAPS>
    ${soapElements}
  </SOAPS>
  <DIAGNOSTICEXAMRESULTS/>
  <MEDICINES>
    <MEDICINE${a("pHciCaseNo", "")}${a("pHciTransNo", "")}${a("pCategory", "")}${a("pDrugCode", "")}${a("pGenericCode", "")}${a("pSaltCode", "")}${a("pStrengthCode", "")}${a("pFormCode", "")}${a("pUnitCode", "")}${a("pPackageCode", "")}${a("pOtherMedicine", "")}${a("pRoute", "")}${a("pQuantity", "")}${a("pActualUnitPrice", "")}${a("pTotalAmtPrice", "")}${a("pInstructionQuantity", "")}${a("pInstructionStrength", "")}${a("pInstructionFrequency", "")}${a("pPrescribingPhysician", "")}${a("pIsDispensed", "")}${a("pDateDispensed", "")}${a("pDispensingPersonnel", "")}${a("pIsApplicable", "")}${a("pDateAdded", "")}${a("pReportStatus", "")}${a("pDeficiencyRemarks", "")}/>
  </MEDICINES>
  <DOCUMENTS>
    <DOCUMENT${a("pHciCaseNo", "")}${a("pHciTransNo", "")}${a("pPatientPin", "")}${a("pPatientType", "")}${a("pMemPin", "")}${a("pDocumentType", "")}${a("pDocumentUrl", "")}${a("pTransDate", "")}${a("pReportStatus", "")}${a("pDeficiencyRemarks", "")}/>
  </DOCUMENTS>
</PCB>`;
}

/**
 * Builds a minimal PCB XML using staging test credentials for connectivity testing.
 * Uses the PhilHealth-provided dummy patient data.
 */
export function buildStagingTestPcbXml(credentials: KonsultaHciCredentials): string {
    const effYear = String(new Date().getFullYear());
    const transmittalNumber = `TN-${credentials.pmccNumber}-${Date.now()}`;

    return buildPcbXml({
        credentials,
        transmittalNumber,
        enlistments: [
            {
                pHciCaseNo: `TH${credentials.hciAccreNo.replace(/\D/g, "")}${effYear}00001`,
                pHciTransNo: `EH${credentials.hciAccreNo.replace(/\D/g, "")}${effYear}00001`,
                pEffYear: effYear,
                pEnlistStat: "1",
                pEnlistDate: today(),
                pPackageType: "K",
                pMemPin: "000000000000",
                pMemFname: "JUAN",
                pMemMname: "DELA",
                pMemLname: "CRUZ",
                pMemExtname: "",
                pMemDob: "1980-01-01",
                pPatientPin: "000000000000",
                pPatientFname: "JUAN",
                pPatientMname: "DELA",
                pPatientLname: "CRUZ",
                pPatientExtname: "",
                pPatientSex: "M",
                pPatientDob: "1980-01-01",
                pPatientType: "MM",
                pPatientMobileNo: "09000000000",
                pPatientLandlineNo: "",
                pWithConsent: "Y",
                pTransDate: today(),
                pCreatedBy: credentials.username,
                pReportStatus: "U",
                pDeficiencyRemarks: "",
            },
        ],
        profiles: [
            {
                pHciTransNo: `PH${credentials.hciAccreNo.replace(/\D/g, "")}${effYear}00001`,
                pHciCaseNo: `TH${credentials.hciAccreNo.replace(/\D/g, "")}${effYear}00001`,
                pProfDate: today(),
                pPatientPin: "000000000000",
                pPatientType: "MM",
                pPatientAge: "45 YR(S), 0 MO(S), 0 DAY(S)",
                pMemPin: "000000000000",
                pEffYear: effYear,
                pATC: "WALKEDIN",
                pIsWalkedIn: "Y",
                pTransDate: today(),
                pReportStatus: "U",
                pDeficiencyRemarks: "",
            },
        ],
        soaps: [],
    });
}
