import { getClinicAction } from "@/actions/clinics/clinic.action";
import BookAppointmentBtn from "@/components/BookAppointmentBtn";
import { Metadata } from "next";
import Image from "next/image";
import React from "react";
import "@/styles/shiny-button.css";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Clinic",
  description: "Clinic",
}

export default async function ClinicPage({params}: {params: {clinicUid: string}}) {
  const {clinicUid} = params;
  const clinic = await getClinicAction(clinicUid);

  if(!clinic?.ClinicSetting?.isPublic) notFound();
  
  return (
    <div className="container mx-auto my-10">
      <div className="flex gap-5 items-center flex-wrap">
        <div className="">
          <Image src={clinic?.logo ?? ""} width={500} height={500} alt="clinic-logo" className="object-scale-down w-[300px] border-dashed border rounded-sm "/>
        </div>
        <div className="space-y-5">
          <h1 className="text-3xl font-medium">{clinic?.name}</h1>
          <p>
            {clinic?.description}
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
