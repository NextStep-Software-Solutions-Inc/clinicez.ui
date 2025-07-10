import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";

interface Props {
  orgUid: string;
  name: string;
  description?: string | null;
  memberCount: number;
  logo?: string | null;
}

export default function OrganizationCard({
  orgUid,
  name,
  description,
  memberCount,
  logo,
}: Props) {
  const safeDescription = description?.trim() ? description : "No description";

  return (
    <Card className="flex flex-col border-none shadow-none bg-transparent">
      <CardHeader className="pb-4">
        <div className="aspect-square relative mb-4 overflow-hidden rounded-lg w-full">
          <Image
            src={logo || "/placeholder.svg"}
            alt={name || "Organization Image"}
            fill
            className="object-cover"
          />
        </div>
        <CardTitle className="text-xl capitalize">{name}</CardTitle>
        <CardDescription className="text-sm line-clamp-1">{safeDescription}</CardDescription>
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
        <Link href={`/organizations/${orgUid}/join`} className="w-full">
          <Button className="w-full">Join</Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
