import { Separator } from "@components/ui/separator"
import SidebarNav from "@components/SidebarNav"

interface AppointmentsLayoutProps {
  children: React.ReactNode
  params: {
    organization: string
  }
}

export default function SettingsLayout({ children, params: {organization} }: AppointmentsLayoutProps) {
  
  const sidebarNavItems = [
    {
      title: "All",
      href: `/appointments`,
    },
    {
      title: "Pending",
      href: `/appointments/pending`,
    },
    {
      title: "Rejected",
      href: `/appointments/rejected`,
    },
    {
      title: "Routed",
      href: `/appointments/routed`,
    },
    {
      title: "Completed",
      href: `/appointments/completed`,
    },
  ]
  
  return (
    <>
      <div className="container space-y-6 p-5 md:p-10 pb-16">
        <div className="space-y-0.5">
          <h2 className="text-2xl font-bold tracking-tight">Appointments</h2>
          <p className="text-muted-foreground">
          Combination of all your appointments from your organizations.
          </p>
        </div>
        <Separator className="my-6" />
        <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
          <aside className="-mx-4 lg:w-1/5">
            <SidebarNav items={sidebarNavItems} />
          </aside>
          <div className="flex-1 lg:max-w-3xl content">{children}</div>
        </div>
      </div>
    </>
  )
}
