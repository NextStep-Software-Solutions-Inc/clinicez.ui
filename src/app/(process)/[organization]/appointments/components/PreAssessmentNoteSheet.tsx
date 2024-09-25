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

import { useEffect, useRef } from "react";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@components/ui/form";
import { Textarea } from "@components/ui/textarea";
import { z } from "zod";
import { useForm, useWatch } from "react-hook-form";
import ActionButton from "@components/ActionButton";
import { toast } from "sonner";
import { upsertPreAssessmentNoteAction } from "@actions/appointments/pre-assessment-note.action";
import { useOrgAppointment } from "@hooks/useAppointment";
import { Checkbox } from "@components/ui/checkbox";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useLocalStorage } from "@hooks/useLocalStorage";

const preAssessmentNotesSchema = z.object({
  createNew: z.boolean(),
  assessment: z.string({
    required_error: "Assessment is required",
  }),
  homeInstructions: z.string().optional(),
  remarks: z.string({
    required_error: "Remarks are required",
  })
})

type PreConsultationNotes = z.infer<typeof preAssessmentNotesSchema>

interface PreAssessmentNoteSheetProps {
  children: React.ReactNode
  preAssessmentNotes: {
    assessment: string
    homeInstructions?: string
    remarks: string
    appointmentId: number
    orgUid: string
    createdBy?: string
  }
  disabled?: boolean
}
export default function PreAssessmentNoteSheet({children, disabled, preAssessmentNotes:{ assessment, homeInstructions, remarks , appointmentId: appointmentId, orgUid, createdBy} }: PreAssessmentNoteSheetProps) {
  const preConSultKey = `preAssessmentNote-${appointmentId}-${orgUid}`
  const [preAssessmentNote, setPreAssessmentNote] = useLocalStorage<Partial<PreConsultationNotes>>(preConSultKey, {
    assessment,
    homeInstructions,
    remarks,
    createNew: false
  })

  const { user } = useUser()
  const closeBtnRef = useRef<HTMLButtonElement>(null)
  const {mutate} = useOrgAppointment({
    orgId: orgUid,
    appointmentId: appointmentId
  })
  const form = useForm<PreConsultationNotes>({
    defaultValues: {
      createNew: preAssessmentNote.createNew,
      assessment: preAssessmentNote.assessment,
      homeInstructions: preAssessmentNote.homeInstructions,
      remarks: preAssessmentNote.remarks
    },
  })
  const watch = form.watch

  useEffect(() => {
    const subscription = watch((value) => setPreAssessmentNote(value))
    return () => subscription.unsubscribe()
  }, [setPreAssessmentNote, watch])

  const action = () => {
    form.handleSubmit((data) => {
      toast.promise(upsertPreAssessmentNoteAction({
        appointmentId,
        assessment: data.assessment,
        homeInstructions: data.homeInstructions,
        remarks: data.remarks,
        orgUid
      }), {
        loading: "Saving Pre-Assessment Note...",
        success: (res) => {
          if (res.status) {
            form.reset(data)
            mutate()
            closeBtnRef.current?.click()
            return res.message
          }
        },
        error: "Failed to save Pre-Assessment Note"
      })
    })()
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        {disabled ? <button disabled className="disabled:bg-gray-100 p-1 rounded w-full">{children}</button>: children}

      </SheetTrigger>
      <SheetContent side="bottom">
        <Form {...form}>
          <form action={action} className="space-y-6 container">
            <SheetHeader>
              <SheetTitle>Pre Assessment Notes</SheetTitle>
              <SheetDescription>
                Notes to be taken before the actual consultation.
              </SheetDescription>
            </SheetHeader>
            
            <FormField
              control={form.control}
              name="assessment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assessment</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Write your assessment here"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>

                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="homeInstructions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Home Instructions (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Write home instructions here"
                      className="resize-none"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormDescription>

                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="remarks"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Remarks</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Write remarks here"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            {
              createdBy !== user?.email &&
              <FormField
                control={form.control}
                name="createNew"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                      Create a new pre-consultation note
                      </FormLabel>
                      <FormDescription>
                      If checked, a new pre-consultation note will be created in place of the existing one.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            }
            <SheetFooter>
              <SheetClose asChild>
                <Button ref={closeBtnRef} variant="outline" type="button">Close</Button>
              </SheetClose>
              <ActionButton type="submit">Save</ActionButton>
            </SheetFooter>
         
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}


