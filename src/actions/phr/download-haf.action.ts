"use server"

import { withErrorHandling } from "@/lib/with-error-handling";
import { getUserAction } from "../users/user.action";
import { generatePdf, PdfCheckboxMapping, PdfRadioMapping, PdfTextMapping } from "./utils/philhealth-pdf";
import { calculateAge, capitalize, centimeterToInch, kilogramsToPounds } from "@/lib/utils";
import { formatDate } from "@/lib/day-utils";
import { summarizeImmunizations } from "@/lib/utils/immunization-mapping";
import { generateCaseNumber } from "@/services/sequence-generator.service";
import prisma from "@lib/prisma";

export const downloadHAFAction = withErrorHandling(async (userId: string) => {
  if (!userId) throw new Error("User ID is required to download HAF");

  const phr = await prisma.user.findFirst({
    where: { userId, isActive: true, deletedAt: null },
    select: {
      firstName: true,
      middleName: true,
      lastName: true,
      suffix: true,
      dob: true,
      gender: true,
      bloodType: true,  // Blood Type shows like this: "A Negative", "O Positive", etc.
      PhilHealthRecords: {
        where: { isActive: true, deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          pin: true,
          PhilHealthMemberType: { select: { name: true } },
        }
      },
      VitalSigns: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          bpSystolic: true,
          bpDiastolic: true,
          temp: true,
          pulseRate: true,
          respRate: true,
          spo2: true,   // oxygen saturation
          height: true,   // in cm
          weight: true,   // in kg
          bmi: true,
        }
      },
      UserAllergies: {
        select: {
          Allergen: {
            select: { name: true }
          }
        }
      },
      MedicalHistories: {
        include: {
          Condition: {
            select: { name: true }
          }
        }
      },
      FamilyMedicalHistories: {
        where: { deletedAt: null },
        include: {
          Condition: {
            select: { name: true }
          }
        }
      },
      PersonalHistory: {
        where: { deletedAt: null }
      },
      SurgicalHistories: {
        where: { deletedAt: null },
        orderBy: { operationDate: "desc" },
        take: 5
      },
      ObGyneHistory: {
        where: { deletedAt: null }
      },
      UserVaccinations: {
        where: { isActive: true, deletedAt: null },
        include: {
          Vaccine: true,
          Dose: true
        }
      },
      PhysicalExaminations: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          id: true,
          visualAcuityLeft: true,
          visualAcuityRight: true,
          status: true,
          caseNumber: true
        }
      }
    }
  });

  if (!phr) throw new Error("User not found");

  // Get or generate case number for this health assessment
  let caseNumber = phr.PhysicalExaminations?.[0]?.caseNumber;

  if (!caseNumber) {
    // Generate new case number (user-level, no clinic)
    caseNumber = await generateCaseNumber("HEALTH_ASSESSMENT");

    // Store it if we have a physical examination record
    if (phr.PhysicalExaminations?.[0]?.id) {
      await prisma.physicalExamination.update({
        where: { id: phr.PhysicalExaminations[0].id },
        data: { caseNumber }
      });
    }
  }

  // Helper to check if condition exists in medical histories
  const hasCondition = (conditionName: string): boolean => {
    return phr.MedicalHistories.some(mh => mh.Condition.name === conditionName);
  };

  // Helper to get condition details
  const getConditionDetails = (conditionName: string): string => {
    const history = phr.MedicalHistories.find(mh => mh.Condition.name === conditionName);
    return history?.details || "";
  };

  // Helper to check if family has condition
  const hasFamilyCondition = (conditionName: string): boolean => {
    return phr.FamilyMedicalHistories.some(fmh => fmh.Condition.name === conditionName);
  };

  // Helper to get family condition details
  const getFamilyConditionDetails = (conditionName: string): string => {
    const history = phr.FamilyMedicalHistories.find(fmh => fmh.Condition.name === conditionName);
    return history?.details || "";
  };

  // Summarize immunization records from UserVaccinations
  const immunizationSummary = summarizeImmunizations(
    phr.UserVaccinations,
    phr.dob || new Date(), // Fallback to current date if dob is null
    phr.ObGyneHistory?.hasPreEclampsia || false // Using pre-eclampsia as pregnancy indicator
  );

  // Get BP values from VitalSigns (most recent)
  const highestBloodPressureSystolic = phr?.VitalSigns?.[0]?.bpSystolic || 0;
  const highestBloodPressureDiastolic = phr?.VitalSigns?.[0]?.bpDiastolic || 0;


  const texts: PdfTextMapping[] = [
    // Header Section
    { field: "dateScreeningAndAssessment", value: formatDate(new Date()) },
    { field: "caseNumber", value: caseNumber || "" },

    // Client Profile Section
    { field: "memberPin", value: phr?.PhilHealthRecords?.[0]?.pin || "" },
    { field: "memberFirstName", value: phr?.firstName ?? "" },
    { field: "memberMiddleName", value: phr?.middleName ?? "" },
    { field: "memberLastName", value: phr?.lastName ?? "" },
    { field: "memberExtensionName", value: phr?.suffix ?? "" },
    { field: "memberAge", value: phr?.dob ? (calculateAge(phr?.dob)?.toString() || "") : "" },
    { field: "memberDateOfBirth", value: formatDate(phr?.dob) },
    { field: "memberSex", value: capitalize(phr?.gender ?? "") },
    { field: "memberType", value: phr?.PhilHealthRecords?.[0]?.PhilHealthMemberType?.name || "" },

    // Past Medical History Section
    { field: "pastMedicalHistorySpecifyAllergy", value: phr.UserAllergies.map(ua => ua.Allergen.name).join(", ") || "" },
    { field: "pastMedicalHistorySpecifyOrgan", value: getConditionDetails("Cancer") },
    { field: "pastMedicalHistorySpecifyHepatitis", value: getConditionDetails("Hepatitis") },
    { field: "pastMedicalHistoryBP_2", value: highestBloodPressureDiastolic > 0 ? highestBloodPressureDiastolic.toString() : "" }, // highest diastolic
    { field: "pastMedicalHistoryBP_1", value: highestBloodPressureSystolic > 0 ? highestBloodPressureSystolic.toString() : "" }, // highest systolic
    { field: "pastMedicalHistorySpecifyPulmonaryTB", value: getConditionDetails("Pulmonary Tuberculosis") },
    { field: "pastMedicalHistorySpecifyExtrapulmonaryTB", value: getConditionDetails("Extrapulmonary Tuberculosis") },
    { field: "pastMedicalHistorySpecifyOthers", value: getConditionDetails("Others") },

    // Past Surgical History Section
    { field: "pastSurgicalOperation_1", value: phr.SurgicalHistories[0]?.operationName || "" },
    { field: "dateSurgery_1", value: phr.SurgicalHistories[0]?.operationDate ? formatDate(phr.SurgicalHistories[0].operationDate) : "" },
    { field: "pastSurgicalOperation_2", value: phr.SurgicalHistories[1]?.operationName || "" },
    { field: "dateSurgery_2", value: phr.SurgicalHistories[1]?.operationDate ? formatDate(phr.SurgicalHistories[1].operationDate) : "" },
    { field: "pastSurgicalOperation_4", value: phr.SurgicalHistories[2]?.operationName || "" },
    { field: "dateSurgery_3", value: phr.SurgicalHistories[2]?.operationDate ? formatDate(phr.SurgicalHistories[2].operationDate) : "" },
    { field: "pastSurgicalOperation_5", value: phr.SurgicalHistories[3]?.operationName || "" },
    { field: "dateSurgery_5", value: phr.SurgicalHistories[3]?.operationDate ? formatDate(phr.SurgicalHistories[3].operationDate) : "" },

    // Connected to Family History Section
    { field: "familyHistorySpecifyAllergy", value: getFamilyConditionDetails("Allergy") },
    { field: "familyHistorySpecifyOrgan", value: getFamilyConditionDetails("Cancer") },
    { field: "familyHistorySpecifyHepatitis", value: getFamilyConditionDetails("Hepatitis") },
    { field: "familyHistoryBP_1", value: "" }, // BP fields removed - no longer storing in family history
    { field: "familyHistoryBP_2", value: "" }, // BP fields removed - no longer storing in family history
    { field: "familyHistorySpecifyPulmononaryTB", value: getFamilyConditionDetails("Pulmonary Tuberculosis") },
    { field: "familyHistorySpecifyExtrapulmonaryTB", value: getFamilyConditionDetails("Extrapulmonary Tuberculosis") },
    { field: "familyHistorySpecifyOthers", value: getFamilyConditionDetails("Others") },

    // Laboratory / Imaging Results Section
    { field: "partnerFacilityFBS", value: "" },
    { field: "dateLabTakenFBS", value: "" },
    { field: "partnerFacilityRBS", value: "" },
    { field: "dateLabTakenRBS", value: "" },

    // Immunization (Optional) Section
    { field: "immunizationOthersSpecify", value: immunizationSummary.others.join(", ") },

    // Personal Smoking History Section
    { field: "numberOfPacksCigPerYear", value: phr.PersonalHistory?.numberOfPacksPerYear?.toString() || "" },

    // Alcohol Consumption Section
    { field: "numberOfBottleADay", value: phr.PersonalHistory?.numberOfBottlesPerDay?.toString() || "" },

    // Glucose FBS, RBS Section
    { field: "glucoseFBS_1", value: "" },
    { field: "glucoseFBS_2", value: "" },
    { field: "glucoseRBS_1", value: "" },
    { field: "glucoseRBS_2", value: "" },

    // OB-Gyne Section
    { field: "obHistoryMenarche", value: phr.ObGyneHistory?.menarche?.toString() || "" },
    { field: "obHistorySexualIntercourse", value: phr.ObGyneHistory?.ageAtFirstSexualIntercourse?.toString() || "" },
    { field: "obHistoryMenopauseAge", value: phr.ObGyneHistory?.menopauseAge?.toString() || "" },
    { field: "obHistoryBirthControl", value: phr.ObGyneHistory?.birthControlMethod || "" },
    { field: "obHistoryLastMenstrualPeriod", value: phr.ObGyneHistory?.lastMenstrualPeriod ? formatDate(phr.ObGyneHistory.lastMenstrualPeriod) : "" },
    { field: "obHistoryPeriodDuration", value: phr.ObGyneHistory?.menstrualPeriodDuration?.toString() || "" },
    { field: "obHistoryIntervalCycle", value: phr.ObGyneHistory?.menstrualCycleInterval?.toString() || "" },
    { field: "obHistoryNumberOfPads", value: phr.ObGyneHistory?.numberOfPadsPerDay?.toString() || "" },
    { field: "obHistoryPregnancyGravidity", value: phr.ObGyneHistory?.gravidity?.toString() || "" },
    { field: "obHistoryPregnancyParity", value: phr.ObGyneHistory?.parity?.toString() || "" },
    { field: "obHistoryPregnancyTypeOfDelivery", value: phr.ObGyneHistory?.typeOfDelivery || "" },
    { field: "obHistoryPregnancyNumberFullTerm", value: phr.ObGyneHistory?.fullTerm?.toString() || "" },
    { field: "obHistoryPregnancyNumberPremature", value: phr.ObGyneHistory?.premature?.toString() || "" },
    { field: "obHistoryPregnancyNumberAbortion", value: phr.ObGyneHistory?.abortion?.toString() || "" },
    { field: "obHistoryPregnancyNumberLivingChildren", value: phr.ObGyneHistory?.livingChildren?.toString() || "" },

    // Pertinent Physical Examination Findings Section
    { field: "patientExaminationBP_1", value: phr?.VitalSigns?.[0]?.bpSystolic?.toString() || "" },
    { field: "patientExaminationBP_2", value: phr?.VitalSigns?.[0]?.bpDiastolic?.toString() || "" },
    { field: "patientExaminationHeartRate", value: phr?.VitalSigns?.[0]?.pulseRate?.toString() || "" },
    { field: "patientExaminationRespiratoryRate", value: phr?.VitalSigns?.[0]?.respRate?.toString() || "" },
    { field: "patientExaminationHeightCm", value: phr?.VitalSigns?.[0]?.height?.toString() || "" },
    { field: "patientExaminationHeightIn", value: centimeterToInch(phr?.VitalSigns?.[0]?.height || 0).toString() },
    { field: "patientExaminationWeightKg", value: phr?.VitalSigns?.[0]?.weight?.toString() || "" },
    { field: "patientExaminationWeightLb", value: phr?.VitalSigns?.[0]?.weight ? kilogramsToPounds(phr.VitalSigns[0].weight).toString() : "" },
    { field: "patientExaminationBMI", value: phr?.VitalSigns?.[0]?.bmi ? phr.VitalSigns[0].bmi.toFixed(2) : "" }, // scale down to 2 decimal places
    { field: "patientExaminationVisual_1", value: phr?.PhysicalExaminations?.[0]?.visualAcuityLeft || "" },
    { field: "patientExaminationVisual_2", value: phr?.PhysicalExaminations?.[0]?.visualAcuityRight || "" },
    { field: "patientExaminationTemperature", value: phr?.VitalSigns?.[0]?.temp?.toString() || "" },

    // Physical Examination - HEENT System
    { field: "heentSystemSpecifyOthers", value: "" },

    // Physical Examination - Chest/Breast/Lungs System
    { field: "cblSystemSpecifyOthers", value: "" },

    // Physical Examination - Heart System
    { field: "heartSystemSpecifyOthers", value: "" },

    // Physical Examination - Genitourinary System
    { field: "genitourinarySystemSpecifyOthers", value: "" },

    // Physical Examination - Digital RE System
    { field: "digitalRESystemSpecifyOthers", value: "" },

    // Physical Examination - Skin System
    { field: "skinSystemSpecifyOthers", value: "" },

    // Physical Examination - Neurological System
    { field: "neurologicalSystemSpecifyOthers", value: "" },

    // NCD Risk Assessment - FBS/RBS
    { field: "fbsRBS_1", value: "" },
    { field: "fbsRBS_2", value: "" },
    { field: "rblTotalCholesterol", value: "" },
    { field: "rblDateTaken", value: "" },
    { field: "presenceKetoneUrine", value: "" },
    { field: "presenceKetoneDateTaken", value: "" },
    { field: "presenceProteinUrine", value: "" },
    { field: "presenceDateTaken", value: "" },
  ];

  const checkboxes: PdfCheckboxMapping[] = [
    // Past Medical History Section
    { field: "pastMedicalHistoryAllergy", condition: phr.UserAllergies.length > 0 },
    { field: "pastMedicalHistoryAsthma", condition: hasCondition("Asthma") },
    { field: "pastMedicalHistoryCancer", condition: hasCondition("Cancer") },
    { field: "pastMedicalHistoryCerebrovascularDisease", condition: hasCondition("Cerebrovascular Disease") },
    { field: "pastMedicalHistoryCoronaryArteryDisease", condition: hasCondition("Coronary Artery Disease") },
    { field: "pastMedicalHistoryDiabetesMellitus", condition: hasCondition("Diabetes Mellitus") },
    { field: "pastMedicalHistoryEmphysema", condition: hasCondition("Emphysema") },
    { field: "pastMedicalHistoryEpilepsy", condition: hasCondition("Epilepsy") },
    { field: "pastMedicalHistoryHepatitis", condition: hasCondition("Hepatitis") },
    { field: "pastMedicalHistoryHyperlipidemia", condition: hasCondition("Hyperlipidemia") },
    { field: "pastMedicalHistoryHypertension", condition: hasCondition("Hypertension") },
    { field: "pastMedicalHistoryPepticUlcer", condition: hasCondition("Peptic Ulcer") },
    { field: "pastMedicalHistoryPneumonia", condition: hasCondition("Pneumonia") },
    { field: "pastMedicalHistoryThyroidDisease", condition: hasCondition("Thyroid Disease") },
    { field: "pastMedicalHistoryPulmonaryTubercolosis", condition: hasCondition("Pulmonary Tuberculosis") },
    { field: "pastMedicalHistoryExtrapulmonaryTubercolosis", condition: hasCondition("Extrapulmonary Tuberculosis") },
    { field: "pastMedicalHistoryUrinaryTractInfection", condition: hasCondition("Urinary Tract Infection") },
    { field: "pastMedicalHistoryMentalIllness", condition: hasCondition("Mental Illness") },
    { field: "pastMedicalHistoryOthers", condition: hasCondition("Others") },
    { field: "pastMedicalHistoryNone", condition: phr.MedicalHistories.length === 0 && phr.UserAllergies.length === 0 },

    // Family History Section
    { field: "familyHistoryAllergy", condition: hasFamilyCondition("Allergy") },
    { field: "familyHistoryAsthma", condition: hasFamilyCondition("Asthma") },
    { field: "familyHistoryCancer", condition: hasFamilyCondition("Cancer") },
    { field: "familyHistoryCerebrovascularDisease", condition: hasFamilyCondition("Cerebrovascular Disease") },
    { field: "familyHistoryCoronaryArteryDisease", condition: hasFamilyCondition("Coronary Artery Disease") },
    { field: "familyHistoryDiabetesMellitus", condition: hasFamilyCondition("Diabetes Mellitus") },
    { field: "familyHistoryEmphysema", condition: hasFamilyCondition("Emphysema") },
    { field: "familyHistoryEpilepsy", condition: hasFamilyCondition("Epilepsy") },
    { field: "familyHistoryHepatitis", condition: hasFamilyCondition("Hepatitis") },
    { field: "familyHistoryHyperlipidemia", condition: hasFamilyCondition("Hyperlipidemia") },
    { field: "familyHistoryHypertension", condition: hasFamilyCondition("Hypertension") },
    { field: "familyHistoryPepticUlcer", condition: hasFamilyCondition("Peptic Ulcer") },
    { field: "familyHistoryPneumonia", condition: hasFamilyCondition("Pneumonia") },
    { field: "familyHistoryThyroidDisease", condition: hasFamilyCondition("Thyroid Disease") },
    { field: "familyHistoryPulmonaryTubercolosis", condition: hasFamilyCondition("Pulmonary Tuberculosis") },
    { field: "familyHistoryExtrapulmonaryTubercolosis", condition: hasFamilyCondition("Extrapulmonary Tuberculosis") },
    { field: "familyHistoryUrinaryTractInfection", condition: hasFamilyCondition("Urinary Tract Infection") },
    { field: "familyHistoryMentalIlness", condition: hasFamilyCondition("Mental Illness") },
    { field: "familyHistoryOthers", condition: hasFamilyCondition("Others") },
    { field: "familyHistoryNone", condition: phr.FamilyMedicalHistories.length === 0 },

    // Immunization - Children
    { field: "immunizationChildrenBCG", condition: immunizationSummary.children.bcg },
    { field: "immunizationChildrenHepatitisB1", condition: immunizationSummary.children.hepatitisB1 },
    { field: "immunizationChildrenHepatitisB2", condition: immunizationSummary.children.hepatitisB2 },
    { field: "immunizationChildrenHepatitisB3", condition: immunizationSummary.children.hepatitisB3 },
    { field: "immunizationChildrenDPT1", condition: immunizationSummary.children.dpt1 },
    { field: "immunizationChildrenDPT2", condition: immunizationSummary.children.dpt2 },
    { field: "immunizationChildrenDPT3", condition: immunizationSummary.children.dpt3 },
    { field: "immunizationChildrenOPV1", condition: immunizationSummary.children.opv1 },
    { field: "immunizationChildrenOPV2", condition: immunizationSummary.children.opv2 },
    { field: "immunizationChildrenOPV3", condition: immunizationSummary.children.opv3 },
    { field: "immunizationChildrenMeasles", condition: immunizationSummary.children.measles },
    { field: "immunizationChildrenHepatitisA", condition: immunizationSummary.children.hepatitisA },
    { field: "immunizationChildrenVaricella", condition: immunizationSummary.children.varicella },
    { field: "immunizationChildrenNone", condition: immunizationSummary.children.none },

    // Immunization - Adult
    { field: "immunizationAdultHPV", condition: immunizationSummary.adult.hpv },
    { field: "immunizationAdultMMR", condition: immunizationSummary.adult.mmr },
    { field: "immunizationAdultNone", condition: immunizationSummary.adult.none },

    // Immunization - Pregnant
    { field: "immunizationPregnantTetanusToxoid", condition: immunizationSummary.pregnant.tetanusToxoid },
    { field: "immunizationPregnantNone", condition: immunizationSummary.pregnant.none },

    // Immunization - Elderly
    { field: "immunizationElderlyFluVaccine", condition: immunizationSummary.elderly.fluVaccine },
    { field: "immunizationElderlyPneumococcalVaccine", condition: immunizationSummary.elderly.pneumococcalVaccine },
    { field: "immunizationElderlyNone", condition: immunizationSummary.elderly.none },

    // OB-Gyne Section
    { field: "obHistoryPregnancyPreEclampsia", condition: !!phr.ObGyneHistory?.hasPreEclampsia },

    // Physical Examination - HEENT System
    { field: "heentSystemEssentiallyNormal", condition: false },
    { field: "heentSystemSunkenEyeballs", condition: false },
    { field: "heentSystemAPR", condition: false },
    { field: "heentSystemSunkenFontanelle", condition: false },
    { field: "heentSystemCervicalLympadenopathy", condition: false },
    { field: "heentSystemDMM", condition: false },
    { field: "heentSystemOthers", condition: false },
    { field: "heentSystemIctericSclerae", condition: false },
    { field: "heentSystemPaleConjunctive", condition: false },

    // Physical Examination - Chest/Breast/Lungs System
    { field: "cblSystemEssentiallyNormal", condition: false },
    { field: "cblSystemRetractions", condition: false },
    { field: "cblSystemACX", condition: false },
    { field: "cblSystemOthers", condition: false },
    { field: "cblSystemDecreasedBreath", condition: false },
    { field: "cblSystemWheezes", condition: false },
    { field: "cblSystemLumps", condition: false },
    { field: "cblSystemCrackles", condition: false },

    // Physical Examination - Heart System
    { field: "heartSystemPericardialBulge", condition: false },
    { field: "heartSystemEssentiallyNormal", condition: false },
    { field: "heartSystemDisplacedApex", condition: false },
    { field: "heartSystemOthers", condition: false },
    { field: "heartSystemHeaves", condition: false },
    { field: "heartSystemIrregularRhythm", condition: false },
    { field: "heartSystemMuffled", condition: false },
    { field: "heartSystemMurmurs", condition: false },

    // Physical Examination - Abdomen
    { field: "abdomenEssentiallyNormal", condition: false },
    { field: "heartSystemUterineContraction", condition: false },
    { field: "heartSystemAbdominalRigidity", condition: false },
    { field: "heartSystemAbdominalTenderness", condition: false },
    { field: "heartSystemHyperactiveBowel", condition: false },
    { field: "heartSystemPalpableMass", condition: false },
    { field: "heartSystemTympanitic", condition: false },

    // Physical Examination - Genitourinary System
    { field: "genitourinarySystemEssentiallyNormal", condition: false },
    { field: "genitourinarySystemOthers", condition: false },
    { field: "genitourinarySystemBloodStained", condition: false },
    { field: "genitourinarySystemCervicalDilation", condition: false },
    { field: "genitourinarySystemPresenceOfAD", condition: false },

    // Physical Examination - Digital RE System
    { field: "digitalRESystemEssentiallyNormal", condition: false },
    { field: "digitalRESystemNotApplicable", condition: false },
    { field: "digitalRESystemEnlargeProstate", condition: false },
    { field: "digitalRESystemOthers", condition: false },
    { field: "digitalRESystemMass", condition: false },
    { field: "digitalRESystemHemorrhoids", condition: false },
    { field: "digitalRESystemPus", condition: false },

    // Physical Examination - Skin System
    { field: "skinSystemPoorSkinTurgor", condition: false },
    { field: "skinSystemEssentiallyNormal", condition: false },
    { field: "skinSystemRashes", condition: false },
    { field: "skinSystemClubbing", condition: false },
    { field: "skinSystemWeakPulses", condition: false },
    { field: "skinSystemColdClammy", condition: false },
    { field: "skinSystemOthers", condition: false },
    { field: "skinSystemCyanosis", condition: false },
    { field: "skinSystemEdema", condition: false },
    { field: "skinSystemDecreased", condition: false },
    { field: "skinSystemPaleNailbeds", condition: false },

    // Physical Examination - Neurological System
    { field: "neurologicalSystemPoorMuscle", condition: false },
    { field: "neurologicalSystemEssentiallyNormal", condition: false },
    { field: "neurologicalSystemAbnormalGait", condition: false },
    { field: "neurologicalSystemPoorCoordination", condition: false },
    { field: "neurologicalSystemAbnormalPS", condition: false },
    { field: "neurologicalSystemOthers", condition: false },
    { field: "neurologicalSystemAbnormalSensation", condition: false },
    { field: "neurologicalSystemAbnormalReflex", condition: false },
    { field: "neurologicalSystemPoorMemory", condition: false },
  ];

  // Radio buttons: Only select ONE option per radio group, not all possibilities
  // Each radio group can only have ONE selected value
  const radios: PdfRadioMapping[] = [];

  // Personal History - Smoking Status
  if (phr.PersonalHistory?.smokingStatus) {
    const smokingStatus = phr.PersonalHistory.smokingStatus;
    if (smokingStatus === "Yes") {
      radios.push({ field: "personalHistorySmoking", option: "Yes" });
    } else if (smokingStatus === "No") {
      radios.push({ field: "personalHistorySmoking", option: "No" });
    } else if (smokingStatus === "Quit") {
      radios.push({ field: "personalHistorySmoking", option: "Quit" });
    }
  }

  // Personal History - Alcohol Status
  if (phr.PersonalHistory?.alcoholStatus) {
    const alcoholStatus = phr.PersonalHistory.alcoholStatus;
    if (alcoholStatus === "Yes") {
      radios.push({ field: "personalHistoryAlcohol", option: "Yes" });
    } else if (alcoholStatus === "No") {
      radios.push({ field: "personalHistoryAlcohol", option: "No" });
    } else if (alcoholStatus === "Quit") {
      radios.push({ field: "personalHistoryAlcohol", option: "Quit" });
    }
  }

  // Personal History - Illicit Drug Use
  if (phr.PersonalHistory?.illicitDrugUse) {
    const drugUse = phr.PersonalHistory.illicitDrugUse;
    if (drugUse === "Yes") {
      radios.push({ field: "personalHistoryIllicitDrugs", option: "Yes" });
    } else if (drugUse === "No") {
      radios.push({ field: "personalHistoryIllicitDrugs", option: "No" });
    }
  }

  // Personal History - Sexually Active
  if (phr.PersonalHistory?.sexuallyActive) {
    const sexuallyActive = phr.PersonalHistory.sexuallyActive;
    if (sexuallyActive === "Yes") {
      radios.push({ field: "personalHistorySexualHistory", option: "Yes" });
    } else if (sexuallyActive === "No") {
      radios.push({ field: "personalHistorySexualHistory", option: "No" });
    }
  }

  // OB-Gyne - Menopause Status
  // NOTE: The PDF only has obHistoryMenopauseNo field, no "Yes" option exists
  if (phr.ObGyneHistory?.menopauseStatus) {
    const menopauseStatus = phr.ObGyneHistory.menopauseStatus;
    if (menopauseStatus === "No") {
      radios.push({ field: "obHistoryMenopause", option: "No" });
    }
    // "Yes" option doesn't exist in the PDF form - only "No" is available
  }

  const pdf = await generatePdf(
    'PhilHealth_HealthAssessment_Form.pdf',
    texts,
    checkboxes,
    `HAF_${phr?.firstName || 'Member'}_${phr?.lastName || ''}`,
    undefined, // options
    radios
  )

  return { message: 'Health Assessment Form populated successfully.', data: pdf }
});