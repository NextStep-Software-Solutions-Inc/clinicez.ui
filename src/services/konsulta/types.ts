/**
 * PhilHealth Konsulta v1.1 PKA — Shared TypeScript Types
 *
 * Based on KonsultaData_v1.14.dtd
 */

// ─── Credentials ────────────────────────────────────────────────────────────

export interface KonsultaHciCredentials {
    username: string;
    password: string;
    hciAccreNo: string;
    pmccNumber: string;
    certificationId: string;
    cipherKey: string;
}

// ─── SOAP Service Parameters ────────────────────────────────────────────────

/** checkUploadStatus — query the processing status of a previous upload. */
export interface CheckUploadStatusParams {
    pUsername: string;
    pUserPassword: string;
    pHospitalCode: string;
    pStartDate: string;
    pEndDate: string;
    pTransmittalID: string;
    pReport: "PCB" | "ML";
}

export interface CheckUploadStatusResponse {
    return: string;
}

/**
 * validateReport — pre-validate an encrypted XML payload before submission.
 * pReport        = the encrypted XML JSON string (from encryptXmlPayload, up to 2 MB).
 * pReportTagging = "1" (first patient encounter: enlistment + profiling)
 *                  "2" (encounter, consultations, diagnostics, drugs)
 * Returns validated XML with pReportStatus="V" on success.
 */
export interface ValidateReportParams {
    pReport: string;
    pReportTagging: "1" | "2";
}

export interface ValidateReportResponse {
    return: string;
}

/**
 * submitReport — final submission after a successful validateReport.
 * pTransmittalID  = EMR-generated transmittal reference (R + accreno(9) + yyyymm + seq(5))
 * pReport         = the encrypted XML JSON string (same as used in validateReport)
 * pReportTagging  = "1" or "2" (same as used in validateReport)
 */
export interface SubmitReportParams {
    pTransmittalID: string;
    pReport: string;
    pReportTagging: "1" | "2";
}

export interface SubmitReportResponse {
    return: string;
}

/**
 * getToken — obtain a session token for authenticated SOAP calls.
 */
export interface GetTokenParams {
    pUsername: string;
    pUserPassword: string;
    pSoftwareCertificationId: string;
    pHospitalCode: string;
}

export interface GetTokenResponse {
    return: string;
}

/**
 * extractRegistrationList — retrieve the list of registered members/dependents
 * within a date range.
 */
export interface ExtractRegistrationListParams {
    pStartDate: string;
    pEndDate: string;
}

export interface ExtractRegistrationListResponse {
    return: string;
}

/**
 * isATCValid — check whether an Authorization to Consult code is valid.
 */
export interface IsATCValidParams {
    pPIN: string;
    pATC: string;
    pEffectivityDate: string;
}

export interface IsATCValidResponse {
    return: string;
}

/**
 * isMemberDependentRegistered — verify if a member / dependent is enrolled
 * under Konsulta.
 * pType = "MM" (member) | "DD" (dependent)
 */
export interface IsMemberDependentRegisteredParams {
    pPIN: string;
    pType: "MM" | "DD";
}

export interface IsMemberDependentRegisteredResponse {
    return: string;
}

/**
 * Parsed ASSIGNMENT element from an extractRegistrationList XML response.
 * Maps directly to the attributes declared in KonsultaMasterlist_v1.4.dtd.
 *
 * For a principal member (pAssignedType="MM"):
 *   pAssignedPin  = member PIN   |  pPrimaryPIN = same PIN
 * For a dependent (pAssignedType="DD"):
 *   pAssignedPin  = dependent PIN |  pPrimaryPIN = primary member PIN
 */
export interface ErlAssignment {
    pAssignedPin: string;
    pAssignedLastName: string;
    pAssignedFirstName: string;
    pAssignedMiddleName: string;
    pAssignedExtName: string;
    pAssignedDateOfBirth: string;
    pAssignedSex: "M" | "F";
    pAssignedType: "MM" | "DD";
    pPrimaryPIN: string;
    pPrimaryLastName: string;
    pPrimaryFirstName: string;
    pPrimaryMiddleName: string;
    pPrimaryExtName: string;
    pPrimaryDateOfBirth: string;
    pMobileNumber: string;
    pPackageType: "E" | "K";
    pEffYear: string;
    pAssignedDate: string;
}

// ─── Deprecated aliases (kept for backwards-compat during migration) ─────────
/** @deprecated Use ValidateReportParams + SubmitReportParams */
export type UploadKonsultaReportParams = ValidateReportParams;
/** @deprecated Use ValidateReportResponse */
export type UploadKonsultaReportResponse = ValidateReportResponse;

// ─── Encrypted Payload ──────────────────────────────────────────────────────

