"use client";

import { getUserAllergiesAction } from "@actions/user-allergy.action";
import { getUserDisabilitiesAction } from "@actions/user-disability.action";
import { getUserIllnessesAction } from "@actions/user-illness.action";
import { getUserVaccinationsAction } from "@actions/user-vaccination.action";
import { getUserAction } from "@actions/user.action";
import { useEffect, useState } from "react";
import { Picture } from "../app/(main)/user/[user]/phr/Picture";
import { Separator } from "./ui/separator";
import { differenceInCalendarYears } from "date-fns";
import Suspend from "./Suspend";
import AllergiesForm from "../app/(main)/user/[user]/phr/allergies/AllergiesForm";
import { VaccinationForm } from "../app/(main)/user/[user]/phr/vaccination-immunization/VaccinationForm";
import DisabilitiesForm from "../app/(main)/user/[user]/phr/disabilities/DisabilitiesForm";
import IllnessesForm from "../app/(main)/user/[user]/phr/disabilities/IllnessesForm";
import PageLoading from "./PageLoading";
import { LabelValue } from "./LabelValue";

interface EMRPreviewProps {
    patientId: string;
  }
export default function EMRPreview({patientId}: EMRPreviewProps) {
  const [loading, setLoading] = useState(true)
  const [patient, setPatient] = useState<Awaited<ReturnType<typeof getUserAction>>>()
  const [allergies, setAllergies] = useState<Awaited<ReturnType<typeof getUserAllergiesAction>>>()
  const [vaccinations, setVaccinations] = useState<Awaited<ReturnType<typeof getUserVaccinationsAction>>>()
  const [disabilities, setDisabilities] = useState<Awaited<ReturnType<typeof getUserDisabilitiesAction>>>()
  const [illnesses, setIllnesses] = useState<Awaited<ReturnType<typeof getUserIllnessesAction>>>()
  
  
  useEffect(() => {
    (async () => {
      setLoading(true)
      const [patient, allergies, vaccinations, disabilities, illnesses] = await Promise.all([
        getUserAction(patientId),
        getUserAllergiesAction(patientId),
        getUserVaccinationsAction(patientId),
        getUserDisabilitiesAction(patientId),
        getUserIllnessesAction(patientId)
      ])
        
      await setPatient(() => patient)
      await setAllergies(() => allergies)
      await setVaccinations(() => vaccinations)
      await setDisabilities(() => disabilities)
      await setIllnesses(() => illnesses)
      setLoading(false)
    })()
  }, [patientId])
  
  if(loading) return <PageLoading label="Loading Records ..."/>
  const name = `${patient?.lastName || "-"}, ${patient?.firstName || "-"} ${patient?.middleName ?? ""} ${patient?.suffix ?? ""}`
  return (
    <div className="space-y-5 my-5 overflow-auto h-screen no-scrollbar">
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
      <Suspend>
        <AllergiesForm readOnly allergies={allergies ?? []} />
      </Suspend>
  
      <Separator/>
      <h3 className="text-xl">Vaccination & Immunization</h3>
      <Suspend>
        <VaccinationForm readOnly vaccinations={vaccinations ?? []} />
      </Suspend>
      <Separator/>
      <h3 className="text-xl">Personal & Social History</h3>
      <Suspend>
        <DisabilitiesForm readOnly disabilities={disabilities ?? []} />
      </Suspend>
      <Suspend>
        <IllnessesForm readOnly illnesses={illnesses ?? []} />
      </Suspend>
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
  
