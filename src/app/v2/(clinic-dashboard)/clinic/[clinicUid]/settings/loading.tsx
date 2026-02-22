import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function ClinicSettingsLoading() {
  return (
    <div className="space-y-6 pb-10">
      {/* Page header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-9 w-28 rounded-md" />
      </div>

      {/* Tab bar skeleton */}
      <div className="flex gap-1 border-b pb-0">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-24 rounded-t-md rounded-b-none" />
        ))}
      </div>

      {/* Tab content skeleton – mirrors the General tab layout */}
      <div className="space-y-5 pt-2">
        {/* Section card 1 */}
        <Card>
          <CardHeader className="pb-3">
            <Skeleton className="h-5 w-40 mb-1" />
            <Skeleton className="h-3.5 w-64" />
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-9 w-full rounded-md" />
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-20 w-full rounded-md" />
            </div>
          </CardContent>
        </Card>

        {/* Section card 2 */}
        <Card>
          <CardHeader className="pb-3">
            <Skeleton className="h-5 w-32 mb-1" />
            <Skeleton className="h-3.5 w-56" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="space-y-1">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-3 w-52" />
                </div>
                <Skeleton className="h-6 w-10 rounded-full flex-shrink-0" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Save button skeleton */}
        <div className="flex justify-end">
          <Skeleton className="h-9 w-28 rounded-md" />
        </div>
      </div>
    </div>
  );
}
