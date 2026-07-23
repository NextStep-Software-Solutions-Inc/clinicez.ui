import { Avatar, AvatarFallback } from "@components/ui/avatar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@components/ui/tabs";
import Suspend from "@components/Suspend";
import { GetAppointment, getAppointmentAction } from "@actions/appointments/appointments.action";
import { GetConsultationTicket } from "@actions/consultation/consultation-ticket.action";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import dynamic from 'next/dynamic';
import { Tooltip, TooltipContent, TooltipTrigger } from "@components/ui/tooltip";
import Image from "next/image";
import { Badge } from "@components/ui/badge";
import { Separator } from "@components/ui/separator";
import Each from "@components/utils/Each";
import { Fragment } from "react";
// import EMRPreviewSheetWrapper from "@components/EMRPreviewSheetWrapper";
import EMRTriggerButton from "@components/EMRTriggerButton";
import PrescriptionsWrapper from "@components/PrescriptionsWrapper";
import { calculateAge } from "@/lib/utils";
import MedicalCertificateWrapper from "@components/MedicalCertificateWrapper";
import ImagingStudiesWrapper from "@components/ImagingStudiesWrapper";
import LaboratoryRequestWrapper from "@components/LaboratoryRequestWrapper";
import HeartStationRequestWrapper from "@/components/HeartStationRequestWrapper";
import ReferralSlipWrapper from "../clinic/clinical-records/referral-slip/ReferralSlipWrapper";
import EKASWrapper from "../clinic/clinical-records/ekas/EKASWrapper";
import { AddConsultationHealthcareProvider } from "./AddConsultationHealthcareProvider";

const VitalSigns = dynamic(() => import('./VitalSigns'), { loading: () => <div>Loading...</div> });
const Conversation = dynamic(() => import('./Conversation'), { loading: () => <div>Loading...</div> });
const Files = dynamic(() => import('./Files'), { loading: () => <div>Loading...</div> });
const Interventions = dynamic(() => import('./Interventions'), { loading: () => <div>Loading...</div> });
const NurseAssessment = dynamic(() => import('./NurseAssessment'), { loading: () => <div>Loading...</div> });
const ConsultationNotes = dynamic(() => import('./ConsultationNotes'), { loading: () => <div>Loading...</div> });
interface ConsultationDetailsProps {
  consultation: NonNullable<GetConsultationTicket["data"]>
}

export interface PatientProfile {
  firstName: string | null;
  middleName?: string | null;
  lastName?: string | null;
  suffix?: string | null;
  dob?: Date | null;
  gender?: string | null;
  address?: {
    homeAddress?: string | null;
    city?: string | null;
    state?: string | null;
    zipCode?: string | null;
    country?: string | null;
  }
}

export default async function ConsultationDetails({ consultation }: ConsultationDetailsProps) {
  const appointment = await getAppointmentAction(consultation?.appointmentId ?? 0, consultation.Clinic.clinicUid);
  const user = appointment.data?.Requesters[0].User;
  const userDetails: PatientProfile = {
    firstName: user?.firstName ?? null,
    middleName: user?.middleName ?? null,
    lastName: user?.lastName ?? null,
    suffix: user?.suffix ?? null,
    dob: user?.dob ?? null,
    gender: user?.gender ?? null,
    address: {
      homeAddress: user?.UserAddresses[0]?.address ?? null,
      city: user?.UserAddresses[0]?.city ?? null,
      state: user?.UserAddresses[0]?.state ?? null,
      zipCode: user?.UserAddresses[0]?.zipCode ?? null,
      country: user?.UserAddresses[0]?.country ?? null,
    }
  };

  // Transform ConsultationTicketHPs to match the GetHpsByIds format
  // Filter out inactive providers and those missing HPProfile
  const creators = consultation.ConsultationTicketHPs
    .map(ticket => ticket.HealthCareProvider)
    .filter((hp): hp is NonNullable<typeof hp> => hp !== null && hp.isActive && hp.HPProfile !== null);

  return (
    <>
      <PatientHpDetails
        creators={creators}
        user={appointment.data?.Requesters[0].User!}
        consultationId={consultation.id}
        clinicUid={consultation.Clinic.clinicUid}
        hpIds={consultation.ConsultationTicketHPs.map(c => Number(c.hpId))}
      />
      <BackgroundInfo
        appointment={appointment.data}
        consultation={consultation}
        user={appointment.data?.Requesters[0].User!}
      />
      <ClinicalRecords
        consultationTicketId={consultation.id}
        clinicUid={consultation.Clinic.clinicUid}
        clinicId={consultation.clinicId}
        hpIds={consultation.ConsultationTicketHPs.map(c => Number(c.hpId))}
        isArchived={false}
        patientId={appointment.data?.Requesters[0].User?.ClinicPatients[0]?.id}
        userId={appointment.data?.Requesters[0].User?.id}
        userInfo={userDetails}
        appointment={appointment.data}
      />
      {/* <EMRPreviewSheetWrapper /> */}
    </>
  );
}

