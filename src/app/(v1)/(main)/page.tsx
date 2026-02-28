import { Metadata } from "next";
import { getCachedSession } from "@actions/session.action";
import { getCurrentUserAction } from "@actions/users/user.action";
import LandingPageContent from "@components/LandingPageVersionHandler";

export const metadata: Metadata = {
  title: "Home | Clinic EZ ",
  description: "Optimized Healthcare Management System",
};

export default async function HomePage() {
  const session = await getCachedSession();

  let onboardingStatus: string | null = null;
  if (session) {
    const userResult = await getCurrentUserAction();
    if (userResult.status && userResult.data) {
      onboardingStatus = userResult.data.onboardingStatus ?? null;
    }
  }

  return (
    <LandingPageContent
      authenticated={!!session}
      onboardingStatus={onboardingStatus}
    />
  );
}