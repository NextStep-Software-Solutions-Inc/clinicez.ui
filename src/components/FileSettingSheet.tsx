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
import ConditionalRender from "./utils/ConditionalRender"
import { updateFileSettingAction } from "@actions/file-setting.action"
interface FileSettingSheetProps extends DialogProps {
  children?: React.ReactNode;
  record: {
    id: number;
    subject: string;
    settings: {
      isPublic: boolean;
    }
  }
}

const privacySchema = z.object({
  isPublic: z.boolean()
})

type PrivacySchema = z.infer<typeof privacySchema>

export default  function FileSettingSheet({ children, record, ...res }: FileSettingSheetProps) {
    
  const action = async () => {
    form.handleSubmit(async (data) => {
      toast.promise(updateFileSettingAction(record.id, data.isPublic), {
        loading: "Saving...",
        success: () => {
          form.reset(data);
          return "Settings saved"
        },
        error: "Failed to save settings"
      })
    })()
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
          <SheetTitle>{record.subject} File Settings</SheetTitle>
          <SheetDescription>
            Configure settings related to this file.
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
                            Allow everyone to view this file
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
        
        <SheetFooter>
          <SheetClose asChild>
            <Button variant="outline" type="button">Close</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
