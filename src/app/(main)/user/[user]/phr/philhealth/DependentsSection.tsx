import { getPhilHealthDependentsAction } from "@/actions/philhealth/philhealth-dependent.action";
// Using dynamic import to avoid potential build-time resolution issues
import type { PhilHealthDependent, Gender } from "@prisma/client";
// Keep union types in sync with DependentsClient
const RELATIONSHIP_OPTIONS = ["Spouse", "Child", "Foster Child", "Parent", "Parent-In-Law"] as const;
const SUFFIX_OPTIONS = ["Jr.", "Sr.", "II", "III", "IV"] as const;
type RelationshipOpt = typeof RELATIONSHIP_OPTIONS[number];
type SuffixOpt = typeof SUFFIX_OPTIONS[number];

interface DependentsSectionProps { userUid: string; readonly: boolean; }

export default async function DependentsSection({ userUid, readonly }: DependentsSectionProps) {
  const { default: DependentsClient } = await import("./DependentsClient");
  let dependents: PhilHealthDependent[] = [];
  try {
    const res = await getPhilHealthDependentsAction(userUid);
    dependents = (res.data ?? []) as unknown as PhilHealthDependent[];
  } catch {
    dependents = [];
  }
  // Local UI shape (mirrors client DependentUIModel)
  const uiDependents = dependents.map(d => {
    const suffix = d.suffix && SUFFIX_OPTIONS.includes(d.suffix as SuffixOpt) ? d.suffix as SuffixOpt : undefined;
    const relationship = d.relationship && RELATIONSHIP_OPTIONS.includes(d.relationship as RelationshipOpt) ? d.relationship as RelationshipOpt : undefined;
    return {
      id: d.id,
      firstName: d.firstName,
      middleName: d.middleName ?? "",
      lastName: d.lastName ?? "",
      suffix,
      relationship,
      dob: d.dob ? d.dob.toISOString().slice(0, 10) : undefined,
      gender: d.gender as Gender | undefined,
      editing: false
    };
  });
  return <DependentsClient userUid={userUid} readonly={readonly} initialDependents={uiDependents} />;
}
