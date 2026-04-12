"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";

interface Props {
  clinicUid: string;
  name: string;
  description?: string | null;
  memberCount: number;
  logo?: string | null;
}

export default function ClinicCard({
  clinicUid,
  name,
  description,
  memberCount,
  logo,
}: Props) {
  const desc = description?.trim() ? description : "No description";
  const [imgError, setImgError] = useState(false);
  const imgSrc = !imgError && logo ? logo : "/placeholder.svg";

  return (
    <Card className="flex flex-col border-none shadow-none bg-transparent">
      <CardHeader className="pb-4">
        <div className="aspect-square relative mb-4 overflow-hidden rounded-lg w-full">
          <Image
            src={imgSrc}
            alt={name || "Clinic Image"}
            fill
            className="object-cover"
            onError={() => setImgError(true)}
          />
        </div>
        <CardTitle className="text-xl capitalize">{name}</CardTitle>
        <CardDescription className="text-sm line-clamp-1">{desc}</CardDescription>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="flex justify-start">
          <div className="bg-primary/15 rounded-full px-3 py-1 flex items-center justify-center">
            <span className="text-xs font-medium text-accent-foreground">
              {memberCount} member{memberCount !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-0">
        <Link href={`/clinics/${clinicUid}`} className="w-full">
          <Button className="w-full">See All</Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
