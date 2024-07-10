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
import { Calendar, Stethoscope, TrendingUp } from "lucide-react"
import { AppRouterPageRouteOpts, withPageAuthRequired } from "@auth0/nextjs-auth0"
import { getUserOrganizationsAction } from "@actions/organization.action"
import { redirect } from "next/navigation"
import ConditionalRender from "@components/utils/ConditionalRender"
import { isHP, isMember } from "@lib/protect-org"
import { DashboardStats } from "./DashboardStats"
import { getCachedSession } from "@actions/session.action"
import Suspend from "@components/Suspend"
import { PatientHealthAnalytics } from "./PatientHealthAnalytics"
import { PatientsAnalytics } from "./PatientsAnalytics"

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Example dashboard app built using the components.",
}


async function DashboardPage({params, searchParams}: AppRouterPageRouteOpts) {
  const orgId = params?.organization as string
  const session = await getCachedSession()
  if (!session) return redirect("/api/auth/login")
  const userId = session.user.sub

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
            {/* <ConditionalRender condition={await isMember() && await isHP()}>
              <div className="flex items-center space-x-2">
                <CalendarDateRangePicker />
                <Button>Download PDF</Button>
              </div>
            </ConditionalRender> */}
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
              <Suspend>
                <DashboardStats userId={userId} orgId={orgId}/>
              </Suspend>
              {/* <ConditionalRender condition={await isMember() && await isHP()}>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                  <Card className="col-span-2 lg:col-span-4">
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
                  <Card className="col-span-2 lg:col-span-3">
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
              </ConditionalRender> */}
            </TabsContent>
            <TabsContent value="analytics" className="space-y-4">
              <Suspend>
                <PatientHealthAnalytics orgId={orgId}/>
              </Suspend>
              <Suspend>
                <PatientsAnalytics orgId={orgId}/>
              </Suspend>
              {/* <ConditionalRender condition={await isMember() && await isHP()}>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                  <Card className="col-span-2 lg:col-span-4">
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
                  <Card className="col-span-2 lg:col-span-3">
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
              </ConditionalRender> */}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}


export default withPageAuthRequired(DashboardPage, {
  returnTo: ({params, searchParams}) => {
    const searchStr = Object.entries(searchParams ?? {}).map(([key, value]) => `${key}=${value}`).join("&");
    return `/${params?.organization}/dashboard?${searchStr}`;
  }
})
