import type { PatientImmunization } from "@prisma/client";

export type VaccinationWithRelations = {
  id: number;
  vaccineName: string;
  doseNumber: string;
  route?: string | null;
  category?: string | null;
  code?: string | null;
  Vaccine?: { name: string };
  Dose?: { dose: string };
};

export interface ImmunizationSummary {
  children: {
    bcg: boolean;
    hepatitisB1: boolean;
    hepatitisB2: boolean;
    hepatitisB3: boolean;
    dpt1: boolean;
    dpt2: boolean;
    dpt3: boolean;
    opv1: boolean;
    opv2: boolean;
    opv3: boolean;
    measles: boolean;
    hepatitisA: boolean;
    varicella: boolean;
    none: boolean;
  };
  adult: {
    hpv: boolean;
    mmr: boolean;
    none: boolean;
  };
  pregnant: {
    tetanusToxoid: boolean;
    none: boolean;
  };
  elderly: {
    fluVaccine: boolean;
    pneumococcalVaccine: boolean;
    none: boolean;
  };
  others: string[]; // List of other vaccinations not mapped to specific checkboxes
}

/**
 * Extracts the dose number from a dose string
 * Examples: "1st dose" → 1, "2nd" → 2, "Third" → 3
 */
function extractDoseNumber(doseStr: string): number {
  const numericMatch = doseStr.match(/(\d+)/);
  if (numericMatch) {
    return parseInt(numericMatch[1], 10);
  }

  const lowerDose = doseStr.toLowerCase();
  if (lowerDose.includes("first") || lowerDose.includes("1st")) return 1;
  if (lowerDose.includes("second") || lowerDose.includes("2nd")) return 2;
  if (lowerDose.includes("third") || lowerDose.includes("3rd")) return 3;
  if (lowerDose.includes("fourth") || lowerDose.includes("4th")) return 4;
  if (lowerDose.includes("fifth") || lowerDose.includes("5th")) return 5;

  return 1;
}

/**
 * Calculates age in years from date of birth
 */
function calculateAge(dateOfBirth: Date): number {
  const today = new Date();
  let age = today.getFullYear() - dateOfBirth.getFullYear();
  const monthDiff = today.getMonth() - dateOfBirth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
    age--;
  }
  return age;
}

/**
 * Summarizes vaccination records into HAF immunization categories
 */
