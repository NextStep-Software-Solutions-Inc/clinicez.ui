"use client";

import { Tooltip, TooltipContent, TooltipTrigger } from "@components/ui/tooltip";
import Each from "@components/utils/Each";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import React from "react";
import { navList } from "./nav";
import { cn } from "@lib/utils";

export default function SideNav() {
  const { organization } = useParams() as { organization: string };
  const pathname = usePathname();

  return (
    <Each
      of={navList.map((item) => ({...item, href: `/${organization}${item.href}`}))}
      render={({name, href, icon: Icon}) => (
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href={href}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8",
                href === pathname && "bg-accent text-accent-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="sr-only">{name}</span>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">{name}</TooltipContent>
        </Tooltip>
      )}
    />
  );
}
