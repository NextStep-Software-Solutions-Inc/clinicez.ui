import { Metadata } from "next"

import { Separator } from "@components/ui/separator"
import SidebarNav from "@components/SidebarNav"
import ConditionalRender from "@components/utils/ConditionalRender"
import { isHP, isOrgAdmin, isSameOrg, isUserOwner } from "@lib/protect-org"
import { redirect } from "next/navigation"
import { getCachedSession } from "@actions/session.action"
import { UnauthorizedWarning } from "../../../../(activation)/[organization]/membership/UnauthorizedWarning"

export const metadata: Metadata = {
  title: "PHR",
  description: "Personal Health Record",
}
interface PHRLayoutProps {
  children: React.ReactNode
  params: {
    user: string
  }
}

export default async function PHRLayout({ children, params: {user} }: PHRLayoutProps) {

  const session = await getCachedSession();
  if(!session) return redirect("/api/auth/login");
  const orgAdmin = await isOrgAdmin();
  const phrOwnerId = decodeURI(user);
  const userOwner = await isUserOwner(phrOwnerId);
  const hp = await isHP();
  const sameOrg = await isSameOrg(phrOwnerId);

  // Allow access if user is the owner, or if user is a HP or an org admin from the same org
  if (!(userOwner || (hp && sameOrg) || (orgAdmin && sameOrg))) {
    return <UnauthorizedWarning />;
  }
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
    // {
    //   title: "Disabilities",
    //   href: `/user/${user}/phr/disabilities`,
    // },
    
    // {
    //   title: "Allergies",
    //   href: `/user/${user}/phr/allergies`,
    // },
    // {
    //   title: "Medications",
    //   href: `/user/${user}/phr/medications`,
    // },
    // {
    //   title: "Insurances & HMOs",
    //   href: `/user/${user}/phr/insurances`,
    // },
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
          <ConditionalRender condition={!userOwner}>
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
