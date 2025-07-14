import { Avatar, AvatarFallback } from "@components/ui/avatar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@components/ui/tabs";
import Suspend from "@components/Suspend";
import { GetAppointment, getAppointmentAction } from "@actions/appointments/appointments.action";
import { differenceInCalendarYears } from "date-fns";
import { GetConsultationTicket } from "@actions/consultation/consultation-ticket.action";
import { ExternalLink, FolderHeart } from "lucide-react";
import Link from "next/link";
import dynamic from 'next/dynamic';
import { Tooltip, TooltipContent, TooltipTrigger } from "@components/ui/tooltip";
import Image from "next/image";
import { Badge } from "@components/ui/badge";
import { Separator } from "@components/ui/separator";
import { GetHpsByIds, getHpsByIdsAction } from "@actions/hp.actions";
import Each from "@components/utils/Each";
import { Fragment } from "react";
import EMRPreviewSheet from "@components/EMRPreviewSheet";
import { Button } from "@components/ui/button";
import Prescriptions from "../Prescriptions";
import MedicalCertificate from "../MedicalCertificate";
import ImagingStudies from "../ImagingStudies";
import LaboratoryRequest from "../LaboratoryRequest";

const VitalSigns = dynamic(() => import('./VitalSigns'), { ssr: false, loading: () => <div>Loading...</div> });
const Conversation = dynamic(() => import('./Conversation'), { ssr: false, loading: () => <div>Loading...</div> });
const Files = dynamic(() => import('./Files'), { ssr: false, loading: () => <div>Loading...</div> });
const Interventions = dynamic(() => import('./Interventions'), { ssr: false, loading: () => <div>Loading...</div> });
const NurseAssessment = dynamic(() => import('./NurseAssessment'), { ssr: false, loading: () => <div>Loading...</div> });
const ConsultationNotes = dynamic(() => import('./ConsultationNotes'), { ssr: false, loading: () => <div>Loading...</div> });
interface ConsultationDetailsProps {
  consultation: NonNullable<GetConsultationTicket["data"]>
}
export default async function ConsultationDetails({ consultation }: ConsultationDetailsProps) {
  const appointment = await getAppointmentAction(consultation?.appointmentId ?? 0, consultation.Clinic.clinicUid);
  
  const [creators] = await Promise.all([
    await getHpsByIdsAction(consultation.ConsultationTicketHPs.map(c => Number(c.hpId))),
  ]);

  return (
    <>
      <PatientHpDetails creators={creators} user={appointment.data?.Requesters[0].User!}/>
      <BackgroundInfo 
        appointment={appointment.data} 
        consultation={consultation} 
        user={appointment.data?.Requesters[0].User!}
      />
      <ClinicalRecords 
        consultationTicketId={consultation.id} 
        clinicUid={consultation.Clinic.clinicUid}
        hpId={consultation.ConsultationTicketHPs[0]?.hpId}
        isArchived={false}
        patientId={appointment.data?.Requesters[0].User?.userId}
      />
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
                  <ExternalLink className="w-4 h-4 text-primary"/>
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
              <ConsultationNotes consultation={consultation}/>
            </Suspend>
          </TabsContent>
          <TabsContent value="pre-assessment-notes">
            <Suspend>
              <NurseAssessment consultation={consultation}/>
            </Suspend>
          </TabsContent>
          <TabsContent value="interventions">
            <Suspend>
              <Interventions consultation={consultation}/>
            </Suspend>
          </TabsContent>
          <TabsContent value="conversation">
            <Suspend>
              <Conversation consultation={consultation}/>
            </Suspend>
          </TabsContent>
          <TabsContent value="vital-signs">
            <Suspend>
              <VitalSigns consultation={consultation} userId={user.userId}/>
            </Suspend>
          </TabsContent>
          <TabsContent value="files">
            <Suspend>
              <Files consultation={consultation}/>
            </Suspend>
          </TabsContent>
        </Tabs>
      </CardFooter>
    </Card>
  )
}

interface ClinicalRecordsProps {
  consultationTicketId: number;
  clinicUid?: string;
  hpId?: number;
  isArchived?: boolean;
  patientId?: string;
}

export const ClinicalRecords = ({
  consultationTicketId,
  clinicUid,
  hpId,
  isArchived = false,
  patientId
}: ClinicalRecordsProps) => {
  const tabConfigs = [
    {
      value: "prescription",
      tabTitle: "Prescription",
      cardTitle: "Prescription Builder",
      description: "Create and manage prescriptions for your patients.",
      Component: Prescriptions,
    },
    {
      value: "medical-certificate",
      tabTitle: "Medical Certificate",
      cardTitle: "Medical Certificate Builder",
      description: "Create and manage medical certificates for your patients.",
      Component: MedicalCertificate,
    },
    {
      value: "imaging-studies",
      tabTitle: "Imaging Studies",
      cardTitle: "Imaging Studies Builder",
      description: "Create and manage imaging study requests for your patients.",
      Component: ImagingStudies,
    },
    {
      value: "laboratory",
      tabTitle: "Laboratory",
      cardTitle: "Laboratory Request",
      description: "Create and manage laboratory test requests for your patients.",
      Component: LaboratoryRequest,
    },
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
                  hpId={hpId}
                  isArchived={isArchived}
                  patientId={patientId}
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
  creators: GetHpsByIds
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
export const PatientHpDetails = ({ creators = [], user }: PatientHpDetailsProps) => {
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
                ? <Image className="object-cover" width={80} height={80} src={user.picture} alt={user.nickname ?? ""}/>
                : <AvatarFallback>{user.firstName?.charAt(0)}{user.lastName?.charAt(0)}</AvatarFallback>
              }
              
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-semibold">{user.firstName} {user.lastName}</span>
              <div className="text-xs text-muted-foreground">
                {user.gender?.charAt(0)} / <span>{user.dob && differenceInCalendarYears(new Date(), user.dob)}</span>
              </div>
            </div>
          </div>
          <div>
            <Tooltip>
              <EMRPreviewSheet>
                <TooltipTrigger asChild>
                  <Button size="icon" variant="link">
                    <FolderHeart className="w-6 h-6"/>
                  </Button>
                </TooltipTrigger>
              </EMRPreviewSheet>
              <TooltipContent> 
                EMR Preview
              </TooltipContent>
            </Tooltip>
          </div>
        </CardContent>
      </Card>
      <Card className="grow">
        <CardHeader>
          <CardTitle className="">Healthcare Provider Details</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-5 items-center">
          <Each
            of={creators}
            render={(creator, index) => (
              <Fragment key={creator.id} >
                <div className="flex gap-3 items-center">
                  <Avatar>
                    {
                      creator?.HPProfile?.picture
                        ? <Image className="object-cover" width={80} height={80} src={creator.HPProfile.picture} alt={creator?.HPProfile?.name ?? ""}/>
                        : <AvatarFallback>{creator?.HPProfile?.name.slice(0,2)}</AvatarFallback>
                    }
                    
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold">{creator?.HPProfile?.title} {creator?.HPProfile?.name} {creator?.HPProfile?.suffix}</span>
                    <div className="text-xs text-muted-foreground">
                      <Badge variant="secondary">{creator?.HPProfile?.fields}</Badge> / <span>{creator.HPType.name}</span>
                    </div>
                  </div>
                </div>
                {index !== (creators.length - 1)  && <Separator orientation="vertical" className="h-10"/>}
              </Fragment>
            )}
          />
        </CardContent>
      </Card>
    </div>
  )
}