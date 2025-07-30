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

  const addressObj = patient.UserAddresses[0];
  if (!addressObj) {
    return "Address not provided";
  }

  const parts = [
    addressObj.address,
    addressObj.city,
    addressObj.state,
    addressObj.country,
    addressObj.zipCode
  ].map(part => (part || "").trim()).filter(Boolean);

  if (parts.length === 0) {
    return "Address not provided";
  }

  return parts.join(", ");
}
