import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Activity, TrendingUp, TrendingDown } from "lucide-react"
import { HealthMetric } from "@/types/patient-dashboard.types"

interface HealthMetricsSectionProps {
  userId: string
}

// Mock data - will be replaced with real data from usePatientDashboard hook
const mockMetrics: HealthMetric[] = [
  {
    id: "1",
    label: "Blood Pressure",
    value: 120,
    unit: "mmHg",
    status: "normal",
    trend: { direction: "stable", value: 0, percentage: 0 },
    lastUpdated: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: "2",
    label: "Heart Rate",
    value: 72,
    unit: "bpm",
    status: "normal",
    trend: { direction: "up", value: 2, percentage: 2.8 },
    lastUpdated: new Date(Date.now() - 3 * 60 * 60 * 1000),
  },
  {
    id: "3",
    label: "Blood Sugar",
    value: 92,
    unit: "mg/dL",
    status: "normal",
    trend: { direction: "stable", value: 0, percentage: 0 },
    lastUpdated: new Date(Date.now() - 5 * 60 * 60 * 1000),
  },
  {
    id: "4",
    label: "Temperature",
    value: 98.6,
    unit: "°F",
    status: "normal",
    trend: { direction: "down", value: 0.1, percentage: 0.1 },
    lastUpdated: new Date(Date.now() - 1 * 60 * 60 * 1000),
  },
]

const statusConfig = {
  normal: { label: "Normal", className: "bg-green-100 text-green-800" },
  warning: { label: "Warning", className: "bg-yellow-100 text-yellow-800" },
  critical: { label: "Critical", className: "bg-red-100 text-red-800" },
} as const

const formatTimeAgo = (date: Date): string => {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 60) return `${diffMins}m ago`
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`
  return `${Math.floor(diffMins / 1440)}d ago`
}

export default function HealthMetricsSection({ userId }: HealthMetricsSectionProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Health Metrics
        </CardTitle>
        <CardDescription>Recent vital signs</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockMetrics.map((metric) => (
            <div key={metric.id} className="space-y-1.5 pb-3 border-b border-slate-100 last:border-0 last:pb-0">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-900">{metric.label}</span>
                <Badge className={statusConfig[metric.status].className}>
                  {statusConfig[metric.status].label}
                </Badge>
              </div>

              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-slate-900">{metric.value}</span>
                <span className="text-xs text-muted-foreground">{metric.unit}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {formatTimeAgo(metric.lastUpdated)}
                </span>
                <div className="flex items-center gap-0.5">
                  {metric.trend?.direction === "up" && (
                    <TrendingUp className="h-3.5 w-3.5 text-orange-500" />
                  )}
                  {metric.trend?.direction === "down" && (
                    <TrendingDown className="h-3.5 w-3.5 text-blue-500" />
                  )}
                  {metric.trend?.direction === "stable" && (
                    <Activity className="h-3.5 w-3.5 text-green-500" />
                  )}
                  <span className="text-xs text-muted-foreground capitalize">{metric.trend?.direction}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
