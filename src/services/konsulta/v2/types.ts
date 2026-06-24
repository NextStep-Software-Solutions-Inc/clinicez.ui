export type YnFlag = "Y" | "N" | "X"; // X for Not Applicable/Quit/Unknown depending on context
export type Gender = "M" | "F";
export type PatientType = "MM" | "DD";
export type ReportStatus = "U" | "V" | "F";

// --- XML Types based on PhilHealth_Konsulta_Data_Dictionary_Reference.md ---

export interface PcbXmlData {
  pUsername: string;
  pPassword: string;
  pHciAccreNo: string;
  pPMCCNo: string;
  pEnlistTotalCnt: number;
  pProfileTotalCnt: number;
  pSoapTotalCnt: number;
  pCertificationId: string;
  pHciTransmittalNumber: string;

  ENLISTMENT?: EnlistmentXmlData[];
  PROFILE?: ProfileXmlData[];
  SOAP?: SoapXmlData[];
}

export interface EnlistmentXmlData {
  pHciCaseNo: string;
  pHciTransNo: string;
  pEffYear: string; // YYYY-MM-DD
  pEnlistStat: string; // 1, 2, 3
  pEnlistDate: string; // YYYY-MM-DD
  pPackageType: "P" | "E" | "K";
  pMemPin: string;
  pMemFname: string;
  pMemMname?: string;
  pMemLname: string;
  pMemExtname?: string;
  pMemDob: string;
  pPatientPin: string;
  pPatientFname: string;
  pPatientMname?: string;
  pPatientLname: string;
  pPatientExtname?: string;
  pPatientSex: Gender;
  pPatientDob: string; // YYYY-MM-DD
  pPatientType: PatientType;
  pPatientMobileNo: string;
  pPatientLandlineNo?: string;
  pWithConsent: YnFlag;
  pTransDate: string; // YYYY-MM-DD
  pCreatedBy: string;
  pReportStatus: ReportStatus;
  pDeficiencyRemarks?: string;
}

export interface ProfileXmlData {
  pHciTransNo: string;
  pHciCaseNo: string;
  pProfDate: string; // YYYY-MM-DD
  pPatientPin: string;
  pPatientType: PatientType;
  pPatientAge: number;
  pMemPin: string;
  pEffYear: string;
  pATC: string;
  pIsWalkedIn: "Y" | "N";
  pTransDate: string;
  pReportStatus: ReportStatus;
  pDeficiencyRemarks?: string;

  MEDHIST?: MedHistXmlData[];
  MHSPECIFIC?: MhSpecificXmlData[];
  SURGHIST?: SurgHistXmlData[];
  FAMHIST?: FamHistXmlData[];
  FHSPECIFIC?: FhSpecificXmlData[];
  SOCHIST?: SocHistXmlData;
  IMMUNIZATION?: ImmunizationXmlData[];
  MENSHIST?: MensHistXmlData;
  PREGHIST?: PregHistXmlData;
  BLOODTYPE?: BloodTypeXmlData;
  PEGENSURVEY?: PeGenSurveyXmlData;
  PEMISC?: PeMiscXmlData;
  NCDQANS?: NcdQAnsXmlData;
}

export interface MedHistXmlData {
  pMdiseaseCode: string;
  pReportStatus: ReportStatus;
  pDeficiencyRemarks?: string;
}

export interface MhSpecificXmlData {
  pMdiseaseCode: string;
  pSpecificDesc: string;
  pReportStatus: ReportStatus;
  pDeficiencyRemarks?: string;
}

export interface SurgHistXmlData {
  pSurgDesc: string;
  pSurgDate: string; // YYYY-MM-DD
  pReportStatus: ReportStatus;
  pDeficiencyRemarks?: string;
}

export interface FamHistXmlData {
  pMdiseaseCode: string;
  pReportStatus: ReportStatus;
  pDeficiencyRemarks?: string;
}

export interface FhSpecificXmlData {
  pMdiseaseCode: string;
  pSpecificDesc: string;
  pReportStatus: ReportStatus;
  pDeficiencyRemarks?: string;
}

export interface SocHistXmlData {
  pIsSmoker: YnFlag;
  pNoCigpk: string;
  pIsAdrinker: YnFlag;
  pNoBottles: string;
  pIllDrugUser: YnFlag;
  pIsSexuallyActive: YnFlag;
  pReportStatus: ReportStatus;
  pDeficiencyRemarks?: string;
}

