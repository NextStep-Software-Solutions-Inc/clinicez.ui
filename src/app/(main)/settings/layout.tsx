import { Separator } from "@components/ui/separator"
import SidebarNav from "@components/SidebarNav"

interface SettingsLayoutProps {
  children: React.ReactNode
  params: Promise<{
    organization: string
  }>
}

export default async function SettingsLayout(props: SettingsLayoutProps) {
  const params = await props.params;

  const {
    organization
  } = params;

  const {
    children
  } = props;

  const sidebarNavItems = [
    {
      title: "General",
      href: `/settings`,
    },
    {
      title: "Security",
      href: `/settings/security`,
    },
    {
      title: "Organizations",
      href: `/settings/organizations`,
    },
    {
      title: "Schedule",
      href: `/settings/schedule`,
    },
    {
      title: "Preferences",
      href: `/settings/preferences`,
    },
    {
      title: "Subscriptions",
      href: `/settings/subscriptions`,
    },
    {
      title: "Integrations",
      href: `/settings/integrations`,
    },
    {
      title: "Advanced",
      href: `/settings/advanced`,
    }
  ]

  return (
    <>
      <div className="container space-y-6 p-5 md:p-10 pb-16">
        <div className="space-y-0.5">
          <h2 className="text-2xl font-bold tracking-tight">Account Settings</h2>
          <p className="text-muted-foreground">
            Manage your account and settings.
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
