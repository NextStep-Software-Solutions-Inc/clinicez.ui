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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@components/ui/select";
import { createFileAction } from "@actions/file.actions";
import ActionButton from "@components/ActionButton"
import {
  DialogClose,
  DialogFooter,
} from "@components/ui/dialog"

import Each from "@components/utils/Each";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { useEffect, useMemo, useRef, useState } from "react"
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { uploadMediaAction } from "@actions/blob.action";
import { useUser } from "@auth0/nextjs-auth0/client";
import { Checkbox } from "@components/ui/checkbox";
import ConditionalRender from "@components/utils/ConditionalRender";
import { useOrganizations } from "@/hooks/useOrganization";
import { useFileTypes } from "@hooks/useFileType";

interface UploadFileFormProps {
    folder: {
      id: number
      name: string
      scopeClinicId?: number
    }
}

export default function UploadFileForm({folder}: UploadFileFormProps) {
  
  const user = useUser()
  const { data: userOrganizations } = useOrganizations(user?.user?.sub)
  const { data: fileTypes } = useFileTypes()
  const userId = user?.user?.sub
  const closeBtnRef = useRef<HTMLInputElement>(null)
  const [isDateTakenRequired, setIsDateTakenRequired] = useState(false)

  const dateTakenSchema = z.date({
    message: "Please select a date"
  })
  const uploadFileFormSchema = z.object({
    media: z.string({
      required_error: "Please select an action"
    }),
    bindOrg: z.boolean().optional().default(false),
    orgId: z.coerce.number().optional(),
    dateTaken: isDateTakenRequired ? dateTakenSchema : dateTakenSchema.optional(),
    fileTypeId: z.coerce.number({
      message: "Please select a file type",
      required_error: "File type is required"
    }),
  })

  const form = useForm<z.infer<typeof uploadFileFormSchema>>({
    resolver: zodResolver(uploadFileFormSchema),
    defaultValues: {
      bindOrg: !!folder?.scopeClinicId,
      ...folder?.scopeClinicId ? {orgId: folder.scopeClinicId} : {},
    }
  })
    
  const action = async (formData: FormData) => {
    form.handleSubmit(async (data) => {
      if(!userId) throw new Error("User ID is required to upload a file")
      formData.append("directory", `${userId}`)
      toast.promise(uploadMediaAction(formData), {
        loading: "Uploading...",
        success: ({url}) => {
          const file = formData.get("media") as File
          toast.promise(createFileAction({
            fileTypeId: data.fileTypeId,
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

  const watchedOrgId = +(form.watch("orgId") ?? 0)
  const watchedBindOrg = form.watch("bindOrg")
  const mappedOrgs = useMemo(() => (userOrganizations ?? [])?.map(org => ({
    id: org.id,
    name: org.name,
  })), [userOrganizations])
  
  const filteredFileTypes = useMemo(() => {
    return (fileTypes ?? [])?.filter(fileType => fileType.FileTypeAttribute?.Clinic?.id === (watchedBindOrg ? watchedOrgId : undefined)) 
  }, [fileTypes, watchedBindOrg, watchedOrgId])
  
  const watchedFileType = +(form.watch("fileTypeId") ?? 0)

  useEffect(() => {
    setIsDateTakenRequired(filteredFileTypes.find(fileType => fileType.id === watchedFileType)?.FileTypeAttribute?.dateTakenRequired ?? false)
  }, [filteredFileTypes, watchedFileType])
  
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
        <ConditionalRender condition={!folder.scopeClinicId}>
          <ConditionalRender condition={mappedOrgs.length > 0}>
            <FormField
              control={form.control}
              name="bindOrg"
              render={({ field }) => {
                return (
                  <FormItem className="my-5">
                    <div className="flex items-center space-x-2">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange}/>
                      </FormControl>
                      <FormLabel 
                        htmlFor="collegeId"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >Bind this to file to one of my organization.</FormLabel>
                    </div>
                    <FormMessage/>
                  </FormItem>
                )
              }}
            />
          </ConditionalRender>
          <ConditionalRender condition={form.watch("bindOrg")}>
            <FormField
              control={form.control}
              name="orgId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Binding organization</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value?.toString()} name="orgId">
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select one of your organization" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <Each
                        of={mappedOrgs}
                        render={item => (
                          <SelectItem value={item.id?.toString()} className="cursor-pointer">
                            {item.name}
                          </SelectItem>
                        )}
                      />
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {`Binding the file to an organization will limit the file type to the organization's file types. Note: Bounded files are subject to organization Privacy Policy & Terms of Conditions.`}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </ConditionalRender>
        </ConditionalRender>
        <div className="flex items-baseline gap-2">
          <FormField
            control={form.control}
            name="fileTypeId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>File Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value?.toString()} name="fileTypeId">
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select the appropriate file type for this file" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <Each
                      of={filteredFileTypes}
                      render={item => (
                        <SelectItem value={item.id?.toString()} className="cursor-pointer">
                          {item.name} {item.FileTypeAttribute?.Clinic?.clinicUid && `- (${item.FileTypeAttribute?.Clinic.clinicUid })`}
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
