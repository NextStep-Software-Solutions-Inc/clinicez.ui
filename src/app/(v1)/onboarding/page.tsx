import { redirect } from "next/navigation";
import { getCachedSession } from "@actions/session.action";
import { getUserOnboardingDataAction } from "@/actions/onboarding/user-onboarding.action";
import UserOnboardingPage from "@/components/onboarding/UserOnboardingPage";

export const metadata = {
  title: "Onboarding | Clinic EZ",
  description: "Complete your profile setup",
};

export default async function OnboardingPage() {
  const session = await getCachedSession();
  if (!session) {
    redirect("/sign-in");
  }

  const result = await getUserOnboardingDataAction();

  if (!result.status || !result.data) {
    redirect("/sign-in?error=onboarding-data-error");
  }

  // If onboarding is already completed, redirect to home
  if (result.data.onboardingStatus === "COMPLETED") {
    redirect("/");
  }

  return <UserOnboardingPage userData={result.data} />;
}
