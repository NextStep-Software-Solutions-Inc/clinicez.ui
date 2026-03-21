import { Metadata } from "next"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@components/ui/tabs"
import { MainNav } from "@components/dashboard/MainNav"
import { DashboardStats } from "@components/dashboard/DashboardStats"
import { getCachedSession } from "@actions/session.action"
import Suspend from "@components/Suspend"
import { OrgMembershipAnalytics } from "@/components/organization/OrgMembershipAnalytics"
import { OrganizationReports } from "@/components/organization/dashboard/reports/OrganizationReports"
import { filterNavList } from "../nav"

export const maxDuration = 20; // page timeout: 20 seconds
export const revalidate = 60; // revalidation interval in seconds
export const metadata: Metadata = {
  title: "Organization Dashboard",
  description: "Overview of your organization's activities and analytics."
}

interface DashboardPageProps {
  params: Promise<{ orgUid: string }>,
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const resolvedParams = await params;
  const orgUid = String(resolvedParams?.orgUid);

  const session = await getCachedSession()
  const userId = session?.user.sub


  const mappedNavList = filterNavList().map((item) => {
    return {
      name: item.name,
      href: `/organizations/${orgUid}${item.href}`,
    }
  })

  return (
    <div className="rounded-[0.5rem] border bg-background shadow]">
      <div className="flex-col flex">
        <div className="border-b">
          <div className="flex h-16 items-center px-4">
            <MainNav className="mx-6" navItems={mappedNavList} />
          </div>
        </div>
        <div className="flex-1 space-y-4 p-8 pt-6">
          <div className="flex items-center justify-between space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
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
                {userId && <DashboardStats userId={userId} orgUid={orgUid} />}
              </Suspend>
              {/* <ConditionalRender condition={await isOrgMember() && await isHP()}>
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
              {/* <Suspend>
                <PatientHealthAnalytics orgUid={orgUid}/>
              </Suspend> */}
              {/* <Suspend>
                <PatientsAnalytics orgUid={orgUid}/>
              </Suspend> */}
              <Suspend>
                <OrgMembershipAnalytics orgUid={orgUid} />
              </Suspend>
            </TabsContent>
            <TabsContent value="reports" className="space-y-4">
              <OrganizationReports orgUid={orgUid} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}