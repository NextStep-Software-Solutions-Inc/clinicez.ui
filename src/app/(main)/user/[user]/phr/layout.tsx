import { Metadata } from "next"

import { Separator } from "@components/ui/separator"
import SidebarNav from "@components/SidebarNav"
import ConditionalRender from "@components/utils/ConditionalRender"
import { isHP, isOrgAdmin, isSameOrg, isUserOwner } from "@lib/org-utils"
import { redirect } from "next/navigation"
import { getCachedSession } from "@actions/session.action"

export const metadata: Metadata = {
  title: "PHR",
  description: "Personal Health Record",
}
interface PHRLayoutProps {
  children: React.ReactNode
  params: Promise<{
    user: string
  }>
}

export default async function PHRLayout(props: PHRLayoutProps) {
  const params = await props.params;

  const {
    user
  } = params;

  const {
    children
  } = props;

  const phrOwnerId = decodeURI(user)
  const [session, userOwner] = await Promise.all([
    getCachedSession(),
    isUserOwner(phrOwnerId)
  ]);

  if (!session) return redirect("/auth/login");

  try {
    // Check if the user is the owner of the PHR
    if (!userOwner) {
      const sameOrg = await isSameOrg(phrOwnerId);
      // Check if the user is same org as the PHR owner

      if (!sameOrg) throw new Error("You must be same organization as the PHR owner to view this page.");
      else {
        const [orgAdmin, hp] = await Promise.all([
          isOrgAdmin(),
          isHP()
        ]);
        if (!orgAdmin && !hp) throw new Error("You must be an organization admin and healthcare provider to view this page.");
      }
    }
  }
  catch (e) {
    console.error(e);
    redirect("/unauthorized");
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
      title: "PhilHealth eKonsulta",
      href: `/user/${user}/phr/philhealth`,
    },
    {
      title: "Immunization & Vaccination",
      href: `/user/${user}/phr/immunization`,
    },
    {
      title: "Vaccination & Immunization",
      href: `/user/${user}/phr/vaccination-immunization`,
    },
    {
      title: "Disabilities & Illnesses",
      href: `/user/${user}/phr/disabilities`,
    },
    {
      title: "Allergies",
      href: `/user/${user}/phr/allergies`,
    },
    {
      title: "Vital Signs & Anthropometric Measurements",
      href: `/user/${user}/phr/vitals`,
    },
    {
      title: "Medications",
      href: `/user/${user}/phr/medications`,
    },
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
    <div className="container space-y-6 p-5 md:p-10 pb-16">
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
