import { getCachedSession } from "@actions/session.action";
import { getMyTenantsAction, getTenantAction, getTenantsAction } from "@actions/tenant.action";
import TenantCard from "@components/console/TenantCard";
import Each from "@components/utils/Each";
import React from "react";

export default async function TenantsPage() {
  const session = await getCachedSession();
  const tenants = await getMyTenantsAction(session?.user.sub);
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#a0f5f5] to-[#1e3142] text-white px-5 py-10">
      <div className="container mx-auto max-w-screen-xl">
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
  );
}


