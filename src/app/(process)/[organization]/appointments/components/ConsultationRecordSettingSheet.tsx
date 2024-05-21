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
interface ConsultationRecordSettingSheetProps extends DialogProps {
  children?: React.ReactNode;
}
export default function ConsultationRecordSettingSheet({ children, ...res }: ConsultationRecordSettingSheetProps) {
  
  const action = async (formData: FormData) => {
    console.log(Object.fromEntries(formData));
    
  }
  return (
    <Sheet {...res}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Consultation Record Settings</SheetTitle>
          <SheetDescription>
            Configure settings related to consultation records.
          </SheetDescription>
        </SheetHeader>
        <div className="my-5 gap-5 flex flex-col">
          <Card>
            <CardHeader>
              <CardTitle>Vital Signs</CardTitle>
              <CardDescription>Configure settings related to vital signs</CardDescription>
            </CardHeader>
            <CardContent >
              <form id="vital-setting" action={action} className="grid gap-6">
                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="vital-patient" className="flex flex-col space-y-1">
                    <span>Allow Patient to add Vital Signs</span>
                    <span className="font-normal leading-snug text-muted-foreground">
                    Alow patients to add their own vital signs
                    </span>
                  </Label>
                  <Switch id="vital-patient" name="vital-patient" />
                </div>
                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="vital-nurse" className="flex flex-col space-y-1">
                    <span>Allow Nurse to add Vital Signs</span>
                    <span className="font-normal leading-snug text-muted-foreground">
                    Allow nurses to add vital signs for patients
                    </span>
                  </Label>
                  <Switch id="vital-nurse" name="vital-nurse" />
                </div>
                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="vital-doctor" className="flex flex-col space-y-1">
                    <span>Allow Doctor to add Vital Signs</span>
                    <span className="font-normal leading-snug text-muted-foreground">
                    Allow doctors to add vital signs for patients
                    </span>
                  </Label>
                  <Switch id="vital-doctor" name="vital-doctor" checked={true} />
                </div>
              </form>
            </CardContent>
            <CardFooter>
              <Button form="vital-setting" variant="outline" className="w-full">
                Save preferences
              </Button>
            </CardFooter>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Consultation Notes</CardTitle>
              <CardDescription>
                Configure settings related to consultation notes
              </CardDescription>
            </CardHeader>
            <CardContent >
              <form id="notes-settings" action={action} className="grid gap-6">

                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="notes-patient" className="flex flex-col space-y-1">
                    <span>
                    Create Consultation Notes for Patients
                    </span>
                    <span className="font-normal leading-snug text-muted-foreground">
                    Allow doctors to create consultation notes for patients
                    </span>
                  </Label>
                  <Switch id="notes-patient" defaultChecked  name="notes-patient"/>
                </div>
                <Label className="flex flex-col space-y-1">
                Allow Patients to view Consultation Notes (S.O.A.P)
                </Label>
                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="notes-s" className="flex flex-col space-y-1">
                    <span className="font-normal leading-snug text-muted-foreground">
                    Subjective History
                    </span>
                  </Label>
                  <Switch id="notes-s" name="notes-s" />
                </div>
                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="notes-o" className="flex flex-col space-y-1">
                    <span className="font-normal leading-snug text-muted-foreground">
                    Objective History
                    </span>
                  </Label>
                  <Switch id="notes-o" name="notes-o"/>
                </div>
                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="notes-a" className="flex flex-col space-y-1">
                    <span className="font-normal leading-snug text-muted-foreground">
                    Assessment
                    </span>
                  </Label>
                  <Switch id="notes-a" name="notes-a" />
                </div>
                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="notes-p" className="flex flex-col space-y-1">
                    <span className="font-normal leading-snug text-muted-foreground">
                    Plan
                    </span>
                  </Label>
                  <Switch id="notes-p" name="notes-p"/>
                </div>
              </form>
            </CardContent>
            <CardFooter>
              <Button form="notes-settings" variant="outline" className="w-full">
                Save preferences
              </Button>
            </CardFooter>
          </Card>
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
