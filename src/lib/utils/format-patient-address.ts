// Formats a patient's address for use in medical documents with proper fallbacks
export function formatPatientAddress(patient?: {
  UserAddresses?: Array<{
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
  }>;
}): string {
  if (!patient?.UserAddresses || !Array.isArray(patient.UserAddresses) || patient.UserAddresses.length === 0) {
    return "Address not provided";
  }

  const patientAddress = patient.UserAddresses[0];
  const parts = [
    patientAddress.address,
    patientAddress.city,
    patientAddress.state,
    patientAddress.country,
    patientAddress.zipCode
  ].filter(part => part?.trim());

  if (parts.length === 0) {
    return "Address not provided";
  }

  return parts.join(", ");
}