export interface ImmunizationXmlData {
  pChildImmcode: string;
  pYoungwImmcode: string;
  pPregwImmcode: string;
  pElderlyImmcode: string;
  pOtherImm: string;
  pReportStatus: ReportStatus;
  pDeficiencyRemarks?: string;
}

export interface MensHistXmlData {
  pMenarchePeriod: string;
  pLastMensPeriod: string; // YYYY-MM-DD
  pPeriodDuration: string;
  pMensInterval: string;
  pPadsPerDay: string;
  pOnsetSexIc: string;
  pBirthCtrlMethod: string;
  pIsMenopause: YnFlag;
  pMenopauseAge: string;
  pIsApplicable: "Y" | "N";
  pReportStatus: ReportStatus;
  pDeficiencyRemarks?: string;
}

export interface PregHistXmlData {
  pPregCnt: string;
  pDeliveryCnt: string;
  pDeliveryTyp: string; // N, O, B, X
  pFullTermCnt: string;
  pPrematureCnt: string;
  pAbortionCnt: string;
  pLivChildrenCnt: string;
  pWPregIndhyp: YnFlag;
  pWFamPlan: YnFlag;
  pIsApplicable: "Y" | "N";
  pReportStatus: ReportStatus;
  pDeficiencyRemarks?: string;
}

export interface BloodTypeXmlData {
  pBloodType: string;
  pReportStatus: ReportStatus;
  pDeficiencyRemarks?: string;
}

export interface PeGenSurveyXmlData {
  pGenSurveyId: string;
  pGenSurveyRem: string;
  pReportStatus: ReportStatus;
  pDeficiencyRemarks?: string;
}

export interface PeMiscXmlData {
  pSkinId: string;
  pHeentId: string;
  pChestId: string;
  pHeartId: string;
  pAbdomenId: string;
  pNeuroId: string;
  pGuId: string;
  pRectalId: string;
  pReportStatus: ReportStatus;
  pDeficiencyRemarks?: string;
}

export interface NcdQAnsXmlData {
  pQid1_Yn: YnFlag;
  pQid2_Yn: YnFlag;
  pQid3_Yn: YnFlag;
  pQid4_Yn: YnFlag;
  pQid5_Ynx: YnFlag;
  pQid6_Yn: YnFlag;
  pQid7_Yn: YnFlag;
  pQid8_Yn: YnFlag;
  pQid9_Yn: YnFlag;
  pQid10_Yn: YnFlag;
  pQid11_Yn: YnFlag;
  pQid12_Yn: YnFlag;
  pQid13_Yn: YnFlag;
  pQid14_Yn: YnFlag;
  pQid15_Yn: YnFlag;
  pQid16_Yn: YnFlag;
  pQid17_Abcde: string; // A, B, C, D, E
  pQid18_Yn: YnFlag;
  pQid19_Yn: YnFlag;
  pQid19_Fbsmg: string;
  pQid19_Fbsmmol: string;
  pQid19_Fbsdate: string;
  pQid20_Yn: YnFlag;
  pQid20_Choleval: string;
  pQid20_Choledate: string;
  pQid21_Yn: YnFlag;
  pQid21_Ketonval: string;
  pQid21_Ketondate: string;
  pQid22_Yn: YnFlag;
  pQid22_Proteinval: string;
  pQid22_Proteindate: string;
  pQid23_Yn: YnFlag;
  pQid24_Yn: YnFlag;
  pReportStatus: ReportStatus;
  pDeficiencyRemarks?: string;
}

export interface SoapXmlData {
  pHciCaseNo: string;
  pHciTransNo: string;
  pSoapDate: string; // YYYY-MM-DD
  pPatientPin: string;
  pPatientType: PatientType;
  pMemPin: string;
  pEffYear: string;
  pATC: string;
  pIsWalkedIn: "Y" | "N";
  pCoPay: number;
  pTransDate: string; // YYYY-MM-DD
  pReportStatus: ReportStatus;
  pDeficiencyRemarks?: string;

  SUBJECTIVE?: SubjectiveXmlData;
  PEPERT?: PePertXmlData;
  PESPECIFIC?: PeSpecificXmlData;
  ICD?: IcdXmlData[];
  DIAGNOSTIC?: DiagnosticXmlData[];
  MANAGEMENT?: ManagementXmlData[];
  ADVICE?: AdviceXmlData;
  MEDICINE?: MedicineXmlData[];
  DIAGNOSTICEXAMRESULT?: DiagnosticExamResultXmlData;
}

