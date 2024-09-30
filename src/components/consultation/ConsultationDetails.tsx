import { Avatar, AvatarFallback } from "@components/ui/avatar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@components/ui/tabs";
import Suspend from "@components/Suspend";
import { GetAppointment, getAppointmentAction } from "@actions/appointments/appointments.action";
import { GetUser, getUserAction } from "@actions/users/user.action";
import { differenceInCalendarYears } from "date-fns";
import { GetConsultationTicket } from "@actions/consultation/consultation-ticket.action";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import dynamic from 'next/dynamic';
import { Tooltip, TooltipContent, TooltipTrigger } from "@components/ui/tooltip";
import Image from "next/image";
import { Badge } from "@components/ui/badge";
import { Separator } from "@components/ui/separator";
import { GetHP, getHPAction, GetHpsByIds, getHpsByIdsAction } from "@actions/hp.actions";
import Each from "@components/utils/Each";
import { Fragment } from "react";

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

  const appointment = await getAppointmentAction(consultation?.appointmentId ?? 0);
  
  const [user, creators] = await Promise.all([
    await getUserAction(appointment.data?.Requesters[0].userId ?? ""),
    await getHpsByIdsAction(consultation.ConsultationTicketAuthors.map(c => Number(c.hpId))),
    
  ]);
  
  return (
    <>
      <PatientHpDetails creators={creators} user={user}/>
      <BackgroundInfo 
        appointment={appointment.data} 
        consultation={consultation} 
        user={user}
      />
    </>
  );
}

interface BackgroundInfoProps {
  appointment: GetAppointment["data"]
  consultation: ConsultationDetailsProps["consultation"]
  user: GetUser
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

interface PatientHpDetailsProps {
  creators: GetHpsByIds
  user: GetUser
}
export const PatientHpDetails = ({ creators = [], user }: PatientHpDetailsProps) => {
  return (
    <div className="flex flex-wrap gap-2 justify-between">
      <Card className="grow">
        <CardHeader>
          <CardTitle className="">Patient Details</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2 items-center">
          <Avatar>
            <Image className="object-cover" width={80} height={80} src={user.picture ?? ""} alt={user.nickname ?? ""}/>
            <AvatarFallback>{user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">{user.firstName} {user.lastName}</span>
            <div className="text-xs text-muted-foreground">
              <Badge>{user.gender?.toLocaleLowerCase()}</Badge> / <span>{user.dob && differenceInCalendarYears(new Date(), user.dob)}</span>
            </div>
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
                <div className="flex gap-2 items-center">
                  <Avatar>
                    <Image className="object-cover" width={80} height={80} src={creator?.HPProfile?.picture ?? ""} alt={creator?.HPProfile?.name ?? ""}/>
                    <AvatarFallback>{creator?.HPProfile?.name.split(" ").map(c => c.charAt(0)).join()}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold">{creator?.HPProfile?.title} {creator?.HPProfile?.name} {creator?.HPProfile?.suffix}</span>
                    <div className="text-xs text-muted-foreground">
                      <Badge>{creator?.HPProfile?.fields}</Badge> / <span>{creator?.type.toLocaleLowerCase()}</span>
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