"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@lib/utils"
import { buttonVariants } from "@components/ui/button"
import Each from "./utils/Each"

interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
  items: {
    href: string
    title: string
  }[]
}

export default function SidebarNav({ className, items, ...props }: SidebarNavProps) {
  const pathname = usePathname()

  return (
    <nav
      className={cn(
        "flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1 flex-wrap",
        className
      )}
      {...props}
    >
      <Each
        of={items}
        render={(item) => (
          <Link
            href={item.href}
            className={cn(
              buttonVariants({ variant: "ghost" }),
              pathname === item.href
                ? "bg-muted hover:bg-muted"
                : "hover:bg-transparent hover:underline",
              "justify-start"
            )}
          >
            {item.title}
          </Link>
        )}
      />
    </nav>
  )
}
