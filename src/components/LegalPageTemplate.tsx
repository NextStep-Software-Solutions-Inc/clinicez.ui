import HeaderTitle from "@/components/HeaderTitle"
import HeroBackground from "@/components/HeroBackground"
import React from "react"

interface TitleItem {
  text: string
  className?: string
  breakLine?: boolean
}

interface LegalPageSection {
  id: string
  title: string
  content: React.ReactNode
}

interface LegalPageProps {
  pageTitle: string
  pageDescription: string
  sections: LegalPageSection[]
  footerLinks?: {
    label: string
    href: string
  }[]
}

export default function LegalPageTemplate({
  pageTitle,
  pageDescription,
  sections,
  footerLinks = [{ label: "Privacy Policy", href: "/privacy" }],
}: LegalPageProps) {
  const header: { title: TitleItem[]; description: string } = {
    title: [{ text: pageTitle, className: "text-primary" }],
    description: pageDescription,
  }

  return (
    <div className="min-h-screen px-4 py-12">
      <HeroBackground imagePath="/assets/hero-v2-1.png" opacity={0.2} />
      <div className="w-full max-w-4xl mx-auto">
        <div className="mb-12">
          <HeaderTitle header={header.title} description={header.description} />
        </div>

        <div className="prose prose-lg max-w-none text-gray-700">
          <p className="text-sm text-gray-500 mb-8">Last updated: January 2026</p>

          {sections.map((section) => (
            <section key={section.id} className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {section.title}
              </h2>
              {section.content}
            </section>
          ))}

          <div className="mt-12 pt-8 border-t border-gray-300">
            <p className="text-sm text-gray-500 text-center">
              © 2026 PointersBit Inc. All rights reserved.{" "}
              {footerLinks.map((link, index) => (
                <React.Fragment key={link.href}>
                  {index > 0 && " | "}
                  <a href={link.href} className="text-primary hover:underline">
                    {link.label}
                  </a>
                </React.Fragment>
              ))}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
