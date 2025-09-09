import HeaderTitle from "@/components/HeaderTitle"
import { getHPTypeCounts } from "@/actions/hp.actions"
import SearchPaginatedList from "@/components/v2/SearchPaginatedList"
import HPTypeCard from "@/components/v2/hp/HPTypeCard"
import HPTypeListShell from "@/components/v2/hp/HPTypeListShell"
import Suspend from "@/components/Suspend"
import HeroBackground from "@/components/HeroBackground"

const header = {
  title: [{ text: "Meet our Healthcare Providers", className: "text-primary" }],
  description:
    "Our Healthcare Providers are equipped with the latest technology to provide you with the best care possible.",
}

export default async function HealthcareProvidersPage() {

  const hpFields = await getHPTypeCounts();

  return (
    <div className="container mx-auto px-8 py-8 space-y-8 max-w-7xl">
      <HeroBackground imagePath="/assets/hero-v2-1.png" opacity={0.2} />
      <HeaderTitle header={header.title} description={header.description} className="text-center" />
      <div className="container mx-auto px-8 py-8 max-w-7xl space-y-8">
        <Suspend>
          <HPTypeListShell data={hpFields} />
        </Suspend>
      </div>
    </div>
  )
}
