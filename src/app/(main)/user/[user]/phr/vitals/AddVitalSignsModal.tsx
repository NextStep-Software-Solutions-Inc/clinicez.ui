import CustomModalContent from "@components/CustomModalContent";
import Suspend from "@components/Suspend";
import { Alert, AlertDescription, AlertTitle } from "@components/ui/alert";
import { Dialog, DialogTrigger } from "@components/ui/dialog";
import { AlertCircle } from "lucide-react";
import AddVitalSignsForm from "./AddVitalSignsForm";
import { Button } from "@components/ui/button";

export default async function AddVitalSignsModal({userId}: {userId: string}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="flex-grow sm:flex-grow-0">Add Vitals</Button>
      </DialogTrigger>
      <CustomModalContent 
        className="sm:max-w-[800px] overflow-scroll max-h-[100vh] no-scrollbar"
        label="Add Vital Signs" 
        description="Add your vital signs and anthropometric measurements."
      >
        <Alert className="my-2">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Caution</AlertTitle>
          <AlertDescription>
              Ensure that you have the correct information before adding your vital signs.
          </AlertDescription>
        </Alert>
        <Suspend>
          <AddVitalSignsForm userId={userId}/>
        </Suspend>
      </CustomModalContent>
    </Dialog>
  )
}