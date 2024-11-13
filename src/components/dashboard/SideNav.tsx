"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from "@components/ui/tooltip";
import Each from "@components/utils/Each";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import React, { useMemo } from "react";
import { cn } from "@lib/utils";
import Icon from "@components/Icon";
import dynamicIconImports from "lucide-react/dynamicIconImports";

interface SideNavProps {
  navItems: {
    name: string;
    href?: string;
    icon: keyof typeof dynamicIconImports;
    items?: { name: string; href: string, icon?: keyof typeof dynamicIconImports, description: string }[]
  }[];
}
export default function SideNav({ navItems }: SideNavProps) {
  const { clinicUid } = useParams<{clinicUid: string}>();
  const pathname = usePathname();

  const mappedNavItems = useMemo(() => navItems.map((item) => ({
    ...item,
    href: `/${clinicUid}${item.href}`
  })), [clinicUid, navItems]);

  return (
    <Each
      of={mappedNavItems}
      render={({ name, href, icon }) => (
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href={href}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8",
                href === pathname && "bg-accent text-accent-foreground"
              )}
            >
              <Icon
                name={icon}
                className="h-5 w-5"
              />
              <span className="sr-only">{name}</span>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">{name}</TooltipContent>
        </Tooltip>
      )}
    />
  );
}
