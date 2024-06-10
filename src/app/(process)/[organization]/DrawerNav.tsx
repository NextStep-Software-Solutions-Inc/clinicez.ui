"use client";

import Each from "@components/utils/Each";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import { cn } from "@lib/utils";

interface DrawerNavProps {
  navItems: {
    name: string;
    href: string;
    icon: React.ElementType;
  }[];
}

export default function DrawerNav({ navItems }: DrawerNavProps) {
  const pathname = usePathname();
  return (
    <Each
      of={navItems}
      render={({name, href, icon:Icon}) => (
        <Link
          href={href}
          className={cn(
            "flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground",
            href === pathname && "text-foreground"
          )}
        >
          <Icon className="h-5 w-5" />
          {name}
        </Link>
      )}
    />
  );
}
