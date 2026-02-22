"use client";

import { useEffect } from "react";
import { AlertCircle, Home } from "lucide-react";
import { Button } from "@components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ClinicDashboardError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error to error reporting system
    console.error("Clinic Dashboard Error:", error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[400px] p-4">
      <Card className="w-full max-w-md border-destructive/50 bg-destructive/5">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <AlertCircle className="h-10 w-10 text-destructive" />
          </div>
          <CardTitle className="text-destructive">Oops! Something went wrong</CardTitle>
          <CardDescription className="mt-2">
            We encountered an error while loading the clinic dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground overflow-auto max-h-24">
            <p className="font-mono text-xs">{error.message || "Unknown error"}</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={reset} className="flex-1" variant="default">
              Try Again
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <a href="/v2/dashboard">
                <Home className="h-4 w-4 mr-2" />
                Go Home
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