interface BackgroundInfoProps {
  appointment: GetAppointment["data"]
  consultation: ConsultationDetailsProps["consultation"]
  user: {
    id: number;
    userId: string;
    firstName: string | null;
    middleName: string | null;
    lastName: string | null;
    suffix: string | null;
    gender: string | null;
    picture: string | null;
    nickname: string | null;
    dob: Date | null;
  }
}
export const BackgroundInfo = ({ appointment, consultation, user }: BackgroundInfoProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Background Information
        </CardTitle>
        <CardDescription>
          <span className="flex items-center gap-2">
            {appointment?.subject}
            <Link target="_blank" href={{
              pathname: `../appointments`,
              query: {
                _appointment: appointment?.id,
              }
            }}>
              <Tooltip>
                <TooltipTrigger>
                  <ExternalLink className="w-4 h-4 text-primary" />
                </TooltipTrigger>
                <TooltipContent>
                  View Appointment
                </TooltipContent>
              </Tooltip>
            </Link>
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        {appointment?.complaint}
      </CardContent>
      <CardFooter>
        <Tabs defaultValue="notes" className="w-full">
          <TabsList>
            <TabsTrigger value="notes">Consultation Notes</TabsTrigger>
            <TabsTrigger value="pre-assessment-notes">Pre-Assessment Notes</TabsTrigger>
            <TabsTrigger value="interventions">Interventions</TabsTrigger>
            {/* <TabsTrigger value="conversation">Conversation</TabsTrigger> */}
            <TabsTrigger value="vital-signs">Vital Signs</TabsTrigger>
            {/* <TabsTrigger value="files">Files</TabsTrigger> */}
          </TabsList>
          <TabsContent value="notes">
            <Suspend>
              <ConsultationNotes consultation={consultation} patientUserId={user?.userId} />
            </Suspend>
          </TabsContent>
          <TabsContent value="pre-assessment-notes">
            <Suspend>
              <NurseAssessment consultation={consultation} />
            </Suspend>
          </TabsContent>
          <TabsContent value="interventions">
            <Suspend>
              <Interventions consultation={consultation} />
            </Suspend>
          </TabsContent>
          <TabsContent value="conversation">
            <Suspend>
              <Conversation consultation={consultation} />
            </Suspend>
          </TabsContent>
          <TabsContent value="vital-signs">
            <Suspend>
              <VitalSigns consultation={consultation} userId={user.userId} />
            </Suspend>
          </TabsContent>
          <TabsContent value="files">
            <Suspend>
              <Files consultation={consultation} />
            </Suspend>
          </TabsContent>
        </Tabs>
      </CardFooter>
    </Card>
  )
}

interface ClinicalRecordsProps {
  consultationTicketId: number;
  clinicUid: string;
  clinicId: number;
  hpIds: number[];
  isArchived?: boolean;
  patientId?: number;
  userId?: number;
  userInfo?: PatientProfile | null;
  appointment?: GetAppointment["data"];
}

