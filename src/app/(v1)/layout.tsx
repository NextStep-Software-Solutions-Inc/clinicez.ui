import { Plus_Jakarta_Sans } from "next/font/google";

import { getCachedSession } from "@actions/session.action";
import { getCurrentUserAction } from "@actions/users/user.action";
import { redirect } from "next/navigation";
import OnboardingGuard from "@components/onboarding/OnboardingGuard";

import "@styles/globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({ subsets: ["latin"] });

export const maxDuration = 40;

export const dynamic = "force-dynamic";

interface Props {
  children: React.ReactNode;
}

/**
 * V1 Layout
 * 
 * Layout for v1 routes (original app).
 * Handles:
 * - Plus Jakarta font family
 * - Onboarding flow and user data extraction
 * - Session and user authentication checks
 * 
 * Global providers (Clerk, Jotai, SWR, etc.) are in root layout.
 * Styling comes from root layout + globals.css.
 */
export default async function V1Layout({ children }: Props) {
  const [session, dbUser] = await Promise.all([
    getCachedSession(),
    getCurrentUserAction()
  ]);

  let onboardingStatus = "COMPLETED";
  let firstName: string | null = null;
  let lastName: string | null = null;
  let dob: Date | null = null;
  let gender: string | null = null;
  let mobile: string | null = null;

  if (session) {
    if (!dbUser.data) {
      // User not found in database - redirect to error page
      // This should not happen if Clerk webhook is properly configured
      redirect(`/sign-in?error=user-not-found`);
    }
    onboardingStatus = dbUser.data.onboardingStatus;
    firstName = dbUser.data.firstName;
    lastName = dbUser.data.lastName;
    dob = dbUser.data.dob ? new Date(dbUser.data.dob) : null;
    gender = dbUser.data.gender;
    mobile = dbUser.data.mobile;
  }

  return (
    <div className={`${plusJakartaSans.className}`}>
      {!!session && (
        <OnboardingGuard
          onboardingStatus={onboardingStatus}
          firstName={firstName}
          lastName={lastName}
          dob={dob}
          gender={gender}
          mobile={mobile}
        />
      )}
      {children}
    </div>
  );
}
