"use client";

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
import { Popover, PopoverContent, PopoverTrigger } from "@components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@components/ui/select";
import { createFileAction } from "@actions/file.actions";
import ActionButton from "@components/ActionButton"
import { Button } from "@components/ui/button"
import { Calendar } from "@components/ui/calendar";
import {
  DialogClose,
  DialogFooter,
} from "@components/ui/dialog"

import Each from "@components/utils/Each";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "@lib/utils";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react"
import { use, useRef } from "react"
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { uploadMediaAction } from "@actions/blob.action";
import { useUser } from "@auth0/nextjs-auth0/client";
import { getFileTypesAction } from "@actions/file-type.action";

const uploadFileFormSchema = z.object({
  media: z.string({
    required_error: "Please select an action"
  }),
  dateTaken: z.date().optional(), 
  fileType: z.coerce.number({
    required_error: "Please select an attachment type"
  }),
})
interface UploadFileFormProps {
    folder: {
      id: number;
    }
}

const fetchFileTypes = getFileTypesAction()
export default function UploadFileForm({folder}: UploadFileFormProps) {
  
  const user = useUser()
  const userId = user?.user?.sub
  const fileTypes = use(fetchFileTypes)
  const closeBtnRef = useRef<HTMLInputElement>(null)

  const form = useForm<z.infer<typeof uploadFileFormSchema>>({
    resolver: zodResolver(uploadFileFormSchema)
  })
    
  const action = async (formData: FormData) => {
    form.handleSubmit(async (data) => {
      if(!userId) throw new Error("User ID is required to upload a file")

      toast.promise(uploadMediaAction(formData), {
        loading: "Uploading...",
        success: ({url}) => {
          const file = formData.get("media") as File
          toast.promise(createFileAction({
            fileTypeId: data.fileType,
            ...data.dateTaken ? {dateTaken: data.dateTaken} : {},
            folderId: folder.id,
            name: file.name as string,
            size: file.size as number,
            url,
          }), {
            loading: "Saving file...",
            success: (res) => {
              closeBtnRef.current?.click()
              return "File created successfully"
            },
            error: "Failed to create file"
          })
          return "File Uploaded"
        },
        error: "Failed to upload file"
      })

     
    })()
  }
  return (
    <Form {...form}>
      <form 
        action={action}
        id="upload-file-form"
        className="grid gap-4 py-4"
      >
        <FormField
          control={form.control}
          name="media"
          render={({ field }) => (
            <FormItem>
              <FormLabel>File</FormLabel>
              <Input id="file" type="file" accept="image/jpeg,image/gif,image/png,application/pdf,image/x-eps" {...field} value={undefined} />
              <FormDescription>
                Select the file to upload.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex items-baseline gap-2">
          <FormField
            control={form.control}
            name="fileType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>File Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value?.toString()} name="fileType">
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select the appropriate file type for this file" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <Each
                      of={fileTypes}
                      render={item => (
                        <SelectItem value={item.id?.toString()} className="cursor-pointer">
                          {item.name} {item.FileTypeAttribute?.Organization?.orgId && `- (${item.FileTypeAttribute?.Organization?.orgId })`}
                        </SelectItem>
                      )}
                    />
                  </SelectContent>
                </Select>
                <FormDescription>
                  Select the appropriate file type. Some of the file types are specific to the organization.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="dateTaken"
            render={({ field }) => (
              <FormItem className="flex flex-col basis-96 flex-grow">
                <FormLabel className="leading-normal">Date Taken</FormLabel>
                <FormControl>
                  <Input
                    name={field.name}
                    onChange={e => field.onChange(new Date(e.target.value))}
                    defaultValue={field.value ? format(field.value, "yyyy-MM-dd") : ""}
                    type="date"
                    placeholder="Select date" 
                  />
                </FormControl>
                <FormDescription>
                  Select the date the document was taken or Issued.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
           
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <input ref={closeBtnRef} type="hidden"  value="ok"/>
          </DialogClose>
          <ActionButton form="upload-file-form" type="submit">
                Upload
          </ActionButton>
        </DialogFooter>
      </form>
    </Form>
  );
}
