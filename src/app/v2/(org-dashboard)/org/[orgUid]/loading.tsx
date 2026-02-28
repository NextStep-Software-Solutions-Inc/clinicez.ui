import { Skeleton } from "@components/ui/skeleton";
import { Card, CardContent } from "@components/ui/card";

export default function OrgOverviewLoading() {
  return (
    <div className="space-y-6 pb-10">
      {/* ── 1. Welcome header skeleton ──────────────────────────────── */}
      <div
        className="relative overflow-hidden rounded-2xl shadow-lg p-6 sm:p-8"
        style={{
          border: "1px solid hsl(var(--color-border-light))",
          background: "hsl(var(--primary) / 0.03)",
        }}
      >
        <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <Skeleton className="h-6 w-44 rounded-full mb-3" />
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
              <CardContent className="p-5 space-y-3">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-2 w-full rounded-full" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ── 3. Structure summary skeleton ──────────────────────────── */}
      <section>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5 flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-lg flex-shrink-0" />
                <div className="space-y-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-7 w-10" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ── 4. Members & Role breakdown skeleton ───────────────────── */}
      <section className="grid gap-5 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
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
              <Skeleton className="h-5 w-36 mb-2" />
              <Skeleton className="h-4 w-44" />
            </div>
            <CardContent className="p-5 space-y-3">
              {Array.from({ length: 5 }).map((_, j) => (
                <div key={j} className="flex items-center gap-3 p-2.5">
                  <Skeleton className="h-9 w-9 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-5 w-14 rounded-full flex-shrink-0" />
                </div>
              ))}
            </CardContent>
          </div>
        ))}
      </section>

      {/* ── 5. Linked clinics skeleton ──────────────────────────────── */}
      <section>
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
            <Skeleton className="h-5 w-36 mb-2" />
            <Skeleton className="h-4 w-40" />
          </div>
          <CardContent className="p-5">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-lg border"
                  style={{ borderColor: "hsl(var(--color-border-light))" }}
                >
                  <Skeleton className="h-10 w-10 rounded-lg flex-shrink-0" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </div>
      </section>

      {/* ── 6. Performance & Activity skeleton ─────────────────────── */}
      <section className="grid gap-5 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
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
              <Skeleton className="h-5 w-36 mb-2" />
              <Skeleton className="h-4 w-44" />
            </div>
            <CardContent className="p-5 space-y-5">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j}>
                  <div className="flex justify-between mb-2">
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="h-4 w-10" />
                  </div>
                  <Skeleton className="h-2 w-full rounded-full" />
                </div>
              ))}
            </CardContent>
          </div>
        ))}
      </section>

      {/* ── 7. Status footer skeleton ──────────────────────────────── */}
      <footer
        className="rounded-xl border px-5 py-3.5"
        style={{ borderColor: "hsl(var(--color-border-light))" }}
      >
        <div className="space-y-2 sm:flex sm:justify-between sm:gap-4">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-64" />
        </div>
      </footer>
    </div>
  );
}
