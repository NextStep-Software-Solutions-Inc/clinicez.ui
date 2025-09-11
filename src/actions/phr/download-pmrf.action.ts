"use server"

import { withErrorHandling } from "@/lib/with-error-handling"
import { generatePdf, getSpouseAndMother, resolvePreferredKonsultaProvider, extractDigits, mapSequentialFields, spacedDigits } from "./utils/philhealth-pdf"
import { getUserAction } from "@/actions/users/user.action"
import prisma from "@/lib/prisma"
import { logger } from "@/lib/logger"

const upper = (v?: string | null) => v ? v.toUpperCase() : "N/A"
const orNA = (v?: string | null) => v ?? "N/A"

type PrimaryAddress = {
  apartmentUnit?: string | null;
  bldgName?: string | null;
  street?: string | null;
  subdivision?: string | null;
  barangay?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  addressLine?: string | null;
}
function hasUserAddresses(u: unknown): u is { UserAddresses?: PrimaryAddress[] } {
  return !!u && typeof u === "object" && "UserAddresses" in (u as Record<string, unknown>)
}
type PhilHealthRecordLite = { id: number; memberTypeId: number; pin?: string | null; philSysId?: string | null; tin?: string | null }
function hasPhilHealthRecord(u: unknown): u is { PhilHealthRecord: PhilHealthRecordLite[] } {
  return !!u && typeof u === "object" && "PhilHealthRecord" in (u as Record<string, unknown>)
}

