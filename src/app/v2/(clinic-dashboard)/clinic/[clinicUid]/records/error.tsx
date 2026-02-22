"use client";

import { useEffect } from "react";
import { AlertCircle, ArrowLeft, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { useParams } from "next/navigation";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function RecordsError({ error, reset }: ErrorProps) {
  const params = useParams<{ clinicUid: string }>();

  useEffect(() => {
    console.error("[Records]", error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[400px] p-4">
      <Card className="w-full max-w-md border-destructive/40 bg-destructive/5">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-destructive/10">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
          </div>
          <CardTitle className="text-destructive">Failed to load records</CardTitle>
          <CardDescription className="mt-1">
            Something went wrong while fetching the clinic records.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {process.env.NODE_ENV === "development" && error.message && (
            <div className="rounded-lg bg-muted/60 p-3 text-xs font-mono text-muted-foreground overflow-auto max-h-24 break-words">
              {error.message}
            </div>
          )}

          <div className="flex gap-3">
            <Button onClick={reset} className="flex-1 gap-1.5">
              <RotateCcw className="h-4 w-4" />
              Try again
            </Button>
            <Button asChild variant="outline" className="flex-1 gap-1.5">
              <Link href={`/v2/clinic/${params?.clinicUid ?? ""}`}>
                <ArrowLeft className="h-4 w-4" />
                Dashboard
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
