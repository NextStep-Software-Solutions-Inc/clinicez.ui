import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function OrgMembersLoading() {
  return (
    <div className="space-y-4 pb-10">
      {/* ── Header card skeleton ──────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2 mb-1">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-5 w-44" />
          </div>
          <Skeleton className="h-4 w-28" />
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Search + filters row */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Skeleton className="h-9 flex-1 rounded-md" />
            <Skeleton className="h-9 w-full sm:w-40 rounded-md" />
            <Skeleton className="h-9 w-full sm:w-44 rounded-md" />
          </div>
        </CardContent>
      </Card>

      {/* ── Member rows skeleton ──────────────────────────────── */}
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />

                {/* Info */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                  <div className="flex gap-3">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>

                {/* Action button */}
                <Skeleton className="h-8 w-8 rounded-md flex-shrink-0" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Pagination skeleton ──────────────────────────────── */}
      <div className="flex items-center justify-between pt-2">
        <Skeleton className="h-4 w-32" />
        <div className="flex gap-1">
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
      </div>
    </div>
  );
}
