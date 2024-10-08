import { Metadata } from "next";
import { getCachedSession } from "@actions/session.action";
import FeatureItems, { HeroImage, HeroTitle } from "@components/FeatureItems";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Home | Clinic EZ ",
  description: "Optimized Healthcare Management System",
};

export default async function HomePage() {
  
  const session = await getCachedSession();
  const authenticated = !!session  
  return (
    <main className="flex flex-col ">
      <section className="flex-1 lg:bg-gradient-to-l from-[#6DEBF4] via-[#C3FBFF] to-[#D3FCFF] bg-opacity-30 ">
        <div className="relative container mx-auto p-4 py-56">
          <div className="mx-auto sm:px-6 lg:px-8">
            <div className="grid items-center grid-cols-1 gap-2 lg:grid-cols-2 ">
              <HeroTitle authenticated={authenticated}/>
              <HeroImage/>
            </div>
          </div>
        </div>
      </section>
      <section className="overflow-hidden">
        <FeatureItems/>
      </section>
    </main>
  );
}
