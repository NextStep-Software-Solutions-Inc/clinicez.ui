import { Metadata } from "next";
import { getCachedSession } from "@actions/session.action";
import { getCurrentUserAction } from "@actions/users/user.action";
import LandingPageContent from "@components/LandingPageVersionHandler";

export const metadata: Metadata = {
  title: "Home | Clinic EZ ",
  description: "Optimized Healthcare Management System",
};

interface HomePageProps {
  searchParams: Promise<{ signin?: string }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const session = await getCachedSession();
  const params = await searchParams;
  const isPostSignIn = params.signin === "1";

  let onboardingStatus: string | null = null;
  if (session && isPostSignIn) {
    const userResult = await getCurrentUserAction();
    if (userResult.status && userResult.data) {
      onboardingStatus = userResult.data.onboardingStatus ?? null;
    }
  }

  return (
    <LandingPageContent
      authenticated={!!session}
      onboardingStatus={onboardingStatus}
      isPostSignIn={isPostSignIn}
    />
  );
}