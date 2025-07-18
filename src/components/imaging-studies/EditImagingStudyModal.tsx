"use client";

import { useState, useEffect } from "react";
import { Button } from "@components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import { Textarea } from "@components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { promiseWrapper } from "@/lib/with-error-handling";
import { updateImagingStudyAction } from "@/actions/clinics/clinical-record/imaging-studies.action";
import { ImagingStudy } from "./ImagingStudiesItem";

const formSchema = z.object({
  history: z.string().optional(),
  reason: z.string().optional(),
  impression: z.string().optional(),
  status: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface EditImagingStudyModalProps {
  study: ImagingStudy;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated?: () => void;
}

const statusOptions = [
  { value: "PENDING", label: "Pending" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

export default function EditImagingStudyModal({
  study,
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
      status: "",
    },
  });

  useEffect(() => {
    if (open && study) {
      form.setValue("status", study.status || "");
    }
  }, [open, study, form]);

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      const result = await promiseWrapper(updateImagingStudyAction)({
        id: study.id,
        history: data.history,
        reason: data.reason,
        impression: data.impression,
        status: data.status,
      });

      toast.success(result.message);
      onUpdated?.();
      onOpenChange(false);
      form.reset();
    } catch (error) {
      toast.error(error as string);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Imaging Study</DialogTitle>
          <DialogDescription>
            Update the imaging study details for {study.ClinicPatient?.Patient?.firstName} {study.ClinicPatient?.Patient?.lastName}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {statusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="history"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>History (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter patient history..."
                      {...field}
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
                    <Textarea
                      placeholder="Enter reason for imaging..."
                      {...field}
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
                    <Textarea
                      placeholder="Enter clinical impression..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Updating..." : "Update Study"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
