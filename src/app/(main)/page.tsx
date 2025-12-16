import { Metadata } from "next";
import { getCachedSession } from "@actions/session.action";
import LandingPageContent from "@components/LandingPageVersionHandler";

export const metadata: Metadata = {
  title: "Home | Clinic EZ ",
  description: "Optimized Healthcare Management System",
};

export default async function HomePage() {
  const session = await getCachedSession();
  const authenticated = !!session
  
  return <LandingPageContent authenticated={authenticated} />;
}