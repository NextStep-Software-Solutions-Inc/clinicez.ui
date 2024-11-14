import Suspend from "@components/Suspend";
import { Separator } from "@components/ui/separator";
import { Metadata } from "next";
import { AppRouterPageRouteOpts } from "@auth0/nextjs-auth0";
import Each from "@components/utils/Each";
import { getFoldersAction } from "@actions/folder.action";
import { getCachedSession } from "@actions/session.action";
import dayjs from "@lib/day-utils";
import { getClinicsAction } from "@/actions/clinics/clinic.action";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Partner Clinic",
  description: "Clinic and hospital where organization is connected to."
}

export default async function ClinicsPage({params}: AppRouterPageRouteOpts) {
  const clinicUid = String(params?.clinicUid)
  const clinics = await getClinicsAction({

  })
  
  return (
    <>
      <div className="space-y-6">
        <div className="group/create-folder">
          <div className="flex items-center">
            <h2 className="text-2xl font-bold tracking-tight">Clinics and Hospitals</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Clinics and hospitals where organization is connected to.
          </p>
        </div>
        
        <Separator />
        <Suspend>
          <Each
            of={clinics}
            render={clinic => {
              return (
                <div className="border border-gray-200 rounded-md p-4  cursor-pointer hover:bg-slate-100 transition-all">
                  <Link href={`/clinics/${clinic.clinicUid}/dashboard`}>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-semibold">{clinic.name}</span>
                      <div className="text-sm text-muted-foreground">
                        {dayjs(clinic.updatedAt).format("lll")}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {clinic.description || "No description"}
                    </p>
                  </Link>
                </div>
              )
            }}
          />
        </Suspend>
      </div>
    
    </>
  );
}
