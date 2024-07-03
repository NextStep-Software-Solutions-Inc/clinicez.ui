"use client";

import React, { useEffect, useState } from "react";
import Each from "./utils/Each";
import { DropdownMenuItem } from "./ui/dropdown-menu";
import { User } from "lucide-react";
import { getHPsActions } from "@actions/hp.actions";
import { Skeleton } from "./ui/skeleton";

export default function HPProfilesLink({userId}: {userId: string}) {
  const [hpProfiles, setHpProfiles] = useState<Awaited<ReturnType<typeof getHPsActions>>>([]);
  const [loadingHPs, setLoadingHPs] = useState(true)
  
  useEffect(() => {
    (async () => {
      setHpProfiles(await getHPsActions({userId}));
      setLoadingHPs(false)
    })()
  },[userId])

  if (loadingHPs) return <Skeleton className="h-6 mx-2 my-1 bg-slate-400" />;
  return (
    <Each
      of={hpProfiles}
      render={(item) => (
        <a href={`/hp/profile/${item.id}?_type=${item.type}`}>
          <DropdownMenuItem>
            <User className="mr-2 h-4 w-4" />
            <span className="capitalize">My {item.type.replaceAll("_", " ").toLowerCase()} Profile</span>
            {/* <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut> */}
          </DropdownMenuItem>
        </a>
      )}
      fallback={null}
    />
  );
}
