"use client"
import { useParams, usePathname, useRouter } from "next/navigation"
import Switcher, { SwitcherOptionsType } from "./Switcher"
import { Building } from "lucide-react"
import { getUserOrganizationsAction } from "@actions/organization.action"
import { useEffect, useState } from "react"
import { useUser } from "@auth0/nextjs-auth0/client"

interface OrganizationSwitcherProps {
  isCollapsed: boolean
}


export function OrganizationSwitcher({isCollapsed,}: OrganizationSwitcherProps) {
  const {organization} = useParams() as { organization: string }
  const router = useRouter();
  const pathname = usePathname();
  const user = useUser()
  const [myOrgs, setMyOrgs] = useState<Awaited<ReturnType<typeof getUserOrganizationsAction>>>([])
  

  useEffect(() => {
    (async () => {
      if (!user.user?.sub) return
      setMyOrgs(await getUserOrganizationsAction({userId: user.user?.sub}))
    })()
  }, [user.user?.sub])

  const orgs: SwitcherOptionsType[] = myOrgs
    .filter(o => ["ACTIVE"].includes(o.status))
    .map(org => ({
      label: org.Organization.name,
      value: org.Organization.orgId,
      icon: Building
    }))
    .reduce((acc: SwitcherOptionsType[], current) => {
      const x = acc.find(item => item.value === current.value);
      if (!x) {
        return acc.concat([current]);
      } else {
        return acc;
      }
    }, []);
   
  
  const handleChangeOrganization = (newValue: string) => {
    const searchParams  = new URLSearchParams(window.location.search);
    router.replace(pathname.replace(organization, newValue).concat("?", searchParams.toString()))
  }

  return (
    <Switcher
      value={organization}
      onSwitch={handleChangeOrganization}
      isCollapsed={isCollapsed}
      options={orgs}
    />
  )
}
