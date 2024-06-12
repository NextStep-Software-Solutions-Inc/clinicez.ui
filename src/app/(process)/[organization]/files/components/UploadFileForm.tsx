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
import { getAttachmentTypesAction, uploadFileAction } from "@actions/file.actions";
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

const uploadFileFormSchema = z.object({
  file: z.string({
    required_error: "Please select an action"
  }),
  dateTaken: z.date({
    required_error: "Please select a date"
  }), 
  attachmentType: z.string({
    required_error: "Please select an attachment type"
  }),
})

interface UploadFileFormProps {
    folder: {
        id: string;
    }
}

const fetchAttachmentTypes = getAttachmentTypesAction()
export default function UploadFileForm({folder}: UploadFileFormProps) {
  const attachmentTypes = use(fetchAttachmentTypes)
  const closeBtnRef = useRef<HTMLInputElement>(null)

  const form = useForm<z.infer<typeof uploadFileFormSchema>>({
    resolver: zodResolver(uploadFileFormSchema)
  })
    
  const action = async (formData: FormData) => {
    form.handleSubmit(async (data) => {
      formData.append("folderId", folder.id)
      formData.append("dateTaken", format(data.dateTaken, "yyyy-MM-dd"))
      const res = await uploadFileAction(formData)
      if (res) {
        toast.success("File uploaded successfully")
        closeBtnRef.current?.click()
      }
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
          name="file"
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
            name="attachmentType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Attachment Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} name="attachmentType">
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select the appropriate attachment type for this file" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <Each
                      of={attachmentTypes}
                      render={item => <SelectItem value={item.id} className="cursor-pointer">{item.name} &bull; {item.description}</SelectItem>}
                    />
                  </SelectContent>
                </Select>
                <FormDescription>
                      Select the attachment type.
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
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date > new Date() || date < new Date("1900-01-01")
                      }
                      initialFocus
                          
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>
                      Select the date the file was taken.
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
