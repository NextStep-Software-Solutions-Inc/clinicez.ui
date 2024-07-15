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
import { DialogProps } from "@radix-ui/react-dialog"
import Suspend from "./Suspend";
import EMRPreview from "./EMRPreview";
// import { preloadUserAction } from "@actions/user.action";
// import { preloadUserAllergiesAction } from "@actions/user-allergy.action";
// import { preloadUserVaccinationsAction } from "@actions/user-vaccination.action";
// import { preloadUserDisabilitiesAction } from "@actions/user-disability.action";
// import { preloadUserIllnessesAction } from "@actions/user-illness.action";
interface EMRPreviewSheetProps extends DialogProps {
  children?: React.ReactNode;
  record: {
    id: string;
    subject: string;
  }
}
export default function EMRPreviewSheet({ children, record, ...res }: EMRPreviewSheetProps) {
  // preloadUserAction(record.id);
  // preloadUserAllergiesAction(record.id);
  // preloadUserVaccinationsAction(record.id);
  // preloadUserDisabilitiesAction(record.id);
  // preloadUserIllnessesAction(record.id);

  return (
    <Sheet {...res}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent side="right" className="min-w-[calc(100dvw-30%)]">
        <SheetHeader>
          <SheetTitle>{`${record.subject}'s EMR Preview`}</SheetTitle>
          <SheetDescription>
            Patient Record Summary
          </SheetDescription>
        </SheetHeader>
        <Suspend>
          <EMRPreview patientId={record.id} />
        </Suspend>
        <SheetFooter>
          <SheetClose asChild>
            <Button variant="outline" type="button">Close</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}