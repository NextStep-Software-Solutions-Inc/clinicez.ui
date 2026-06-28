"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { generateEkasPdfAction } from "@/actions/consultation/ekas.action";

export default function DownloadEkasButton({
  ticketId,
  clinicUid,
}: {
  ticketId: number;
  clinicUid: string;
}) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const res = await generateEkasPdfAction({ ticketId, clinicUid });
      if (!res.data) throw new Error(res.message);

      const byteCharacters = atob(res.data.base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = res.data.filename;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success("Downloaded eKAS & ePresS successfully");
    } catch (e: any) {
      toast.error(e.message || "Failed to generate eKAS & ePresS");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleDownload}
      disabled={isDownloading}
      className="gap-2 shrink-0 h-9"
    >
      {isDownloading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      Download eKAS & ePresS
    </Button>
  );
}