export interface KonsultaEncryptedPayload {
    docMimeType: string;
    hash: string;
    key1: string;
    key2: string;
    iv: string;
    doc: string;
}

// ─── PCB XML Data Types ──────────────────────────────────────────────────────

export type KonsultaPatientType = "MM" | "DD";
export type KonsultaPackageType = "P" | "E" | "K";
export type KonsultaReportStatus = "U" | "V" | "F";
export type KonsultaYN = "Y" | "N";
export type KonsultaDeliveryType = "N" | "X";

export interface KonsultaEnlistmentData {
    pHciCaseNo: string;
    pHciTransNo: string;
    pEffYear: string;
    pEnlistStat: string;
    pEnlistDate: string;
    pPackageType: KonsultaPackageType;
    pMemPin: string;
    pMemFname: string;
    pMemMname: string;
    pMemLname: string;
    pMemExtname: string;
    pMemDob: string;
    pPatientPin: string;
    pPatientFname: string;
    pPatientMname: string;
    pPatientLname: string;
    pPatientExtname: string;
    pPatientSex: "M" | "F";
    pPatientDob: string;
    pPatientType: KonsultaPatientType;
    pPatientMobileNo: string;
    pPatientLandlineNo: string;
    pWithConsent: KonsultaYN;
    pTransDate: string;
    pCreatedBy: string;
    pReportStatus: KonsultaReportStatus;
    pDeficiencyRemarks: string;
}

export interface KonsultaSocHistData {
    pIsSmoker: KonsultaYN;
    pNoCigpk: string;
    pIsAdrinker: KonsultaYN;
    pNoBottles: string;
    pIllDrugUser: KonsultaYN;
    pIsSexuallyActive: KonsultaYN;
    pReportStatus: KonsultaReportStatus;
    pDeficiencyRemarks: string;
}

export interface KonsultaPePertData {
    pSystolic: string;
    pDiastolic: string;
    pHr: string;
    pRr: string;
    pTemp: string;
    pHeight: string;
    pWeight: string;
    pBMI: string;
    pZScore: string;
    pLeftVision: string;
    pRightVision: string;
    pLength: string;
    pHeadCirc: string;
    pSkinfoldThickness: string;
    pWaist: string;
    pHip: string;
    pLimbs: string;
    pMidUpperArmCirc: string;
    pReportStatus: KonsultaReportStatus;
    pDeficiencyRemarks: string;
}

// ─── PROFILE Sub-Element Data ─────────────────────────────────────────────────

/** Medical history item. Use PhilHealth disease codes (e.g. "011") or "999" for Other. */
export interface KonsultaMedHistItem {
    /** PhilHealth disease code (e.g. "001", "011") or "999" for Other */
    code: string;
    /** Specific description for MHSPECIFICS/MHSPECIFIC element */
    specificDesc?: string;
}

export interface KonsultaSurgHistItem {
    desc: string;
    /** yyyy-mm-dd or empty string */
    date: string;
}

/** Family history item. Use PhilHealth disease codes or "999" for Other. */
export interface KonsultaFamHistItem {
    /** PhilHealth disease code or "999" for Other */
    code: string;
    /** Specific description for FHSPECIFICS/FHSPECIFIC element */
    specificDesc?: string;
}

export interface KonsultaImmunizationItem {
    pChildImmcode?: string;
    pYoungwImmcode?: string;
    pPregwImmcode?: string;
    pElderlyImmcode?: string;
    pOtherImm?: string;
}

export interface KonsultaPeMiscItem {
    pSkinId?: string;
    pHeentId?: string;
    pChestId?: string;
    pHeartId?: string;
    pAbdomenId?: string;
    pNeuroId?: string;
    pGuId?: string;
    pRectalId?: string;
}

/** Optional patient-history data used to populate PROFILE sub-elements. */
export interface KonsultaProfileSubData {
    // ── SOCHIST ──────────────────────────────────────────────────────────────
    isSmoker?: KonsultaYN;
    noCigpk?: string;
    isAdrinker?: KonsultaYN;
    noBottles?: string;
    illDrugUser?: KonsultaYN;
    isSexuallyActive?: KonsultaYN;

    // ── BLOODTYPE ─────────────────────────────────────────────────────────────
    bloodType?: string;

    // ── PEPERT (physical exam vitals) ─────────────────────────────────────────
    systolic?: string;
    diastolic?: string;
    hr?: string;
    rr?: string;
    temp?: string;
    height?: string;
    weight?: string;
    bmi?: string;
    zScore?: string;
    leftVision?: string;
    rightVision?: string;
    length?: string;
    headCirc?: string;
    skinfoldThickness?: string;
    waist?: string;
    hip?: string;
    limbs?: string;
    midUpperArmCirc?: string;

