"use client";

import { promiseWrapper } from "@/lib/with-error-handling";
import { updatePrescriptionActions } from "@actions/medications/prescription.action";
import { useUser } from "@auth0/nextjs-auth0";
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@components/ui/tooltip";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Pill } from "lucide-react";
import {  useRef } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

interface UpdatePrescriptionModalProps {
  onUpdated?: () => void;
  prescription: {
    id: number;
    name: string;
  }
}

type UpdatePrescriptionForm = z.infer<typeof updatePrescriptionFormSchema>;
const updatePrescriptionFormSchema = z.object({
  name: z.string().trim().optional(),
});

export default function UpdatePrescriptionModal({onUpdated,prescription}: UpdatePrescriptionModalProps) {
  const closeBtnRef = useRef<HTMLInputElement>(null);
  
  const form = useForm<UpdatePrescriptionForm>({
    resolver: zodResolver(updatePrescriptionFormSchema),
    defaultValues: {
      name: prescription.name,
    }
  });

  const action = async () => {
    form.handleSubmit((data) => {
     
      toast.promise(promiseWrapper(updatePrescriptionActions)({...data, id: prescription.id}), {
        loading: "Updating new prescription...",
        success: (res) => {
          onUpdated?.();
          closeBtnRef.current?.click();
          form.reset(data);
          return res.message;
        },
        error: error => error
      });
    })();
  };

  return (
    <Dialog>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="invisible group-hover/item:visible"
              >
                <Pencil className="h-4 w-4  hover:scale-125 transition-all" />
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent side="top">Modify</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <CustomModalContent
        className="sm:max-w-[625px] overflow-scroll max-h-[100vh] no-scrollbar"
        label="Update Prescription"
        description={
          <>
            Updating prescription #
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
                    Prescription unique name
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
              <ActionButton type="submit">Save Changes</ActionButton>
            </DialogFooter>
          </form>
        </Form>
      </CustomModalContent>
    </Dialog>
  );
}
