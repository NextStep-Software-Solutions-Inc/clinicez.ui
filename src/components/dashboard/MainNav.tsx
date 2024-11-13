"use client";

import Link from "next/link"
import { cn } from "@lib/utils"
import Each from "@components/utils/Each"
import { usePathname } from "next/navigation"



interface DashboardNavProps {
  className?: string
  navItems: {
    name: string
    href: string
  }[]
}
export function MainNav({ className, navItems }: DashboardNavProps) {
  const pathname = usePathname()
  
  return (
    <nav
      className={cn("flex items-center space-x-4 lg:space-x-6", className)}
    >
      <Each
        of={navItems}
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
      
    </nav>
  )
}
