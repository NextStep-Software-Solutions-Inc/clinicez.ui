"use client";

import { promiseWrapper } from "@/lib/with-error-handling";
import { createMedicationAction } from "@actions/medications/medication.action";
import { useUser } from "@clerk/nextjs";
import ActionButton from "@components/ActionButton";
import CustomModalContent from "@components/CustomModalContent";
import { Button } from "@components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogFooter,
  DialogTrigger
} from "@components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@components/ui/form";
import { Input } from "@components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@components/ui/tooltip";
import Each from "@components/utils/Each";
import { zodResolver } from "@hookform/resolvers/zod";
import { useHPs } from "@hooks/useHP";
import { sessionClinicAtom } from "@state/session-clinic";
import { useAtomValue } from "jotai";
import { Pill } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

interface CreateMedicationModalProps {
  onCreated?: () => void;
  consultation: {
    id: number;
    patientId: number;
  }
}

type CreatePrescriptionForm = z.infer<typeof createPrescriptionFormSchema>;
const createPrescriptionFormSchema = z.object({
  name: z.string().trim(),
  hpId: z.number({
    coerce: true,
    required_error: "Healthcare provider is required"
  }),
});

export default function CreateMedicationModal({onCreated, consultation}: CreateMedicationModalProps) {
  const { user } = useUser();
  const {clinicUid} = useParams<{clinicUid: string}>()
  const closeBtnRef = useRef<HTMLInputElement>(null);
  
  const { data: myHps } = useHPs({
    userId: user?.id ?? ""
  });

  const form = useForm<CreatePrescriptionForm>({
    resolver: zodResolver(createPrescriptionFormSchema),
    defaultValues: {
      name: "",
    }
  });

  const action = async () => {
    form.handleSubmit((data) => {
      
      toast.promise(promiseWrapper(createMedicationAction)({
        ...data, 
        clinicUid,
        consultationTicketId: consultation.id,
        patientId: consultation.patientId,
      }), {
        loading: "Creating new medication...",
        success: (res) => {
          onCreated?.();
          closeBtnRef.current?.click();
          form.reset(data);
          return res.message;
        },
        error: error => error
      });
    })();
  };

  useEffect(() => {
    if (myHps?.length === 1) {
      form.setValue("hpId", myHps[0].id);
    }
  }, [form, myHps]);

 
  return (
    <Dialog>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button className="w-full">
                <Pill className="h-4 w-4 mr-2" />
                New Medication
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent>Create New Medication</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <CustomModalContent
        className="sm:max-w-[625px] overflow-scroll max-h-[100vh] no-scrollbar"
        label="Create New Medication"
        description={
          <>
            The medication will be linked to consultation #:{" "}
            <span className="italic font-semibold"></span>
          </>
        }
      >
        <Form {...form}>
          <form
            action={action}
            className="space-y-6"
          >
            <FormField
              control={form.control}
              name="hpId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Interacting as</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    name={field.name}
                    defaultValue={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="HP profile to interact as" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <Each
                        of={myHps ?? []}
                        render={(hp) => (
                          <SelectItem value={hp.id.toString()}>
                            {hp.HPProfile?.title} {hp.HPProfile?.name} {hp.HPProfile?.suffix} ({hp.HPType.name})
                          </SelectItem>
                        )}
                      />
                    </SelectContent>
                  </Select>
                  <FormDescription></FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Give this medication a unique name"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    This is your public display name.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <DialogClose asChild>
                <input
                  ref={closeBtnRef}
                  type="hidden"
                  value="ok"
                />
              </DialogClose>
              <ActionButton type="submit">Create new medication</ActionButton>
            </DialogFooter>
          </form>
        </Form>
      </CustomModalContent>
    </Dialog>
  );
}
