"use client"
import { useParams, usePathname, useRouter } from "next/navigation"
import Switcher from "./Switcher"
import { Home } from "lucide-react"

interface OrganizationSwitcherProps {
  isCollapsed: boolean
}

export function OrganizationSwitcher({
  isCollapsed,
  
}: OrganizationSwitcherProps) {
  const {organization} = useParams() as { organization: string }
  const router = useRouter();
  const pathname = usePathname();

  const orgs = [
    {
      value: "hims",
      label: "Health Information Management System",
      icon: Home,
    },
    {
      value: "clinic-ez",
      label: "Clinic EZ",
      icon: Home,
    }, 
    {
      value: "my-organization",
      label: "My Organization",
      icon: Home,
    }
  ]
  
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
