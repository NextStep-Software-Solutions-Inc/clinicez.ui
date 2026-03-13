"use client";

import { Button } from "@components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@components/ui/tooltip";
import { Plus } from "lucide-react";
import { useParams, useRouter } from "next/navigation";

interface CreateDocumentTemplateModalProps {
  documentType?: string;
  label?: string;
  clinicUid?: string;
}

export default function CreateDocumentTemplateModal({
  documentType,
  label,
  clinicUid,
}: CreateDocumentTemplateModalProps) {
  const params = useParams<{ clinicUid?: string }>();
  const router = useRouter();
  const resolvedClinicUid = clinicUid ?? params?.clinicUid;

  const handleClick = () => {
    if (!resolvedClinicUid) return;
    const searchParams = new URLSearchParams();
    if (documentType) searchParams.set("type", documentType);
    if (label) searchParams.set("label", label);
    router.push(
      `/v2/clinic/${resolvedClinicUid}/document-templates/new?${searchParams.toString()}`
    );
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            className="w-full sm:w-auto whitespace-nowrap"
            onClick={handleClick}
          >
            <Plus className="h-4 w-4 mr-2" />
            New {label ?? "Document"} Template
          </Button>
        </TooltipTrigger>
        <TooltipContent>Create New {label ?? "Document"} Template</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