    // ── MENSHIST ──────────────────────────────────────────────────────────────
    isMenshApplicable?: KonsultaYN;
    menarchePeriod?: string;
    lastMensPeriod?: string;
    periodDuration?: string;
    mensInterval?: string;
    padsPerDay?: string;
    onsetSexIc?: string;
    birthCtrlMethod?: string;
    isMenopause?: string;
    menopauseAge?: string;

    // ── PREGHIST ──────────────────────────────────────────────────────────────
    isPreghApplicable?: KonsultaYN;
    pregCnt?: string;
    deliveryCnt?: string;
    /** "N"=Normal, "C"=Caesarean, "X"=Not applicable */
    deliveryTyp?: string;
    fullTermCnt?: string;
    prematureCnt?: string;
    abortionCnt?: string;
    livChildrenCnt?: string;
    /** "Y" if pregnancy-induced hypertension */
    wPregIndhyp?: string;
    /** "Y" if using family planning */
    wFamPlan?: string;

    // ── Medical + family history codes with specifics ──────────────────────────
    medHistItems?: KonsultaMedHistItem[];
    surgHistItems?: KonsultaSurgHistItem[];
    famHistItems?: KonsultaFamHistItem[];

    // ── IMMUNIZATIONS ─────────────────────────────────────────────────────────
    immunizations?: KonsultaImmunizationItem[];

    // ── PEGENSURVEY ───────────────────────────────────────────────────────────
    genSurveyId?: string;
    genSurveyRem?: string;

    // ── PEMISCS (physical exam miscellaneous finding codes) ───────────────────
    pemiscItems?: KonsultaPeMiscItem[];

    // ── PESPECIFIC (physical exam specific remarks) ───────────────────────────
    skinRem?: string;
    heentRem?: string;
    chestRem?: string;
    heartRem?: string;
    abdomenRem?: string;
    neuroRem?: string;
    rectalRem?: string;
    guRem?: string;

    // ── NCDQANS (Non-Communicable Disease questionnaire answers) ───────────────
    ncdQans?: {
        pQid1_Yn?: string;
        pQid2_Yn?: string;
        pQid3_Yn?: string;
        pQid4_Yn?: string;
        pQid5_Ynx?: string;
        pQid6_Yn?: string;
        pQid7_Yn?: string;
        pQid8_Yn?: string;
        pQid9_Yn?: string;
        pQid10_Yn?: string;
        pQid11_Yn?: string;
        pQid12_Yn?: string;
        pQid13_Yn?: string;
        pQid14_Yn?: string;
        pQid15_Yn?: string;
        pQid16_Yn?: string;
        pQid17_Abcde?: string;
        pQid18_Yn?: string;
        pQid19_Yn?: string;
        pQid19_Fbsmg?: string;
        pQid19_Fbsmmol?: string;
        pQid19_Fbsdate?: string;
        pQid20_Yn?: string;
        pQid20_Choleval?: string;
        pQid20_Choledate?: string;
        pQid21_Yn?: string;
        pQid21_Ketonval?: string;
        pQid21_Ketondate?: string;
        pQid22_Yn?: string;
        pQid22_Proteinval?: string;
        pQid22_Proteindate?: string;
        pQid23_Yn?: string;
        pQid24_Yn?: string;
    };
}

// ─── SOAP Sub-Element Data ────────────────────────────────────────────────────

export interface KonsultaDiagnosticItem {
    /** PhilHealth diagnostic ID (1–19) or "99" for Other */
    id: string;
    othRemarks?: string;
    /** "Y"=yes, "N"=no, "X"=not applicable */
    isPhysicianRecommendation?: string;
    /** "RQ"=requested, "RF"=refused, "XX"=not applicable */
    patientRemarks?: string;
}

export interface KonsultaManagementItem {
    /** PhilHealth management ID (1–10) or "X" for Other */
    id: string;
    othRemarks?: string;
}

/** Optional consultation-specific data used to populate SOAP sub-elements. */
export interface KonsultaSoapSubData {
    // ── SUBJECTIVE ────────────────────────────────────────────────────────────
    illnessHistory?: string;
    /** Semicolon-separated PhilHealth symptom codes (e.g. "37;38;X") */
    signsSymptoms?: string;
    otherComplaint?: string;
    painSite?: string;

    // ── PEPERT (vital signs taken at consultation) ────────────────────────────
    systolic?: string;
    diastolic?: string;
    hr?: string;
    rr?: string;
    temp?: string;
    height?: string;
    weight?: string;
    bmi?: string;
    zScore?: string;
    leftVision?: string;
    rightVision?: string;
    length?: string;
    headCirc?: string;
    skinfoldThickness?: string;
    waist?: string;
    hip?: string;
    limbs?: string;
    midUpperArmCirc?: string;

