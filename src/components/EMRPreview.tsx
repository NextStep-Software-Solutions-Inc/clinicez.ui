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
import ConsultationHistory from "./ConsultationHistory";

interface EMRPreviewProps {
    patientId: string
  }
function EMRPreview({patientId}: EMRPreviewProps) {

  const params = useParams<{clinicUid: string}>();
  const { data: patient, isLoading } = useUser({userId: patientId})
  const { data: allergies, } = useAllergies(patientId)
  const { data: disabilities } = useDisabilities(patientId)
  const { data: illnesses } = useIllnesses(patientId)
  const { data: vaccinations } = useVaccinations(patientId)
  const { data: vitalSigns } = useUserVitalSigns(patientId)
  
  if(isLoading) return <PageLoading label="Loading Records ..."/>
  if(!patient?.data) return <div className="text-muted-foreground">Patient record cannot be found.</div>

  const name = `${patient?.data?.lastName || "-"}, ${patient?.data?.firstName || "-"} ${patient?.data?.middleName ?? ""} ${patient?.data?.suffix ?? ""}`
  return (
    <div className="space-y-5 my-5 overflow-auto h-[calc(100vh-15%)] no-scrollbar">
      <div className="flex gap-5">
        <Picture readOnly user={patient.data}/>
        <div className="">
          <LabelValue label="Name" value={name}/>
          <div className="flex gap-5 items-center">
            <LabelValue label="Gender" value={patient?.data?.gender}/>
            <Separator orientation="vertical" className="h-10"/>
            <LabelValue label="Age" value={patient.data.dob && `${differenceInCalendarYears(new Date(), patient.data.dob)} years old`}/>
          </div>
          <LabelValue label="Blood Type" value={patient?.data?.bloodType}/>
          <LabelValue label="Email" value={(
            <a className="text-primary" href={`mailto:${patient?.data?.email}`}>{patient?.data?.email}</a>
          )}/>
        </div>
      </div>
      <Separator/>
      <Section title={`Basic Information`} >
        <div className="">
          <LabelValue className="flex items-center gap-2 flex-row-reverse justify-end" label="Nickname:" value={patient?.data?.nickname}/>
          <LabelValue className="flex items-center gap-2 flex-row-reverse justify-end" label="Mobile:" value={(
            <a href={`tel:${patient?.data?.mobile}`}>{patient?.data?.mobile}</a>
          )}/>
          <LabelValue className="flex items-center gap-2 flex-row-reverse justify-end" label="Civil Status:" value={patient?.data?.civilStatus}/>
          <LabelValue className="flex items-center gap-2 flex-row-reverse justify-end" label="Religion:" value={patient?.data?.religion}/>
          <LabelValue className="flex items-center gap-2 flex-row-reverse justify-end" label="Nationality:" value={patient?.data?.nationality}/>
        </div>
      </Section>
      
      <Section title={`Allergies`} >
        <AllergiesForm readOnly allergies={allergies ?? []} />
      </Section>

      <Section title={`Vaccination & Immunization`} >
        <VaccinationForm readOnly vaccinations={vaccinations ?? []} />
      </Section>

      <Section title={`Personal & Social History`} >
        <DisabilitiesForm readOnly disabilities={disabilities ?? []} />
        <IllnessesForm readOnly illnesses={illnesses ?? []} />
      </Section>


      <Section title={`Family History`} >
      </Section>

      <Section title={`Consultation History`} >
        <ConsultationHistory
          patientId={patientId}
          clinicUid={params.clinicUid}
        />
      </Section>
     
      <Section title={`Obstetric History`} >
      </Section>

      <Section title={`Vital Signs & Anthropometric Measurements`} >
        <RecentVitalSigns readOnly vitalSigns={vitalSigns ?? []} userId={patient?.data?.userId ?? ""}/>
      </Section>

      <Section title={`Organs / Systems`} >
      </Section>

      <Section title={`Visual Acuity / Snellen's`} >
      </Section>
    </div>
  );
}
  
export default memo(EMRPreview)

export const Section = ({title, children}: {title: string, children?: React.ReactNode}) => {
  return (
    <section className="space-y-3">
      <h3 className="text-xl bg-primary text-primary-foreground rounded px-2 py-1 font-semibold">{title}</h3>
      {children ?? <p className="text-muted-foreground">No records found.</p>}
    </section>
  )
}