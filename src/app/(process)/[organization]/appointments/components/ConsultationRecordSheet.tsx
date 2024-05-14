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
import Each from "@components/utils/Each";
import { format } from "date-fns";
import Link from "next/link";
interface ConsultationRecordSheetProps {
  children?: React.ReactNode;
  onOpenChange? : (open: boolean) => void;
  onSelect? : (e: Event) => void;
}

const consultationRecords = [
  {
    id: "1",
    createdAt: "2022-03-01T10:00:00Z",
    doctor: "Dr. John Doe",
    subject: "Fever",
  },
  {
    id: "2",
    createdAt: "2022-03-02T11:00:00Z",
    doctor: "Dr. Jane Doe",
    subject: "Headache",
  },
  {
    id: "3",
    createdAt: "2022-03-03T12:00:00Z",
    doctor: "Dr. John Doe",
    subject: "Cough",
  },
  {
    id: "4",
    createdAt: "2022-03-04T13:00:00Z",
    doctor: "Dr. Jane Doe",
    subject: "Stomachache",
  },
  {
    id: "5",
    createdAt: "2022-03-05T14:00:00Z",
    doctor: "Dr. John Doe",
    subject: "Backache",
  }
]

export default function ConsultationRecordSheet({ children, onOpenChange }: ConsultationRecordSheetProps) {
  return (
    <Sheet onOpenChange={onOpenChange}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Consultation Records</SheetTitle>
          <SheetDescription>
            View and manage consultation records.
          </SheetDescription>
        </SheetHeader>
        <div className="my-5">
          <Each
            of={consultationRecords}
            render={(record) => (
              <Link href={{
                pathname: `/${"org"}/consultations/${record.id}`,
              }}>
                <div className="flex items-center justify-between p-2 border-b border-border hover:bg-slate-100 hover:ring-1">
                  <div>
                    <p className="font-semibold">{record.subject}</p>
                    <p className="text-sm text-muted-foreground">{record.doctor}</p>
                 
                  </div>
                  <p className="text-sm text-muted-foreground">{format(record.createdAt, "PPp")}</p>
                </div>
              </Link>
            )}
          />
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