export interface SubjectiveXmlData {
  pIllnessHistory: string;
  pSignsSymptoms: string; // semicolon delimited
  pOtherComplaint: string;
  pPainSite: string;
  pReportStatus: ReportStatus;
  pDeficiencyRemarks?: string;
}

export interface PePertXmlData {
  pSystolic: number | string;
  pDiastolic: number | string;
  pHr: number | string;
  pRr: number | string;
  pTemp: number | string;
  pHeight: number | string;
  pWeight: number | string;
  pBMI: number | string;
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
  pReportStatus: ReportStatus;
  pDeficiencyRemarks?: string;
}

export interface PeSpecificXmlData {
  pSkinRem: string;
  pHeentRem: string;
  pChestRem: string;
  pHeartRem: string;
  pAbdomenRem: string;
  pNeuroRem: string;
  pRectalRem: string;
  pGuRem: string;
  pReportStatus: ReportStatus;
  pDeficiencyRemarks?: string;
}

export interface IcdXmlData {
  pIcdCode: string;
  pReportStatus: ReportStatus;
  pDeficiencyRemarks?: string;
}

export interface DiagnosticXmlData {
  pDiagnosticId: string;
  pOthRemarks: string;
  pIsPhysicianRecommendation?: string;
  pPatientRemarks: string;
  pReportStatus: ReportStatus;
  pDeficiencyRemarks?: string;
}

export interface ManagementXmlData {
  pManagementId: string;
  pOthRemarks: string;
  pReportStatus: ReportStatus;
  pDeficiencyRemarks?: string;
}

export interface AdviceXmlData {
  pRemarks: string;
  pReportStatus: ReportStatus;
  pDeficiencyRemarks?: string;
}

export interface MedicineXmlData {
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
  pOthMedDrugGrouping?: string;
  pRoute: string;
  pQuantity: number;
  pActualUnitPrice: number;
  pTotalAmtPrice: number;
  pInstructionQuantity: string;
  pInstructionStrength: string;
  pInstructionFrequency: string;
  pPrescribingPhysician: string;
  pIsDispensed: "Y" | "N";
  pDateDispensed: string;
  pDispensingPersonnel: string;
  pIsApplicable: "Y" | "N";
  pDateAdded: string;
  pReportStatus: ReportStatus;
  pDeficiencyRemarks?: string;
}

export interface DiagnosticExamResultXmlData {
  pHciCaseNo: string;
  pHciTransNo: string;
  pPatientPin: string;
  pPatientType: PatientType;
  pMemPin: string;
  pEffYear: string;

  CBC?: CbcXmlData[];
  URINALYSIS?: UrinalysisXmlData[];
  CHESTXRAY?: ChestXrayXmlData[];
  ECG?: EcgXmlData[];
  LIPIDPROFILE?: LipidProfileXmlData[];
  FBS?: FbsXmlData[];
  OGTT?: OgttXmlData[];
  HBA1C?: Hba1cXmlData[];
  CREATININE?: CreatinineXmlData[];
  SPUTUM?: SputumXmlData[];
  PAPSMEAR?: PapsmearXmlData[];
  FECALYSIS?: FecalysisXmlData[];
  FOBT?: FobtXmlData[];
}

export interface CbcXmlData {
  pReferralFacility: string;
  pLabDate: string;
  pHematocrit: string;
  pHemoglobinG: string;
  pHemoglobinMmol: string;
  pMhcPg: string;
  pMhcFmol: string;
  pMchcGhb: string;
  pMchcMmol: string;
  pMcvUm: string;
  pMcvFl: string;
  pWbc1000: string;
  pWbc10: string;
  pMyelocyte: string;
  pNeutrophilsBnd: string;
  pNeutrophilsSeg: string;
  pLymphocytes: string;
  pMonocytes: string;
  pEosinophils: string;
  pBasophils: string;
  pPlatelet: string;
  pDateAdded: string;
  pStatus: string;
  pDiagnosticLabFee: string;
  pReportStatus: ReportStatus;
  pDeficiencyRemarks?: string;
}

export interface UrinalysisXmlData {
  pReferralFacility: string;
  pLabDate: string;
  pGravity: string;
  pAppearance: string;
  pColor: string;
  pGlucose: string;
  pProteins: string;
  pKetones: string;
  pPh: string;
  pRbCells: string;
  pWbCells: string;
  pBacteria: string;
  pCrystals: string;
  pDateAdded: string;
  pStatus: string;
  pDiagnosticLabFee: string;
  pReportStatus: ReportStatus;
  pDeficiencyRemarks?: string;
}

