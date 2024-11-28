import { getClinicAction } from "@/actions/clinics/clinic.action";
import BookAppointmentBtn from "@/components/BookAppointmentBtn";
import { Metadata } from "next";
import Image from "next/image";
import React from "react";
import "@/styles/shiny-button.css";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getClinicMembersAction } from "@/actions/clinics/clinic-member.action";
import { getCachedSession } from "@/actions/session.action";
import { getClinicPatientsAction } from "@/actions/clinics/clinic-patient.action";
import { getOrgMembersAction } from "@/actions/organizations/org-member.action";

export const metadata: Metadata = {
  title: "Clinic",
  description: "Clinic",
}

export default async function ClinicPage({params}: {params: {clinicUid: string}}) {
  const {clinicUid} = params;
  const session = await getCachedSession();
  const clinic = await getClinicAction(clinicUid);

  if(!clinic.data?.ClinicSetting?.isPublic) {
  
    const [myClinicMembership, clinicPatients, myOrganizationMembership] = await Promise.all([
      getClinicMembersAction({
        userId: session?.user.sub,
        clinicUid,
        status: "ACTIVE"
      }),
      getClinicPatientsAction({
        clinicUid,
        userId: session?.user.sub
      }),
      await getOrgMembersAction({
        clinicUid,
        userId: session?.user.sub,
        status: "ACTIVE"
      })
    ])
     
    if(!myOrganizationMembership.data?.data.length && !clinicPatients.data?.length && !myClinicMembership.data?.length) {
      return notFound();
    }
  }
  
  return (
    <div className="container mx-auto my-10 h-1/2">
      <div className="flex gap-5 items-center flex-wrap">
        <div className="">
          <Image src={clinic.data?.logo ?? ""} width={500} height={500} alt="clinic-logo" className="object-scale-down w-[300px] border-dashed border rounded-sm "/>
        </div>
        <div className="space-y-5">
          <h1 className="text-3xl font-medium">{clinic.data?.name}</h1>
          <p>
            {clinic.data?.description}
          </p>
          <BookAppointmentBtn className="shiny-cta"/>
          <div>
            <Link href={`/clinics/${clinicUid}/dashboard`}>
              <Button variant="link">Go to Dashboard</Button>
            </Link>
          </div>
        </div>
      </div>
      <div>
       
      </div>
    </div>
  );
}
