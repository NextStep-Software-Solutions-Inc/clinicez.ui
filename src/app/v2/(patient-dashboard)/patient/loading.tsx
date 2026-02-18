import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function PatientDashboardLoading() {
  return (
    <div className="w-full">
      {/* Header Skeleton */}
      <div className="bg-white border-b border-slate-200 px-4 py-6 lg:px-6 lg:py-8">
        <div className="container mx-auto space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 lg:py-8">
        <div className="space-y-6">
          {/* Quick Actions Skeleton */}
          <Card>
            <CardHeader>
              <CardTitle>
                <Skeleton className="h-6 w-32" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-20" />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Grid Skeletons */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(2)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <CardTitle>
                    <Skeleton className="h-6 w-40" />
                  </CardTitle>
                  <div>
                    <Skeleton className="h-4 w-32" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[...Array(3)].map((_, j) => (
                      <Skeleton key={j} className="h-12" />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Prescriptions Skeleton */}
          <Card>
            <CardHeader>
              <CardTitle>
                <Skeleton className="h-6 w-40" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-24" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