export interface ChestXrayXmlData {
  pReferralFacility: string;
  pLabDate: string;
  pFindings: string;
  pObservations: string;
  pDateAdded: string;
  pStatus: string;
  pDiagnosticLabFee: string;
  pReportStatus: ReportStatus;
  pDeficiencyRemarks?: string;
}

export interface EcgXmlData {
  pReferralFacility: string;
  pLabDate: string;
  pFindings: string;
  pObservations: string;
  pDateAdded: string;
  pStatus: string;
  pDiagnosticLabFee: string;
  pReportStatus: ReportStatus;
  pDeficiencyRemarks?: string;
}

export interface LipidProfileXmlData {
  pReferralFacility: string;
  pLabDate: string;
  pLdl: string;
  pHdl: string;
  pTotalCholesterol: string;
  pCholesterol: string;
  pTriglycerides: string;
  pDateAdded: string;
  pStatus: string;
  pDiagnosticLabFee: string;
  pReportStatus: ReportStatus;
  pDeficiencyRemarks?: string;
}

export interface FbsXmlData {
  pReferralFacility: string;
  pLabDate: string;
  pGlucoseMg: string;
  pGlucoseMmol: string;
  pDateAdded: string;
  pStatus: string;
  pDiagnosticLabFee: string;
  pReportStatus: ReportStatus;
  pDeficiencyRemarks?: string;
}

export interface OgttXmlData {
  pReferralFacility: string;
  pLabDate: string;
  pFastingMg: string;
  pFastingMmol: string;
  pOgtt1HrMg: string;
  pOgtt1HrMmol: string;
  pOgtt2HrMg: string;
  pOgtt2HrMmol: string;
  pDateAdded: string;
  pStatus: string;
  pDiagnosticLabFee: string;
  pReportStatus: ReportStatus;
  pDeficiencyRemarks?: string;
}

export interface Hba1cXmlData {
  pReferralFacility: string;
  pLabDate: string;
  pHba1cRating: string;
  pDateAdded: string;
  pStatus: string;
  pDiagnosticLabFee: string;
  pReportStatus: ReportStatus;
  pDeficiencyRemarks?: string;
}

export interface CreatinineXmlData {
  pReferralFacility: string;
  pLabDate: string;
  pCreatinineMg: string;
  pCreatinineMmol: string;
  pDateAdded: string;
  pStatus: string;
  pDiagnosticLabFee: string;
  pReportStatus: ReportStatus;
  pDeficiencyRemarks?: string;
}

export interface SputumXmlData {
  pReferralFacility: string;
  pLabDate: string;
  pDataOfCollection: string; // YYYY-MM-DD
  pVisualApp: string;
  pAppearance: string;
  pSmearNo: string;
  pReading: string;
  pDiagnosis: string;
  pDateAdded: string;
  pStatus: string;
  pDiagnosticLabFee: string;
  pReportStatus: ReportStatus;
  pDeficiencyRemarks?: string;
}

export interface PapsmearXmlData {
  pReferralFacility: string;
  pLabDate: string;
  pFindings: string;
  pImpression: string;
  pDateAdded: string;
  pStatus: string;
  pDiagnosticLabFee: string;
  pReportStatus: ReportStatus;
  pDeficiencyRemarks?: string;
}

export interface FecalysisXmlData {
  pReferralFacility: string;
  pLabDate: string;
  pColor: string;
  pConsistency: string;
  pWbc: string;
  pRbc: string;
  pFatGlobules: string;
  pYeastCells: string;
  pMucusThread: string;
  pMacrophages: string;
  pAscarisLumbricoides: string;
  pTrichurisTrichiura: string;
  pHookworm: string;
  pEntamoebaHistolytica: string;
  pEntamoebaColi: string;
  pGiardiaLamblia: string;
  pSchistosomaJaponicum: string;
  pDateAdded: string;
  pStatus: string;
  pDiagnosticLabFee: string;
  pReportStatus: ReportStatus;
  pDeficiencyRemarks?: string;
}

export interface FobtXmlData {
  pReferralFacility: string;
  pLabDate: string;
  pFindings: string;
  pDateAdded: string;
  pStatus: string;
  pDiagnosticLabFee: string;
  pReportStatus: ReportStatus;
  pDeficiencyRemarks?: string;
}
