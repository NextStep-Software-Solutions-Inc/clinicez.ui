// Official PhilHealth management codes reference
// Used for seeding and display — NOT a "use server" file
export const MANAGEMENT_CODES = [
  { code: "1", description: "Breastfeeding Program Education", sortOrder: 1 },
  { code: "2", description: "Counselling for Smoking Cessation", sortOrder: 2 },
  { code: "3", description: "Counselling for Lifestyle Modification", sortOrder: 3 },
  { code: "4", description: "Oral Check-up and Prophylaxis", sortOrder: 4 },
  { code: "0", description: "Not applicable", sortOrder: 5 },
  { code: "X", description: "Others", sortOrder: 6 },
] as const;

export type ManagementCodeEntry = (typeof MANAGEMENT_CODES)[number];
