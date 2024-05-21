"use client";

import { addInterventionAction } from "@actions/consultations.action"
import ActionButton from "@components/ActionButton"
import CustomModalContent from "@components/CustomModalContent";
import { Alert, AlertDescription, AlertTitle } from "@components/ui/alert";
import { Button } from "@components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogFooter,
  DialogTrigger,
} from "@components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@components/ui/form"
import { Input } from "@components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@components/ui/tooltip"
import Each from "@components/utils/Each";
import { zodResolver } from "@hookform/resolvers/zod";
import {  AlertCircle, Cloud, Plus, Terminal, Upload } from "lucide-react"
import { useRef } from "react"
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";


interface UploadFileModalProps {
  consultation: Consultation
}

const AddInterventionFormSchema = z.object({
  file: z.string({
    required_error: "Please select an action"
  }),
})

export default function UploadFileModal({consultation}: UploadFileModalProps) {

  const form = useForm<z.infer<typeof AddInterventionFormSchema>>({
    resolver: zodResolver(AddInterventionFormSchema)
  })

  const closeBtnRef = useRef<HTMLInputElement>(null)
  const action = async (formData: FormData) => {
    form.handleSubmit(async (data) => {

      const res = await addInterventionAction(formData)
      if (res) {
        toast.success("Intervention added successfully")
        closeBtnRef.current?.click()
      }
    })()
  }

  return (
    <Dialog>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button>
              <Cloud className="h-4 w-4" />
              Upload File
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>Upload File</TooltipContent>
      </Tooltip>
      <CustomModalContent 
        className="sm:max-w-[625px]"
        label="Upload File" 
        description="Upload files related to the consultation."
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
        <Form {...form}>
          <form 
            action={action}
            id="add-intervention-form"
            className="grid gap-4 py-4"
          >
            <FormField
              control={form.control}
              name="file"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>File</FormLabel>
                  <Input id="file" type="file" accept="image/jpeg,image/gif,image/png,application/pdf,image/x-eps"/>
                  <FormDescription>
                    Select the file to upload.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
           
            <DialogFooter>
              <DialogClose asChild>
                <input ref={closeBtnRef} type="hidden"  value="ok"/>
              </DialogClose>
              <ActionButton form="add-intervention-form" type="submit">
                Upload
              </ActionButton>
            </DialogFooter>
          </form>
        </Form>
      </CustomModalContent>
    </Dialog>
  )
}
