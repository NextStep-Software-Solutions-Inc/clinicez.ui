"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

interface OnboardingGuardProps {
  onboardingStatus: string;
  accountType: string;
}

/** Excluded paths that should not trigger onboarding redirect */
const EXCLUDED_PATHS = [
  "/onboarding",
  "/sign-in",
  "/sign-up",
  "/api",
  "/maintenance",
];

export default function OnboardingGuard({
  onboardingStatus,
  accountType,
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

    // Shell accounts always need onboarding
    const isShellAccount = accountType === "SHELL";

    if (needsOnboarding || isShellAccount) {
      router.replace("/onboarding");
    }
  }, [onboardingStatus, accountType, pathname, router]);

  return null;
}
