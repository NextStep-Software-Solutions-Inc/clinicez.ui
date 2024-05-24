import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@components/ui/tooltip";
import Each from "@components/utils/Each";
import { cn } from "@lib/utils";
import { FileText, ImageIcon, Trash, Trash2 } from "lucide-react";
import UploadFileModal from "./UploadFileModal";
import { getConsultationFilesAction } from "@actions/consultations.action";
import ConfirmDeleteFile from "./ConfirmDeleteFile";

interface FilesProps {
    consultation: Consultation;
}

export default async function Files({ consultation}: FilesProps) {

  const files = await getConsultationFilesAction(consultation.id);

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
            <UploadFileModal consultation={consultation}/>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-1">
        <Each
          of={files}
          render={(file, index) => {
            const Icon = file.type === "document" ? FileText : ImageIcon;
            return (
              <div className={cn("-mx-2 flex items-start space-x-4 rounded-md p-2 transition-all hover:bg-accent hover:text-accent-foreground odd:bg-accent odd:text-accent-foreground group/item ")}>
                <Icon className="mt-px h-5 w-5 text-primary"/>
                <div className="flex w-full">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">{file.name}</p>
                    <p className="text-sm text-muted-foreground">{file.description}</p>
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <ConfirmDeleteFile fileId={file.id}/>
                    </TooltipTrigger>
                    <TooltipContent side="top">Delete</TooltipContent>
                  </Tooltip>
                </div>
              </div>
            )
          }}
        />
      </CardContent>
    </Card>
  );
}
