"use client";

import Link from "next/link"
import { cn } from "@lib/utils"
import Each from "@components/utils/Each"
import { navList } from "../../app/(process)/[organization]/nav"
import { useParams, usePathname } from "next/navigation"

export function MainNav({ className,...props }: React.HTMLAttributes<HTMLElement>) {
  const pathname = usePathname()
  const params = useParams() as { organization: string }
  const { organization } = params
  
  return (
    <nav
      className={cn("flex items-center space-x-4 lg:space-x-6", className)}
      {...props}
    >
      <Each
        of={navList.map((item) => ({...item, href: `/${organization}${item.href}`}))}
        render={(item) => (
          <Link
            href={item.href}
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary",
              item.href !== pathname && "text-muted-foreground"
            )}
          >
            {item.name}
          </Link>
        )}
      />
      
      <Link
        href={`/${organization}/settings`}
        className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
      >
        Settings
      </Link>
    </nav>
  )
}
