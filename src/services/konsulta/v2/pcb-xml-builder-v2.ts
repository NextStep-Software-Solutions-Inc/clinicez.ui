import { create } from "xmlbuilder2";
import type { 
  PcbXmlData, EnlistmentXmlData, ProfileXmlData, SoapXmlData,
  MedHistXmlData, MhSpecificXmlData, SurgHistXmlData, FamHistXmlData, FhSpecificXmlData,
  ImmunizationXmlData, PeMiscXmlData, IcdXmlData, DiagnosticXmlData, ManagementXmlData,
  MedicineXmlData, DiagnosticExamResultXmlData, CbcXmlData, UrinalysisXmlData, ChestXrayXmlData,
  EcgXmlData, LipidProfileXmlData, FbsXmlData, OgttXmlData, Hba1cXmlData, CreatinineXmlData,
  SputumXmlData, PapsmearXmlData, FecalysisXmlData, FobtXmlData
} from "./types";

/**
 * Validates and converts PcbXmlData into a well-formed PhilHealth XML string.
 * This builder strictly follows KonsultaData_v1.14.dtd.
 */
export function buildPcbXml(data: PcbXmlData): string {
  const root = create({ version: "1.0", encoding: "UTF-8" }).ele("PCB", {
    pUsername: data.pUsername,
    pPassword: data.pPassword,
    pHciAccreNo: data.pHciAccreNo,
    pPMCCNo: data.pPMCCNo,
    pEnlistTotalCnt: data.pEnlistTotalCnt,
    pProfileTotalCnt: data.pProfileTotalCnt,
    pSoapTotalCnt: data.pSoapTotalCnt,
    pCertificationId: data.pCertificationId,
    pHciTransmittalNumber: data.pHciTransmittalNumber,
  });

  if (data.ENLISTMENT && data.ENLISTMENT.length > 0) {
    const enlistments = root.ele("ENLISTMENTS");
    for (const en of data.ENLISTMENT) {
      enlistments.ele("ENLISTMENT", cleanupParams(en));
    }
  }

  if (data.PROFILE && data.PROFILE.length > 0) {
    const profiles = root.ele("PROFILES");
    for (const prof of data.PROFILE) {
      const profNode = profiles.ele("PROFILE", cleanupParams({
        pHciTransNo: prof.pHciTransNo,
        pHciCaseNo: prof.pHciCaseNo,
        pProfDate: prof.pProfDate,
        pPatientPin: prof.pPatientPin,
        pPatientType: prof.pPatientType,
        pPatientAge: prof.pPatientAge,
        pMemPin: prof.pMemPin,
        pEffYear: prof.pEffYear,
        pATC: prof.pATC,
        pIsWalkedIn: prof.pIsWalkedIn,
        pTransDate: prof.pTransDate,
        pReportStatus: prof.pReportStatus,
        pDeficiencyRemarks: prof.pDeficiencyRemarks,
      }));

      addArrayNode(profNode, "MEDHISTS", "MEDHIST", prof.MEDHIST);
      addArrayNode(profNode, "MHSPECIFICS", "MHSPECIFIC", prof.MHSPECIFIC);
      addArrayNode(profNode, "SURGHISTS", "SURGHIST", prof.SURGHIST);
      addArrayNode(profNode, "FAMHISTS", "FAMHIST", prof.FAMHIST);
      addArrayNode(profNode, "FHSPECIFICS", "FHSPECIFIC", prof.FHSPECIFIC);
      
      if (prof.SOCHIST) profNode.ele("SOCHIST", cleanupParams(prof.SOCHIST));
      addArrayNode(profNode, "IMMUNIZATIONS", "IMMUNIZATION", prof.IMMUNIZATION);
      if (prof.MENSHIST) profNode.ele("MENSHIST", cleanupParams(prof.MENSHIST));
      if (prof.PREGHIST) profNode.ele("PREGHIST", cleanupParams(prof.PREGHIST));
      if (prof.BLOODTYPE) profNode.ele("BLOODTYPE", cleanupParams(prof.BLOODTYPE));
      if (prof.PEGENSURVEY) profNode.ele("PEGENSURVEY", cleanupParams(prof.PEGENSURVEY));
      if (prof.PEMISC) {
        profNode.ele("PEMISCS").ele("PEMISC", cleanupParams(prof.PEMISC));
      }
      if (prof.NCDQANS) profNode.ele("NCDQANS", cleanupParams(prof.NCDQANS));
    }
  }

  if (data.SOAP && data.SOAP.length > 0) {
    const soaps = root.ele("SOAPS");
    for (const soap of data.SOAP) {
      const soapNode = soaps.ele("SOAP", cleanupParams({
        pHciCaseNo: soap.pHciCaseNo,
        pHciTransNo: soap.pHciTransNo,
        pSoapDate: soap.pSoapDate,
        pPatientPin: soap.pPatientPin,
        pPatientType: soap.pPatientType,
        pMemPin: soap.pMemPin,
        pEffYear: soap.pEffYear,
        pATC: soap.pATC,
        pIsWalkedIn: soap.pIsWalkedIn,
        pCoPay: soap.pCoPay,
        pTransDate: soap.pTransDate,
        pReportStatus: soap.pReportStatus,
        pDeficiencyRemarks: soap.pDeficiencyRemarks,
      }));

      if (soap.SUBJECTIVE) soapNode.ele("SUBJECTIVE", cleanupParams(soap.SUBJECTIVE));
      if (soap.PEPERT) soapNode.ele("PEPERT", cleanupParams(soap.PEPERT));
      if (soap.PESPECIFIC) soapNode.ele("PESPECIFIC", cleanupParams(soap.PESPECIFIC));
      addArrayNode(soapNode, "ICDS", "ICD", soap.ICD);
      addArrayNode(soapNode, "DIAGNOSTICS", "DIAGNOSTIC", soap.DIAGNOSTIC);
      addArrayNode(soapNode, "MANAGEMENTS", "MANAGEMENT", soap.MANAGEMENT);
      if (soap.ADVICE) soapNode.ele("ADVICE", cleanupParams(soap.ADVICE));
      
      if (soap.MEDICINE && soap.MEDICINE.length > 0) {
        const medsNode = soapNode.ele("MEDICINES");
        for (const med of soap.MEDICINE) {
          medsNode.ele("MEDICINE", cleanupParams(med));
        }
      }

      if (soap.DIAGNOSTICEXAMRESULT) {
        const dxResult = soap.DIAGNOSTICEXAMRESULT;
        const dxNode = soapNode.ele("DIAGNOSTICEXAMRESULTS").ele("DIAGNOSTICEXAMRESULT", cleanupParams({
          pHciCaseNo: dxResult.pHciCaseNo,
          pHciTransNo: dxResult.pHciTransNo,
          pPatientPin: dxResult.pPatientPin,
          pPatientType: dxResult.pPatientType,
          pMemPin: dxResult.pMemPin,
          pEffYear: dxResult.pEffYear,
        }));

        addArrayNode(dxNode, "CBCS", "CBC", dxResult.CBC);
        addArrayNode(dxNode, "URINALYSES", "URINALYSIS", dxResult.URINALYSIS);
        addArrayNode(dxNode, "CHESTXRAYS", "CHESTXRAY", dxResult.CHESTXRAY);
        addArrayNode(dxNode, "ECGS", "ECG", dxResult.ECG);
        addArrayNode(dxNode, "LIPIDPROFILES", "LIPIDPROFILE", dxResult.LIPIDPROFILE);
        addArrayNode(dxNode, "FBSS", "FBS", dxResult.FBS);
        addArrayNode(dxNode, "OGTTS", "OGTT", dxResult.OGTT);
        addArrayNode(dxNode, "HBA1CS", "HBA1C", dxResult.HBA1C);
        addArrayNode(dxNode, "CREATININES", "CREATININE", dxResult.CREATININE);
        addArrayNode(dxNode, "SPUTUMS", "SPUTUM", dxResult.SPUTUM);
        addArrayNode(dxNode, "PAPSMEARS", "PAPSMEAR", dxResult.PAPSMEAR);
        addArrayNode(dxNode, "FECALYSES", "FECALYSIS", dxResult.FECALYSIS);
        addArrayNode(dxNode, "FOBTS", "FOBT", dxResult.FOBT);
      }
    }
  }

  // DTD expects the elements without whitespace inside attributes
  return root.end({ prettyPrint: false });
}

// Helper to remove undefined properties and convert all values to strings for attributes
function cleanupParams(obj: Record<string, any>): Record<string, string> {
  const clean: Record<string, string> = {};
  for (const key of Object.keys(obj)) {
    if (obj[key] !== undefined && obj[key] !== null) {
      clean[key] = String(obj[key]);
    }
  }
  return clean;
}

// Helper to conditionally build array parent -> child nodes
function addArrayNode<T>(parent: any, parentTag: string, childTag: string, list?: T[]) {
  if (list && list.length > 0) {
    const parentEle = parent.ele(parentTag);
    for (const item of list) {
      parentEle.ele(childTag, cleanupParams(item as any));
    }
  }
}
