import { Metadata } from "next"

import { Button } from "@components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@components/ui/card"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@components/ui/tabs"
import { CalendarDateRangePicker } from "./components/date-range-picker"
import { MainNav } from "./components/main-nav"
import { Overview } from "./components/overview"
import { RecentSales } from "./components/recent-sales"
import { Calendar, Stethoscope, TrendingUp, User } from "lucide-react"

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Example dashboard app built using the components.",
}


interface DashboardPageProps {
  params: {
    organization: string
  }
}
export default function DashboardPage({params: {organization}}:DashboardPageProps) {
  return (
    <div className="rounded-[0.5rem] border bg-background shadow]">
      <div className="flex-col flex">
        <div className="border-b">
          <div className="flex h-16 items-center px-4">
            {/* <TeamSwitcher /> */}
            <MainNav className="mx-6" />
          </div>
        </div>
        <div className="flex-1 space-y-4 p-8 pt-6">
          <div className="flex items-center justify-between space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
            <div className="flex items-center space-x-2">
              <CalendarDateRangePicker />
              <Button>Download PDF</Button>
            </div>
          </div>
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="analytics" >
                Analytics
              </TabsTrigger>
              <TabsTrigger value="reports">
                Reports
              </TabsTrigger>
              <TabsTrigger value="notifications">
                Notifications
              </TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="group/icon">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Appointments
                    </CardTitle>
                    <Calendar className="text-primary group-hover/icon:scale-150 transition-all"/>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">12</div>
                    <p className="text-xs text-muted-foreground">
                      +120% from last month
                    </p>
                  </CardContent>
                </Card>
                <Card className="group/icon">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Consultations
                    </CardTitle>
                    <Stethoscope className="text-primary group-hover/icon:scale-150 transition-all"/>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">190</div>
                    <p className="text-xs text-muted-foreground">
                      +180% from last month
                    </p>
                  </CardContent>
                </Card>
                <Card className="group/icon">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Trending Case</CardTitle>
                    <TrendingUp className="text-primary group-hover/icon:scale-150 transition-all"/>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">Covid-19</div>
                    <p className="text-xs text-muted-foreground">
                      +200% from last month
                    </p>
                  </CardContent>
                </Card>
                <Card className="group/icon">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Patients Visited
                    </CardTitle>
                    <User className="text-primary group-hover/icon:scale-150 transition-all"/>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">+573</div>
                    <p className="text-xs text-muted-foreground">
                      +201 since last hour
                    </p>
                  </CardContent>
                </Card>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                  <CardHeader>
                    <CardTitle>Appointment Overview</CardTitle>
                    <CardDescription>
                      Monthly counts of appointments.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pl-2">
                    <Overview />
                  </CardContent>
                </Card>
                <Card className="col-span-3">
                  <CardHeader>
                    <CardTitle>Recent Appointments</CardTitle>
                    <CardDescription>
                      You made 12 appointments this month.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <RecentSales />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
