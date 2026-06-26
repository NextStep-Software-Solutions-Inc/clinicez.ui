/**
 * Strictly-typed interfaces for Health History models
 * Generated from Prisma schema with proper TypeScript types
 * 
 * Updated: November 27, 2025
 * MedicalHistory now uses HealthCondition references instead of boolean fields
 */

// HealthCondition Types (Master table for conditions)
export interface HealthCondition {
  id: number;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  isActive: boolean;
}

// Medical History Types (NEW STRUCTURE - uses HealthCondition references)
export interface MedicalHistoryInput {
  conditionId: number;
  details?: string | null; // For condition-specific details (cancer organ, hepatitis type, TB details)
}

export interface MedicalHistoryRecord extends MedicalHistoryInput {
  id: number;
  userId: number;
  createdAt: Date;
  updatedAt: Date;
}

// Medical History with HealthCondition joined
export interface MedicalHistoryWithCondition extends MedicalHistoryRecord {
  Condition: HealthCondition;
}

// For bulk updates (multiple conditions at once)
export interface MedicalHistoryBulkInput {
  conditions: Array<{
    conditionId: number;
    details?: string | null;
  }>;
}

// Family Medical History Types (same structure as MedicalHistory)
export type FamilyMedicalHistoryInput = MedicalHistoryInput;
export type FamilyMedicalHistoryRecord = MedicalHistoryRecord;
export type FamilyMedicalHistoryWithCondition = MedicalHistoryWithCondition;

// Surgical History Types
export interface SurgicalHistoryInput {
  operationName: string;
  operationDate?: Date | null;
  notes?: string | null;
}

export interface SurgicalHistoryRecord extends SurgicalHistoryInput {
  id: number;
  userId: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

// Personal History Types
export interface PersonalHistoryInput {
  smokingStatus?: string | null; // "Yes", "No", "Quit"
  numberOfPacksPerYear?: number | null;
  alcoholStatus?: string | null; // "Yes", "No", "Quit"
  numberOfBottlesPerDay?: number | null;
  illicitDrugUse?: string | null; // "Yes", "No"
  sexuallyActive?: string | null; // "Yes", "No"
}

export interface PersonalHistoryRecord extends PersonalHistoryInput {
  id: number;
  userId: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

// Immunization Record Types - REMOVED
// Model deleted from schema - use existing UserVaccination model instead
// See: Vaccine, UserVaccination, Dose, Route models in schema

// OB-Gyne History Types
export interface ObGyneHistoryInput {
  menarche?: number | null;
  lastMenstrualPeriod?: Date | null;
  menopauseAge?: number | null;
  menopauseStatus?: string | null; // "Yes", "No"
  ageAtFirstSexualIntercourse?: number | null;
  birthControlMethod?: string | null;
  menstrualPeriodDuration?: number | null;
  menstrualCycleInterval?: number | null;
  numberOfPadsPerDay?: number | null;
  gravidity?: number | null;
  parity?: number | null;
  fullTerm?: number | null;
  premature?: number | null;
  abortion?: number | null;
  livingChildren?: number | null;
  typeOfDelivery?: string | null;
  hasPreEclampsia: boolean;
}

export interface ObGyneHistoryRecord extends ObGyneHistoryInput {
  id: number;
  userId: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}


// Pediatric Measurement Types - REMOVED
// PediatricMeasurement model removed from Prisma schema.
// Fields (length, headCircumference, skinfoldThickness, waistCircumference,
// hipCircumference, limbCircumference, midUpperArmCircumference, notes)
// are now consolidated into the VitalSign model.

// NCD Risk Assessment Types - COMPUTED (not stored in database)
// Model removed from schema - should be calculated on-demand from source data
export interface NCDRiskAssessmentComputed {
  // Dietary recommendations (computed)
  needsLowSaltDiet: boolean;
  needsLowFatDiet: boolean;
  needsHighFiberDiet: boolean;
  needsWeightManagement: boolean;

  // Physical activity (computed)
  needsIncreasePhysicalActivity: boolean;

  // Substance use (computed from PersonalHistory)
  needsSmokingCessation: boolean;
  needsAlcoholReduction: boolean;

  // Risk levels (computed from VitalSign, MedicalHistory, PersonalHistory)
  diabetesRiskLevel: 'low' | 'moderate' | 'high';
  cardiovascularRiskLevel: 'low' | 'moderate' | 'high' | 'very-high';
  hypertensionRiskLevel: 'low' | 'moderate' | 'high';

  // Overall NCD risk
  overallRiskScore: number; // 0-100
  riskCategory: 'low' | 'moderate' | 'high' | 'very-high';

  // Recommendations
  recommendations: string[];
}

// Comprehensive health history response type (UPDATED)
export interface HealthHistoryData {
  id: number;
  MedicalHistories: MedicalHistoryWithCondition[]; // Changed from singular to plural
  FamilyMedicalHistory: FamilyMedicalHistoryRecord | null;
  SurgicalHistories: SurgicalHistoryRecord[];
  PersonalHistory: PersonalHistoryRecord | null;
  ObGyneHistory: ObGyneHistoryRecord | null;
  // PediatricMeasurements removed - pediatric fields now consolidated into VitalSign
  // ImmunizationRecord removed - use UserVaccination queries instead
  // NCDRiskAssessment removed - compute on-demand using NCDRiskAssessmentComputed
}

// Action response types
export interface ActionResponse<T> {
  status: boolean;
  message: string;
  data: T | null;
}

// Smoking/Alcohol status enums for type safety
export const SmokingAlcoholStatus = {
  YES: "Yes",
  NO: "No",
  QUIT: "Quit"
} as const;

export type SmokingAlcoholStatusType = typeof SmokingAlcoholStatus[keyof typeof SmokingAlcoholStatus];

// Yes/No enum for binary questions
export const YesNo = {
  YES: "Yes",
  NO: "No"
} as const;

export type YesNoType = typeof YesNo[keyof typeof YesNo];

// Diabetes knowledge status
export const DiabetesStatus = {
  YES: "Yes",
  NO: "No",
  DONT_KNOW: "Don't Know"
} as const;

export type DiabetesStatusType = typeof DiabetesStatus[keyof typeof DiabetesStatus];
