"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import Link from "next/link";

interface Props {
  orgUid: string;
  name: string;
  description?: string | null;
  memberCount: number;
  logo?: string | null;
  membershipStatus?: string | null;
}

export default function OrganizationCard({
  orgUid,
  name,
  description,
  memberCount,
  logo,
  membershipStatus,
}: Props) {
  const safeDescription = description?.trim() ? description : "No description";
  const [imgError, setImgError] = useState(false);

  const membershipBadge: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    ACTIVE: { label: "Active Member", variant: "default" },
    PENDING: { label: "Application Pending", variant: "secondary" },
    SUSPENDED: { label: "Suspended", variant: "destructive" },
    INACTIVE: { label: "Inactive", variant: "outline" },
  };

  const hasMembership = !!membershipStatus;
  const badge = membershipStatus ? membershipBadge[membershipStatus] : null;
  const imgSrc = !imgError && logo ? logo : "/placeholder.svg";

  return (
    <Card className="flex flex-col border-none shadow-none bg-transparent">
      <CardHeader className="pb-4">
        <div className="aspect-square relative mb-4 overflow-hidden rounded-lg w-full">
          <Image
            src={imgSrc}
            alt={name || "Organization Image"}
            fill
            className="object-cover"
            onError={() => setImgError(true)}
          />
        </div>
        <CardTitle className="text-xl capitalize">{name}</CardTitle>
        <CardDescription className="text-sm line-clamp-1">{safeDescription}</CardDescription>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="flex flex-wrap justify-start gap-2">
          <div className="bg-primary/15 rounded-full px-3 py-1 flex items-center justify-center">
            <span className="text-xs font-medium text-accent-foreground">
              {memberCount} member{memberCount !== 1 ? "s" : ""}
            </span>
          </div>
          {badge && (
            <Badge variant={badge.variant} className="text-xs">
              {badge.label}
            </Badge>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-0">
        {hasMembership ? (
          <Link href={`/v2/organizations/${orgUid}/membership`} className="w-full">
            <Button className="w-full" variant="outline">View Membership</Button>
          </Link>
        ) : (
          <Link href={`/organizations/${orgUid}/join`} className="w-full">
            <Button className="w-full">Join</Button>
          </Link>
        )}
      </CardFooter>
    </Card>
  );
}
