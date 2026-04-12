// components/v2/hp/HPTypeCard.tsx

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import HPTypeIcon from "./HPTypeIcon";

interface Props {
  id: number;
  name: string;
  description?: string | null;
  count: number;
}

export default function HPTypeCard({ id, name, description, count }: Props) {
  const desc = description?.trim() ? description : "No description";
  const sanitizedName = name?.trim() || `${id}`;
  const href = `/v2/hp?type=${encodeURIComponent(sanitizedName)}`;

  return (
    <Card className="flex flex-col border-none shadow-none bg-transparent">
      <CardHeader className="pb-4">
        <div className="mb-4 flex items-start">
          <div className="h-11 w-11 overflow-hidden rounded-xl flex-shrink-0">
            <HPTypeIcon name={sanitizedName} />
          </div>
        </div>
        <CardTitle className="text-xl capitalize">{name || "Unknown Title"}</CardTitle>
        <CardDescription className="text-sm line-clamp-1">
          {desc}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="flex justify-start">
          <div className="bg-primary/15 rounded-full px-3 py-1 flex items-center justify-center">
            <span className="text-xs font-medium text-accent-foreground">{count} available</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-0">
        <Link href={href} className="w-full">
          <Button className="w-full">See All</Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