export const ClinicalRecords = ({
  consultationTicketId,
  clinicUid,
  clinicId,
  hpIds,
  isArchived = false,
  patientId,
  userId,
  userInfo,
  appointment
}: ClinicalRecordsProps) => {
  const tabConfigs = [
    {
      value: "prescription",
      tabTitle: "Prescription",
      cardTitle: "Prescription Builder",
      description: "Create and manage prescriptions for your patients.",
      Component: PrescriptionsWrapper,
    },
    {
      value: "medical-certificate",
      tabTitle: "Medical Certificate",
      cardTitle: "Medical Certificate Builder",
      description: "Create and manage medical certificates for your patients.",
      Component: MedicalCertificateWrapper,
    },
    {
      value: "imaging-studies",
      tabTitle: "Imaging Studies",
      cardTitle: "Imaging Studies Builder",
      description: "Create and manage imaging study requests for your patients.",
      Component: ImagingStudiesWrapper,
    },
    {
      value: "laboratory",
      tabTitle: "Laboratory",
      cardTitle: "Laboratory Request",
      description: "Create and manage laboratory test requests for your patients.",
      Component: LaboratoryRequestWrapper,
    },
    {
      value: "heart-station",
      tabTitle: "Heart Station",
      cardTitle: "Heart Station Request",
      description: "Create and manage heart station requests for your patients.",
      Component: HeartStationRequestWrapper,
    },
    {
      value: "referral-slip",
      tabTitle: "Referral Slip",
      cardTitle: "Referral Slip Management",
      description: "Create and manage referral slips for your patients.",
      Component: ReferralSlipWrapper,
    },
    {
      value: "ekas",
      tabTitle: "EKAS & EPRESS",
      cardTitle: "Electronic Yakap Availment Slip & Electronic Prescription Slip",
      description: "Download the Electronic Yakap Availment Slip for this consultation.",
      Component: EKASWrapper,
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Clinical Records
        </CardTitle>
      </CardHeader>
      <CardFooter>
        <Tabs defaultValue="prescription" className="w-full">
          <TabsList>
            <Each
              of={tabConfigs}
              render={tab => (
                <TabsTrigger value={tab.value}>{tab.tabTitle}</TabsTrigger>
              )}
            />
          </TabsList>
          <Each
            of={tabConfigs}
            render={tab => (
              <TabsContent value={tab.value} key={tab.value}>
                <div className="py-4 space-y-4">
                  <span className="block text-xl font-semibold leading-tight mb-2">{tab.cardTitle}</span>
                  <span className="block text-muted-foreground mb-2">{tab.description}</span>
                </div>
                <tab.Component
                  consultationTicketId={consultationTicketId}
                  clinicUid={clinicUid}
                  clinicId={clinicId}
                  hpIds={hpIds}
                  isArchived={isArchived}
                  patientId={patientId}
                  userId={userId}
                  userInfo={userInfo}
                  appointment={appointment}
                />
              </TabsContent>
            )}
          />
        </Tabs>
      </CardFooter>
    </Card>
  );
}

interface PatientHpDetailsProps {
  creators: NonNullable<NonNullable<GetConsultationTicket["data"]>["ConsultationTicketHPs"][number]["HealthCareProvider"]>[]
  user: {
    id: number;
    userId: string;
    firstName: string | null;
    middleName: string | null;
    lastName: string | null;
    suffix: string | null;
    gender: string | null;
    picture: string | null;
    nickname: string | null;
    dob: Date | null;
  }
  consultationId: number;
  clinicUid: string;
  hpIds: number[];
}
export const PatientHpDetails = ({ creators = [], user, consultationId, clinicUid, hpIds }: PatientHpDetailsProps) => {
  return (
    <div className="flex flex-wrap gap-2 justify-between">
      <Card className="grow">
        <CardHeader>
          <CardTitle className="">Patient Details</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-3 items-center justify-between">
          <div className="flex gap-2 items-center">
            <Avatar>
              {user.picture
                ? <Image className="object-cover" width={80} height={80} src={user.picture} alt={user.nickname ?? ""} />
                : <AvatarFallback>{user.firstName?.charAt(0)}{user.lastName?.charAt(0)}</AvatarFallback>
              }

            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-semibold">{user.firstName} {user.lastName}</span>
              <div className="text-xs text-muted-foreground">
                {user.gender?.charAt(0)} / <span>{calculateAge(user.dob) ?? ""}</span>
              </div>
            </div>
          </div>
          {/* <div>
            <Tooltip>
              <TooltipTrigger asChild>
                <EMRTriggerButton patientId={user.userId} />
              </TooltipTrigger>
              <TooltipContent>
                EMR Preview
              </TooltipContent>
            </Tooltip>
          </div> */}
        </CardContent>
      </Card>
      <Card className="grow">
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="">Healthcare Provider Details</CardTitle>
          <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-3">
            <Badge className="bg-red-50 text-red-800 border border-red-200">Experimental</Badge>
            <span className="text-xs text-red-800">Manual verification required: double-check provider assignments after saving.</span>
            <AddConsultationHealthcareProvider
              consultationId={consultationId}
              clinicUid={clinicUid}
              existingHpIds={hpIds}
            />
          </div>
        </CardHeader>
        <CardContent className="flex gap-5 items-center">
          {creators.length === 0 ? (
            <div className="text-sm text-muted-foreground">No healthcare providers assigned</div>
          ) : (
            <Each
              of={creators}
              render={(creator, index) => (
                <Fragment key={creator.id} >
                  <div className="flex gap-3 items-center">
                    <Avatar>
                      {
                        creator?.HPProfile?.picture
                          ? <Image className="object-cover" width={80} height={80} src={creator.HPProfile.picture} alt={creator?.HPProfile?.name ?? ""} />
                          : <AvatarFallback>{creator?.HPProfile?.name.slice(0, 2)}</AvatarFallback>
                      }

                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold">{creator?.HPProfile?.title} {creator?.HPProfile?.name} {creator?.HPProfile?.suffix}</span>
                      <div className="text-xs text-muted-foreground">
                        <Badge variant="secondary">{creator?.HPProfile?.specialties}</Badge> / <span>{creator.HPType.name}</span>
                      </div>
                    </div>
                  </div>
                  {index !== (creators.length - 1) && <Separator orientation="vertical" className="h-10" />}
                </Fragment>
              )}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}