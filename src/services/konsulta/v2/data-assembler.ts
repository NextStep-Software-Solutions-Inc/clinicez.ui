import { PcbXmlData, EnlistmentXmlData, ProfileXmlData, SoapXmlData, Gender, PatientType, ReportStatus, YnFlag, MedHistXmlData, SurgHistXmlData, FamHistXmlData, ImmunizationXmlData, IcdXmlData, DiagnosticXmlData, ManagementXmlData, MedicineXmlData, CbcXmlData, UrinalysisXmlData, ChestXrayXmlData, EcgXmlData, LipidProfileXmlData, FbsXmlData, OgttXmlData, Hba1cXmlData, CreatinineXmlData, SputumXmlData, PapsmearXmlData, FecalysisXmlData, FobtXmlData } from "./types";
import { format } from "date-fns";

export const KONSULTA_TICKET_INCLUDE = {
  ClinicPatient: {
    include: {
      Patient: {
        include: {
          PhilHealthRecords: true
        }
      }
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
  Appointment: true,
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
    const kData = ticket.ConsultationKonsultaData || {};
    
    const isEnlistment = reportTagging === "1";
    const patient = ticket.ClinicPatient?.Patient;
    if (!patient) continue;

    const dob = patient.dob ? format(new Date(patient.dob), 'yyyy-MM-dd') : "";
    const sex: Gender = patient.gender === "MALE" ? "M" : "F";
    const patientType: PatientType = kData.patientType === "DEPENDENT" ? "DD" : "MM";
    
    const phRecord = patient.PhilHealthRecords?.[0];
    const pin = phRecord?.pin || "000000000000";

    const targetEffYear = kData.effYear || String(new Date().getFullYear());
    const activeReg = ticket.ClinicPatient?.YakapRegistrations?.find(
      (r: any) => r.effYear === targetEffYear && r.registrationStatus === "REGISTERED"
    ) || ticket.ClinicPatient?.YakapRegistrations?.[0];

    const enlistment: EnlistmentXmlData = {
      pHciCaseNo: activeReg?.hciCaseNo || "",
      pHciTransNo: activeReg?.hciEnlistmentTransNo || "",
      pEffYear: kData.effYear || String(new Date().getFullYear()),
      pEnlistStat: kData.enlistStat || "1",
      pEnlistDate: kData.enlistDate ? format(new Date(kData.enlistDate), 'yyyy-MM-dd') : format(new Date(ticket.createdAt), 'yyyy-MM-dd'),
      pPackageType: kData.packageType || "K",
      pMemPin: kData.memPin || pin,
      pMemFname: kData.memFname || patient.firstName,
      pMemMname: kData.memMname || patient.middleName || "",
      pMemLname: kData.memLname || patient.lastName,
      pMemExtname: kData.memExtname || patient.suffix || "",
      pMemDob: kData.memDob ? format(new Date(kData.memDob), 'yyyy-MM-dd') : dob,
      pPatientPin: pin,
      pPatientFname: patient.firstName,
      pPatientMname: patient.middleName || "",
      pPatientLname: patient.lastName,
      pPatientExtname: patient.suffix || "",
      pPatientSex: sex,
      pPatientDob: dob,
      pPatientType: patientType,
      pPatientMobileNo: patient.mobile || "09000000000",
      pPatientLandlineNo: "",
      pWithConsent: "Y",
      pTransDate: format(new Date(ticket.createdAt), 'yyyy-MM-dd'),
      pCreatedBy: ctx.pHciAccreNo, // or user
      pReportStatus: "U",
      pDeficiencyRemarks: ""
    };
    pcb.ENLISTMENT!.push(enlistment);
    pcb.pEnlistTotalCnt++;

    const profile = buildProfileXml(ticket, kData, patient, patientType, ctx);
    if (profile) {
      pcb.PROFILE!.push(profile);
      pcb.pProfileTotalCnt++;
    }

    if (!isEnlistment) {
      // Encounter (Tagging 2) also includes SOAP
      const soap = buildSoapXml(ticket, kData, patient, patientType, ctx, pcb);
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

  const targetEffYear = kData.effYear || String(new Date().getFullYear());
  const activeReg = ticket.ClinicPatient?.YakapRegistrations?.find(
    (r: any) => r.effYear === targetEffYear && r.registrationStatus === "REGISTERED"
  ) || ticket.ClinicPatient?.YakapRegistrations?.[0];

  const prof: ProfileXmlData = {
    pHciCaseNo: activeReg?.hciCaseNo || "",
    pHciTransNo: activeReg?.hciProfilingTransNo || "",
    pProfDate: format(new Date(ticket.createdAt), 'yyyy-MM-dd'),
    pPatientPin: patient.philhealthNo || "000000000000",
    pPatientType: patientType,
    pPatientAge: age,
    pMemPin: kData.memPin || patient.philhealthNo || "000000000000",
    pEffYear: kData.effYear || String(new Date().getFullYear()),
    pATC: kData.atc || "",
    pIsWalkedIn: ticket.konsultaIsWalkedIn ? "Y" : "N",
    pTransDate: format(new Date(ticket.createdAt), 'yyyy-MM-dd'),
    pReportStatus: "U",
    pDeficiencyRemarks: ""
  };

  prof.MEDHIST = [{ pMdiseaseCode: "999", pReportStatus: "U", pDeficiencyRemarks: "" }];
  prof.MHSPECIFIC = [{ pMdiseaseCode: "999", pSpecificDesc: "NONE", pReportStatus: "U", pDeficiencyRemarks: "" }];
  prof.SURGHIST = [{ pSurgDesc: "NONE", pSurgDate: "", pReportStatus: "U", pDeficiencyRemarks: "" }];
  prof.FAMHIST = [{ pMdiseaseCode: "999", pReportStatus: "U", pDeficiencyRemarks: "" }];
  prof.FHSPECIFIC = [{ pMdiseaseCode: "999", pSpecificDesc: "NONE", pReportStatus: "U", pDeficiencyRemarks: "" }];
  prof.SOCHIST = { pIsSmoker: "N", pNoCigpk: "0", pIsAdrinker: "N", pNoBottles: "0", pIllDrugUser: "N", pIsSexuallyActive: "N", pReportStatus: "U", pDeficiencyRemarks: "" };
  prof.IMMUNIZATION = [{ pChildImmcode: "999", pYoungwImmcode: "999", pPregwImmcode: "999", pElderlyImmcode: "999", pOtherImm: "NONE", pReportStatus: "U", pDeficiencyRemarks: "" }];
  prof.MENSHIST = { pMenarchePeriod: "0", pLastMensPeriod: "", pPeriodDuration: "0", pMensInterval: "0", pPadsPerDay: "0", pOnsetSexIc: "0", pBirthCtrlMethod: "none", pIsMenopause: "N", pMenopauseAge: "0", pIsApplicable: patient.gender === "FEMALE" ? "Y" : "N", pReportStatus: "U", pDeficiencyRemarks: "" };
  prof.PREGHIST = { pPregCnt: "0", pDeliveryCnt: "0", pDeliveryTyp: "N", pFullTermCnt: "0", pPrematureCnt: "0", pAbortionCnt: "0", pLivChildrenCnt: "0", pWPregIndhyp: "N", pWFamPlan: "N", pIsApplicable: patient.gender === "FEMALE" ? "Y" : "N", pReportStatus: "U", pDeficiencyRemarks: "" };
  prof.PEPERT = { pSystolic: 0, pDiastolic: 0, pHr: 0, pRr: 0, pTemp: 0, pHeight: 0, pWeight: 0, pBMI: 0, pZScore: "", pLeftVision: "", pRightVision: "", pLength: "", pHeadCirc: "", pSkinfoldThickness: "", pWaist: "", pHip: "", pLimbs: "", pMidUpperArmCirc: "", pReportStatus: "U", pDeficiencyRemarks: "" };
  prof.BLOODTYPE = { pBloodType: "OTH", pReportStatus: "U", pDeficiencyRemarks: "" };
  prof.PEGENSURVEY = { pGenSurveyId: "1", pGenSurveyRem: "NONE", pReportStatus: "U", pDeficiencyRemarks: "" };
  prof.PEMISC = { pSkinId: "99", pHeentId: "", pChestId: "", pHeartId: "", pAbdomenId: "", pNeuroId: "", pRectalId: "", pGuId: "", pReportStatus: "U", pDeficiencyRemarks: "" };
  prof.PESPECIFIC = { pSkinRem: "NONE", pHeentRem: "NONE", pChestRem: "NONE", pHeartRem: "NONE", pAbdomenRem: "NONE", pNeuroRem: "NONE", pRectalRem: "NONE", pGuRem: "NONE", pReportStatus: "U", pDeficiencyRemarks: "" };

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
      pReportStatus: "U",
      pDeficiencyRemarks: ""
    };
  } else {
    // Generate dummy NCD so the tag is complete
    prof.NCDQANS = {
      pQid1_Yn: "N", pQid2_Yn: "N", pQid3_Yn: "N", pQid4_Yn: "N", pQid5_Ynx: "X",
      pQid6_Yn: "N", pQid7_Yn: "N", pQid8_Yn: "N", pQid9_Yn: "N", pQid10_Yn: "N",
      pQid11_Yn: "N", pQid12_Yn: "N", pQid13_Yn: "N", pQid14_Yn: "N", pQid15_Yn: "N",
      pQid16_Yn: "N", pQid17_Abcde: "A", pQid18_Yn: "N", pQid19_Yn: "N", pQid19_Fbsmg: "",
      pQid19_Fbsmmol: "", pQid19_Fbsdate: "", pQid20_Yn: "N", pQid20_Choleval: "",
      pQid20_Choledate: "", pQid21_Yn: "N", pQid21_Ketonval: "", pQid21_Ketondate: "",
      pQid22_Yn: "N", pQid22_Proteinval: "", pQid22_Proteindate: "", pQid23_Yn: "N", pQid24_Yn: "N",
      pReportStatus: "U", pDeficiencyRemarks: ""
    };
  }

  return prof;
}

function buildSoapXml(ticket: any, kData: any, patient: any, patientType: PatientType, ctx: DataAssemblerContext, pcb: PcbXmlData): SoapXmlData | null {
  const phRecord = patient.PhilHealthRecords?.[0];
  const pin = phRecord?.pin || "000000000000";

  const targetEffYear = kData.effYear || String(new Date().getFullYear());
  const activeReg = ticket.ClinicPatient?.YakapRegistrations?.find(
    (r: any) => r.effYear === targetEffYear && r.registrationStatus === "REGISTERED"
  ) || ticket.ClinicPatient?.YakapRegistrations?.[0];

  const soap: SoapXmlData = {
    pHciCaseNo: activeReg?.hciCaseNo || "",
    pHciTransNo: ticket.soapTransNo || "",
    pSoapDate: format(new Date(ticket.createdAt), 'yyyy-MM-dd'),
    pPatientPin: pin,
    pPatientType: patientType,
    pMemPin: kData.memPin || pin,
    pEffYear: kData.effYear || String(new Date().getFullYear()),
    pATC: kData.atc || "",
    pIsWalkedIn: ticket.konsultaIsWalkedIn ? "Y" : "N",
    pCoPay: Number(ticket.konsultaCoPay) || 0,
    pTransDate: format(new Date(ticket.createdAt), 'yyyy-MM-dd'),
    pReportStatus: "U",
    pDeficiencyRemarks: ""
  };

  // Clean up signs symptoms: PhilHealth rejects "X" and "38". 
  // Fall back to "1" (Altered mental sensorium) or another valid code if invalid.
  let cleanSymptoms = kData.signsSymptoms || "1";
  if (cleanSymptoms === "X" || cleanSymptoms.includes("38") || cleanSymptoms === "None") {
    cleanSymptoms = "1";
  }

  // SUBJECTIVE
  soap.SUBJECTIVE = {
    pIllnessHistory: kData.illnessHistory || "NONE",
    pSignsSymptoms: cleanSymptoms,
    pOtherComplaint: kData.otherComplaint || "",
    pPainSite: kData.painSite || "",
    pReportStatus: "U",
    pDeficiencyRemarks: ""
  };

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
    pReportStatus: "U",
    pDeficiencyRemarks: ""
  };

  // PEMISCS
  soap.PEMISC = [
    {
      pSkinId: "99", pHeentId: "", pChestId: "", pHeartId: "", pAbdomenId: "",
      pNeuroId: "", pRectalId: "", pGuId: "", pReportStatus: "U", pDeficiencyRemarks: ""
    }
  ];

  // PESPECIFIC
  soap.PESPECIFIC = {
    pSkinRem: "NONE",
    pHeentRem: "NONE",
    pChestRem: "NONE",
    pHeartRem: "NONE",
    pAbdomenRem: "NONE",
    pNeuroRem: "NONE",
    pRectalRem: "NONE",
    pGuRem: "NONE",
    pReportStatus: "U",
    pDeficiencyRemarks: ""
  };

  // ICDS
  soap.ICD = [{ pIcdCode: "Z00.0", pReportStatus: "U", pDeficiencyRemarks: "" }]; // Default generic examination

  // DIAGNOSTICS
  soap.DIAGNOSTIC = ticket.KonsultaDiagnosticResults && ticket.KonsultaDiagnosticResults.length > 0 
    ? ticket.KonsultaDiagnosticResults.map((dr: any) => ({
      pDiagnosticId: dr.Category?.code || "",
      pOthRemarks: dr.results?.othRemarks || "",
      pPatientRemarks: dr.results?.patientRemarks || "",
      pReportStatus: "U",
      pDeficiencyRemarks: ""
    }))
    : [{ pDiagnosticId: "99", pOthRemarks: "NONE", pIsPhysicianRecommendation: "N", pPatientRemarks: "XX", pReportStatus: "U", pDeficiencyRemarks: "" }];

  // MANAGEMENTS
  soap.MANAGEMENT = [
    { pManagementId: "99", pOthRemarks: "NONE", pReportStatus: "U", pDeficiencyRemarks: "" }
  ];

  // ADVICE
  soap.ADVICE = { pRemarks: "NONE", pReportStatus: "U", pDeficiencyRemarks: "" };

  // MEDICINES
  if (ticket.Prescriptions && ticket.Prescriptions.length > 0) {
    if (!pcb.MEDICINE) pcb.MEDICINE = [];
    for (const rx of ticket.Prescriptions) {
      for (const m of rx.Medicines) {
        const targetEffYear = kData.effYear || String(new Date().getFullYear());
        const activeReg = ticket.ClinicPatient?.YakapRegistrations?.find(
          (r: any) => r.effYear === targetEffYear && r.registrationStatus === "REGISTERED"
        ) || ticket.ClinicPatient?.YakapRegistrations?.[0];

        pcb.MEDICINE.push({
          pHciCaseNo: activeReg?.hciCaseNo || "",
          pHciTransNo: ticket.soapTransNo || "",
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
          pReportStatus: "U",
          pDeficiencyRemarks: ""
        });
      }
    }
  }

  return soap;
}
