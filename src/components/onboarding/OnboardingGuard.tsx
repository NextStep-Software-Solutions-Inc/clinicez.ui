"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

interface OnboardingGuardProps {
  onboardingStatus: string;
}

/** Excluded paths that should not trigger onboarding redirect */
const EXCLUDED_PATHS = [
  "/onboarding",
  "/sign-in",
  "/sign-up",
  "/api",
  "/maintenance",
  "/organizations",
];

export default function OnboardingGuard({
  onboardingStatus,
}: OnboardingGuardProps) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Don't redirect if already on an excluded path
    const isExcluded = EXCLUDED_PATHS.some((p) => pathname.startsWith(p));
    if (isExcluded) return;

    // Redirect to onboarding if status is NOT_STARTED or IN_PROGRESS
    const needsOnboarding =
      onboardingStatus === "NOT_STARTED" ||
      onboardingStatus === "IN_PROGRESS";

    if (needsOnboarding) {
      router.replace("/onboarding");
    }
  }, [onboardingStatus, pathname, router]);

  return null;
}
