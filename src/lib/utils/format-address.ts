// Formats a user address object into a single string, omitting empty fields and avoiding duplicate commas.
export function formatAddress(addressObj?: {
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
}): string {
  if (!addressObj) return "";
  const parts = [
    addressObj.address,
    addressObj.city,
    addressObj.state,
    addressObj.country,
    addressObj.zipCode
  ].map(part => (part || "").trim()).filter(Boolean);
  return parts.join(", ");
}
