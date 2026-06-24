import { PcbXmlData } from "./types";

export interface XmlValidationError {
  path: string;
  message: string;
}

/**
 * Validates the raw PcbXmlData before building the XML string.
 * This checks for required fields, field lengths, and logic mandated by PhilHealth.
 */
export function validatePcbXmlData(data: PcbXmlData): XmlValidationError[] {
  const errors: XmlValidationError[] = [];

  if (!data.pHciAccreNo) errors.push({ path: "PCB.pHciAccreNo", message: "Required" });
  if (!data.pCertificationId) errors.push({ path: "PCB.pCertificationId", message: "Required" });
  if (!data.pHciTransmittalNumber) errors.push({ path: "PCB.pHciTransmittalNumber", message: "Required" });

  if (data.ENLISTMENT) {
    data.ENLISTMENT.forEach((en, idx) => {
      const path = `ENLISTMENT[${idx}]`;
      if (!en.pHciCaseNo) errors.push({ path: `${path}.pHciCaseNo`, message: "Required" });
      if (!en.pEffYear) errors.push({ path: `${path}.pEffYear`, message: "Required" });
      if (!en.pPatientSex) errors.push({ path: `${path}.pPatientSex`, message: "Required" });
      if (!en.pPatientDob) errors.push({ path: `${path}.pPatientDob`, message: "Required" });
      if (!en.pPatientType) errors.push({ path: `${path}.pPatientType`, message: "Required" });
    });
  }

  if (data.PROFILE) {
    data.PROFILE.forEach((prof, idx) => {
      const path = `PROFILE[${idx}]`;
      if (!prof.pHciCaseNo) errors.push({ path: `${path}.pHciCaseNo`, message: "Required" });
      if (!prof.pHciTransNo) errors.push({ path: `${path}.pHciTransNo`, message: "Required" });
      if (!prof.pPatientPin) errors.push({ path: `${path}.pPatientPin`, message: "Required" });
    });
  }

  if (data.SOAP) {
    data.SOAP.forEach((soap, idx) => {
      const path = `SOAP[${idx}]`;
      if (!soap.pHciCaseNo) errors.push({ path: `${path}.pHciCaseNo`, message: "Required" });
      if (!soap.pHciTransNo) errors.push({ path: `${path}.pHciTransNo`, message: "Required" });
      
      if (!soap.SUBJECTIVE) {
        errors.push({ path: `${path}.SUBJECTIVE`, message: "Subjective section is required in SOAP" });
      } else {
        if (!soap.SUBJECTIVE.pIllnessHistory) errors.push({ path: `${path}.SUBJECTIVE.pIllnessHistory`, message: "Required" });
        if (!soap.SUBJECTIVE.pSignsSymptoms) errors.push({ path: `${path}.SUBJECTIVE.pSignsSymptoms`, message: "Required" });
      }

      if (!soap.PEPERT) {
        errors.push({ path: `${path}.PEPERT`, message: "Vital signs (PEPERT) are required in SOAP" });
      }
    });
  }

  return errors;
}
