export interface PhilHealthSignAndSymptomSeed {
  code: string;
  description: string;
  isActive: boolean;
  sortOrder: number;
}

/**
 * Official PhilHealth Konsulta v1.1 `lib_signs_symptoms.xlsx` reference library.
 * Contains all 39 codes: 36 active and 3 deactivated (`16`, `24`, `31`).
 */
export const PHILHEALTH_SIGNS_AND_SYMPTOMS: readonly PhilHealthSignAndSymptomSeed[] = [
  { code: "01", description: "ALTERED MENTAL SENSORIUM", isActive: true, sortOrder: 1 },
  { code: "02", description: "ABDOMINAL CRAMP/PAIN", isActive: true, sortOrder: 2 },
  { code: "03", description: "ANOREXIA", isActive: true, sortOrder: 3 },
  { code: "04", description: "BLEEDING GUMS", isActive: true, sortOrder: 4 },
  { code: "05", description: "BODY WEAKNESS", isActive: true, sortOrder: 5 },
  { code: "06", description: "BLURRING OF VISION", isActive: true, sortOrder: 6 },
  { code: "07", description: "CONSTIPATION", isActive: true, sortOrder: 7 },
  { code: "08", description: "CHEST PAIN/DISCOMFORT", isActive: true, sortOrder: 8 },
  { code: "09", description: "COUGH", isActive: true, sortOrder: 9 },
  { code: "10", description: "DIARRHEA", isActive: true, sortOrder: 10 },
  { code: "11", description: "DIZZINESS", isActive: true, sortOrder: 11 },
  { code: "12", description: "DYSPHAGIA", isActive: true, sortOrder: 12 },
  { code: "13", description: "DYSPNEA", isActive: true, sortOrder: 13 },
  { code: "14", description: "DYSURIA", isActive: true, sortOrder: 14 },
  { code: "15", description: "EPISTAXIS", isActive: true, sortOrder: 15 },
  { code: "16", description: "FLANK OR LOWER BACK", isActive: false, sortOrder: 16 },
  { code: "17", description: "FREQUENCY OF URINATION", isActive: true, sortOrder: 17 },
  { code: "18", description: "HEADACHE", isActive: true, sortOrder: 18 },
  { code: "19", description: "HEMATEMESIS", isActive: true, sortOrder: 19 },
  { code: "20", description: "HEMATURIA", isActive: true, sortOrder: 20 },
  { code: "21", description: "HEMOPTYSIS", isActive: true, sortOrder: 21 },
  { code: "22", description: "IRRITABILITY", isActive: true, sortOrder: 22 },
  { code: "23", description: "JAUNDICE", isActive: true, sortOrder: 23 },
  { code: "24", description: "LEG CRAMPS OR PAIN", isActive: false, sortOrder: 24 },
  { code: "25", description: "LOWER EXTREMITY EDEMA", isActive: true, sortOrder: 25 },
  { code: "26", description: "MYALGIA", isActive: true, sortOrder: 26 },
  { code: "27", description: "ORTHOPNEA", isActive: true, sortOrder: 27 },
  { code: "28", description: "PALPITATIONS", isActive: true, sortOrder: 28 },
  { code: "29", description: "SKIN RASHES", isActive: true, sortOrder: 29 },
  { code: "30", description: "STOOL, BLOODY/BLACK TARRY/MUCOID", isActive: true, sortOrder: 30 },
  { code: "31", description: "SKIN RASHES", isActive: false, sortOrder: 31 },
  { code: "32", description: "SWEATING", isActive: true, sortOrder: 32 },
  { code: "33", description: "SEIZURES", isActive: true, sortOrder: 33 },
  { code: "34", description: "URGENCY", isActive: true, sortOrder: 34 },
  { code: "35", description: "VOMITING/NAUSEA", isActive: true, sortOrder: 35 },
  { code: "36", description: "WEIGHT LOSS", isActive: true, sortOrder: 36 },
  { code: "37", description: "FEVER", isActive: true, sortOrder: 37 },
  { code: "38", description: "PAIN", isActive: true, sortOrder: 38 },
  { code: "X", description: "OTHERS", isActive: true, sortOrder: 39 },
];
