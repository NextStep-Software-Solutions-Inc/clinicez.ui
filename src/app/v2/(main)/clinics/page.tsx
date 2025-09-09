import HeaderTitle from "@/components/HeaderTitle";
import { getClinicsV2Action } from "@/actions/clinics/clinic.action";
import ClinicListShell from "@/components/v2/clinic/ClinicListShell";
import Suspend from "@/components/Suspend";
import HeroBackground from "@/components/HeroBackground";

export default async function ClinicsPage() {
  const clinics = await getClinicsV2Action();

  return (
    <div className="container mx-auto px-8 py-8 max-w-7xl space-y-8">
      <HeroBackground imagePath="/assets/hero-v2-1.png" opacity={0.2} />
      <HeaderTitle
        header={[{ text: "Clinics", className: "text-primary" }]}
        description="Find a clinic near you. View their services, providers."
        className="text-center"
      />
      <Suspend>
        <ClinicListShell data={clinics} />
      </Suspend>
    </div>
  );
}
