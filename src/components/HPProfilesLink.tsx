"use client";

import React from "react";
import Each from "./utils/Each";
import { DropdownMenuItem } from "./ui/dropdown-menu";
import { User } from "lucide-react";
import { Skeleton } from "./ui/skeleton";
import { useHPs } from "@hooks/useHP";
import { useUser } from "@clerk/nextjs";

export default function HPProfilesLink({ userId }: { userId?: string }) {
  // If caller provides userId, use it; otherwise fall back to Clerk's client hook.
  const { user } = useUser();
  const resolvedUserId = userId ?? user?.id ?? "";

  const { data: hpProfiles, isLoading } = useHPs({ userId: resolvedUserId }, !!resolvedUserId);

  if (isLoading) return <Skeleton className="h-6 mx-2 my-1 bg-slate-400" />;
  return (
    <Each
      of={hpProfiles ?? []}
      render={(item) => (
        <a href={`/hp/${item.id}`}>
          <DropdownMenuItem>
            <User className="mr-2 h-4 w-4" />
            <span className="capitalize">My Healthcare Profile</span>
          </DropdownMenuItem>
        </a>
      )}
      fallback={null}
    />
  );
}
