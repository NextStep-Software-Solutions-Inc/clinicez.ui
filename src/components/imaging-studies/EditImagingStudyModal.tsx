"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@components/ui/form";
import ActionButton from "@/components/ActionButton";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { promiseWrapper } from "@/lib/with-error-handling";
import { updateImagingStudyAction } from "@/actions/clinics/clinical-record/imaging-studies.action";
import { ImagingStudy } from "./ImagingStudiesItem";
import { PatientProfile } from "../consultation/ConsultationDetails";

const formSchema = z.object({
  history: z.string().optional(),
  reason: z.string().optional(),
  impression: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface EditImagingStudyModalProps {
  study: ImagingStudy;
  userInfo?: PatientProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated?: () => void;
}

export default function EditImagingStudyModal({
  study,
  userInfo,
  open,
  onOpenChange,
  onUpdated,
}: EditImagingStudyModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      history: "",
      reason: "",
      impression: "",
    },
    mode: "onChange",
  });

  const resetForm = useCallback(() => {
    form.reset({
      history: "",
      reason: "",
      impression: "",
    });
  }, [form]);

  useEffect(() => {
    if (open && study) {
      form.setValue("history", study.history || "");
      form.setValue("reason", study.reason || "");
      form.setValue("impression", study.impression || "");
    } else if (!open) {
      resetForm();
    }
  }, [open, study, form, resetForm]);

  const onSubmit = useCallback(async (data: FormData) => {
    setIsLoading(true);
    try {
      const result = await promiseWrapper(updateImagingStudyAction)({
        id: study.id,
        history: data.history,
        reason: data.reason,
        impression: data.impression,
      });

      toast.success(result.message);
      onUpdated?.();
      onOpenChange(false);
    } catch (error) {
      toast.error(error as string);
    } finally {
      setIsLoading(false);
    }
  }, [study.id, onUpdated, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Imaging Study</DialogTitle>
          <DialogDescription>
            Update the imaging study details for {userInfo?.firstName} {userInfo?.lastName}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} id="edit-imaging-study-form">
            <div className="max-h-[60vh] overflow-y-auto flex flex-col gap-4 py-2">
              <FormField
                control={form.control}
                name="history"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>History (Optional)</FormLabel>
                    <FormControl>
                      <textarea
                        placeholder="Enter patient history..."
                        {...field}
                        className="w-full min-h-[80px] border rounded-md p-2 text-sm focus:outline-primary"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason (Optional)</FormLabel>
                    <FormControl>
                      <textarea
                        placeholder="Enter reason for imaging..."
                        {...field}
                        className="w-full min-h-[80px] border rounded-md p-2 text-sm focus:outline-primary"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="impression"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Impression (Optional)</FormLabel>
                    <FormControl>
                      <textarea
                        placeholder="Enter clinical impression..."
                        {...field}
                        className="w-full min-h-[80px] border rounded-md p-2 text-sm focus:outline-primary"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <ActionButton
                type="submit"
                disabled={isLoading}
                form="edit-imaging-study-form"
                className="bg-black text-white hover:bg-black/90"
              >
                {isLoading ? "Updating..." : "Update Study"}
              </ActionButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
