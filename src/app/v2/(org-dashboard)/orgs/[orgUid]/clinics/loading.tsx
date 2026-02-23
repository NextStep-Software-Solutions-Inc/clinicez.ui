import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function OrgClinicsLoading() {
  return (
    <div className="space-y-6 pb-10">
      {/* ── Summary KPI strip skeleton ──────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-5 flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-lg flex-shrink-0" />
              <div className="space-y-1.5">
                <Skeleton className="h-3.5 w-20" />
                <Skeleton className="h-7 w-10" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Filter bar skeleton ──────────────────────────────────── */}
      <Card>
        <CardHeader className="px-5 py-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="h-7 w-7 rounded-lg" />
              <Skeleton className="h-5 w-32" />
            </div>
            <Skeleton className="h-4 w-20" />
          </div>
        </CardHeader>
        <CardContent className="p-5">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Skeleton className="h-9 flex-1 rounded-md" />
            <Skeleton className="h-9 w-full sm:w-40 rounded-md" />
          </div>
        </CardContent>
      </Card>

      {/* ── Clinic card grid skeleton ────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-5 flex flex-col gap-4">
              {/* Header */}
              <div className="flex items-start gap-3">
                <Skeleton className="h-12 w-12 rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-5 w-14 rounded-full" />
                  </div>
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              </div>
              {/* Meta */}
              <div className="space-y-1.5">
                <Skeleton className="h-3 w-40" />
                <Skeleton className="h-3 w-36" />
              </div>
              {/* Stats row */}
              <div className="grid grid-cols-3 gap-2 pt-1 border-t">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="flex flex-col items-center gap-1">
                    <Skeleton className="h-4 w-4 rounded" />
                    <Skeleton className="h-5 w-8" />
                    <Skeleton className="h-2.5 w-12" />
                  </div>
                ))}
              </div>
              {/* Feature tags */}
              <div className="flex gap-1.5">
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-5 w-24 rounded-full" />
              </div>
              {/* Footer */}
              <div className="flex items-center justify-between pt-1 border-t">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-7 w-16 rounded-md" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
