"use client"

import { useParams, usePathname, useRouter } from "next/navigation"
import Switcher, { SwitcherOptionsType } from "../dashboard/Switcher"
import { Building } from "lucide-react"
import { useClinics } from "@/hooks/useClinic"

interface ClinicSwitcherProps {
  isCollapsed: boolean
  userId: string
}

export function ClinicSwitcher({isCollapsed,userId}: ClinicSwitcherProps) {
  const {clinicUid} = useParams<{clinicUid: string}>()
  const router = useRouter();
  const pathname = usePathname();
  const {data: myClinics} = useClinics({
    userId,
  })  
  
  const clinics: SwitcherOptionsType[] = (myClinics?.data ?? [])
    .map(org => ({
      label: org.name,
      value: org.clinicUid,
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
    router.replace(pathname.replace(clinicUid, newValue).concat("?", searchParams.toString()))
  }

  return (
    <Switcher
      value={clinicUid}
      onSwitch={handleChangeOrganization}
      isCollapsed={isCollapsed}
      options={clinics}
    />
  )
}
