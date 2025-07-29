import { getCachedSession } from "@/actions/session.action";
import FeatureItems, { HeroTitle } from "@/components/FeatureItems";
import HeroBackground from "@/components/HeroBackground";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Home | Clinic EZ V2",
  description: "Redesigned Healthcare Management System"
};

export default async function HomePageV2() {
  const session = await getCachedSession();
  const authenticated = !!session;

  return (
    <main>
      {/* Hero Section */}
      <section className="relative h-[calc(100vh-8rem)] flex items-center justify-center">
        <HeroBackground opacity={0.2} />
        <div className="relative z-10 container mx-auto">
          <div className="mx-auto sm:px-6 lg:px-8">
            <div className="grid items-center justify-center text-center">
              <HeroTitle version="v2" authenticated={authenticated} />
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-20 overflow-hidden">
        <FeatureItems version="v2" />
      </section>
    </main>
  );
}