import { Metadata } from "next"
import Image from "next/image"

import { Separator } from "@components/ui/separator"
import { PHRSidebarNav } from "@components/PHRSidebarNav"

export const metadata: Metadata = {
  title: "PHR",
  description: "Personal Health Record",
}


interface SettingsLayoutProps {
  children: React.ReactNode
  params: {
    organization: string
  }
}

export default function SettingsLayout({ children, params: {organization} }: SettingsLayoutProps) {
  
  const sidebarNavItems = [
    {
      title: "Personal Information",
      href: `/${organization}/phr`,
    },
    {
      title: "Contact",
      href: `/${organization}/phr/contact-information`,
    },
    {
      title: "Address",
      href: `/${organization}/phr/address`,
    },
    {
      title: "Vaccination & Immunization",
      href: `/${organization}/phr/vaccination-immunization`,
    },
    {
      title: "Disabilities",
      href: `/${organization}/phr/disabilities`,
    },
  ]
  
  return (
    <>
      <div className="md:hidden">
        <Image
          src="/examples/forms-light.png"
          width={1280}
          height={791}
          alt="Forms"
          className="block dark:hidden"
        />
        <Image
          src="/examples/forms-dark.png"
          width={1280}
          height={791}
          alt="Forms"
          className="hidden dark:block"
        />
      </div>
      <div className="hidden space-y-6 p-10 pb-16 md:block">
        <div className="space-y-0.5">
          <h2 className="text-2xl font-bold tracking-tight">Personal Health Record</h2>
          <p className="text-muted-foreground">
            Manage your personal health record and track your health.
          </p>
        </div>
        <Separator className="my-6" />
        <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
          <aside className="-mx-4 lg:w-1/5">
            <PHRSidebarNav items={sidebarNavItems} />
          </aside>
          <div className="flex-1 lg:max-w-2xl">{children}</div>
        </div>
      </div>
    </>
  )
}
