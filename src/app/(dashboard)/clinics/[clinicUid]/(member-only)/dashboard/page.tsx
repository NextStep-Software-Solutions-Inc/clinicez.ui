import { Metadata } from "next"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@components/ui/tabs"
import { MainNav } from "@components/dashboard/MainNav"
import { AppRouterPageRouteOpts, withPageAuthRequired } from "@auth0/nextjs-auth0"
import { DashboardStats } from "@components/dashboard/DashboardStats"
import { getCachedSession } from "@actions/session.action"
import Suspend from "@components/Suspend"
import { PatientHealthAnalytics } from "@components/dashboard/PatientHealthAnalytics"
import { PatientsAnalytics } from "@components/dashboard/PatientsAnalytics"
import { OrgMembershipAnalytics } from "@/components/organization/OrgMembershipAnalytics"
import { filterNavList } from "../nav"
import { ClinicOverview } from "@/components/dashboard/ClinicOverview"
import { getClinicAction } from "@/actions/clinics/clinic.action"

export const maxDuration = 30; // page timeout in seconds
export const revalidate  = 60; // revalidation interval in seconds
export const metadata: Metadata = {
  title: "Clinic Dashboard",
  description: "Clinic Dashboard",
}

async function DashboardPage({params, searchParams}: AppRouterPageRouteOpts) {
  const clinicUid = String(params?.clinicUid)
  const session = await getCachedSession()
  const clinic = await getClinicAction(clinicUid)
  const userId = session?.user.sub
  

  const mappedNavItems = filterNavList().map((item) => ({
    ...item,
    href: `/clinics/${clinicUid}${item.href}`
  }));

  return (
    <div className="rounded-[0.5rem] border bg-background shadow]">
      <div className="flex-col flex">
        <div className="border-b">
          <div className="flex h-16 items-center px-4">
            <MainNav className="mx-6" navItems={mappedNavItems} />
          </div>
        </div>

        <div className="flex-1 space-y-4 p-8 pt-6">
          <div className="space-y-2">
            <p className="text-3xl font-bold tracking-tight">{clinic.data?.name} Dashboard</p>
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
                <ClinicOverview userId={userId} clinicUid={clinicUid}/>
              </Suspend>
            </TabsContent>
            <TabsContent value="analytics" className="space-y-4">
              <Suspend>
                <PatientHealthAnalytics orgUid={clinicUid}/>
              </Suspend>
              <Suspend>
                <PatientsAnalytics orgUid={clinicUid}/>
              </Suspend>
              <Suspend>
                <OrgMembershipAnalytics orgUid={clinicUid}/>
              </Suspend>
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
    return `/clinics/${params?.clinicUid}/dashboard?${searchStr}`;
  }
})
