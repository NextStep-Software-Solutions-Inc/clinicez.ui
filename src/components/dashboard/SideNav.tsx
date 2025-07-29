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
  params: string[]
  navItems: {
    name: string;
    href?: string;
    icon: keyof typeof dynamicIconImports;
    items?: { name: string; href: string, icon?: keyof typeof dynamicIconImports, description: string }[]
  }[];
}
export default function SideNav({ navItems, params: paramArray }: SideNavProps) {
  const pathname = usePathname();
  const params = useParams();
  
  const mappedNavItems = useMemo(() => {
    return navItems.map((item) => ({
      ...item,
      href: `/${paramArray[0]}/${params[paramArray[1]]}${item.href}`
    }));
  }, [navItems, paramArray, params]);

  return (
    <Each
      of={mappedNavItems}
      render={(item, index) => (
        <Tooltip key={`${item.name}-${index}`} delayDuration={100}>
          <TooltipTrigger asChild>
            <Link
              href={item.href || "#"}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8",
                item.href === pathname && "bg-accent text-accent-foreground"
              )}
            >
              <Icon
                name={item.icon}
                className="h-5 w-5"
              />
              <span className="sr-only">{item.name}</span>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">{item.name}</TooltipContent>
        </Tooltip>
      )}
    />
  );
}
