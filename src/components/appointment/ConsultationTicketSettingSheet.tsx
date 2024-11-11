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
import { GetConsultationTicket } from "@actions/consultation/consultation-ticket.action"
import { useConsultation } from "@hooks/useConsultation"
import Each from "@components/utils/Each"
import { useNoteTemplate } from "@hooks/useNoteTemplate"
import { toast } from "sonner"
import { upsertConsultationNotesAction, upsertConsultationNotesSettingsAction } from "@actions/consultation/consultation-notes.action"
import { useState } from "react"
import { FormControl } from "@components/ui/form"
interface ConsultationTicketSettingSheetProps extends DialogProps {
  children?: React.ReactNode;
  consultationId: number;
  clinicUid: string;
}
export default function ConsultationTicketSettingSheet({ children, consultationId, clinicUid, ...res }: ConsultationTicketSettingSheetProps) {
  
  const action = async (formData: FormData) => {
  }

  return (
    <Sheet {...res}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Consultation Ticket Settings</SheetTitle>
          <SheetDescription>
            Configure settings related to consultation tickets.
          </SheetDescription>
        </SheetHeader>
        <div className="my-5 gap-5 flex flex-col">
          <Card>
            <CardHeader>
              <CardTitle>Vital Signs (canary)</CardTitle>
              <CardDescription>Configure settings related to vital signs</CardDescription>
            </CardHeader>
            <CardContent >
              <form id="vital-setting" action={action} className="grid gap-6">
                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="vital-patient" className="flex flex-col space-y-1">
                    <span>Allow Patient to add Vital Signs</span>
                    <span className="font-normal leading-snug text-muted-foreground">
                    Allow patients to add their own vital signs
                    </span>
                  </Label>
                  <Switch id="vital-patient" name="vital-patient" />
                </div>
                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="vital-nurse" className="flex flex-col space-y-1">
                    <span>Allow Other HP to add Vital Signs</span>
                    <span className="font-normal leading-snug text-muted-foreground">
                    Allow nurses to add vital signs for patients
                    </span>
                  </Label>
                  <Switch id="vital-nurse" name="vital-nurse" />
                </div>
              </form>
            </CardContent>
            <CardFooter>
              <Button form="vital-setting" variant="outline" className="w-full">
                Save preferences
              </Button>
            </CardFooter>
          </Card>
          <ConsultationNotesSetting consultationId={consultationId} clinicUid={clinicUid}/>
        </div>
        <SheetFooter>
          <SheetClose asChild>
            <Button variant="outline" type="button">Close</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}


export const ConsultationNotesSetting = ({consultationId, clinicUid}: { consultationId: number, clinicUid: string }) => {

  const {data: consultation} = useConsultation({
    consultationId,
    clinicUid
  });

  const {data: noteTemplate} = useNoteTemplate(consultation?.data?.ConsultationTicketAttribute?.NoteTemplate.name ?? "");

  const mappedNotes = (consultation?.data?.ConsultationNotes ?? []).map(note => {
    const noteSection = noteTemplate?.NoteSections?.find(section => section.name === note.section)
    return {
      ...note,
      label: noteSection?.label ?? note.section,
    }
  })

  const action = async (formData: FormData) => {
    mappedNotes.forEach(note => {
      const showOnPatient = formData.get(note.section) === "on"
      formData.append(note.section, showOnPatient.toString()) 
    })
    formData.append("consultationTicketId", consultationId.toString())
    toast.promise(upsertConsultationNotesSettingsAction(formData), {
      loading: "Saving consultation notes settings...",
      success: (res)  => {
        return res.message;
      },
      error: "Failed to save consultation notes settings",
      position: "top-center",
    })
    
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Consultation Notes (canary)</CardTitle>
        <CardDescription>
          Configure settings related to consultation notes
        </CardDescription>
      </CardHeader>
      <CardContent >
        <form id="notes-settings" action={action} className="grid gap-6">
          <Label className="flex flex-col space-y-1">
            Allow Patients to view Consultation Notes ({consultation?.data?.ConsultationTicketAttribute?.NoteTemplate.name})
          </Label>
          <Each
            of={mappedNotes}
            render={(note) => {
              return (
                <SectionSetting
                  key={note.section}
                  note={{
                    label: note.label,
                    section: note.section,
                    showOnPatient: note.showOnPatient
                  }}
                />
              )
            }}
          />
        </form>
      </CardContent>
      <CardFooter>
        <Button form="notes-settings" variant="outline" className="w-full">
          Save preferences
        </Button>
      </CardFooter>
    </Card>
  )
}

export const SectionSetting = ({note}: {note: {
  label: string;
  section: string;
  showOnPatient: boolean;
}}) => {
  const [showOnPatient, setShowOnPatient] = useState(note.showOnPatient);
  return (
    <div key={note.section} className="flex items-center justify-between space-x-2">
      <Label htmlFor={note.section} className="flex flex-col space-y-1">
        <span className="font-normal leading-snug text-muted-foreground">
          {note.label} ({note.section})
        </span>
      </Label>
      <Switch name={note.section} id={note.section} checked={showOnPatient} onCheckedChange={setShowOnPatient}/>
    </div>
  )
}