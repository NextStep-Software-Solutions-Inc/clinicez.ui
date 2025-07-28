import "@styles/shiny-button.css"

import { getCachedSession } from "@actions/session.action";
import { getMyTenantsAction } from "@actions/tenant.action";
import TenantCard from "@components/console/TenantCard";
import { TooltipProvider } from "@components/ui/tooltip";
import Each from "@components/utils/Each";
import Link from "next/link";
import React from "react";
import { cn } from "@lib/utils";

export default async function TenantsPage() {
  const session = await getCachedSession();
  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg">You must be logged in to view this page.</p>
      </div>
    );
  }
  const tenants = await getMyTenantsAction(session?.user.sub);
  return (
    <TooltipProvider>
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-[#1e3142] via-[#49b9b9] to-[#1e3142]  px-5 py-10">
        <div className="container mx-auto max-w-screen-xl space-y-10">
          <NewTenantButton />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            <Each
              of={tenants.data}
              render={(tenant) => {
                return (
                  <TenantCard details={tenant}/>
                )
              }}
            />
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

const NewTenantButton = () => {
  return (
    <>
      <Link href="/tenants/register" className="flex justify-start" >
        <button className={cn("shiny-cta font-semibold")}>
          <span>Create New Tenant</span>
        </button>
      </Link>
    </>
  );
}