"use client";

import { useDocumentTemplates } from "@/hooks/useDocumentTemplate";
import { promiseWrapper } from "@/lib/with-error-handling";
import { createPrescriptionAction } from "@actions/medications/prescription.action";
import { useUser } from "@auth0/nextjs-auth0/client";
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
import { useMedications } from "@hooks/useMedication";
import { Pill } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

interface CreatePrescriptionModalProps {
  onCreated?: () => void;
}

type CreatePrescriptionForm = z.infer<typeof createPrescriptionFormSchema>;
const createPrescriptionFormSchema = z.object({
  name: z.string().trim().optional(),
  medicationId: z.number({
    coerce: true,
    required_error: "Medication is required"
  }),
  templateId: z.number({
    coerce: true,
    required_error: "Prescription template is required"
  }),
  hpId: z.number({
    coerce: true,
    required_error: "Healthcare provider is required"
  }),
});

export default function CreatePrescriptionModal({
  onCreated,
}: CreatePrescriptionModalProps) {
  const { user } = useUser();
  const {clinicUid} = useParams<{clinicUid: string}>()
  const closeBtnRef = useRef<HTMLInputElement>(null);
  
  const { data: myHps } = useHPs({
    userId: user?.sub ?? ""
  });

  const { data: medications } = useMedications({
    clinicUid
  });

  const {data: documentTemplates } = useDocumentTemplates({
    typeName: "prescription",
    clinicUid
  })

  const form = useForm<CreatePrescriptionForm>({
    resolver: zodResolver(createPrescriptionFormSchema),
    defaultValues: {
      name: "",
    }
  });

  const action = async () => {
    form.handleSubmit((data) => {
     
      toast.promise(promiseWrapper(createPrescriptionAction)({...data, clinicUid}), {
        loading: "Creating new prescription...",
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

  useEffect(() => {
    if (medications?.data?.length === 1) {
      form.setValue("medicationId", medications?.data[0].id);
    }
  }, [form, medications?.data]);

  useEffect(() => {
    if (documentTemplates?.data?.length === 1) {
      form.setValue("templateId", documentTemplates?.data[0].id);
    }
  }, [form, documentTemplates?.data]);

  return (
    <Dialog>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button className="w-full">
                <Pill className="h-4 w-4 mr-2" />
                New Prescription
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent>Create New Prescription</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <CustomModalContent
        className="sm:max-w-[625px] overflow-scroll max-h-[100vh] no-scrollbar"
        label="Create New Prescription"
        description={
          <>
            The prescription will be linked to consultation #:{" "}
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

            {/* <FormField
              control={form.control}
              name="patientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Patient</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    name={field.name}
                    defaultValue={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select patient" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <Each
                        of={orgUsers?.data ?? []}
                        render={(user) => (
                          <SelectItem value={user.id.toString()}>
                            {user.User.firstName} {user.User.lastName}{" "}
                            {user.User.suffix}
                          </SelectItem>
                        )}
                      />
                    </SelectContent>
                  </Select>
                  <FormDescription></FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            /> */}

            <FormField
              control={form.control}
              name="medicationId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Medication</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    name={field.name}
                    defaultValue={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select active medication" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <Each
                        of={medications?.data ?? []}
                        render={(medication) => (
                          <SelectItem value={medication.id.toString()}>
                            {medication.name || `Medication #${medication.id}`}
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
              name="templateId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prescription Template</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    name={field.name}
                    defaultValue={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select template" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <Each
                        of={documentTemplates?.data ?? []}
                        render={(template) => (
                          <SelectItem value={template.id.toString()}>
                            {template.name || `Template #${template.id}`}
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
                  <FormLabel>Name (optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Give this prescription a unique name"
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
              <ActionButton type="submit">Create new prescription</ActionButton>
            </DialogFooter>
          </form>
        </Form>
      </CustomModalContent>
    </Dialog>
  );
}
