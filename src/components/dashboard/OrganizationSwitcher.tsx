"use client"

import { cn } from "@lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select"
import { useEffect, useState } from "react"
import Each from "../utils/Each"
import { useParams, usePathname, useRouter } from "next/navigation"

interface OrganizationSwitcherProps {
  isCollapsed: boolean
  onChangeOrganization?: (id: string) => void
  accounts: {
    uid: string
    label: string
    name: string
    icon: React.ReactNode
  }[]
}

export function OrganizationSwitcher({
  isCollapsed,
  accounts,
  onChangeOrganization
}: OrganizationSwitcherProps) {
  const {organization} = useParams() as { organization: string }
  const [selectedOrg, setSelectedAccount] = useState<string>(organization)
  const router = useRouter();
  const pathname = usePathname();

  
  const handleChangeOrganization = (uid: string) => {
    const org = accounts.find((account) => account.uid === uid)
    if(!org) throw new Error("Invalid organization id")
    setSelectedAccount(prevUid => {
      router.push(pathname.replace(prevUid, org.uid))
      return org.uid
    })
    onChangeOrganization?.(org.uid)
  }

  const currentOrg = accounts.find((account) => account.uid === selectedOrg)
  return (
    <Select defaultValue={selectedOrg} onValueChange={handleChangeOrganization}>
      <SelectTrigger
        className={cn(
          "flex items-center gap-2 [&>span]:line-clamp-1 [&>span]:flex [&>span]:w-full [&>span]:items-center [&>span]:gap-1 [&>span]:truncate [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0",
          isCollapsed &&
            "flex h-9 w-9 shrink-0 items-center justify-center p-0 [&>span]:w-auto [&>svg]:hidden"
        )}
        aria-label="Select account"
      >
        <SelectValue placeholder="Select an account">
          {currentOrg?.icon}
          <span className={cn("ml-2", isCollapsed && "hidden")}>
            {currentOrg?.label}
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <Each
          of={accounts}
          render={(account) => (
            <SelectItem value={account.uid}>
              <div className="flex items-center gap-3 [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0 [&_svg]:text-foreground">
                {account.icon}
                {account.name}
              </div>
            </SelectItem>
          )}
        />
      </SelectContent>
    </Select>
  )
}
