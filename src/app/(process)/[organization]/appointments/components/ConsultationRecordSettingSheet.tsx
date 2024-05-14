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
            <CardContent className="grid gap-6">
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="necessary" className="flex flex-col space-y-1">
                  <span>Allow Patient to add Vital Signs</span>
                  <span className="font-normal leading-snug text-muted-foreground">
                    Alow patients to add their own vital signs
                  </span>
                </Label>
                <Switch id="necessary" defaultChecked />
              </div>
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="functional" className="flex flex-col space-y-1">
                  <span>Allow Nurse to add Vital Signs</span>
                  <span className="font-normal leading-snug text-muted-foreground">
                    Allow nurses to add vital signs for patients
                  </span>
                </Label>
                <Switch id="functional" />
              </div>
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="performance" className="flex flex-col space-y-1">
                  <span>Allow Doctor to add Vital Signs</span>
                  <span className="font-normal leading-snug text-muted-foreground">
                    Allow doctors to add vital signs for patients
                  </span>
                </Label>
                <Switch id="performance" />
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">
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
            <CardContent className="grid gap-6">
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="necessary" className="flex flex-col space-y-1">
                  <span>
                    Create Consultation Notes for Patients
                  </span>
                  <span className="font-normal leading-snug text-muted-foreground">
                    Allow doctors to create consultation notes for patients
                  </span>
                </Label>
                <Switch id="necessary" defaultChecked />
              </div>
              <Label htmlFor="functional" className="flex flex-col space-y-1">
                Allow Patients to view Consultation Notes (S.O.A.P)
              </Label>
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="functional" className="flex flex-col space-y-1">
                  <span className="font-normal leading-snug text-muted-foreground">
                    Subjective History
                  </span>
                </Label>
                <Switch id="functional" />
              </div>
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="functional" className="flex flex-col space-y-1">
                  <span className="font-normal leading-snug text-muted-foreground">
                    Objective History
                  </span>
                </Label>
                <Switch id="functional" />
              </div>
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="functional" className="flex flex-col space-y-1">
                  <span className="font-normal leading-snug text-muted-foreground">
                    Assessment
                  </span>
                </Label>
                <Switch id="functional" />
              </div>
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="functional" className="flex flex-col space-y-1">
                  <span className="font-normal leading-snug text-muted-foreground">
                    Plan
                  </span>
                </Label>
                <Switch id="functional" />
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">
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
