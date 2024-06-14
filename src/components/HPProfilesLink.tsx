"use client";

import React, { useEffect, useState } from "react";
import Each from "./utils/Each";
import { DropdownMenuItem } from "./ui/dropdown-menu";
import { User } from "lucide-react";
import { useUser } from "@auth0/nextjs-auth0/client";
import { getHPsActions } from "@actions/hp.actions";

export default function HPProfilesLink() {
  const [hpProfiles, setHpProfiles] = useState<Awaited<ReturnType<typeof getHPsActions>>>([]);
  const { user } = useUser();
  
  useEffect(() => {
    (async () => {
      if(user?.sub) setHpProfiles(await getHPsActions({userId: user?.sub ?? ""}))
    })()
  },[user?.sub])

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
