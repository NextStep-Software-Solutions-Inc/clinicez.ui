"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, FileText, Loader2 } from "lucide-react";
import { handlePrintHtmlToPDF } from "@/lib/print-pdf";

interface RecordPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  html: string;
  title: string;
  loading: boolean;
}

export function RecordPreviewDialog({
  open,
  onOpenChange,
  html,
  title,
  loading,
}: RecordPreviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[calc(100vw-2rem)] h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-5 pb-4 border-b flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4 text-primary shrink-0" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden relative bg-muted/30 min-h-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="text-sm">Preparing preview…</span>
            </div>
          ) : html ? (
            <iframe
              srcDoc={html}
              className="w-full h-full border-0"
              title={title}
              sandbox="allow-same-origin"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
              No document content available.
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t flex-shrink-0 sm:justify-between">
          <DialogClose asChild>
            <Button variant="outline" className="gap-1.5">
              Close
            </Button>
          </DialogClose>
          <Button
            onClick={() => handlePrintHtmlToPDF(html)}
            disabled={loading || !html}
            className="gap-1.5"
          >
            <Printer className="h-4 w-4" />
            Print / Download
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
