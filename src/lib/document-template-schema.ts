// ---------------------------------------------------------------------------
// Template variable types and registry
// ---------------------------------------------------------------------------

export type TemplateVariableType =
  | "string"
  | "html"
  | "number"
  /** An array of plain strings, e.g. lab test names */
  | "array-of-strings"
  /** An array of objects — each item has typed `properties` */
  | "array-of-objects";

/** A single property on an array-of-objects item */
export type TemplatePropertyInfo = {
  /** Property name accessed as `<loopVar>.<variable>` inside a for loop */
  variable: string;
  description: string;
};

/** Scalar (string / html / number) variable */
type ScalarVariableInfo = {
  variable: string;
  description: string;
  type?: "string" | "html" | "number";
  loopVar?: never;
  properties?: never;
};

/** Array-of-strings variable (e.g. lab test categories) */
type ArrayOfStringsVariableInfo = {
  variable: string;
  description: string;
  type: "array-of-strings";
  loopVar?: never;
  properties?: never;
};

/** Array-of-objects variable — requires explicit loopVar and properties */
export type ArrayOfObjectsVariableInfo = {
  variable: string;
  description: string;
  type: "array-of-objects";
  /** The loop alias, e.g. `"med"` for `{% for med in medicines %}` */
  loopVar: string;
  /** Typed properties of each item in the array */
  properties: TemplatePropertyInfo[];
};

export type TemplateVariableInfo =
  | ScalarVariableInfo
  | ArrayOfStringsVariableInfo
  | ArrayOfObjectsVariableInfo;

export type TemplateVariableSchema = {
  /** Short description of this document type's template context */
  description: string;
  variables: TemplateVariableInfo[];
};

// ---------------------------------------------------------------------------
// Dynamic registry — assembled from each prepare-*.ts file's own schema export.
// To register a new document type: export TEMPLATE_VARIABLE_SCHEMA from its
// prepare file and add it to the array below.
// ---------------------------------------------------------------------------

import { TEMPLATE_VARIABLE_SCHEMA as prescriptionSchema } from "./prepare-prescription";
import { TEMPLATE_VARIABLE_SCHEMA as medCertSchema } from "./prepare-medical-certificate";
import { TEMPLATE_VARIABLE_SCHEMA as referralSchema } from "./prepare-referral-slip";
import { TEMPLATE_VARIABLE_SCHEMA as imagingSchema } from "./prepare-imaging-study";
import { TEMPLATE_VARIABLE_SCHEMA as laboratorySchema } from "./prepare-laboratory-request";
import { TEMPLATE_VARIABLE_SCHEMA as heartStationSchema } from "./prepare-heart-station-request";

const ALL_SCHEMAS = [
  prescriptionSchema,
  medCertSchema,
  referralSchema,
  imagingSchema,
  laboratorySchema,
  heartStationSchema,
];

/**
 * Maps a document-type key to its available Liquid variables.
 * Built dynamically from TEMPLATE_VARIABLE_SCHEMA exports in each prepare-*.ts file.
 */
export const DOCUMENT_TEMPLATE_VARIABLES: Record<string, TemplateVariableSchema> =
  Object.fromEntries(ALL_SCHEMAS.map(({ key, ...schema }) => [key, schema]));

/**
 * Resolves the template variable schema for a given document type name.
 *
 * The lookup is case-insensitive and matches by substring, so "Medical Certificate"
 * resolves to the `medical_certificate` schema, "Imaging Study" resolves to `imaging`, etc.
 *
 * Returns `null` if no matching schema is found.
 */
export function getTemplateVariableSchema(
  documentTypeName: string
): TemplateVariableSchema | null {
  const normalized = documentTypeName.toLowerCase().replace(/[\s-]+/g, "_");

  // Direct key match first
  if (normalized in DOCUMENT_TEMPLATE_VARIABLES) {
    return DOCUMENT_TEMPLATE_VARIABLES[normalized];
  }

  // Substring / pattern matching for flexible DB names
  const matchers: Array<[RegExp, string]> = [
    [/prescription/, "prescription"],
    [/medical.cert|medcert/, "medical_certificate"],
    [/referral/, "referral"],
    [/imaging/, "imaging"],
    [/laborator/, "laboratory"],
    [/heart.station|heartstation/, "heart_station"],
  ];

  for (const [pattern, key] of matchers) {
    if (pattern.test(normalized)) {
      return DOCUMENT_TEMPLATE_VARIABLES[key] ?? null;
    }
  }

  return null;
}
