import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@components/ui/tooltip";
import { cn } from "@lib/utils";
import { Archive, DownloadIcon, Trash2, User } from "lucide-react";
import dayjs from "@lib/day-utils";
import { Badge } from "@components/ui/badge";
import ActionButton from "./ActionButton";
import DownloadMedicalCertificateAction from "./medical-certificate/DownloadMedicalCertificateAction";

export interface MedicalCertificateItemProps {
  certificate: any;
  onUpdated?: () => void;
}

export default function MedicalCertificateItem({ certificate, onUpdated }: MedicalCertificateItemProps) {
  const patient = certificate.ClinicPatient?.Patient || {};
  return (
    <div
      className={cn(
        "-mx-2 flex items-center space-x-4 rounded-md p-2 transition-all hover:bg-accent hover:text-accent-foreground odd:bg-accent odd:text-accent-foreground group/item "
      )}
    >
      <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10">
        <User className="h-5 w-5 text-primary" />
      </div>
      <div className="flex flex-col flex-1 min-w-0">
        <span className="font-semibold text-base leading-tight">{patient.firstName} {patient.lastName}</span>
        <span className="text-xs text-muted-foreground truncate">ID: {certificate.serialNumber}</span>
      </div>
      <div className="flex items-center justify-center w-12 text-center text-sm text-muted-foreground font-medium">
        {patient.age || "32"}
      </div>
      <div className="flex items-center min-w-[90px]">
        <Badge variant="secondary">{certificate.Classification?.name}</Badge>
      </div>
      <div className="flex flex-col items-end min-w-[160px]">
        <span className="text-xs text-muted-foreground">{certificate.createdAt && dayjs(certificate.createdAt).format("MM/D/YYYY | h:mm A")}</span>
      </div>
      <div className="flex items-center gap-1 ml-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <DownloadMedicalCertificateAction certificate={{ id: certificate.id }} onUpdated={onUpdated}>
                <ActionButton
                  variant="ghost"
                  size="icon"
                  className="invisible group-hover/item:visible text-primary hover:text-primary/90"
                >
                  <DownloadIcon className="h-4 w-4 hover:scale-125 transition-all" />
                </ActionButton>
              </DownloadMedicalCertificateAction>
            </TooltipTrigger>
            <TooltipContent side="top">Download</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <ActionButton
                variant="ghost"
                size="icon"
                className="invisible group-hover/item:visible text-destructive hover:text-destructive/90"
              >
                <Archive className="h-4 w-4 hover:scale-125 transition-all" />
              </ActionButton>
            </TooltipTrigger>
            <TooltipContent side="top">Archive</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <ActionButton
                variant="ghost"
                size="icon"
                className="invisible group-hover/item:visible text-destructive hover:text-destructive/90"
              >
                <Trash2 className="h-4 w-4 hover:scale-125 transition-all" />
              </ActionButton>
            </TooltipTrigger>
            <TooltipContent side="top">Delete</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
