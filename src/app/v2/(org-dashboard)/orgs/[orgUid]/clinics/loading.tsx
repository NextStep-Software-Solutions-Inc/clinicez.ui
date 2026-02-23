import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function OrgClinicsLoading() {
  return (
    <div className="space-y-6 pb-10">
      {/* ── 1. Welcome header skeleton ──────────────────────────────── */}
      <div
        className="relative overflow-hidden rounded-2xl shadow-lg p-6 sm:p-8"
        style={{
          background: "hsl(175,83%,32%) / 0.05",
          border: "1px solid hsl(175,83%,50%) / 0.2",
        }}
      >
        <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <Skeleton className="h-6 w-40 rounded-full mb-3" />
            <div className="flex items-center gap-3 mb-2">
              <Skeleton className="h-11 w-11 rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-56" />
              </div>
            </div>
            <div className="flex gap-4 mt-4">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <Skeleton className="h-6 w-32 rounded-full" />
          </div>
        </div>
      </div>

      {/* ── 2. KPI row skeleton ─────────────────────────────────────── */}
      <section>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <Skeleton className="h-4 w-24 mb-2" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-2 w-full rounded-full" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ── 3. Summary strip skeleton ──────────────────────────────── */}
      <section>
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5 flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-lg flex-shrink-0" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-7 w-10" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ── 4. Clinics grid skeleton ────────────────────────────────── */}
      <div
        className="rounded-2xl border overflow-hidden"
        style={{ borderColor: "hsl(var(--color-border-light))" }}
      >
        {/* Card header */}
        <div
          className="px-5 py-4 border-b"
          style={{
            borderColor: "hsl(var(--color-border-light))",
            background: "hsl(var(--primary) / 0.06)",
          }}
        >
          <Skeleton className="h-5 w-40 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>

        <CardContent className="p-5">
          {/* Search bar skeleton */}
          <div className="flex gap-3 mb-5">
            <Skeleton className="h-9 flex-1 rounded-md" />
            <Skeleton className="h-9 w-20 rounded-lg" />
          </div>

          {/* Clinic cards skeleton */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card
                key={i}
                className="border"
                style={{ borderColor: "hsl(var(--color-border-light))" }}
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <Skeleton className="h-12 w-12 rounded-xl flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-5 w-14 rounded-full flex-shrink-0" />
                      </div>
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-24" />
                      <div className="flex gap-3 mt-2">
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t"
                        style={{ borderColor: "hsl(var(--color-border-light))" }}>
                        <Skeleton className="h-3 w-28" />
                        <Skeleton className="h-7 w-16 rounded-md" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </div>

      {/* ── 5. Status footer skeleton ──────────────────────────────── */}
      <footer
        className="rounded-xl border px-5 py-3.5"
        style={{ borderColor: "hsl(var(--color-border-light))" }}
      >
        <div className="space-y-2 sm:flex sm:justify-between sm:gap-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-72" />
        </div>
      </footer>
    </div>
  );
}
