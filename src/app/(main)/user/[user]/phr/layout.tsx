import { Metadata } from "next"

import { Separator } from "@components/ui/separator"
import SidebarNav from "@components/SidebarNav"
import ConditionalRender from "@components/utils/ConditionalRender"
import { isUserOwner } from "@lib/protect-org"
import { getSession } from "@auth0/nextjs-auth0"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "PHR",
  description: "Personal Health Record",
}


interface SettingsLayoutProps {
  children: React.ReactNode
  params: {
    organization: string,
    user: string
  }
}

export default async function SettingsLayout({ children, params: {user} }: SettingsLayoutProps) {

  const session = await getSession();
  if(!session) return redirect("/api/auth/login");
  
  const sidebarNavItems = [
    {
      title: "Personal Information",
      href: `/user/${user}/phr`,
    },
    {
      title: "Emergency Contact",
      href: `/user/${user}/phr/emergency-contact`,
    },
    {
      title: "Address",
      href: `/user/${user}/phr/address`,
    },
    {
      title: "Vaccination & Immunization",
      href: `/user/${user}/phr/vaccination-immunization`,
    },
    {
      title: "Disabilities",
      href: `/user/${user}/phr/disabilities`,
    },
    
    {
      title: "Allergies",
      href: `/user/${user}/phr/allergies`,
    },
    {
      title: "Medications",
      href: `/user/${user}/phr/medications`,
    },
    {
      title: "Insurances & HMOs",
      href: `/user/${user}/phr/insurances`,
    },
    {
      title: "Files",
      href: `/user/${user}/phr/files`,
    }
  ]
  
  return (
    <div className="space-y-6 p-10 pb-16">
      <div className="space-y-0.5">
        <h2 className="text-2xl font-bold tracking-tight">
          Personal Health Record 
          <ConditionalRender condition={!await isUserOwner(decodeURI(user))}>
            <span className="text-primary text-base italic mx-2">(View Only)</span>
          </ConditionalRender>
        </h2>
        <p className="text-muted-foreground">
            Manage your personal health record and track your health.
        </p>
      </div>
      <Separator className="my-6" />
      <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
        <aside className="-mx-4 lg:w-1/5">
          <SidebarNav items={sidebarNavItems} />
        </aside>
        <div className="flex-1 lg:max-w-5xl">{children}</div>
      </div>
    </div>
  )
}
