"use client"

import { Button } from "@components/ui/button";
import { FolderHeart } from "lucide-react";

interface EMRTriggerButtonProps {
  patientId: string;
}

export default function EMRTriggerButton({ patientId }: EMRTriggerButtonProps) {
  const handleClick = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('emr', patientId);
    window.history.pushState({}, '', url.toString());
  };

  return (
    <Button
      size="icon"
      variant="link"
      onClick={handleClick}
    >
      <FolderHeart className="w-6 h-6" />
    </Button>
  );
}
