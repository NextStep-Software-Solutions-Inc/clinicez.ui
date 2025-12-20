import { toast } from "sonner";
import Icon from "../Icon";
import { Button } from "../ui/button";
import { Tooltip, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { promiseWrapper } from "@/lib/with-error-handling";
import { downloadHAFAction } from "@/actions/phr/download-haf.action";
import { toBlobDownload } from "@/lib/utils/download";

export default function DownloadHAFAction({ userId }: { userId: string }) {

  const handleDownload = async () => {
    toast.promise(promiseWrapper(downloadHAFAction)(userId), {
      loading: "Generating PhilHealth Member Registration Form...",
      success: async (res) => {
        const data = res.data
        if (!data) throw new Error("No PDF data received from server")
        toBlobDownload(data.pdfData, data.filename)
        return "Health Assessment Form downloaded successfully"
      },
      error: "Unable to generate Health Assessment Form. Please check your profile information and try again.",
    })
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={handleDownload}
            variant="outline"
            size="sm"
            className="gap-2 cursor-pointer inline-block">
            <Icon name="download" className="h-4 w-4" />
            Download Health Assessment Form
          </Button>
        </TooltipTrigger>
      </Tooltip>
    </TooltipProvider>
  );
}