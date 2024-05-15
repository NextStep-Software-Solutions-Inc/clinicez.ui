import { Avatar, AvatarFallback, AvatarImage } from "@components/ui/avatar";
import { Badge } from "@components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@components/ui/tabs";
import ConsultationNotes from "./ConsultationNotes";
import NurseAssessment from "./NurseAssessment";
import Interventions from "./Interventions";
import Conversation from "./Conversation";
import VitalSigns from "./VitalSigns";
import Files from "./Files";
import { DataTableRowActions } from "./data-table-row-actions";
import { MoreHorizontal, MoreVertical } from "lucide-react";
import { DropdownMenuProvider } from "@components/DropdownMenuProvider";

interface ConsultationDetailsProps {
    consultation: Consultation
}

export default async function ConsultationDetails({ consultation }: ConsultationDetailsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <div className="flex gap-2">
            <Avatar>
              <AvatarImage className="object-cover" src="https://plus.unsplash.com/premium_photo-1714229505201-072ef1c6edcd?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxlZGl0b3JpYWwtZmVlZHwxfHx8ZW58MHx8fHx8"/>
              <AvatarFallback>{consultation.subject[0]}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-bold">Patient Name</span>
              <span className="text-xs text-muted-foreground">Male/27</span>
            </div>
          </div>
          <div className="space-x-2 flex flex-row items-center text-xs capitalize">
            <span className="ring-1 ring-black p-2 rounded-md">Priority: {consultation.priority}</span>
            <span className=" bg-black text-white p-2 rounded-md">Status: {consultation.status}</span>
            <DropdownMenuProvider>
              <DataTableRowActions consultation={consultation}/>
            </DropdownMenuProvider>
          </div>
        </CardTitle>
        <CardDescription>
          
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Badge variant="destructive" className="capitalize">Label: {consultation.label}</Badge>
        <div>{consultation.subject}</div>
      </CardContent>
      <CardFooter>
        <Tabs defaultValue="notes" className="w-full">
          <TabsList>
            <TabsTrigger value="notes">Consultation Notes</TabsTrigger>
            <TabsTrigger value="assessment">Nurse Assessment</TabsTrigger>
            <TabsTrigger value="interventions">Interventions</TabsTrigger>
            <TabsTrigger value="conversation">Conversation</TabsTrigger>
            <TabsTrigger value="vital-signs">Vital Signs</TabsTrigger>
            <TabsTrigger value="files">Files</TabsTrigger>
          </TabsList>
          <TabsContent value="notes">
            <ConsultationNotes consultation={consultation}/>
          </TabsContent>
          <TabsContent value="assessment">
            <NurseAssessment consultation={consultation}/>
          </TabsContent>
          <TabsContent value="interventions">
            <Interventions consultation={consultation}/>
          </TabsContent>
          <TabsContent value="conversation">
            <Conversation consultation={consultation}/>
          </TabsContent>
          <TabsContent value="vital-signs">
            <VitalSigns consultation={consultation}/>
          </TabsContent>
          <TabsContent value="files">
            <Files consultation={consultation}/>
          </TabsContent>
        </Tabs>
      </CardFooter>
    </Card>
  );
}
