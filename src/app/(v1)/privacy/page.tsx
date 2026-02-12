import HeaderTitle from "@/components/HeaderTitle"
import HeroBackground from "@/components/HeroBackground"
import PrivacyPolicyContent from "@/components/PrivacyPolicyContent"

interface TitleItem {
  text: string
  className?: string
  breakLine?: boolean
}

interface PrivacyData {
  title: TitleItem[]
  description: string
}

const header: PrivacyData = {
  title: [{ text: "Privacy Policy", className: "text-primary" }],
  description: "Protecting your data and privacy is our commitment",
}

export const metadata = {
  title: "Privacy Policy | ClinicEZ",
  description: "Learn how ClinicEZ collects, uses, and protects your personal information",
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen px-4 py-12">
      <HeroBackground imagePath="/assets/hero-v2-1.png" opacity={0.2} />
      <div className="w-full max-w-4xl mx-auto">
        <div className="mb-12">
          <HeaderTitle header={header.title} description={header.description} />
        </div>
        <PrivacyPolicyContent />
      </div>
    </div>
  )
}