    // ── PEMISCS ───────────────────────────────────────────────────────────────
    pemiscItems?: KonsultaPeMiscItem[];

    // ── PESPECIFIC ────────────────────────────────────────────────────────────
    skinRem?: string;
    heentRem?: string;
    chestRem?: string;
    heartRem?: string;
    abdomenRem?: string;
    neuroRem?: string;
    rectalRem?: string;
    guRem?: string;

    // ── ICDS (ICD-10 codes from ConsultationDiagnoses) ────────────────────────
    icdCodes?: string[];

    // ── DIAGNOSTICS (PhilHealth diagnostic test IDs) ──────────────────────────
    diagnostics?: KonsultaDiagnosticItem[];

    // ── MANAGEMENTS (PhilHealth management procedure IDs) ─────────────────────
    managements?: KonsultaManagementItem[];

    // ── ADVICE (from consultation plan/assessment notes) ──────────────────────
    advice?: string;
}

export interface KonsultaProfileData {
    pHciTransNo: string;
    pHciCaseNo: string;
    pProfDate: string;
    pPatientPin: string;
    pPatientType: KonsultaPatientType;
    pPatientAge: string;
    pMemPin: string;
    pEffYear: string;
    pATC: string;
    pIsWalkedIn: KonsultaYN;
    pTransDate: string;
    pReportStatus: KonsultaReportStatus;
    pDeficiencyRemarks: string;
    medicalHistoryCodes?: string[];
    immunizations?: KonsultaImmunizationData[];
    physicalExamFindings?: KonsultaPhysicalExamFindingData[];
    /** Optional enriched patient-history data for PROFILE sub-elements */
    subData?: KonsultaProfileSubData;
}

export interface KonsultaSoapData {
    pHciCaseNo: string;
    pHciTransNo: string;
    pSoapDate: string;
    pPatientPin: string;
    pPatientType: KonsultaPatientType;
    pMemPin: string;
    pEffYear: string;
    pATC: string;
    pIsWalkedIn: KonsultaYN;
    pCoPay: string;
    pTransDate: string;
    pReportStatus: KonsultaReportStatus;
    pDeficiencyRemarks: string;
    icdCodes?: string[];
    diagnosticCodes?: string[];
    managementCodes?: string[];
    physicalExamFindings?: KonsultaPhysicalExamFindingData[];
    /** Optional enriched consultation data for SOAP sub-elements */
    subData?: KonsultaSoapSubData;
}

export interface KonsultaMedicalHistoryData {
    pMdiseaseCode: string;
    pReportStatus: KonsultaReportStatus;
    pDeficiencyRemarks: string;
}

export interface KonsultaImmunizationData {
    pChildImmcode: string;
    pYoungwImmcode: string;
    pPregwImmcode: string;
    pElderlyImmcode: string;
    pOtherImm: string;
    pReportStatus: KonsultaReportStatus;
    pDeficiencyRemarks: string;
}

export interface KonsultaPhysicalExamFindingData {
    pSkinId: string;
    pHeentId: string;
    pChestId: string;
    pHeartId: string;
    pAbdomenId: string;
    pNeuroId: string;
    pGuId: string;
    pRectalId: string;
    pReportStatus: KonsultaReportStatus;
    pDeficiencyRemarks: string;
}

export interface KonsultaMedicineData {
    pHciCaseNo: string;
    pHciTransNo: string;
    pCategory: string;
    pDrugCode: string;
    pGenericCode: string;
    pSaltCode: string;
    pStrengthCode: string;
    pFormCode: string;
    pUnitCode: string;
    pPackageCode: string;
    pOtherMedicine: string;
    pRoute: string;
    pQuantity: string;
    pActualUnitPrice: string;
    pTotalAmtPrice: string;
    pInstructionQuantity: string;
    pInstructionStrength: string;
    pInstructionFrequency: string;
    pPrescribingPhysician: string;
    pIsDispensed: string;
    pDateDispensed: string;
    pDispensingPersonnel: string;
    pIsApplicable: KonsultaYN;
    pDateAdded: string;
    pReportStatus: KonsultaReportStatus;
    pDeficiencyRemarks: string;
}

// ─── PCB Root ────────────────────────────────────────────────────────────────

export interface PcbXmlBuilderInput {
    credentials: KonsultaHciCredentials;
    transmittalNumber: string;
    enlistments: KonsultaEnlistmentData[];
    profiles: KonsultaProfileData[];
    soaps: KonsultaSoapData[];
    medicines?: KonsultaMedicineData[];
}
