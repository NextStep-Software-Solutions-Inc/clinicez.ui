
export function extractExperienceYears(experience: string | undefined): string {
  if (!experience) return "0";
  const match = experience.match(/(\d+)/);
  return match ? match[1] : "0";
}