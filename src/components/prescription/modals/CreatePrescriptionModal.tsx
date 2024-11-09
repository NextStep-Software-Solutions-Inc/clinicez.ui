"use client";

import { useUser } from "@auth0/nextjs-auth0/client";
import ActionButton from "@components/ActionButton";
import CustomModalContent from "@components/CustomModalContent";
import { Alert, AlertDescription, AlertTitle } from "@components/ui/alert";
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
import { useUserOrganizations } from "@hooks/useUserOrganization";
import { Pill } from "lucide-react";
import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

interface CreatePrescriptionModalProps {
  prescription: {
    id: number;
    name: string;
    description?: string;
    scopeOrgId?: number;
  };
}

type CreatePrescriptionForm = z.infer<typeof createPrescriptionFormSchema>;
const createPrescriptionFormSchema = z.object({
  name: z.string().trim().optional(),
  patientId: z
    .string({
      required_error: "Patient is required"
    })
    .trim(),
  hpId: z
    .string({
      required_error: "Healthcare provider is required"
    })
    .trim()
});

export default function CreatePrescriptionModal({
  prescription
}: CreatePrescriptionModalProps) {
  const { user } = useUser();
  const closeBtnRef = useRef<HTMLInputElement>(null);
  const { data: myHps } = useHPs({
    userId: user?.sub ?? ""
  });

  const { data: orgUsers } = useUserOrganizations({
    orgId: "ustp-hims",
    status: "ACTIVE"
  });

  const form = useForm<CreatePrescriptionForm>({
    resolver: zodResolver(createPrescriptionFormSchema)
  });

  const action = async () => {
    form.handleSubmit((data) => {
      form.reset(data);

      closeBtnRef.current?.click();
    }, console.error)();
  };

  useEffect(() => {
    if (myHps?.length === 1) {
      form.setValue("hpId", myHps[0].id.toString());
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
            <span className="italic font-semibold">{prescription.id}</span>
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
                            {hp.HPProfile?.title} {hp.HPProfile?.suffix}{" "}
                            {hp.HPProfile?.name} ({hp.HPType.name})
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
