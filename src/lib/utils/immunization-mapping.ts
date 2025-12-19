import type { UserVaccination, Vaccine, Dose } from "@prisma/client";

export type VaccinationWithRelations = UserVaccination & {
  Vaccine: Vaccine;
  Dose: Dose;
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
 * Maps vaccine brand names to standardized immunization types
 * This allows matching production vaccine data to HAF checkbox categories
 */
export const VACCINE_TO_IMMUNIZATION_MAP: Record<string, string> = {
  // BCG
  "BCG": "BCG",

  // Hepatitis B
  "Engerix-B": "HepatitisB",
  "Recombivax HB": "HepatitisB",
  "Heplisav-B": "HepatitisB",
  "Bimmu8": "HepatitisB",
  "Hepatitis B": "HepatitisB",

  // Hepatitis A
  "Havrix": "HepatitisA",
  "Vaqta": "HepatitisA",
  "Avaxim": "HepatitisA",
  "Hepatitis A": "HepatitisA",

  // DPT/DTaP/Tdap/DT
  "Infanrix": "DPT",
  "Pentacel": "DPT",
  "Adacel": "DPT",
  "Boostrix": "DPT",
  "Tenivac": "DT",
  "DPT": "DPT",
  "DTaP": "DPT",
  "Tdap": "DPT",
  "DT": "DT",

  // OPV/IPV (Polio)
  "IPol": "OPV",
  "Kinrix": "OPV",
  "Bivalent Polio Vaccine": "OPV",
  "bOPV": "OPV",
  "OPV": "OPV",
  "IPV": "OPV",
  "Polio": "OPV",

  // Measles/MMR
  "MMR": "MMR",
  "ProQuad": "MMR",
  "Measles": "Measles",

  // Varicella (Chickenpox)
  "Varivax": "Varicella",
  "Varicella": "Varicella",

  // HPV
  "Gardasil 9": "HPV",
  "Cervarix": "HPV",
  "Gardasil": "HPV",
  "HPV": "HPV",

  // Influenza
  "Afluria": "Flu",
  "Fluad": "Flu",
  "Flublok": "Flu",
  "Flucelvax": "Flu",
  "FluLaval": "Flu",
  "Fluarix": "Flu",
  "Influvac": "Flu",
  "Vaxigrip": "Flu",
  "Fluvirin": "Flu",
  "Fluzone": "Flu",
  "Influenza": "Flu",
  "Flu": "Flu",

  // Pneumococcal
  "Prevnar 13": "Pneumococcal",
  "Vaxneuvance": "Pneumococcal",
  "Prevnar 20": "Pneumococcal",
  "Synflorix": "Pneumococcal",
  "Pneumococcal Conjugate Vaccine": "Pneumococcal",
  "PCV": "Pneumococcal",
  "Pneumococcal": "Pneumococcal",

  // Rotavirus
  "Rotarix": "Rotavirus",
  "RotaTeq": "Rotavirus",
  "Rotasla": "Rotavirus",
  "Rotavirus": "Rotavirus",

  // Dengue
  "Dengvaxia": "Dengue",
  "Dengue": "Dengue",

  // COVID-19
  "Comirnaty": "COVID19",
  "Pfizer-BioNTech": "COVID19",
  "Spikevax": "COVID19",
  "Moderna": "COVID19",
  "CoronaVac": "COVID19",
  "Sinovac": "COVID19",
  "Sinopharm COVID-19 Vaccine": "COVID19",
  "Sinopharm": "COVID19",
  "Covaxin": "COVID19",
  "Sputnik V": "COVID19",
  "COVID-19": "COVID19",

  // Meningococcal
  "Menomune": "Meningococcal",
  "Menactra": "Meningococcal",
  "Nimenrix": "Meningococcal",
  "Avastrix": "Meningococcal",
  "Mencevax": "Meningococcal",
  "Meningococcal": "Meningococcal",

  // Hib (Haemophilus influenzae type b)
  "ActHIB": "Hib",
  "PedvaxHIB": "Hib",
  "Hiberix": "Hib",
  "HibTiter": "Hib",
  "Hib": "Hib",

  // Shingles (Herpes Zoster)
  "Shingrix": "Shingles",
  "Zostavax": "Shingles",
  "Shingles": "Shingles",

  // Tetanus
  "Tetanol": "TetanusToxoid",
  "Tetanus": "TetanusToxoid",
  "Tetanus Toxoid": "TetanusToxoid",
};

/**
 * Extracts the dose number from a dose string
 * Examples: "1st dose" → 1, "2nd" → 2, "Third" → 3
 */
function extractDoseNumber(doseStr: string): number {
  // Try numeric patterns first (1st, 2nd, 3rd, 1, 2, 3)
  const numericMatch = doseStr.match(/(\d+)/);
  if (numericMatch) {
    return parseInt(numericMatch[1], 10);
  }

  // Try word patterns (first, second, third)
  const lowerDose = doseStr.toLowerCase();
  if (lowerDose.includes("first") || lowerDose.includes("1st")) return 1;
  if (lowerDose.includes("second") || lowerDose.includes("2nd")) return 2;
  if (lowerDose.includes("third") || lowerDose.includes("3rd")) return 3;
  if (lowerDose.includes("fourth") || lowerDose.includes("4th")) return 4;
  if (lowerDose.includes("fifth") || lowerDose.includes("5th")) return 5;

  // Default to 1 if no dose number found
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
 * Groups vaccinations by age-appropriate categories and handles multi-dose vaccines
 * 
 * @param vaccinations - User's vaccination records with Vaccine and Dose relations
 * @param patientDateOfBirth - Patient's date of birth for age calculation
 * @param isPregnant - Whether the patient is currently pregnant (for tetanus toxoid)
 * @returns Structured summary matching HAF immunization checkboxes
 */
export function summarizeImmunizations(
  vaccinations: VaccinationWithRelations[],
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
      none: true
    },
    adult: {
      hpv: false,
      mmr: false,
      none: true
    },
    pregnant: {
      tetanusToxoid: false,
      none: true
    },
    elderly: {
      fluVaccine: false,
      pneumococcalVaccine: false,
      none: true
    },
    others: []
  };

  for (const vax of vaccinations) {
    const vaccineName = vax.Vaccine.name;
    const normalized = VACCINE_TO_IMMUNIZATION_MAP[vaccineName];
    const doseNumber = extractDoseNumber(vax.Dose.dose);

    let mapped = false;

    // Map to children immunizations (0-12 years)
    if (age <= 12) {
      if (normalized === "BCG") {
        summary.children.bcg = true;
        summary.children.none = false;
        mapped = true;
      } else if (normalized === "HepatitisB") {
        if (doseNumber === 1) summary.children.hepatitisB1 = true;
        else if (doseNumber === 2) summary.children.hepatitisB2 = true;
        else if (doseNumber === 3) summary.children.hepatitisB3 = true;
        summary.children.none = false;
        mapped = true;
      } else if (normalized === "DPT" || normalized === "DT") {
        if (doseNumber === 1) summary.children.dpt1 = true;
        else if (doseNumber === 2) summary.children.dpt2 = true;
        else if (doseNumber === 3) summary.children.dpt3 = true;
        summary.children.none = false;
        mapped = true;
      } else if (normalized === "OPV") {
        if (doseNumber === 1) summary.children.opv1 = true;
        else if (doseNumber === 2) summary.children.opv2 = true;
        else if (doseNumber === 3) summary.children.opv3 = true;
        summary.children.none = false;
        mapped = true;
      } else if (normalized === "Measles" || normalized === "MMR") {
        summary.children.measles = true;
        summary.children.none = false;
        mapped = true;
      } else if (normalized === "HepatitisA") {
        summary.children.hepatitisA = true;
        summary.children.none = false;
        mapped = true;
      } else if (normalized === "Varicella") {
        summary.children.varicella = true;
        summary.children.none = false;
        mapped = true;
      }
    }

    // Map to adult immunizations (13-59 years)
    if (age >= 13 && age <= 59) {
      if (normalized === "HPV") {
        summary.adult.hpv = true;
        summary.adult.none = false;
        mapped = true;
      } else if (normalized === "MMR") {
        summary.adult.mmr = true;
        summary.adult.none = false;
        mapped = true;
      }
    }

    // Map to elderly immunizations (60+ years)
    if (age >= 60) {
      if (normalized === "Flu") {
        summary.elderly.fluVaccine = true;
        summary.elderly.none = false;
        mapped = true;
      } else if (normalized === "Pneumococcal") {
        summary.elderly.pneumococcalVaccine = true;
        summary.elderly.none = false;
        mapped = true;
      }
    }

    // Map to pregnant immunizations (if applicable)
    if (isPregnant && normalized === "TetanusToxoid") {
      summary.pregnant.tetanusToxoid = true;
      summary.pregnant.none = false;
      mapped = true;
    }

    // Track unmapped vaccines in "Others"
    if (!mapped || !normalized) {
      const otherEntry = doseNumber > 1
        ? `${vaccineName} (${vax.Dose.dose})`
        : vaccineName;
      if (!summary.others.includes(otherEntry)) {
        summary.others.push(otherEntry);
      }
    }
  }

  return summary;
}
