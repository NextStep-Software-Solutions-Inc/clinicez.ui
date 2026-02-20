import { Skeleton } from "@components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@components/ui/card";

export default function ClinicDashboardLoading() {
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
            {/* Clinic badge */}
            <Skeleton className="h-6 w-40 rounded-full mb-3" />
            {/* Greeting + name */}
            <div className="flex items-center gap-3 mb-2">
              <Skeleton className="h-11 w-11 rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-56" />
              </div>
            </div>
            {/* Date/time */}
            <div className="flex gap-4 mt-4">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          {/* Status pill + actions */}
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

      {/* ── 3. Today's schedule skeleton ──────────────────────────── */}
      <section>
        <div
          className="rounded-2xl border overflow-hidden"
          style={{ borderColor: "hsl(var(--color-border-light))" }}
        >
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
          <CardContent className="p-5 space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 p-4 rounded-xl border"
                style={{ borderColor: "hsl(var(--color-border-light))" }}
              >
                <Skeleton className="h-9 w-9 rounded-lg flex-shrink-0" />
                <Skeleton className="h-10 w-14 rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-5 w-16 rounded-full flex-shrink-0" />
              </div>
            ))}
          </CardContent>
        </div>
      </section>

      {/* ── 4. Three-column analysis zone ──────────────────────────── */}
      <section className="grid gap-5 lg:grid-cols-3">
        {/* Active Workload */}
        <div
          className="rounded-2xl border overflow-hidden"
          style={{ borderColor: "hsl(var(--color-border-light))" }}
        >
          <div
            className="px-5 py-4 border-b"
            style={{
              borderColor: "hsl(var(--color-border-light))",
              background: "hsl(var(--primary) / 0.06)",
            }}
          >
            <Skeleton className="h-5 w-32 mb-2" />
            <Skeleton className="h-4 w-40" />
          </div>
          <CardContent className="p-5 space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-3 rounded-lg border space-y-2">
                <Skeleton className="h-4 w-32" />
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-4 w-12 rounded-full" />
                </div>
              </div>
            ))}
          </CardContent>
        </div>

        {/* Diagnostic Requests */}
        <div
          className="rounded-2xl border overflow-hidden"
          style={{ borderColor: "hsl(var(--color-border-light))" }}
        >
          <div
            className="px-5 py-4 border-b"
            style={{
              borderColor: "hsl(var(--color-border-light))",
              background: "hsl(var(--chart-2) / 0.06)",
            }}
          >
            <Skeleton className="h-5 w-40 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
          <CardContent className="p-5 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg border">
                <Skeleton className="h-4 w-4 flex-shrink-0" />
                <Skeleton className="h-4 w-24 flex-1" />
                <Skeleton className="h-5 w-8" />
              </div>
            ))}
          </CardContent>
        </div>

        {/* Performance */}
        <div
          className="rounded-2xl border overflow-hidden"
          style={{ borderColor: "hsl(var(--color-border-light))" }}
        >
          <div
            className="px-5 py-4 border-b"
            style={{
              borderColor: "hsl(var(--color-border-light))",
              background: "hsl(var(--chart-7) / 0.06)",
            }}
          >
            <Skeleton className="h-5 w-28 mb-2" />
            <Skeleton className="h-4 w-40" />
          </div>
          <CardContent className="p-5 space-y-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i}>
                <div className="flex justify-between mb-2">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-4 w-10" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            ))}
          </CardContent>
        </div>
      </section>

      {/* ── 5. Team & Activity skeleton ───────────────────────────── */}
      <section className="grid gap-5 lg:grid-cols-2">
        {/* Team On Duty */}
        <div
          className="rounded-2xl border overflow-hidden"
          style={{ borderColor: "hsl(var(--color-border-light))" }}
        >
          <div
            className="px-5 py-4 border-b"
            style={{
              borderColor: "hsl(var(--color-border-light))",
              background: "hsl(var(--chart-3) / 0.06)",
            }}
          >
            <Skeleton className="h-5 w-32 mb-2" />
            <Skeleton className="h-4 w-40" />
          </div>
          <CardContent className="p-5 space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg">
                <Skeleton className="h-9 w-9 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-2.5 w-2.5 rounded-full flex-shrink-0" />
              </div>
            ))}
          </CardContent>
        </div>

        {/* Recent Activity */}
        <div
          className="rounded-2xl border overflow-hidden"
          style={{ borderColor: "hsl(var(--color-border-light))" }}
        >
          <div
            className="px-5 py-4 border-b"
            style={{
              borderColor: "hsl(var(--color-border-light))",
              background: "hsl(var(--primary) / 0.06)",
            }}
          >
            <Skeleton className="h-5 w-32 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
          <CardContent className="p-5 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-4 w-4 rounded flex-shrink-0 mt-1" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            ))}
          </CardContent>
        </div>
      </section>

      {/* ── 6. Status footer skeleton ──────────────────────────────── */}
      <footer
        className="rounded-xl border px-5 py-3.5"
        style={{ borderColor: "hsl(var(--color-border-light))" }}
      >
        <div className="space-y-2 sm:flex sm:justify-between sm:gap-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-64" />
        </div>
      </footer>
    </div>
  );
}