export const downloadPMRFAction = withErrorHandling(async (userId: string) => {
  if (!userId) throw new Error("User ID is required to generate PMRF")

  const userRes = await getUserAction(userId)
  const user = userRes.data
  if (!user) throw new Error("User profile not found. Please ensure you have a valid account.")

  const { spouse, mother } = await getSpouseAndMother(userId)
  const primaryAddress: PrimaryAddress | undefined = hasUserAddresses(user) ? user.UserAddresses?.[0] : undefined
  const provider = await resolvePreferredKonsultaProvider(userId)

  // Prepare split fields for PhilSys ID, TIN, and DOB per updated PDF field list
  let phr: PhilHealthRecordLite | undefined = hasPhilHealthRecord(user) ? user.PhilHealthRecord?.[0] : undefined
  if (!phr) {
    const fetched = await prisma.philHealthRecord.findFirst({
      where: { userId: user.id, isActive: true, deletedAt: null },
      orderBy: { id: 'asc' },
      select: { id: true, memberTypeId: true, pin: true, philSysId: true, tin: true },
    })
    phr = fetched ?? undefined
  }
  const philSysDigits = extractDigits(phr?.philSysId, 12)
  const tinDigits = extractDigits(phr?.tin, 9)
  const dobDate = user.dob ? new Date(user.dob) : undefined;
  const monthStr = dobDate ? String(dobDate.getMonth() + 1).padStart(2, "0") : "";
  const dayStr = dobDate ? String(dobDate.getDate()).padStart(2, "0") : "";
  const yearStr = dobDate ? String(dobDate.getFullYear()).padStart(4, "0") : "";

  const DIGIT_SPACING = "   " // 3 spaces between digits
  const spaced = (value: string) => value ? " " + value.split("").join(DIGIT_SPACING) : undefined; // leading space + 3 spaces between digits
  const dateOfBirthMonth = spacedDigits(monthStr)
  const dateOfBirthDay = spacedDigits(dayStr)
  const dateOfBirthYear = spacedDigits(yearStr)

  const textMappings = [
    { field: 'memberLastName', value: upper(user.lastName) },
    { field: 'memberMiddleName', value: upper(user.middleName) },
    { field: 'memberFirstName', value: upper(user.firstName) },
    { field: 'memberNameExtension', value: upper(user.suffix) },
    // PhilSysID split fields
    ...mapSequentialFields('philsysPin', philSysDigits, 12),
    ...mapSequentialFields('tinPin', tinDigits, 9),

    { field: 'spouseLastName', value: upper(spouse.lastName) },
    { field: 'spouseMiddleName', value: upper(spouse.middleName) },
    { field: 'spouseFirstName', value: upper(spouse.firstName) },
    { field: 'spouseNameExtension', value: upper(spouse.nameExtension) },

    { field: 'motherMaidenLastName', value: upper(mother.lastName) },
    { field: 'motherMaidenFirstName', value: upper(mother.firstName) },
    { field: 'motherMiddleName', value: upper(mother.middleName) },
    { field: 'motherNameExtension', value: upper(mother.nameExtension) },
    { field: 'mobileNumber', value: orNA(user.mobile) },
    { field: 'homePhoneNumber', value: "N/A" },
    { field: 'businessDirectLine', value: "N/A" },
    { field: 'emailAddress', value: upper(orNA(user.email)) },
    { field: 'memberPlaceOfBirth', value: upper(orNA(user.placeOfBirth)) },
    { field: 'dateOfBirthMonth', value: dateOfBirthMonth },
    { field: 'dateOfBirthDay', value: dateOfBirthDay },
    { field: 'dateOfBirthYear', value: dateOfBirthYear },

    { field: 'addressUnitRoomNumberFloor', value: upper(orNA(primaryAddress?.apartmentUnit)) },
    { field: 'addressBuildingName', value: upper(orNA(primaryAddress?.bldgName)) },
    { field: 'addressStreetNumber', value: upper(orNA(primaryAddress?.street)) },
    { field: 'addressBarangay', value: upper(orNA(primaryAddress?.barangay)) },
    { field: 'addressMunicipalityCity', value: upper(orNA(primaryAddress?.city)) },
    { field: 'addressProvince', value: upper(orNA(primaryAddress?.state)) },
    { field: 'addressZipCode', value: orNA(primaryAddress?.zipCode) },
    { field: 'addressSubdivision', value: upper(orNA(primaryAddress?.subdivision)) },
    { field: 'addressLotBlockPhaseHouseNumber', value: upper(orNA(primaryAddress?.addressLine)) },
    { field: 'preferredKonSulTaProvider', value: provider ? upper(provider) : 'N/A' },
  ]

  const checkboxMappings = [
    { field: 'memberNoMiddleName', condition: !user.middleName?.trim() },
    { field: 'memberMononym', condition: !user.middleName?.trim() && !user.lastName?.trim() },
    { field: 'motherNoMiddleName', condition: !mother.middleName?.trim() },
    { field: 'motherMononym', condition: !mother.middleName?.trim() && !mother.lastName?.trim() },
    { field: 'spouseNoMiddleName', condition: !spouse.middleName?.trim() },
    { field: 'spouseMononym', condition: !spouse.middleName?.trim() && !spouse.lastName?.trim() },
    { field: 'sexMale', condition: user.gender === 'MALE' },
    { field: 'sexFemale', condition: user.gender === 'FEMALE' },
    { field: 'civilStatusSingle', condition: user.civilStatus === 'SINGLE' },
    { field: 'civilStatusMarried', condition: user.civilStatus === 'MARRIED' },
    { field: 'civilStatusLegallySeparated', condition: user.civilStatus === 'SEPARATED' },
    { field: 'civilStatusLegallyAnnulled', condition: user.civilStatus === 'DIVORCED' },
    { field: 'civilStatusWidower', condition: user.civilStatus === 'WIDOWED' },
    { field: 'citizenshipFilipino', condition: user.nationality === 'Filipino' },
    { field: 'addressMailing', condition: true },
    { field: 'purposeRegistration', condition: true },
  ]

  // Dependents mapping (first four)
  try {
    if (phr) {
      const dependents = await prisma.philHealthDependent.findMany({
        where: { philHealthRecordId: phr.id, deletedAt: null },
        orderBy: { id: 'asc' },
        take: 4,
      })
      const depPrefixes = ['One', 'Two', 'Three', 'Four']
      dependents.forEach((d, idx) => {
        const pref = depPrefixes[idx]
        textMappings.push(
          { field: `dependents${pref}LastName`, value: upper(d.lastName) },
          { field: `dependents${pref}FirstName`, value: upper(d.firstName) },
          { field: `dependents${pref}MiddleName`, value: upper(d.middleName) },
          { field: `dependents${pref}NameExtension`, value: upper(d.suffix) },
          { field: `dependents${pref}Relationship`, value: upper(d.relationship) },
          { field: `dependents${pref}DateOfBirth_af_date`, value: d.dob ? new Date(d.dob).toLocaleDateString('en-PH') : undefined },
        )
        // checkbox style flags for missing middle name / mononym
        checkboxMappings.push(
          { field: `dependents${pref}NoMiddleName`, condition: !d.middleName?.trim() },
          { field: `dependents${pref}Mononym`, condition: !d.middleName?.trim() && !d.lastName?.trim() },
        )
      })
    }
  } catch (error: unknown) {
    // log dependents retrieval errors for debugging
    logger.error("Failed to map dependents:", error)
  }

  // Member type checkbox mapping (supports parent-child hierarchy)
  try {
    if (phr) {
      const memberType = await prisma.philHealthMemberType.findUnique({ where: { id: phr.memberTypeId }, include: { Parent: true } })
      if (memberType?.name) {
        const memberTypeCheckboxMap: Record<string, string> = {
          'EMPLOYED PRIVATE': 'memberTypeEmployedPrivate',
          'KASAMBAHAY': 'memberTypeKasambahay',
          'FAMILY DRIVER': 'memberTypeFamilyDriver',
          'EMPLOYED GOVERNMENT': 'memberTypeEmployedGovernment',
          // Hierarchical groups
          'MIGRANT WORKER': 'memberTypeMigrantWorker',
          'SEA-BASED': 'memberTypeSeaBased',
          'LAND-BASED': 'memberTypeLandbased', // match actual PDF field name
          'PROFESSIONAL PRACTITIONER': 'memberTypeProfessionalPractitioner',
          'LIFETIME MEMBER': 'memberTypeLifetimeMember',
          'SELF-EARNING INDIVIDUAL': 'memberTypeSelfEarningIndividual',
          'FILIPINO DUAL CITIZENSHIP': 'memberTypeFilipinoDualCitizenship',
          // Children of SELF-EARNING INDIVIDUAL
          'INDIVIDUAL': 'memberTypeIndividual',
          'SOLE PROPRIETOR': 'memberTypeSoleProprietor',
          'GROUP ENROLLMENT SCHEME': 'memberTypeGroupEnrollmentScheme',
          'FOREIGN NATIONAL': 'memberTypeForeignNational',
        }
        const toMark = new Set<string>()
        const childUpper = memberType.name.toUpperCase()
        toMark.add(childUpper)
        if (memberType.Parent?.name) {
          toMark.add(memberType.Parent.name.toUpperCase())
        }
        // Special case: If selected is LAND-BASED or SEA-BASED ensure MIGRANT WORKER also checked (already handled by Parent, but fallback)
        if (childUpper === 'LAND-BASED' || childUpper === 'SEA-BASED') toMark.add('MIGRANT WORKER')
        // Self-earning individual children ensure parent also marked
        if (['INDIVIDUAL', 'SOLE PROPRIETOR', 'GROUP ENROLLMENT SCHEME'].includes(childUpper)) toMark.add('SELF-EARNING INDIVIDUAL')

        toMark.forEach(name => {
          const field = memberTypeCheckboxMap[name]
          if (field) checkboxMappings.push({ field, condition: true })
        })
      }
    }
  } catch (error: unknown) {
    // log member type retrieval errors for debugging
    logger.error("Failed to map member type:", error)
  }

  const pdf = await generatePdf('PhilHealth_Member_Registration_Form.pdf', textMappings, checkboxMappings, `PHR_Form_${user.firstName || 'Member'}_${user.lastName || ''}`)
  return { message: 'PDF generated successfully', data: pdf }
})
