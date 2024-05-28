"use client";

import Each from "@components/utils/Each";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import React from "react";
import { navList } from "./nav";
import { cn } from "@lib/utils";


export default function DrawerNav() {
  const { organization } = useParams() as { organization: string };
  const pathname = usePathname();
  return (
    <Each
      of={navList.map((item) => ({...item, href: `/${organization}${item.href}`}))}
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
