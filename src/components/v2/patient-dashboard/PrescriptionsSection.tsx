import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Pill, Download, AlertCircle, ChevronRight } from 'lucide-react';
import { PrescriptionCard } from "@/types/patient-dashboard.types"

interface PrescriptionsSectionProps {
  userId: string
}

// Mock data - will be replaced with real data from usePatientDashboard hook
const mockPrescriptions: PrescriptionCard[] = [
  {
    id: "1",
    name: "Lisinopril",
    dosage: "10 mg",
    frequency: "Once daily",
    provider: "Dr. Sarah Johnson",
    startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    refillsRemaining: 3,
    status: "active",
  },
  {
    id: "2",
    name: "Atorvastatin",
    dosage: "20 mg",
    frequency: "Once daily at bedtime",
    provider: "Dr. Sarah Johnson",
    startDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
    refillsRemaining: 5,
    status: "active",
  },
  {
    id: "3",
    name: "Metformin",
    dosage: "500 mg",
    frequency: "Twice daily with meals",
    provider: "Dr. Michael Chen",
    startDate: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    refillsRemaining: 1,
    status: "active",
  },
]

const statusConfig = {
  active: { label: "Active", className: "bg-green-100 text-green-800" },
  expired: { label: "Expired", className: "bg-red-100 text-red-800" },
  pending: { label: "Pending", className: "bg-yellow-100 text-yellow-800" },
} as const

export default function PrescriptionsSection({ userId }: PrescriptionsSectionProps) {
  const lowRefills = mockPrescriptions.filter((p) => p.refillsRemaining <= 1)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Pill className="h-5 w-5" />
              Active Prescriptions
            </CardTitle>
            <CardDescription>Your current medications</CardDescription>
          </div>
          <Button variant="outline" size="sm">
            View History
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Low Refill Alert */}
          {lowRefills.length > 0 && (
            <div className="flex gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium">Low refill reminder</p>
                <p className="text-xs mt-0.5">
                  {lowRefills.length} of your prescription{lowRefills.length > 1 ? "s" : ""} is running low on refills.
                </p>
              </div>
            </div>
          )}

          {/* Prescriptions List */}
          {mockPrescriptions.length === 0 ? (
            <div className="text-center py-8">
              <Pill className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">No active prescriptions</p>
            </div>
          ) : (
            <div className="space-y-3">
              {mockPrescriptions.map((prescription) => (
                <div
                  key={prescription.id}
                  className="flex items-start justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-slate-900">{prescription.name}</h3>
                      <Badge className={statusConfig[prescription.status].className}>
                        {statusConfig[prescription.status].label}
                      </Badge>
                    </div>

                    <p className="text-sm text-muted-foreground mb-2">
                      {prescription.dosage} • {prescription.frequency}
                    </p>

                    <p className="text-xs text-muted-foreground">
                      Prescribed by {prescription.provider}
                    </p>

                    <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                      <span>
                        Expires:{" "}
                        {prescription.endDate.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                      <span
                        className={
                          prescription.refillsRemaining === 0
                            ? "text-red-600 font-medium"
                            : prescription.refillsRemaining <= 1
                              ? "text-yellow-600 font-medium"
                              : ""
                        }
                      >
                        {prescription.refillsRemaining} refill{prescription.refillsRemaining !== 1 ? "s" : ""} left
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Button variant="outline" size="sm">
                      Refill
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
