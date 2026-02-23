import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function OrgMembersLoading() {
  return (
    <div className="space-y-6 p-4 sm:p-6 pb-10">
      {/* Page header skeleton */}
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-9 w-32 rounded-md" />
      </div>

      {/* Filters skeleton */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Skeleton className="h-9 flex-1 max-w-xs rounded-md" />
        <Skeleton className="h-9 w-36 rounded-md" />
        <Skeleton className="h-9 w-32 rounded-md" />
      </div>

      {/* Status tabs skeleton */}
      <div className="flex gap-1 border-b pb-0 overflow-x-auto">
        {["All", "Active", "Pending", "Suspended"].map((tab) => (
          <Skeleton key={tab} className="h-9 w-20 rounded-t-md rounded-b-none flex-shrink-0" />
        ))}
      </div>

      {/* Member cards skeleton */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        </CardHeader>
        <CardContent className="space-y-2 pt-0">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-lg border p-3"
            >
              {/* Avatar */}
              <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />

              {/* Name + meta */}
              <div className="flex-1 min-w-0 space-y-1.5">
                <Skeleton className="h-4 w-44" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>

              {/* Badges + action */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-8 w-8 rounded-md" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
