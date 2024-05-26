"use client";

import CustomModalContent from "@components/CustomModalContent";
import Suspend from "@components/Suspend";
import { Alert, AlertDescription, AlertTitle } from "@components/ui/alert";
import { Button } from "@components/ui/button"
import {
  Dialog,
  DialogTrigger,
} from "@components/ui/dialog"
import { Tooltip, TooltipContent, TooltipTrigger } from "@components/ui/tooltip"
import {  AlertCircle, Cloud } from "lucide-react"
import dynamic from "next/dynamic";

const UploadFileForm = dynamic(() => import("../UploadFileForm"), {
  ssr: false,
  loading: () => <p>Loading form...</p>
})

interface UploadFileModalProps {
  folder: {
    id: string;
    name: string;
    description: string;
  }
}

export default function UploadFileModal({folder}: UploadFileModalProps) {

  return (
    <Dialog>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button>
              <Cloud className="h-4 w-4 mr-2"/>
              Upload File
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>Upload File</TooltipContent>
      </Tooltip>
      <CustomModalContent 
        className="sm:max-w-[625px]"
        label="Upload File" 
        description={(
          <>
          The file will be uploaded to folder: <span className="italic font-semibold">{folder.name}</span>
          </>
        )}
      >
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Warning!</AlertTitle>
          <AlertDescription>
            <p>
              Only files with the following extensions are allowed: .jpeg, .gif, .png, .pdf
            </p>
            <p>
              Maximum file size is 10MB.
            </p>
            <p>
              Please ensure that the file is not password protected.
            </p>
            <p>
              Disclaimer: Uploading files is at your own risk. We are not responsible for any loss of data.
            </p>
          </AlertDescription>
        </Alert>
        <Suspend>
          <UploadFileForm folder={folder} />
        </Suspend>
      </CustomModalContent>
    </Dialog>
  )
}
