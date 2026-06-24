import { PcbXmlData, EnlistmentXmlData, ProfileXmlData, SoapXmlData, Gender, PatientType, ReportStatus, YnFlag, MedHistXmlData, SurgHistXmlData, FamHistXmlData, ImmunizationXmlData, IcdXmlData, DiagnosticXmlData, ManagementXmlData, MedicineXmlData, CbcXmlData, UrinalysisXmlData, ChestXrayXmlData, EcgXmlData, LipidProfileXmlData, FbsXmlData, OgttXmlData, Hba1cXmlData, CreatinineXmlData, SputumXmlData, PapsmearXmlData, FecalysisXmlData, FobtXmlData } from "./types";
import { format } from "date-fns";

export const KONSULTA_TICKET_INCLUDE = {
  ClinicPatient: {
    include: {
      Patient: true
    }
  },
  Clinic: true,
  ConsultationKonsultaData: true,
  KonsultaDiagnosticResults: {
    include: {
      Category: true
    }
  },
  KonsultaNcdQuestionnaires: true,
  ConsultationDiagnoses: true,
  Medications: true,
  Prescriptions: {
    include: {
      Medicines: true
    }
  },
  Appointment: true, // If we need scheduling info
  ConsultationNotes: true
};

export interface DataAssemblerContext {
  pUsername: string;
  pPassword: string;
  pHciAccreNo: string;
  pPMCCNo: string;
  pCertificationId: string;
  pHciTransmittalNumber: string;
}

export function assemblePcbData(
  tickets: any[], 
  ctx: DataAssemblerContext, 
  reportTagging: "1" | "2"
): PcbXmlData {
  
  const pcb: PcbXmlData = {
    pUsername: ctx.pUsername,
    pPassword: ctx.pPassword,
    pHciAccreNo: ctx.pHciAccreNo,
    pPMCCNo: ctx.pPMCCNo,
    pCertificationId: ctx.pCertificationId,
    pHciTransmittalNumber: ctx.pHciTransmittalNumber,
    pEnlistTotalCnt: 0,
    pProfileTotalCnt: 0,
    pSoapTotalCnt: 0,
    ENLISTMENT: [],
    PROFILE: [],
    SOAP: []
  };

  for (const ticket of tickets) {
    const kData = ticket.ConsultationKonsultaData;
    if (!kData) continue; // Skip if no Konsulta metadata
    
    const isEnlistment = reportTagging === "1";
    const patient = ticket.ClinicPatient?.User;
    if (!patient) continue;

    const dob = patient.dob ? format(new Date(patient.dob), 'yyyy-MM-dd') : "";
    const sex: Gender = patient.gender === "MALE" ? "M" : "F";
    const patientType: PatientType = kData.patientType === "DEPENDENT" ? "DD" : "MM";
    
    if (isEnlistment) {
      const enlistment: EnlistmentXmlData = {
        pHciCaseNo: ticket.konsultaHciCaseNo || ticket.caseNumber,
        pHciTransNo: ticket.konsultaHciTransNo || "",
        pEffYear: kData.effYear || String(new Date().getFullYear()),
        pEnlistStat: kData.enlistStat || "1",
        pEnlistDate: kData.enlistDate ? format(new Date(kData.enlistDate), 'yyyy-MM-dd') : "",
        pPackageType: kData.packageType || "K",
        pMemPin: kData.memPin || patient.philhealthNo || "",
        pMemFname: kData.memFname || patient.firstName,
        pMemMname: kData.memMname || patient.middleName || undefined,
        pMemLname: kData.memLname || patient.lastName,
        pMemExtname: kData.memExtname || patient.suffix || undefined,
        pMemDob: kData.memDob ? format(new Date(kData.memDob), 'yyyy-MM-dd') : dob,
        pPatientPin: patient.philhealthNo || "",
        pPatientFname: patient.firstName,
        pPatientMname: patient.middleName || undefined,
        pPatientLname: patient.lastName,
        pPatientExtname: patient.suffix || undefined,
        pPatientSex: sex,
        pPatientDob: dob,
        pPatientType: patientType,
        pPatientMobileNo: patient.mobileNo || "",
        pWithConsent: "Y",
        pTransDate: format(new Date(ticket.createdAt), 'yyyy-MM-dd'),
        pCreatedBy: ctx.pHciAccreNo, // or user
        pReportStatus: "U"
      };
      pcb.ENLISTMENT!.push(enlistment);
      pcb.pEnlistTotalCnt++;

      // In Enlistment (1), Profile is also usually generated
      const profile = buildProfileXml(ticket, kData, patient, patientType, ctx);
      if (profile) {
        pcb.PROFILE!.push(profile);
        pcb.pProfileTotalCnt++;
      }
    } else {
      // Encounter (2)
      const soap = buildSoapXml(ticket, kData, patient, patientType, ctx);
      if (soap) {
        pcb.SOAP!.push(soap);
        pcb.pSoapTotalCnt++;
      }
    }
  }

  return pcb;
}

