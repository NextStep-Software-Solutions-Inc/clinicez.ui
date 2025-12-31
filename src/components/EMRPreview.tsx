"use client";

import { memo } from "react";
import { Picture } from "../app/(main)/user/[user]/phr/Picture";
import { Separator } from "./ui/separator";
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
import { useParams } from "next/navigation";
import EMRFilesWrapper from "./EMRFilesWrapper";
import { calculateAge } from "@/lib/utils";
import ConsultationHistory from "./ConsultationHistory";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { User, Stethoscope, FileText, Mail, Phone, Heart, ShieldAlert, Syringe, Users, Calendar, UserCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface EMRPreviewProps {
  patientId: string
}
function EMRPreview({ patientId }: EMRPreviewProps) {

  const params = useParams<{ clinicUid: string }>();
  const { data: patient, isLoading } = useUser({ userId: patientId })
  const { data: allergies, } = useAllergies(patientId)
  const { data: disabilities } = useDisabilities(patientId)
  const { data: illnesses } = useIllnesses(patientId)
  const { data: vaccinations } = useVaccinations(patientId)
  const { data: vitalSigns } = useUserVitalSigns(patientId)

  if (isLoading) return <PageLoading label="Loading Records ..." />
  if (!patient?.data) return <div className="text-muted-foreground">Patient record cannot be found.</div>

  const name = `${patient?.data?.lastName || "-"}, ${patient?.data?.firstName || "-"} ${patient?.data?.middleName ?? ""} ${patient?.data?.suffix ?? ""}`
  const age = calculateAge(patient.data.dob);

  return (
    <div className="my-5 h-[calc(100vh-15%)] flex flex-col">
      {/* Patient Header - Always Visible */}
      <div className="mb-5 pb-5 border-b">
        <div className="flex gap-5 mb-4">
          <Picture readOnly user={patient.data} />
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-2">{name}</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 text-sm">
                <UserCircle className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Gender:</span>
                <span className="font-medium">{patient?.data?.gender || "-"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Age:</span>
                <span className="font-medium">{age ? `${age} years old` : "-"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Heart className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Blood Type:</span>
                <span className="font-medium">{patient?.data?.bloodType || "-"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <a href={`tel:${patient?.data?.mobile}`} className="font-medium text-primary hover:underline">
                  {patient?.data?.mobile || "-"}
                </a>
              </div>
              <div className="flex items-center gap-2 text-sm col-span-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a href={`mailto:${patient?.data?.email}`} className="font-medium text-primary hover:underline">
                  {patient?.data?.email || "-"}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabbed Content */}
      <Tabs defaultValue="profile" className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="w-full justify-start bg-transparent p-0 h-auto gap-2">
          <TabsTrigger
            value="profile"
            className="flex-1 rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=inactive]:bg-gray-100 data-[state=inactive]:text-gray-600 py-2.5"
          >
            Patient Profile
          </TabsTrigger>
          <TabsTrigger
            value="consultations"
            className="flex-1 rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=inactive]:bg-gray-100 data-[state=inactive]:text-gray-600 py-2.5"
          >
            Consultations and Vitals
          </TabsTrigger>
          <TabsTrigger
            value="files"
            className="flex-1 rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=inactive]:bg-gray-100 data-[state=inactive]:text-gray-600 py-2.5"
          >
            Files and Medical History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="flex-1 overflow-auto mt-0 pt-5 no-scrollbar">
          <div className="space-y-5">
            <Section title="Basic Information" icon={<User className="h-5 w-5" />}>
              <div className="grid grid-cols-2 gap-3">
                <InfoItem label="Nickname" value={patient?.data?.nickname} />
                <InfoItem label="Civil Status" value={patient?.data?.civilStatus} />
                <InfoItem label="Religion" value={patient?.data?.religion} />
                <InfoItem label="Nationality" value={patient?.data?.nationality} />
              </div>
            </Section>

            <Section title="Allergies" icon={<ShieldAlert className="h-5 w-5" />}>
              <AllergiesForm readOnly allergies={allergies ?? []} />
            </Section>

            <Section title="Disabilities" icon={<Users className="h-5 w-5" />}>
              <DisabilitiesForm readOnly disabilities={disabilities ?? []} />
            </Section>

            <Section title="Personal & Social History" icon={<FileText className="h-5 w-5" />}>
              <IllnessesForm readOnly illnesses={illnesses ?? []} />
            </Section>

            <Section title="Vaccination & Immunization" icon={<Syringe className="h-5 w-5" />}>
              <VaccinationForm readOnly vaccinations={vaccinations ?? []} />
            </Section>
          </div>
        </TabsContent>

        <TabsContent value="consultations" className="flex-1 overflow-auto mt-0 pt-5 no-scrollbar">
          <div className="space-y-5">
            <Section title="Consultation History" icon={<Stethoscope className="h-5 w-5" />}>
              <ConsultationHistory
                patientId={patientId}
                clinicUid={params.clinicUid}
              />
            </Section>

            <Section title={`Files`} >
              <EMRFilesWrapper
                patientId={patientId}
              />
            </Section>

            <Section title="Vital Signs" icon={<Heart className="h-5 w-5" />}>
              <RecentVitalSigns readOnly vitalSigns={vitalSigns ?? []} userId={patient?.data?.userId ?? ""} />
            </Section>
          </div>
        </TabsContent>

        <TabsContent value="files" className="flex-1 overflow-auto mt-0 pt-5 no-scrollbar">
          <div className="space-y-5">
            <Section title="General Health Assessment" icon={<FileText className="h-5 w-5" />}>
              <div className="space-y-4">
                <HealthHistoryItem title="Medical History" />
                <HealthHistoryItem title="Family History" />
                <HealthHistoryItem title="Surgical History" />
                <HealthHistoryItem title="Personal History" />
                <HealthHistoryItem title="Obstetric History" />
              </div>
            </Section>

            <Section title="Files" icon={<FileText className="h-5 w-5" />}>
              <p className="text-muted-foreground">No files uploaded yet.</p>
            </Section>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default memo(EMRPreview)

const InfoItem = ({ label, value }: { label: string, value?: string | null }) => {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value || "-"}</span>
    </div>
  )
}

const HealthHistoryItem = ({ title }: { title: string }) => {
  return (
    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
      <p className="font-medium text-sm text-gray-800 mb-1">{title}</p>
      <p className="text-sm text-muted-foreground">No records available</p>
    </div>
  )
}

export const Section = ({ title, icon, children }: { title: string, icon?: React.ReactNode, children?: React.ReactNode }) => {
  return (
    <section className="border rounded-lg p-4 bg-white shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        {icon && <div className="text-gray-600">{icon}</div>}
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>
      <div>
        {children ?? <p className="text-muted-foreground">No records found.</p>}
      </div>
    </section>
  )
}