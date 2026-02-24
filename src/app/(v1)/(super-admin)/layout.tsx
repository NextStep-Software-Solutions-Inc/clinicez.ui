import { getCachedSession } from "@actions/session.action";
import { isSuperAdminAction } from "@actions/super-admin/admin-check.action";
import { redirect } from "next/navigation";
import SidebarNav from "@components/SidebarNav";
import SuperAdminMobileNav from "@components/super-admin/SuperAdminMobileNav";
import { SuperAdminQueryProvider } from "./super-admin-query-provider";

const sidebarNavItems = [
  {
    title: "Permissions",
    href: "/super-admin/permissions",
  },
  {
    title: "Clinic Roles",
    href: "/super-admin/roles",
  },
  {
    title: "Appointment Tabs",
    href: "/super-admin/appointment-tabs",
  },
  {
    title: "Diagnostics & Procedures",
    href: "/super-admin/diagnostics-procedures",
  },
  {
    title: "Tenants",
    href: "/super-admin/tenants",
  },
  {
    title: "System Admins",
    href: "/super-admin/system-admins",
  },
  {
    title: "Users",
    href: "/super-admin/users",
  },
  {
    title: "Audit Logs",
    href: "/super-admin/audit-logs",
  },
];

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCachedSession();
  
  if (!session) {
    redirect("/sign-in");
  }

  // Check if user has super admin privileges
  const isSuperAdmin = await isSuperAdminAction();
  if (!isSuperAdmin) {
    redirect("/unauthorized");
  }

  return (
    <SuperAdminQueryProvider>
      <div className="flex h-screen flex-col bg-background overflow-hidden">
        <div className="border-b flex-shrink-0">
          <div className="container flex h-14 items-center gap-3 px-4 lg:h-16">
            <SuperAdminMobileNav items={sidebarNavItems} />
            <h1 className="text-lg font-bold sm:text-2xl truncate">Super Admin Console</h1>
          </div>
        </div>
        <div className="container flex flex-1 min-h-0 px-4 lg:px-8">
          <div className="flex flex-1 min-h-0 lg:gap-12">
            <aside className="hidden lg:flex lg:w-1/5 py-10 overflow-y-auto flex-shrink-0 flex-col">
              <div className="space-y-0.5 mb-6">
                <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
                <p className="text-muted-foreground">
                  Manage system-wide settings and resources.
                </p>
              </div>
              <SidebarNav items={sidebarNavItems} />
            </aside>
            <div className="flex-1 overflow-y-auto py-6 pb-16 lg:py-10 lg:max-w-5xl min-h-0">{children}</div>
          </div>
        </div>
      </div>
    </SuperAdminQueryProvider>
  );
}
