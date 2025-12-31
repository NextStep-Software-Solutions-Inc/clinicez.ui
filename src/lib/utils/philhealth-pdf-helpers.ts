
export type PdfTextMapping = { field: string; value: string | undefined | null }
export type PdfCheckboxMapping = { field: string; condition: boolean }
export type PdfRadioMapping = { field: string; option: string | number | boolean }

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
