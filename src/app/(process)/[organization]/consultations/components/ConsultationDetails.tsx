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
import { DropdownMenuProvider } from "@components/DropdownMenuProvider";
import Suspend from "@components/Suspend";

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
          <DropdownMenuProvider>
            <DataTableRowActions consultation={consultation}/>
          </DropdownMenuProvider>
        </CardTitle>
        <CardDescription>
          
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p>
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Doloribus voluptas vel dicta excepturi natus officiis accusantium, eum nam eligendi quia deleniti nobis modi fugiat veritatis officia vero. Aliquid vero nobis, molestias praesentium inventore dolor adipisci autem velit aut sit accusantium cumque a amet omnis nisi soluta obcaecati? Vitae eaque dolorem eligendi delectus laborum repudiandae culpa optio fuga omnis inventore corrupti laboriosam iste assumenda quasi sequi, deleniti commodi illum doloribus iusto. Voluptas saepe eaque maiores, velit sed sint quod eveniet cum quibusdam fuga delectus consectetur! Tempora, eaque omnis. Impedit dicta iusto dolorum magni sapiente quasi doloremque. Voluptatum enim iure debitis ab voluptatem consequuntur, expedita, excepturi quae iste nam assumenda, ut eius qui perferendis impedit dolores obcaecati ex unde sint? Voluptate fugiat et vero sed eius consequatur, ex debitis blanditiis. Dolor eius saepe dolore voluptate doloremque reprehenderit. Odit fuga eaque ratione omnis animi perspiciatis repellendus in tempore optio, quod accusamus cupiditate tempora enim incidunt placeat eligendi officiis earum maxime qui at! Asperiores reiciendis, qui labore a autem ratione suscipit illo tenetur ad numquam mollitia et nesciunt consequatur. Sequi similique corrupti dolorum commodi quam sint deserunt libero assumenda, culpa hic exercitationem, incidunt repellat obcaecati. Blanditiis omnis explicabo, eius odio quae perferendis eum excepturi.
        </p>
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
