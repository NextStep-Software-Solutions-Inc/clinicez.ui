"use server"

import { withErrorHandling } from "@/lib/with-error-handling"
import { generatePdf, getSpouseAndMother, resolvePreferredKonsultaProvider } from "./utils/philhealth-pdf"
import { getUserAction } from "@/actions/users/user.action"

const upper = (v?: string | null) => v ? v.toUpperCase() : "N/A"
const orNA = (v?: string | null) => v ?? "N/A"

export const downloadPMRFAction = withErrorHandling(async (userId: string) => {
  if (!userId) throw new Error("User ID required")
  const userRes = await getUserAction(userId)
  const user = userRes.data
  if (!user) throw new Error("User not found")

  const { spouse, mother } = await getSpouseAndMother(userId)
  const primaryAddress = user.UserAddresses?.[0]
  const provider = await resolvePreferredKonsultaProvider(userId)

  const textMappings = [
    { field: 'memberLastName', value: upper(user.lastName) },
    { field: 'memberMiddleName', value: upper(user.middleName) },
    { field: 'memberFirstName', value: upper(user.firstName) },
    { field: 'memberNameExtension', value: upper(user.suffix) },

    { field: 'spouseLastName', value: upper(spouse.lastName) },
    { field: 'spouseMiddleName', value: upper(spouse.middleName) },
    { field: 'spouseFirstName', value: upper(spouse.firstName) },
    { field: 'spouseNameExtension', value: upper(spouse.nameExtension) },

    { field: 'motherMaidenLastName', value: upper(mother.lastName) },
    { field: 'motherMaidenFirstName', value: upper(mother.firstName) },
    { field: 'motherMiddleName', value: upper(mother.middleName) },
    { field: 'motherNameExtension', value: upper(mother.nameExtension) },

    { field: 'mobileNumber', value: orNA(user.mobile) },
    { field: 'emailAddress', value: upper(orNA(user.email)) },
    { field: 'memberPlaceOfBirth', value: orNA(user.placeOfBirth) },
    { field: 'memberDateOfBirth', value: user.dob ? new Date(user.dob).toLocaleDateString('en-PH') : 'N/A' },

    { field: 'addressUnitRoomNumberFloor', value: upper(orNA(primaryAddress?.apartmentUnit)) },
    { field: 'addressBuildingName', value: upper(orNA(primaryAddress?.bldgName)) },
    { field: 'addressStreetNumber', value: upper(orNA(primaryAddress?.street)) },
    { field: 'addressBarangay', value: upper(orNA(primaryAddress?.barangay)) },
    { field: 'addressMunicipalityCity', value: upper(orNA(primaryAddress?.city)) },
    { field: 'addressProvince', value: upper(orNA(primaryAddress?.state)) },
    { field: 'addressZipCode', value: orNA(primaryAddress?.zipCode) },
    { field: 'addressSubdivision', value: upper(orNA(primaryAddress?.subdivision)) },
    { field: 'addressLotBlockPhaseHouseNumber', value: upper(orNA(primaryAddress?.addressLine)) },
    { field: 'preferredKonsultaProvider', value: provider ? upper(provider) : 'N/A' },
  ]

  const checkboxMappings = [
    { field: 'noMiddleName', condition: !user.middleName?.trim() },
    { field: 'mononym', condition: !user.middleName?.trim() && !user.lastName?.trim() },
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
  ]

  const pdf = await generatePdf('PhilHealth_Member_Registration_Form_V2.pdf', textMappings, checkboxMappings, `PHR_Form_${user.firstName || 'Member'}_${user.lastName || ''}`)
  return { message: 'PDF generated successfully', data: pdf }
})
