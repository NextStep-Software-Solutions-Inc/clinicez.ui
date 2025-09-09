import HeaderTitle from "@/components/HeaderTitle"
import { ContactUsForm } from "./ContactUsForm"
import HeroBackground from "@/components/HeroBackground"

interface TitleItem {
  text: string
  className?: string
  breakLine?: boolean
}

interface contactUsData {
  title: TitleItem[]
  description: string
}

const header: contactUsData = {
  title: [{ text: "Let's build something better for healthcare together", className: "text-primary" }],
  description: "Have questions or ready to get started with Clinic EZ?",
}

export default function ContactUsPage() {
  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-6rem)] px-4">
      <HeroBackground imagePath="/assets/hero-v2-1.png" opacity={0.2} />
      <div className="w-full max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-16 lg:gap-2 items-center justify-items-center">
          <div className="w-full sm:mb-2 md:mb-4 lg:mb-10 max-w-lg">
            <HeaderTitle header={header.title} description={header.description} />
          </div>
          <div className="w-full max-w-md">
            <ContactUsForm />
          </div>
        </div>
      </div>
    </div>
  )
}
