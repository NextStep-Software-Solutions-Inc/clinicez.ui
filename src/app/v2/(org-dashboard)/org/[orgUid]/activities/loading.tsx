import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function OrgActivitiesLoading() {
  return (
    <div className="space-y-5 p-4 md:p-6">
      {/* ── Header skeleton ── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-7 w-52" />
          </div>
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-8 w-24 rounded-md self-start" />
      </div>

      {/* ── Filters skeleton ── */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <Skeleton className="h-4 w-16" />
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="flex flex-wrap gap-3">
            <Skeleton className="h-8 w-44 rounded-md" />
            <Skeleton className="h-8 w-44 rounded-md" />
            <Skeleton className="h-8 w-36 rounded-md" />
            <Skeleton className="h-8 w-36 rounded-md" />
            <Skeleton className="h-8 w-16 rounded-md" />
          </div>
        </CardContent>
      </Card>

      {/* ── Activity feed skeleton ── */}
      <Card className="overflow-hidden">
        <CardHeader className="px-4 py-3 border-b">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <div className="divide-y">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex gap-3 px-4 py-3.5">
              {/* Avatar */}
              <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
              {/* Content */}
              <div className="flex-1 space-y-1.5">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <Skeleton className="h-4 w-24" />
                </div>
                {i % 3 === 0 && (
                  <div className="flex items-center gap-1.5">
                    <Skeleton className="h-3.5 w-16 rounded" />
                    <Skeleton className="h-3 w-3" />
                    <Skeleton className="h-3.5 w-24 rounded" />
                  </div>
                )}
              </div>
              {/* Timestamp */}
              <Skeleton className="h-4 w-14 flex-shrink-0" />
            </div>
          ))}
        </div>
        {/* Footer */}
        <div className="px-4 py-2 border-t bg-muted/20">
          <Skeleton className="h-4 w-40 mx-auto" />
        </div>
      </Card>
    </div>
  );
}
