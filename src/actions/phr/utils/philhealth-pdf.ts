import prisma from "@lib/prisma"
import { loadPhilHealthPdf, fillTextFields, processCheckboxes, pdfBytesToBase64 } from "@/lib/utils/pdf-utils"
import { getUserAction, getUserAndAddressAction } from "@/actions/users/user.action"
import { getEmergencyContactsAction } from "@actions/emergency-contact.action"

export type PdfTextMapping = { field: string; value: string | undefined | null }
export type PdfCheckboxMapping = { field: string; condition: boolean }

export interface NameParts { firstName: string; middleName: string; lastName: string; nameExtension: string }

const SUFFIX_REGEX = /^(jr\.?|sr\.?|ii+|iii+|iv|v|vi+|phd|md|esq)$/i

export function parseFullName(raw?: string | null): NameParts {
  if (!raw) return { firstName: "", middleName: "", lastName: "", nameExtension: "" }
  const tokens = raw.trim().split(/\s+/)
  if (!tokens.length) return { firstName: "", middleName: "", lastName: "", nameExtension: "" }
  let firstName = tokens[0] || ""
  let lastName = tokens[tokens.length - 1] || ""
  let middleTokens = tokens.slice(1, -1)
  let nameExtension = ""
  if (tokens.length >= 2 && SUFFIX_REGEX.test(lastName)) {
    nameExtension = lastName
    lastName = tokens[tokens.length - 2] || ""
    middleTokens = tokens.slice(1, -2)
  }
  return { firstName, lastName, middleName: middleTokens.join(" "), nameExtension }
}

export function buildFullName(parts: Partial<NameParts>): string {
  return [parts.firstName, parts.middleName, parts.lastName, parts.nameExtension]
    .filter(v => v && v.trim() !== "")
    .join(" ")
}

export interface AddressParts { subdivision?: string | null; street?: string | null; apartmentUnit?: string | null; barangay?: string | null; city?: string | null; state?: string | null }

export function buildAddress(addr?: AddressParts | null): string {
  if (!addr) return ""
  const first = [addr.subdivision, addr.street, addr.apartmentUnit].filter(Boolean).join(" ")
  const trail = [addr.barangay, addr.city, addr.state].filter(v => v && v.trim() !== "")
  return [first, ...trail].filter(v => v && v.trim() !== "").join(", ")
}

export function formatIsoDate(d?: Date | string | null): string {
  if (!d) return ""
  const dt = typeof d === "string" ? new Date(d) : d
  return isNaN(dt.getTime()) ? "" : dt.toISOString().split("T")[0]
}

export async function resolvePreferredKonsultaProvider(userId: string): Promise<string> {
  const clinic = await prisma.clinic.findFirst({
    where: {
      isActive: true,
      ClinicOrganizations: {
        some: {
          isActive: true,
          Organization: {
            isActive: true,
            OrganizationMembers: { some: { User: { userId }, status: { in: ["ACCEPTED", "APPROVED", "ACTIVE"] } } }
          }
        }
      }
    },
    select: { name: true }
  })
  return clinic?.name || ""
}

export interface GeneratedPdfResult { pdfData: string; filename: string }

export interface GeneratePdfOptions { textFontSize?: number }

export async function generatePdf(
  template: string,
  texts: PdfTextMapping[],
  checkboxes?: PdfCheckboxMapping[],
  filenameBase?: string,
  options?: GeneratePdfOptions
): Promise<GeneratedPdfResult> {
  const { pdfDoc, form } = await loadPhilHealthPdf(template)
  const fontSize = options?.textFontSize
  await fillTextFields(form, texts, fontSize)
  if (checkboxes?.length) await processCheckboxes(form, checkboxes)
  form.updateFieldAppearances()
  const bytes = await pdfDoc.save()
  const base64 = await pdfBytesToBase64(bytes)
  return { pdfData: base64, filename: `${filenameBase ?? "PhilHealth_Form"}_${formatIsoDate(new Date())}.pdf` }
}

export async function getUserMinimal(userId: string) {
  const res = await getUserAction(userId)
  if (!res.data) throw new Error("User not found")
  return res.data
}

export async function getUserWithPrimaryAddress(userId: string) {
  const res = await getUserAndAddressAction(userId)
  if (!res.data) throw new Error("User not found")
  return res.data
}

export async function getSpouseAndMother(userId: string) {
  const contacts = await getEmergencyContactsAction(userId)
  const spouse = contacts.find(c => c.isPrimary && c.relationship.toLowerCase() === "spouse")
  const mother = contacts.find(c => c.isPrimary && c.relationship.toLowerCase() === "mother")
  return { spouse: parseFullName(spouse?.name), mother: parseFullName(mother?.name) }
}

// ---- Shared helpers for splitting identifiers (PhilSys ID / TIN / Date components) ----
export function extractDigits(value: string | null | undefined, max: number): string[] {
  return (value || "").replace(/\D/g, "").slice(0, max).split("")
}

export function mapSequentialFields(prefix: string, digits: string[], padTo: number): { field: string; value: string | undefined }[] {
  return Array.from({ length: padTo }, (_, i) => ({ field: `${prefix}_${i + 1}`, value: digits[i] || undefined }))
}

export function spacedDigits(value: string): string | undefined {
  if (!value) return undefined
  const DIGIT_SPACING = "   " // 3 spaces between digits
  return " " + value.split("").join(DIGIT_SPACING)
}
