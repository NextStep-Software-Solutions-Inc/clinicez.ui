"use client";

import { Button } from "@components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@components/ui/tooltip";
import { Pencil } from "lucide-react";
import { useParams, useRouter } from "next/navigation";

interface UpdateDocumentTemplateModalProps {
  label?: string;
  documentTemplate: {
    id: number;
    name: string;
    htmlContent: string;
    DocumentTemplateType: {
      id: number;
      name: string;
    };
  };
}

/**
 * Edit button that navigates to the full-page template editor route.
 */
export default function UpdateDocumentTemplateModal({
  documentTemplate,
  label,
}: UpdateDocumentTemplateModalProps) {
  const params = useParams<{ clinicUid?: string }>();
  const router = useRouter();

  const handleClick = () => {
    const clinicUid = params?.clinicUid;
    if (!clinicUid) return;
    const searchParams = new URLSearchParams();
    if (label) searchParams.set("label", label);
    router.push(
      `/v2/clinic/${clinicUid}/document-templates/${documentTemplate.id}/edit?${searchParams.toString()}`
    );
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="invisible group-hover/item:visible"
            onClick={handleClick}
          >
            <Pencil className="h-4 w-4 hover:scale-125 transition-all" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">Modify</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
