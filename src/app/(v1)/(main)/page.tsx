import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCachedSession } from "@actions/session.action";
import { getCurrentUserAction } from "@actions/users/user.action";

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

  if (session && isPostSignIn) {
    const userResult = await getCurrentUserAction();
    const onboardingStatus =
      userResult.status && userResult.data ? (userResult.data.onboardingStatus ?? null) : null;
    const isIncomplete =
      !onboardingStatus || onboardingStatus === "NOT_STARTED" || onboardingStatus === "IN_PROGRESS";
    if (isIncomplete) {
      redirect("/onboarding");
    } else {
      redirect("/v2/select-dashboard");
    }
  }

  redirect("/v2");
}