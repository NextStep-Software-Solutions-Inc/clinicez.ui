import { getCachedSession } from "@actions/session.action";
import { redirect } from "next/navigation";
import { Card } from "@components/ui/card";
import SidebarNav from "@components/SidebarNav";

const sidebarNavItems = [
  {
    title: "Permissions",
    href: "/super-admin/permissions",
  },
  {
    title: "Roles",
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

  // TODO: Implement super admin role check before production deployment
  // This should verify the user has super admin privileges
  // For development, any authenticated user can access these pages

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="container flex h-16 items-center px-4">
          <h1 className="text-2xl font-bold">Super Admin Console</h1>
        </div>
      </div>
      <div className="container space-y-6 p-10 pb-16">
        <div className="space-y-0.5">
          <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
          <p className="text-muted-foreground">
            Manage system-wide settings and resources.
          </p>
        </div>
        <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
          <aside className="-mx-4 lg:w-1/5">
            <SidebarNav items={sidebarNavItems} />
          </aside>
          <div className="flex-1 lg:max-w-5xl">{children}</div>
        </div>
      </div>
    </div>
  );
}
