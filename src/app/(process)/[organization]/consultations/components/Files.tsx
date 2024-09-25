import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card";
import UploadFileModal from "../../files/components/modals/UploadFileModal";
import { faker } from "@faker-js/faker";
import { GetConsultationTicket } from "@actions/consultation/consultation-ticket.action";

interface FilesProps {
    consultation:  NonNullable<GetConsultationTicket["data"]>;
}

export default async function Files({ consultation}: FilesProps) {

  // const files = await getFilesAction(consultation.id);
  const folder = {
    id: consultation.id,
    name: faker.lorem.words(2),
    description: faker.lorem.sentence(),
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-row">
          <div>
            <CardTitle>Files</CardTitle>
            <CardDescription>
              Collection of files related to the consultation.
            </CardDescription>
        
          </div>
          <div className="ml-auto">
            <UploadFileModal folder={folder}/>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-1">
        {/* <Each
          of={files.flatMap((file) => file.files)}
          render={file => <File file={file}/>}
        /> */}
      </CardContent>
    </Card>
  );
}
