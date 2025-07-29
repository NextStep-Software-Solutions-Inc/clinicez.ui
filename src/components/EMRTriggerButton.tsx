"use client"

import { Button } from "@components/ui/button";
import { FolderHeart } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@components/ui/tooltip";

interface EMRTriggerButtonProps {
  patientId: string;
  className?: string;
  variant?: "link" | "outline" | "default" | "destructive" | "secondary" | "ghost";
  keyProp?: string;
}

export default function EMRTriggerButton({
  patientId,
  className = "w-6 h-6",
  variant = "link",
  keyProp
}: EMRTriggerButtonProps) {
  const handleClick = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('emr', patientId);
    window.history.pushState({}, '', url.toString());
  };

  return (
    <Tooltip key={keyProp}>
      <TooltipTrigger asChild>
        <Button
          size="icon"
          variant={variant}
          onClick={handleClick}
        >
          <FolderHeart className={className} />
        </Button>
      </TooltipTrigger>
      <TooltipContent>EMR Preview</TooltipContent>
    </Tooltip>
  );
}
