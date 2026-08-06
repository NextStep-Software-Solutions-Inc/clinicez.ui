"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { generateEkasPdfAction, generateEpressPdfAction } from "@/actions/consultation/ekas.action";

export default function DownloadEkasButton({
  ticketId,
  clinicUid,
}: {
  ticketId: number;
  clinicUid: string;
}) {
  const [isDownloadingEkas, setIsDownloadingEkas] = useState(false);
  const [isDownloadingEpress, setIsDownloadingEpress] = useState(false);

  const downloadPdf = async (
    actionFn: ({ ticketId, clinicUid }: { ticketId: number; clinicUid: string }) => Promise<any>,
    label: string,
    setLoading: (loading: boolean) => void
  ) => {
    setLoading(true);
    try {
      const res = await actionFn({ ticketId, clinicUid });
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
      toast.success(`Downloaded ${label} successfully`);
    } catch (e: any) {
      toast.error(e.message || `Failed to generate ${label}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => downloadPdf(generateEkasPdfAction, "eKAS", setIsDownloadingEkas)}
        disabled={isDownloadingEkas}
        className="gap-2 shrink-0 h-9"
      >
        {isDownloadingEkas ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        Download eKAS
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={() => downloadPdf(generateEpressPdfAction, "ePRESS", setIsDownloadingEpress)}
        disabled={isDownloadingEpress}
        className="gap-2 shrink-0 h-9"
      >
        {isDownloadingEpress ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        Download ePRESS
      </Button>
    </div>
  );
}
