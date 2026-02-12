"use client";

import { usePathname } from "next/navigation";
import BasicInfoModal from "./BasicInfoModal";

interface OnboardingGuardProps {
  onboardingStatus: string;
  firstName: string | null;
  lastName: string | null;
  dob: Date | null;
  gender: string | null;
  mobile: string | null;
}

/** Paths where the basic-info modal should NOT appear */
const EXCLUDED_PATHS = [
  "/onboarding",
  "/sign-in",
  "/sign-up",
  "/api",
  "/maintenance",
];

/**
 * Returns true when any of the required basic-info fields are missing.
 */
function isBasicInfoIncomplete(props: {
  firstName: string | null;
  lastName: string | null;
  dob: Date | null;
  gender: string | null;
  mobile: string | null;
}): boolean {
  return (
    !props.firstName?.trim() ||
    !props.lastName?.trim() ||
    !props.dob ||
    !props.gender ||
    !props.mobile?.trim()
  );
}

export default function OnboardingGuard({
  onboardingStatus,
  firstName,
  lastName,
  dob,
  gender,
  mobile,
}: OnboardingGuardProps) {
  const pathname = usePathname();

  // Don't show on excluded paths
  const isExcluded = EXCLUDED_PATHS.some((p) => pathname.startsWith(p));
  if (isExcluded) return null;

  // Show modal if onboarding not completed OR basic info fields are incomplete
  const needsOnboarding =
    onboardingStatus === "NOT_STARTED" || onboardingStatus === "IN_PROGRESS";

  const basicInfoMissing = isBasicInfoIncomplete({
    firstName,
    lastName,
    dob,
    gender,
    mobile,
  });

  if (!needsOnboarding && !basicInfoMissing) return null;

  return (
    <BasicInfoModal
      firstName={firstName}
      lastName={lastName}
      dob={dob}
      gender={gender}
      mobile={mobile}
    />
  );
}
