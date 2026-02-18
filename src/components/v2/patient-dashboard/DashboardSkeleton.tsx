import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function DashboardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div>
          <Skeleton className="h-6 w-40" />
        </div>
        <div>
          <Skeleton className="h-4 w-32" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
