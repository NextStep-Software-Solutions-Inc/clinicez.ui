import { Avatar, AvatarFallback, AvatarImage } from "@components/ui/avatar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@components/ui/tabs";
import ConsultationNotes from "./ConsultationNotes";
import NurseAssessment from "./NurseAssessment";
import Interventions from "./Interventions";
import { DataTableRowActions } from "./data-table-row-actions";
import { DropdownMenuProvider } from "@components/DropdownMenuProvider";
import Suspend from "@components/Suspend";
import { getAppointmentAction } from "@actions/appointments/appointments.action";
import { getUserAction } from "@actions/users/user.action";
import { differenceInCalendarYears } from "date-fns";
import { GetConsultationRecord } from "@actions/consultation/consultation-record.action";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import dynamic from 'next/dynamic';

const VitalSigns = dynamic(() => import('./VitalSigns'), { ssr: false, loading: () => <div>Loading...</div> });
const Conversation = dynamic(() => import('./Conversation'), { ssr: false, loading: () => <div>Loading...</div> });
const Files = dynamic(() => import('./Files'), { ssr: false, loading: () => <div>Loading...</div> });
interface ConsultationDetailsProps {
    consultation: NonNullable<GetConsultationRecord["data"]>
}
export default async function ConsultationDetails({ consultation }: ConsultationDetailsProps) {

  const appointment = await getAppointmentAction(consultation?.appointmentId ?? 0);
  const user = await getUserAction(appointment.data?.Requesters[0].email ?? "");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <div className="flex gap-2">
            <Avatar>
              <AvatarImage className="object-cover" src={user.picture ?? ""}/>
              <AvatarFallback>{consultation?.subject.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-semibold">{user.firstName} {user.lastName}</span>
              <div className="text-xs text-muted-foreground"><span>{"Male"}</span> / <span>{differenceInCalendarYears(new Date(), new Date())}</span></div>
            </div>
          </div>
          <DropdownMenuProvider>
            <DataTableRowActions consultation={consultation}/>
          </DropdownMenuProvider>
        </CardTitle>
        <CardDescription>
          <span className="flex items-center gap-2">
            {appointment.data?.subject} 
            <Link target="_blank" href={{
              pathname: `../appointments`,
              query: {
                _appointment: appointment.data?.id,
              }
            }}>
              <ExternalLink className="w-4 h-4 text-primary"/></Link>
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        {appointment.data?.complaint} 
      </CardContent>
      <CardFooter>
        <Tabs defaultValue="notes" className="w-full">
          <TabsList>
            <TabsTrigger value="notes">Consultation Notes</TabsTrigger>
            <TabsTrigger value="pre-consultation-notes">Pre-Consultation Notes</TabsTrigger>
            <TabsTrigger value="interventions">Interventions</TabsTrigger>
            <TabsTrigger value="conversation">Conversation</TabsTrigger>
            <TabsTrigger value="vital-signs">Vital Signs</TabsTrigger>
            <TabsTrigger value="files">Files</TabsTrigger>
          </TabsList>
          <TabsContent value="notes">
            <ConsultationNotes consultation={consultation}/>
          </TabsContent>
          <TabsContent value="pre-consultation-notes">
            <NurseAssessment consultation={consultation}/>
          </TabsContent>
          <TabsContent value="interventions">
            <Interventions consultation={consultation}/>
          </TabsContent>
          <TabsContent value="conversation">
            <Suspend>
              <Conversation consultation={consultation}/>
            </Suspend>
          </TabsContent>
          <TabsContent value="vital-signs">
            <Suspend>
              <VitalSigns consultation={consultation}/>
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
  );
}
