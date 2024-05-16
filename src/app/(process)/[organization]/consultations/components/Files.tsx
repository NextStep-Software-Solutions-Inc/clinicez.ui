import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@components/ui/accordion";
import { Button } from "@components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@components/ui/tooltip";
import Each from "@components/utils/Each";
import { cn } from "@lib/utils";
import { Delete, FileText, ImageIcon, Trash, Trash2 } from "lucide-react";
import { date } from "zod";
import UploadFileModal from "./UploadFileModal";

interface FilesProps {
    consultation: Consultation;
}

const files = [
  {
    type: "document",
    name: "Consultation Note",
    description: "Summary of the consultation.",
    date: "2021-10-01"
  },
  {
    type: "document",
    name: "Prescription",
    description: "Medication prescribed to the patient.",
    date: "2021-10-01"
  },
  {
    type: "document",
    name: "Lab Results",
    description: "Results of the lab tests.",
    date: "2021-10-01"
  },
  {
    type: "image",
    name: "X-Ray",
    description: "X-Ray image of the patient.",
    date: "2021-10-01"
  },
  {
    type: "image",
    name: "MRI",
    description: "MRI image of the patient.",
    date: "2021-10-01"
  },
  {
    type: "image",
    name: "CT Scan",
    description: "CT Scan image of the patient.",
    date: "2021-10-01"
  },
  {
    type: "document",
    name: "Discharge Summary",
    description: "Summary of the discharge.",
    date: "2021-10-01"
  }
]

export default function Files({ consultation}: FilesProps) {
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
              <div className={cn("-mx-2 flex items-start space-x-4 rounded-md p-2 transition-all hover:bg-accent hover:text-accent-foreground",
                index % 2 === 0 && "bg-accent text-accent-foreground"
              )}>
                <Icon className="mt-px h-5 w-5" />
                <div className="flex w-full">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">{file.name}</p>
                    <p className="text-sm text-muted-foreground">{file.description}</p>
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button className="ml-auto" variant="ghost" size="icon">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
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
