import { PcbXmlData } from "./types";

/**
 * Returns a hardcoded, valid PcbXmlData object for testing staging environment.
 */
export function getStagingTestData(): PcbXmlData {
  return {
    pUsername: "STAGING_USER",
    pPassword: "STAGING_PASSWORD",
    pHciAccreNo: "HCI123456",
    pPMCCNo: "PMCC123",
    pEnlistTotalCnt: 1,
    pProfileTotalCnt: 1,
    pSoapTotalCnt: 1,
    pCertificationId: "CERT123",
    pHciTransmittalNumber: "TRANS12345",
    ENLISTMENT: [
      {
        pHciCaseNo: "CASE001",
        pHciTransNo: "TRANS001",
        pEffYear: "2024",
        pEnlistStat: "1",
        pEnlistDate: "2024-01-01",
        pPackageType: "K",
        pMemPin: "123456789012",
        pMemFname: "JUAN",
        pMemLname: "DELA CRUZ",
        pMemDob: "1980-01-01",
        pPatientPin: "123456789012",
        pPatientFname: "JUAN",
        pPatientLname: "DELA CRUZ",
        pPatientSex: "M",
        pPatientDob: "1980-01-01",
        pPatientType: "MM",
        pPatientMobileNo: "09171234567",
        pWithConsent: "Y",
        pTransDate: "2024-01-01",
        pCreatedBy: "HCI123456",
        pReportStatus: "U"
      }
    ],
    PROFILE: [
      {
        pHciCaseNo: "CASE001",
        pHciTransNo: "TRANS001",
        pProfDate: "2024-01-01",
        pPatientPin: "123456789012",
        pPatientType: "MM",
        pPatientAge: 44,
        pMemPin: "123456789012",
        pEffYear: "2024",
        pATC: "ATC001",
        pIsWalkedIn: "N",
        pTransDate: "2024-01-01",
        pReportStatus: "U",
        PEGENSURVEY: {
          pGenSurveyId: "1",
          pGenSurveyRem: "Normal",
          pReportStatus: "U"
        }
      }
    ],
    SOAP: [
      {
        pHciCaseNo: "CASE001",
        pHciTransNo: "TRANS001",
        pSoapDate: "2024-01-01",
        pPatientPin: "123456789012",
        pPatientType: "MM",
        pMemPin: "123456789012",
        pEffYear: "2024",
        pATC: "ATC001",
        pIsWalkedIn: "N",
        pCoPay: 0,
        pTransDate: "2024-01-01",
        pReportStatus: "U",
        SUBJECTIVE: {
          pIllnessHistory: "NONE",
          pSignsSymptoms: "NONE",
          pOtherComplaint: "NONE",
          pPainSite: "NONE",
          pReportStatus: "U"
        },
        PEPERT: {
          pSystolic: 120,
          pDiastolic: 80,
          pHr: 80,
          pRr: 20,
          pTemp: 37,
          pHeight: 170,
          pWeight: 70,
          pBMI: 24,
          pZScore: "N/A",
          pLeftVision: "20/20",
          pRightVision: "20/20",
          pLength: "0",
          pHeadCirc: "0",
          pSkinfoldThickness: "0",
          pWaist: "80",
          pHip: "90",
          pLimbs: "Normal",
          pMidUpperArmCirc: "0",
          pReportStatus: "U"
        }
      }
    ]
  };
}