function calculateAge(dobStr: string): number {
  if (!dobStr) return 0;
  const dob = new Date(dobStr);
  const diffMs = Date.now() - dob.getTime();
  const ageDate = new Date(diffMs);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
}

function buildProfileXml(ticket: any, kData: any, patient: any, patientType: PatientType, ctx: DataAssemblerContext): ProfileXmlData | null {
  const ncd = ticket.KonsultaNcdQuestionnaires?.[0];
  const age = patient.dob ? calculateAge(patient.dob) : 0;

  const prof: ProfileXmlData = {
    pHciCaseNo: ticket.konsultaHciCaseNo || ticket.caseNumber,
    pHciTransNo: ticket.konsultaHciTransNo || "",
    pProfDate: format(new Date(ticket.createdAt), 'yyyy-MM-dd'),
    pPatientPin: patient.philhealthNo || "",
    pPatientType: patientType,
    pPatientAge: age,
    pMemPin: kData.memPin || patient.philhealthNo || "",
    pEffYear: kData.effYear || String(new Date().getFullYear()),
    pATC: kData.atc || "",
    pIsWalkedIn: ticket.konsultaIsWalkedIn ? "Y" : "N",
    pTransDate: format(new Date(ticket.createdAt), 'yyyy-MM-dd'),
    pReportStatus: "U"
  };

  if (ncd) {
    prof.NCDQANS = {
      pQid1_Yn: ncd.q1_Yn as YnFlag || "N",
      pQid2_Yn: ncd.q2_Yn as YnFlag || "N",
      pQid3_Yn: ncd.q3_Yn as YnFlag || "N",
      pQid4_Yn: ncd.q4_Yn as YnFlag || "N",
      pQid5_Ynx: ncd.q5_Ynx as YnFlag || "X",
      pQid6_Yn: ncd.q6_Yn as YnFlag || "N",
      pQid7_Yn: ncd.q7_Yn as YnFlag || "N",
      pQid8_Yn: ncd.q8_Yn as YnFlag || "N",
      pQid9_Yn: ncd.q9_Yn as YnFlag || "N",
      pQid10_Yn: ncd.q10_Yn as YnFlag || "N",
      pQid11_Yn: ncd.q11_Yn as YnFlag || "N",
      pQid12_Yn: ncd.q12_Yn as YnFlag || "N",
      pQid13_Yn: ncd.q13_Yn as YnFlag || "N",
      pQid14_Yn: ncd.q14_Yn as YnFlag || "N",
      pQid15_Yn: ncd.q15_Yn as YnFlag || "N",
      pQid16_Yn: ncd.q16_Yn as YnFlag || "N",
      pQid17_Abcde: ncd.q17_Abcde || "A",
      pQid18_Yn: ncd.q18_Yn as YnFlag || "N",
      pQid19_Yn: ncd.q19_Yn as YnFlag || "N",
      pQid19_Fbsmg: ncd.q19_Fbsmg?.toString() || "",
      pQid19_Fbsmmol: ncd.q19_Fbsmmol?.toString() || "",
      pQid19_Fbsdate: ncd.q19_Fbsdate ? format(new Date(ncd.q19_Fbsdate), 'yyyy-MM-dd') : "",
      pQid20_Yn: ncd.q20_Yn as YnFlag || "N",
      pQid20_Choleval: ncd.q20_Choleval?.toString() || "",
      pQid20_Choledate: ncd.q20_Choledate ? format(new Date(ncd.q20_Choledate), 'yyyy-MM-dd') : "",
      pQid21_Yn: ncd.q21_Yn as YnFlag || "N",
      pQid21_Ketonval: ncd.q21_Ketonval?.toString() || "",
      pQid21_Ketondate: ncd.q21_Ketondate ? format(new Date(ncd.q21_Ketondate), 'yyyy-MM-dd') : "",
      pQid22_Yn: ncd.q22_Yn as YnFlag || "N",
      pQid22_Proteinval: ncd.q22_Proteinval?.toString() || "",
      pQid22_Proteindate: ncd.q22_Proteindate ? format(new Date(ncd.q22_Proteindate), 'yyyy-MM-dd') : "",
      pQid23_Yn: ncd.q23_Yn as YnFlag || "N",
      pQid24_Yn: ncd.q24_Yn as YnFlag || "N",
      pReportStatus: "U"
    };
  }

  // TODO: Map MedHist, SurgHist, FamHist, Immunization, MensHist, PregHist, BloodType, PeGenSurvey, PeMisc
  // These will be mapped from ConsultationKonsultaData JSON fields or related tables.

  return prof;
}

