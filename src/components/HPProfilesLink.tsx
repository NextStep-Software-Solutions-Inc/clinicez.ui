"use client";

import React from "react";
import Each from "./utils/Each";
import { DropdownMenuItem } from "./ui/dropdown-menu";
import { User } from "lucide-react";
import { Skeleton } from "./ui/skeleton";
import { useHPs } from "@hooks/useHP";

export default function HPProfilesLink({userId}: {userId: string}) {
  
  const {data: hpProfiles, isLoading} = useHPs({userId}, !!userId);
 
  if (isLoading) return <Skeleton className="h-6 mx-2 my-1 bg-slate-400" />;
  return (
    <Each
      of={hpProfiles ?? []}
      render={(item) => (
        <a href={`/hp/${item.id}`}>
          <DropdownMenuItem>
            <User className="mr-2 h-4 w-4" />
            <span className="capitalize">My {item.HPType.name.replaceAll("_", " ").toLowerCase()} Profile</span>
          </DropdownMenuItem>
        </a>
      )}
      fallback={null}
    />
  );
}
