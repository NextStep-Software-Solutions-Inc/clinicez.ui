import HeaderTitle from "@/components/HeaderTitle"
import HeroBackground from "@/components/HeroBackground"
import TermsOfServiceContent from "@/components/TermsOfServiceContent"

interface TitleItem {
  text: string
  className?: string
  breakLine?: boolean
}

interface TermsData {
  title: TitleItem[]
  description: string
}

const header: TermsData = {
  title: [{ text: "Terms of Service", className: "text-primary" }],
  description: "Please read these terms carefully before using ClinicEZ",
}

export const metadata = {
  title: "Terms of Service | ClinicEZ",
  description: "Terms and Conditions for using ClinicEZ healthcare management platform",
}

export default function TermsPage() {
  return (
    <div className="min-h-screen px-4 py-12">
      <HeroBackground imagePath="/assets/hero-v2-1.png" opacity={0.2} />
      <div className="w-full max-w-4xl mx-auto">
        <div className="mb-12">
          <HeaderTitle header={header.title} description={header.description} />
        </div>
        <TermsOfServiceContent />
      </div>
    </div>
  )
}
