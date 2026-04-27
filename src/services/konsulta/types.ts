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
 * pReportTagging = the encrypted XML JSON string (from encryptXmlPayload).
 * pReport        = "PCB" | "ML"
 * Returns a transmittal ID on success which must be passed to submitReport.
 */
export interface ValidateReportParams {
    pReportTagging: string;
    pReport: "PCB" | "ML";
}

export interface ValidateReportResponse {
    return: string;
}

/**
 * submitReport — final submission after a successful validateReport.
 * pTransmittalID  = value returned by validateReport
 * pReport         = "PCB" | "ML"
 * pReportTagging  = same encrypted XML JSON string used in validateReport
 */
export interface SubmitReportParams {
    pTransmittalID: string;
    pReport: "PCB" | "ML";
    pReportTagging: string;
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
}

// ─── PCB Root ────────────────────────────────────────────────────────────────

export interface PcbXmlBuilderInput {
    credentials: KonsultaHciCredentials;
    transmittalNumber: string;
    enlistments: KonsultaEnlistmentData[];
    profiles: KonsultaProfileData[];
    soaps: KonsultaSoapData[];
}
