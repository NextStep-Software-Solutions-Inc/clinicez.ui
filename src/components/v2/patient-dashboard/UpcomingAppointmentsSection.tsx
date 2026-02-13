import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, MapPin, User, ChevronRight } from "lucide-react"
import { AppointmentCard } from "@/types/patient-dashboard.types"

interface UpcomingAppointmentsSectionProps {
  userId: string
}

// Mock data - will be replaced with real data from usePatientDashboard hook
const mockAppointments: AppointmentCard[] = [
  {
    id: "1",
    doctorName: "Dr. Sarah Johnson",
    specialty: "Cardiology",
    clinic: "Downtown Medical Center",
    date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    time: "10:00 AM",
    status: "confirmed",
    type: "in-person",
  },
  {
    id: "2",
    doctorName: "Dr. Michael Chen",
    specialty: "Internal Medicine",
    clinic: "Northside Clinic",
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    time: "2:30 PM",
    status: "pending",
    type: "telemedicine",
  },
  {
    id: "3",
    doctorName: "Dr. Lisa Rodriguez",
    specialty: "Orthopedics",
    clinic: "Sports Medicine Center",
    date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    time: "9:00 AM",
    status: "confirmed",
    type: "in-person",
  },
]

const statusConfig = {
  confirmed: { label: "Confirmed", className: "bg-green-100 text-green-800" },
  pending: { label: "Pending", className: "bg-yellow-100 text-yellow-800" },
  cancelled: { label: "Cancelled", className: "bg-red-100 text-red-800" },
} as const

const typeConfig = {
  "in-person": { label: "In-Person" },
  telemedicine: { label: "Virtual" },
} as const

export default function UpcomingAppointmentsSection({
  userId,
}: UpcomingAppointmentsSectionProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upcoming Appointments
            </CardTitle>
            <CardDescription>Your scheduled appointments</CardDescription>
          </div>
          <Button variant="outline" size="sm">
            View All
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockAppointments.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">No upcoming appointments</p>
              <Button variant="outline" className="mt-4">
                Schedule an Appointment
              </Button>
            </div>
          ) : (
            mockAppointments.map((appointment) => (
              <div
                key={appointment.id}
                className="flex gap-4 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                {/* Date Column */}
                <div className="flex flex-col items-center justify-start gap-1 min-w-fit">
                  <div className="text-xs font-semibold text-muted-foreground">
                    {appointment.date.toLocaleDateString("en-US", { month: "short" })}
                  </div>
                  <div className="text-lg font-bold text-slate-900">
                    {appointment.date.getDate()}
                  </div>
                </div>

                {/* Content Column */}
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-slate-900">{appointment.doctorName}</h3>
                      <p className="text-sm text-muted-foreground">{appointment.specialty}</p>
                    </div>
                    <Badge className={statusConfig[appointment.status].className}>
                      {statusConfig[appointment.status].label}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{appointment.time}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Badge variant="secondary" className="text-xs">
                        {typeConfig[appointment.type].label}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-2">
                    <MapPin className="h-4 w-4" />
                    <span>{appointment.clinic}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 justify-center">
                  <Button variant="outline" size="sm">
                    Reschedule
                  </Button>
                  <Button variant="ghost" size="sm">
                    Details
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
