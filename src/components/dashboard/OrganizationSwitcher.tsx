"use client"
import { useParams, usePathname, useRouter } from "next/navigation"
import Switcher, { SwitcherOptionsType } from "./Switcher"
import { Building, Home } from "lucide-react"
import { getMyDefaultOrganizationAction, getOrganizationsAction } from "@actions/organization.action"
import { useEffect, useState } from "react"
import { useUser } from "@auth0/nextjs-auth0/client"

interface OrganizationSwitcherProps {
  isCollapsed: boolean
}


export function OrganizationSwitcher({isCollapsed,}: OrganizationSwitcherProps) {
  const {organization} = useParams() as { organization: string }
  const router = useRouter();
  const pathname = usePathname();
  const [myOrgs, setMyOrgs] = useState<Awaited<ReturnType<typeof getOrganizationsAction>>>([])
  

  useEffect(() => {
    (async () => {
      setMyOrgs(await getOrganizationsAction())
    })()
  }, [])

  const orgs: SwitcherOptionsType[] = myOrgs.map(org => ({
    label: org.name,
    value: org.orgId,
    icon: Building
  }))
   
  
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