export function summarizeImmunizations(
  vaccinations: Array<any>,
  patientDateOfBirth: Date,
  isPregnant: boolean = false
): ImmunizationSummary {
  const age = calculateAge(patientDateOfBirth);

  const summary: ImmunizationSummary = {
    children: {
      bcg: false,
      hepatitisB1: false,
      hepatitisB2: false,
      hepatitisB3: false,
      dpt1: false,
      dpt2: false,
      dpt3: false,
      opv1: false,
      opv2: false,
      opv3: false,
      measles: false,
      hepatitisA: false,
      varicella: false,
      none: true,
    },
    adult: {
      hpv: false,
      mmr: false,
      none: true,
    },
    pregnant: {
      tetanusToxoid: false,
      none: true,
    },
    elderly: {
      fluVaccine: false,
      pneumococcalVaccine: false,
      none: true,
    },
    others: [],
  };

  for (const vax of vaccinations) {
    const code = vax.code?.toUpperCase();
    const vaccineName = vax.vaccineName || vax.Vaccine?.name || '';
    const doseStr = vax.doseNumber || vax.Dose?.dose || '1st Dose';
    const doseNumber = extractDoseNumber(doseStr);

    let mapped = false;

    // Check by PhilHealth code first
    if (code === 'C01') {
      summary.children.bcg = true;
      summary.children.none = false;
      mapped = true;
    } else if (code === 'C02') {
      summary.children.opv1 = true;
      summary.children.none = false;
      mapped = true;
    } else if (code === 'C03') {
      summary.children.opv2 = true;
      summary.children.none = false;
      mapped = true;
    } else if (code === 'C04') {
      summary.children.opv3 = true;
      summary.children.none = false;
      mapped = true;
    } else if (code === 'C05') {
      summary.children.dpt1 = true;
      summary.children.none = false;
      mapped = true;
    } else if (code === 'C06') {
      summary.children.dpt2 = true;
      summary.children.none = false;
      mapped = true;
    } else if (code === 'C07') {
      summary.children.dpt3 = true;
      summary.children.none = false;
      mapped = true;
    } else if (code === 'C08') {
      summary.children.measles = true;
      summary.children.none = false;
      mapped = true;
    } else if (code === 'C09') {
      summary.children.hepatitisB1 = true;
      summary.children.none = false;
      mapped = true;
    } else if (code === 'C10') {
      summary.children.hepatitisB2 = true;
      summary.children.none = false;
      mapped = true;
    } else if (code === 'C11') {
      summary.children.hepatitisB3 = true;
      summary.children.none = false;
      mapped = true;
    } else if (code === 'C12') {
      summary.children.hepatitisA = true;
      summary.children.none = false;
      mapped = true;
    } else if (code === 'C13') {
      summary.children.varicella = true;
      summary.children.none = false;
      mapped = true;
    } else if (code === 'Y01') {
      summary.adult.hpv = true;
      summary.adult.none = false;
      mapped = true;
    } else if (code === 'Y02') {
      summary.adult.mmr = true;
      summary.adult.none = false;
      mapped = true;
    } else if (code === 'P01') {
      summary.pregnant.tetanusToxoid = true;
      summary.pregnant.none = false;
      mapped = true;
    } else if (code === 'E01') {
      summary.elderly.pneumococcalVaccine = true;
      summary.elderly.none = false;
      mapped = true;
    } else if (code === 'E02') {
      summary.elderly.fluVaccine = true;
      summary.elderly.none = false;
      mapped = true;
    }

    // Name-based fallback if code not present
    if (!mapped && vaccineName) {
      const vNameUpper = vaccineName.toUpperCase();
      if (vNameUpper.includes('BCG')) {
        summary.children.bcg = true;
        summary.children.none = false;
        mapped = true;
      } else if (vNameUpper.includes('POLIO') || vNameUpper.includes('OPV') || vNameUpper.includes('IPV')) {
        if (doseNumber === 1) summary.children.opv1 = true;
        else if (doseNumber === 2) summary.children.opv2 = true;
        else summary.children.opv3 = true;
        summary.children.none = false;
        mapped = true;
      } else if (vNameUpper.includes('DPT') || vNameUpper.includes('PENTA')) {
        if (doseNumber === 1) summary.children.dpt1 = true;
        else if (doseNumber === 2) summary.children.dpt2 = true;
        else summary.children.dpt3 = true;
        summary.children.none = false;
        mapped = true;
      } else if (vNameUpper.includes('HEPATITIS B') || vNameUpper.includes('HEP B')) {
        if (doseNumber === 1) summary.children.hepatitisB1 = true;
        else if (doseNumber === 2) summary.children.hepatitisB2 = true;
        else summary.children.hepatitisB3 = true;
        summary.children.none = false;
        mapped = true;
      } else if (vNameUpper.includes('MEASLES')) {
        summary.children.measles = true;
        summary.children.none = false;
        mapped = true;
      } else if (vNameUpper.includes('HEPATITIS A') || vNameUpper.includes('HEP A')) {
        summary.children.hepatitisA = true;
        summary.children.none = false;
        mapped = true;
      } else if (vNameUpper.includes('VARICELLA') || vNameUpper.includes('CHICKEN')) {
        summary.children.varicella = true;
        summary.children.none = false;
        mapped = true;
      } else if (vNameUpper.includes('HPV')) {
        summary.adult.hpv = true;
        summary.adult.none = false;
        mapped = true;
      } else if (vNameUpper.includes('MMR')) {
        summary.adult.mmr = true;
        summary.adult.none = false;
        mapped = true;
      } else if (vNameUpper.includes('TETANUS')) {
        summary.pregnant.tetanusToxoid = true;
        summary.pregnant.none = false;
        mapped = true;
      } else if (vNameUpper.includes('FLU') || vNameUpper.includes('INFLUENZA')) {
        summary.elderly.fluVaccine = true;
        summary.elderly.none = false;
        mapped = true;
      } else if (vNameUpper.includes('PNEUMO')) {
        summary.elderly.pneumococcalVaccine = true;
        summary.elderly.none = false;
        mapped = true;
      }
    }

    if (!mapped && vaccineName) {
      const otherLabel = doseNumber > 1 ? `${vaccineName} (${doseStr})` : vaccineName;
      if (!summary.others.includes(otherLabel)) {
        summary.others.push(otherLabel);
      }
    }
  }

  return summary;
}
