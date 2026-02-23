import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function OrgClinicsLoading() {
  return (
    <div className="space-y-6 pb-10">
      {/* Header skeleton */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-52" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
      </div>

      {/* Search bar skeleton */}
      <Skeleton className="h-9 w-full max-w-sm rounded-md" />

      {/* Clinic cards grid skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-start gap-3">
                <Skeleton className="h-12 w-12 rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-5 w-16 rounded-full flex-shrink-0" />
                  </div>
                  <Skeleton className="h-3.5 w-16" />
                </div>
              </div>
              <Skeleton className="h-4 w-full mt-2" />
              <Skeleton className="h-4 w-3/4" />
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                {Array.from({ length: 4 }).map((_, j) => (
                  <Skeleton key={j} className="h-4 w-full" />
                ))}
              </div>
              <div className="flex gap-1.5">
                <Skeleton className="h-5 w-24 rounded-full" />
                <Skeleton className="h-5 w-28 rounded-full" />
              </div>
              <Skeleton className="h-8 w-full rounded-md" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
