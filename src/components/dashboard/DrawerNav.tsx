"use client";

import Each from "@components/utils/Each";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import { cn } from "@lib/utils";
import dynamicIconImports from "lucide-react/dynamicIconImports";
import Icon from "@components/Icon";

interface DrawerNavProps {
  navItems: {
    name: string;
    href?: string;
    icon: keyof typeof dynamicIconImports;
    items?: { name: string; href: string, icon?: keyof typeof dynamicIconImports, description: string }[]
  }[];
}

export default function DrawerNav({ navItems }: DrawerNavProps) {
  const pathname = usePathname();

  return (
    <Each
      of={navItems}
      render={({ name, href, icon, items }) => {
        return (
          <>
            {
              !!href
                ? (
                  <Link
                    href={href}
                    className={cn(
                      "flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground",
                      href === pathname && "text-foreground"
                    )}
                    legacyBehavior>
                    <Icon name={icon}  className="h-5 w-5" />
                    {name}
                  </Link>)
                : (
                  
                  <Each
                    of={items ?? []}
                    render={({ name, icon = "layout-dashboard", href}) => {
                      return (
                        <Link
                          href={href}
                          className={cn(
                            "flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground",
                            href === pathname && "text-foreground"
                          )}
                          legacyBehavior>
                          {!!icon && <Icon name={icon} className="h-5 w-5"/>}
                          {name}
                        </Link>
                      );
                    }}
                  /> 

                )
            }
          </>
        );
      }}
    />
  );
}
