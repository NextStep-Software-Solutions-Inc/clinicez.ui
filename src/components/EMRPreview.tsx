"use client";

import { memo } from "react";
import { Picture } from "../app/(main)/user/[user]/phr/Picture";
import { Separator } from "./ui/separator";
import { differenceInCalendarYears } from "date-fns";
import AllergiesForm from "../app/(main)/user/[user]/phr/allergies/AllergiesForm";
import { VaccinationForm } from "../app/(main)/user/[user]/phr/vaccination-immunization/VaccinationForm";
import DisabilitiesForm from "../app/(main)/user/[user]/phr/disabilities/DisabilitiesForm";
import IllnessesForm from "../app/(main)/user/[user]/phr/disabilities/IllnessesForm";
import PageLoading from "./PageLoading";
import { LabelValue } from "./LabelValue";
import { useUser } from "@hooks/useUser";
import { useAllergies } from "@hooks/useAllergy";
import { useDisabilities } from "@hooks/useDisability";
import { useIllnesses } from "@hooks/useIllness";
import { useVaccinations } from "@hooks/useVaccination";
import RecentVitalSigns from "../app/(main)/user/[user]/phr/vitals/RecentVitalSigns";
import { useUserVitalSigns } from "@hooks/useUserVitalSign";
import { notFound, useParams } from "next/navigation";
import MedicalHistory from "./MedicalHistory";

interface EMRPreviewProps {
    patientId: string
  }
function EMRPreview({patientId}: EMRPreviewProps) {

  const params = useParams<{organization: string}>();
  const { data: patient, isLoading } = useUser({userId: patientId})
  const { data: allergies, } = useAllergies(patientId)
  const { data: disabilities } = useDisabilities(patientId)
  const { data: illnesses } = useIllnesses(patientId)
  const { data: vaccinations } = useVaccinations(patientId)
  const { data: vitalSigns } = useUserVitalSigns(patientId)
  
  if(isLoading) return <PageLoading label="Loading Records ..."/>
  if(patient === undefined) notFound()

  const name = `${patient?.lastName || "-"}, ${patient?.firstName || "-"} ${patient?.middleName ?? ""} ${patient?.suffix ?? ""}`
  return (
    <div className="space-y-5 my-5 overflow-auto h-[calc(100vh-15%)] no-scrollbar">
      <div className="flex gap-5">
        <Picture readOnly user={patient!}/>
        <div className="">
          <LabelValue label="Name" value={name}/>
          <div className="flex gap-5 items-center">
            <LabelValue label="Gender" value={patient?.gender}/>
            <Separator orientation="vertical" className="h-10"/>
            <LabelValue label="Age" value={patient?.dob && `${differenceInCalendarYears(new Date(), patient.dob)} years old`}/>
          </div>
          <LabelValue label="Blood Type" value={patient?.bloodType}/>
          <LabelValue label="Email" value={(
            <a className="text-primary" href={`mailto:${patient?.email}`}>{patient?.email}</a>
          )}/>
        </div>
      </div>
      <Separator/>
      <h3 className="text-xl bg-primary text-primary-foreground rounded px-2 font-bold">Basic Information</h3>
      <div className="space-y-3">
        <LabelValue className="flex items-center gap-2 flex-row-reverse justify-end" label="Nickname:" value={patient?.nickname}/>
        <LabelValue className="flex items-center gap-2 flex-row-reverse justify-end" label="Mobile:" value={(
          <a href={`tel:${patient?.mobile}`}>{patient?.mobile}</a>
        )}/>
        <LabelValue className="flex items-center gap-2 flex-row-reverse justify-end" label="Civil Status:" value={patient?.civilStatus}/>
        <LabelValue className="flex items-center gap-2 flex-row-reverse justify-end" label="Religion:" value={patient?.religion}/>
        <LabelValue className="flex items-center gap-2 flex-row-reverse justify-end" label="Nationality:" value={patient?.nationality}/>
      </div>
        
      <Separator/>
      <h3 className="text-xl bg-primary text-primary-foreground rounded px-2 font-bold">Allergies</h3>
      <AllergiesForm readOnly allergies={allergies ?? []} />
  
      <Separator/>
      <h3 className="text-xl bg-primary text-primary-foreground rounded px-2 font-bold">Vaccination & Immunization</h3>
      <VaccinationForm readOnly vaccinations={vaccinations ?? []} />
      <Separator/>

      <h3 className="text-xl bg-primary text-primary-foreground rounded px-2 font-bold">Personal & Social History</h3>
      <div>
        <DisabilitiesForm readOnly disabilities={disabilities ?? []} />
        <IllnessesForm readOnly illnesses={illnesses ?? []} />
      </div>
      <Separator/>
      <h3 className="text-xl bg-primary text-primary-foreground rounded px-2 font-bold">Family History</h3>
        
      <Separator/>
      <h3 className="text-xl bg-primary text-primary-foreground rounded px-2 font-bold">Medical History</h3>
      <MedicalHistory
        patientId={patientId}
        orgUid={params.organization}
      />
      {/* <Separator/> */}
      <h3 className="text-xl bg-primary text-primary-foreground rounded px-2 font-bold">Obstetric History</h3>
        
      <Separator/>
      <h3 className="text-xl bg-primary text-primary-foreground rounded px-2 font-bold">Vital Signs & Anthropometric Measurements</h3>
      <RecentVitalSigns readOnly vitalSigns={vitalSigns ?? []} userId={patient?.userId ?? ""}/>
        
      <Separator/>
      <h3 className="text-xl bg-primary text-primary-foreground rounded px-2 font-bold">Organs / Systems</h3>
  
      <Separator/>
      <h3 className="text-xl bg-primary text-primary-foreground rounded px-2 font-bold">{`Visual Acuity / Snellen's`}</h3>
  
    </div>
  );
}
  
export default memo(EMRPreview)