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
import BookAppointmentSteps from "./BookAppointmentSteps";
import SelectTimeSlot from "./SelectTimeSlot";
import ChiefComplaint from "./ChiefComplaint";
import ConsentForm from "./ConsentForm";
import ReviewBooking from "./ReviewBooking";
import { InsertAttachment } from "./InsertAttachment";

export default function BookAppointmentSheet() {
  return (
    <Sheet >
      <SheetTrigger asChild>
        <Button>Book Appointment</Button>
      </SheetTrigger>
      <SheetContent side="top">
        <SheetHeader>
          <SheetTitle>Book an Appointment</SheetTitle>
          <SheetDescription>
            Filter the calendar to find the best time for your appointment.
          </SheetDescription>
        </SheetHeader>
        <BookAppointmentSteps initialStep={1}>
          <SelectTimeSlot/>
          <ChiefComplaint/>
          <InsertAttachment/>
          <ConsentForm/>
          <ReviewBooking/>
        </BookAppointmentSteps>
        <SheetFooter>
          <SheetClose asChild>
            <Button variant="outline" type="button">Close</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}


