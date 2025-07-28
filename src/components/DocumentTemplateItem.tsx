import React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@components/ui/tooltip";
import { cn } from "@lib/utils";
import { DownloadIcon, File, Trash } from "lucide-react";
import Link from "next/link";
import { Button } from "@components/ui/button";
import dayjs from "@lib/day-utils";
import UpdateDocumentTemplateModal from "./prescription/modals/UpdateDocumentTemplateModal";
import { toast } from "sonner";
import { promiseWrapper } from "@/lib/with-error-handling";
import ActionButton from "./ActionButton";
import { deleteDocumentTemplateAction } from "@/actions/document-template.action";


export interface DocumentTemplateItemProps {
  onUpdated?: () => void;
  documentTemplate: {
    id: number;
    name: string;
    createdAt: Date;
    htmlContent: string;
    DocumentTemplateType: {
      id: number
      name: string;
    };
  };
}
export default function DocumentTemplateItem({ documentTemplate, onUpdated }: DocumentTemplateItemProps) {
  const Icon = File;
  return (
    <div
      className={cn(
        "-mx-2 flex items-start space-x-4 rounded-md p-2 transition-all hover:bg-accent hover:text-accent-foreground odd:bg-accent odd:text-accent-foreground group/item "
      )}
    >
      <Icon className="mt-px h-5 w-5 text-primary" />
      <div className="flex w-full">
        <div className="space-y-1">
          <Link
            href={`prescription-builder/${documentTemplate.id}`}
            target="_blank"
            rel="noreferrer"
          >
            <div className="text-sm font-medium leading-none space-x-2">
              <span className="">
                {documentTemplate.name || `Document #${documentTemplate.id}`} - {documentTemplate.DocumentTemplateType.name}
              </span>
            </div>
          </Link>
          <p className="text-sm text-muted-foreground">
            {documentTemplate.createdAt &&
              dayjs(documentTemplate.createdAt).format("lll")}
          </p>
        </div>
        <div className="flex items-center ml-auto gap-1">
          <DownloadPrescriptionAction documentTemplate={documentTemplate} />
          <ModifyPrescriptionAction documentTemplate={documentTemplate} onUpdated={onUpdated} label="Prescription" />
          <DeletePrescriptionAction documentTemplate={documentTemplate} onUpdated={onUpdated} />
        </div>
      </div>
    </div>
  );
}

interface DocumentTemplateItemActionProps {
  documentTemplate: DocumentTemplateItemProps["documentTemplate"];
  onUpdated?: () => void;
  label?: string;
}
const ModifyPrescriptionAction = ({ documentTemplate, onUpdated, label }: DocumentTemplateItemActionProps) => {
  return (
    <UpdateDocumentTemplateModal onUpdated={onUpdated} documentTemplate={documentTemplate} label={label} />
  )
}

const DownloadPrescriptionAction = ({ documentTemplate }: { documentTemplate: DocumentTemplateItemProps["documentTemplate"] }) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href={"#"}
            download
            className="invisible group-hover/item:visible"
          >
            <Button
              variant="ghost"
              size="icon"
            >
              <DownloadIcon className="h-4 w-4  hover:scale-125 transition-all" />
            </Button>
          </Link>
        </TooltipTrigger>
        <TooltipContent side="top">Download</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
interface DeletePrescriptionActionProps {
  documentTemplate: DocumentTemplateItemProps["documentTemplate"];
  onUpdated?: () => void;
}

const DeletePrescriptionAction = React.forwardRef<
  HTMLFormElement,
  DeletePrescriptionActionProps
>(({ documentTemplate, onUpdated }, ref) => {

  const handleDelete = async () => {
    toast.promise(promiseWrapper(deleteDocumentTemplateAction)(documentTemplate.id), {
      loading: "Deleting document template...",
      success: (res) => {
        onUpdated?.();
        return res.message;
      },
      error: error => error
    })
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <form ref={ref} action={handleDelete}>
            <ActionButton
              variant="ghost"
              size="icon"
              className="invisible group-hover/item:visible text-destructive hover:text-destructive/90"
            >
              <Trash className="h-4 w-4 hover:scale-125 transition-all" />
            </ActionButton>
          </form>
        </TooltipTrigger>
        <TooltipContent side="top">Delete</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
})

DeletePrescriptionAction.displayName = "DeletePrescriptionAction"