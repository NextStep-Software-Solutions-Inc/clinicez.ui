"use client"
import { useParams, usePathname, useRouter } from "next/navigation"
import Switcher, { SwitcherOptionsType } from "../dashboard/Switcher"
import { Building } from "lucide-react"
import { useUser } from "@auth0/nextjs-auth0/client"
import { useOrgMembers } from "@/hooks/useOrgMember"

interface OrganizationSwitcherProps {
  isCollapsed: boolean
}


export function OrganizationSwitcher({ isCollapsed, }: OrganizationSwitcherProps) {
  const { orgUid } = useParams<{ orgUid: string }>()
  const router = useRouter();
  const pathname = usePathname();
  const user = useUser()
  const { data: myOrgs } = useOrgMembers({
    userId: user.user?.sub ?? undefined,
    status: ["ACTIVE"]
  }, !!user.user?.sub)

  const orgs: SwitcherOptionsType[] = (myOrgs?.data?.data ?? []).filter(o => ["ACTIVE"].includes(o.status))
    .map(org => ({
      label: org.Organization.name,
      value: org.Organization.orgUid,
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
    const searchParams = new URLSearchParams(window.location.search);
    router.replace(pathname.replace(orgUid, newValue).concat("?", searchParams.toString()))
  }

  return (
    <Switcher
      value={orgUid}
      onSwitch={handleChangeOrganization}
      isCollapsed={isCollapsed}
      options={orgs}
    />
  )
}