function buildSoapXml(ticket: any, kData: any, patient: any, patientType: PatientType, ctx: DataAssemblerContext): SoapXmlData | null {
  const soap: SoapXmlData = {
    pHciCaseNo: ticket.konsultaHciCaseNo || ticket.caseNumber,
    pHciTransNo: ticket.konsultaHciTransNo || "",
    pSoapDate: format(new Date(ticket.createdAt), 'yyyy-MM-dd'),
    pPatientPin: patient.philhealthNo || "",
    pPatientType: patientType,
    pMemPin: kData.memPin || patient.philhealthNo || "",
    pEffYear: kData.effYear || String(new Date().getFullYear()),
    pATC: kData.atc || "",
    pIsWalkedIn: ticket.konsultaIsWalkedIn ? "Y" : "N",
    pCoPay: Number(ticket.konsultaCoPay) || 0,
    pTransDate: format(new Date(ticket.createdAt), 'yyyy-MM-dd'),
    pReportStatus: "U"
  };

  // SUBJECTIVE
  if (kData.illnessHistory || kData.signsSymptoms || kData.otherComplaint || kData.painSite) {
    soap.SUBJECTIVE = {
      pIllnessHistory: kData.illnessHistory || "NONE",
      pSignsSymptoms: kData.signsSymptoms || "NONE",
      pOtherComplaint: kData.otherComplaint || "NONE",
      pPainSite: kData.painSite || "NONE",
      pReportStatus: "U"
    };
  }

  // PEPERT (Vitals)
  soap.PEPERT = {
    pSystolic: kData.systolic || 0,
    pDiastolic: kData.diastolic || 0,
    pHr: kData.hr || 0,
    pRr: kData.rr || 0,
    pTemp: kData.temp || 0,
    pHeight: kData.height || 0,
    pWeight: kData.weight || 0,
    pBMI: kData.bmi || 0,
    pZScore: kData.zScore || "",
    pLeftVision: kData.leftVision || "",
    pRightVision: kData.rightVision || "",
    pLength: kData.length || "",
    pHeadCirc: kData.headCirc || "",
    pSkinfoldThickness: kData.skinfoldThickness || "",
    pWaist: kData.waist || "",
    pHip: kData.hip || "",
    pLimbs: kData.limbs || "",
    pMidUpperArmCirc: kData.midUpperArmCirc || "",
    pReportStatus: "U"
  };

  // DIAGNOSTICS
  if (ticket.KonsultaDiagnosticResults && ticket.KonsultaDiagnosticResults.length > 0) {
    soap.DIAGNOSTIC = ticket.KonsultaDiagnosticResults.map((dr: any) => ({
      pDiagnosticId: dr.Category?.code || "",
      pOthRemarks: dr.results?.othRemarks || "",
      pPatientRemarks: dr.results?.patientRemarks || "",
      pReportStatus: "U"
    }));
  }

  // MEDICINES
  if (ticket.Prescriptions && ticket.Prescriptions.length > 0) {
    soap.MEDICINE = [];
    for (const rx of ticket.Prescriptions) {
      for (const m of rx.Medicines) {
        soap.MEDICINE.push({
          pHciCaseNo: ticket.konsultaHciCaseNo || ticket.caseNumber,
          pHciTransNo: ticket.konsultaHciTransNo || "",
          pCategory: m.yakapCategory || "",
          pDrugCode: m.yakapCode || "",
          pGenericCode: m.yakapCode || "",
          pSaltCode: "0", // Defaulting to 0 if not tracked
          pStrengthCode: "0",
          pFormCode: "0",
          pUnitCode: "0",
          pPackageCode: "0",
          pOtherMedicine: m.name || "",
          pRoute: m.yakapRoute || "",
          pQuantity: m.qty || 1,
          pActualUnitPrice: 0,
          pTotalAmtPrice: 0,
          pInstructionQuantity: m.qty?.toString() || "1",
          pInstructionStrength: m.dosage || "",
          pInstructionFrequency: m.frequency || "",
          pPrescribingPhysician: "",
          pIsDispensed: "N",
          pDateDispensed: "",
          pDispensingPersonnel: "",
          pIsApplicable: "Y",
          pDateAdded: format(new Date(m.createdAt), 'yyyy-MM-dd'),
          pReportStatus: "U"
        });
      }
    }
  }

  // TODO: ICDS, MANAGEMENT, ADVICE, DIAGNOSTICEXAMRESULT

  return soap;
}
