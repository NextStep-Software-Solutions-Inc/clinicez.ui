"use client"

import { Button } from "@components/ui/button"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@components/ui/sheet"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@components/ui/card"
import { Label } from "@components/ui/label"
import { Switch } from "@components/ui/switch"
import { DialogProps } from "@radix-ui/react-dialog"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Form, FormField, FormItem } from "./ui/form"
import ActionButton from "./ActionButton"
import { toast } from "sonner"
import { updateFolderSettingAction } from "@actions/folder-setting.action"
import ConditionalRender from "./utils/ConditionalRender"
import { deleteFolderAction } from "@actions/folder.action"
import { useRef } from "react"
export interface FolderSettingSheetProps extends DialogProps {
  children?: React.ReactNode;
  record: {
    id: number;
    subject: string;
    settings: {
      isPublic: boolean;
    }
  }
  onDeleted?: () => void;
}

const privacySchema = z.object({
  isPublic: z.boolean()
})

type PrivacySchema = z.infer<typeof privacySchema>

export default  function FolderSettingSheet({ children, record, onDeleted, ...res }: FolderSettingSheetProps) {

  const closeSheetRef = useRef<HTMLButtonElement>(null);
  const action = async () => {
    form.handleSubmit(async (data) => {
      toast.promise(updateFolderSettingAction(record.id, data.isPublic), {
        loading: "Saving...",
        success: () => {
          form.reset(data);
          return "Settings saved"
        },
        error: "Failed to save settings"
      })
    })()
  }
  const deleteFolder = async () => {
    toast.promise(deleteFolderAction(record.id), {
      loading: "Deleting...",
      success: () => {
        onDeleted?.();
        closeSheetRef.current?.click();
        return "Folder deleted"
      },
      error: "Failed to delete folder"
    })
  }

  const form = useForm<PrivacySchema>({
    resolver: zodResolver(privacySchema),
    defaultValues: privacySchema.parse(record.settings)
  })

  return (
    <Sheet {...res}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>{record.subject} Folder Settings</SheetTitle>
          <SheetDescription>
            Configure settings related to this folder.
          </SheetDescription>
        </SheetHeader>
        <form action={action} className="my-5 gap-5 flex flex-col">
          <Card>
            <CardHeader>
              <CardTitle>Privacy</CardTitle>
              <CardDescription>
                Privacy settings
              </CardDescription>
            </CardHeader>
            <CardContent >
              <Form {...form}>
                <div className="grid gap-6">
                  <FormField
                    control={form.control}
                    name="isPublic"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between space-x-2">
                        <Label htmlFor={`folder-${record.id}-${field.name}`} className="flex flex-col space-y-1">
                          <span>Public</span>
                          <span className="font-normal leading-snug text-muted-foreground">
                            Allow everyone to view this folder
                          </span>
                        </Label>
                        <Switch id={`folder-${record.id}-${field.name}`} onCheckedChange={field.onChange} checked={field.value} />
                      </FormItem>
                    )}
                  
                  />
                </div>
              </Form>
            </CardContent>
            <CardFooter>
              <ConditionalRender condition={form.formState.isDirty}>
                <ActionButton type="submit" disabled={form.formState.isLoading || !form.formState.isValid} variant="outline" className="w-full">
                Save preferences
                </ActionButton>
              </ConditionalRender>
            </CardFooter>
          </Card>
        </form>

        <form action={deleteFolder}>
          <Card>
            <CardHeader>
              <CardTitle>Delete Folder</CardTitle>
              <CardDescription>
                Deleting this folder will permanently remove it from the system.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <ActionButton  type="submit" disabled={form.formState.isLoading || !form.formState.isValid} variant="destructive" className="w-full">
                Delete Folder
              </ActionButton>
            </CardFooter>
          </Card>
        </form>
        
        <SheetFooter className="mt-5">
          <SheetClose asChild>
            <Button variant="outline" type="button" ref={closeSheetRef}>Close</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
