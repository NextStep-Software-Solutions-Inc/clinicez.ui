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
import { useAllergy } from "@hooks/useAllergy";
import { useDisability } from "@hooks/useDisability";
import { useIllness } from "@hooks/useIllness";
import { useVaccination } from "@hooks/useVaccination";

interface EMRPreviewProps {
    patientId: string;
  }
function EMRPreview({patientId}: EMRPreviewProps) {

  const { data: patient, isLoading } = useUser(patientId)
  const { data: allergies, } = useAllergy(patientId)
  const { data: disabilities } = useDisability(patientId)
  const { data: illnesses } = useIllness(patientId)
  const { data: vaccinations } = useVaccination(patientId)
  
  if(isLoading) return <PageLoading label="Loading Records ..."/>
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
      <h3 className="text-xl">Basic Information</h3>
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
      <h3 className="text-xl">Allergies</h3>
      <AllergiesForm readOnly allergies={allergies ?? []} />
  
      <Separator/>
      <h3 className="text-xl">Vaccination & Immunization</h3>
      <VaccinationForm readOnly vaccinations={vaccinations ?? []} />
      <Separator/>
      <h3 className="text-xl">Personal & Social History</h3>
      <DisabilitiesForm readOnly disabilities={disabilities ?? []} />
      <IllnessesForm readOnly illnesses={illnesses ?? []} />
      <Separator/>
      <h3 className="text-xl">Family History</h3>
        
      <Separator/>
      <h3 className="text-xl">Medical History</h3>
        
      <Separator/>
      <h3 className="text-xl">Obstetric History</h3>
        
      <Separator/>
      <h3 className="text-xl">Latest Vitals</h3>
        
      <Separator/>
      <h3 className="text-xl">Organs / Systems</h3>
  
      <Separator/>
      <h3 className="text-xl">{`Visual Acuity / Snellen's`}</h3>
  
    </div>
  );
}
  
export default memo(EMRPreview)