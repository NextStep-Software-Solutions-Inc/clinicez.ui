import { Metadata } from "next";
import { getCachedSession } from "@actions/session.action";
import LandingPageContent from "@components/LandingPageVersionHandler";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Home | Clinic EZ ",
  description: "Optimized Healthcare Management System",
};

export default async function HomePage() {
  const session = await getCachedSession();

  // Authenticated users coming to the home page (e.g. after Clerk redirects back
  // to "/" after sign-in) are sent to the dashboard selector instead.
  if (session) {
    redirect("/v2/select-dashboard");
  }

  return <LandingPageContent authenticated={false} />;
}