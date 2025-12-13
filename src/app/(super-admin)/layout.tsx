import { getCachedSession } from "@actions/session.action";
import { isSuperAdminAction } from "@actions/super-admin/admin-check.action";
import { redirect } from "next/navigation";
import { Card } from "@components/ui/card";
import SidebarNav from "@components/SidebarNav";

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
    <div className="flex h-screen flex-col bg-background overflow-hidden">
      <div className="border-b flex-shrink-0">
        <div className="container flex h-16 items-center px-4">
          <h1 className="text-2xl font-bold">Super Admin Console</h1>
        </div>
      </div>
      <div className="container flex flex-1 min-h-0">
        <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0 flex-1 min-h-0">
          <aside className="lg:w-1/5 py-10 overflow-y-auto flex-shrink-0">
            <div className="space-y-0.5 mb-6">
              <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
              <p className="text-muted-foreground">
                Manage system-wide settings and resources.
              </p>
            </div>
            <SidebarNav items={sidebarNavItems} />
          </aside>
          <div className="flex-1 overflow-y-auto py-10 pb-16 lg:max-w-5xl min-h-0">{children}</div>
        </div>
      </div>
    </div>
  );
}
