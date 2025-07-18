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
import {
  updateMedicalCertificateAction,
  getMedicalCertificateReasonsAction,
  getMedicalCertificateFindingsAction,
  getMedicalCertificateClassificationsAction,
  type GetMedicalCertificateReasons,
  type GetMedicalCertificateFindings,
  type GetMedicalCertificateClassifications
} from "@/actions/clinics/clinical-record/medical-certificate.action";
import { MedicalCertificate } from "./MedicalCertificateItem";

const formSchema = z.object({
  reasonId: z.number().min(1, "Reason is required"),
  findingId: z.number().min(1, "Finding is required"),
  classificationId: z.number().min(1, "Classification is required"),
  remarks: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface EditMedicalCertificateModalProps {
  certificate: MedicalCertificate;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated?: () => void;
}

export default function EditMedicalCertificateModal({
  certificate,
  open,
  onOpenChange,
  onUpdated,
}: EditMedicalCertificateModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [reasons, setReasons] = useState<GetMedicalCertificateReasons["data"]>([]);
  const [findings, setFindings] = useState<GetMedicalCertificateFindings["data"]>([]);
  const [classifications, setClassifications] = useState<GetMedicalCertificateClassifications["data"]>([]);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      reasonId: 0,
      findingId: 0,
      classificationId: 0,
      remarks: "",
    },
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [reasonsRes, findingsRes, classificationsRes] = await Promise.all([
          getMedicalCertificateReasonsAction(),
          getMedicalCertificateFindingsAction(),
          getMedicalCertificateClassificationsAction(),
        ]);

        setReasons(reasonsRes.data);
        setFindings(findingsRes.data);
        setClassifications(classificationsRes.data);

        if (certificate.Reason && reasonsRes.data) {
          const reason = reasonsRes.data.find(r => r.name === certificate.Reason?.name);
          if (reason) form.setValue("reasonId", reason.id);
        }
        if (certificate.Finding && findingsRes.data) {
          const finding = findingsRes.data.find(f => f.name === certificate.Finding?.name);
          if (finding) form.setValue("findingId", finding.id);
        }
        if (certificate.Classification && classificationsRes.data) {
          const classification = classificationsRes.data.find(c => c.name === certificate.Classification?.name);
          if (classification) form.setValue("classificationId", classification.id);
        }
      } catch (error) {
        toast.error("Failed to load form data");
      }
    };

    if (open) {
      loadData();
    }
  }, [open, certificate, form, reasons?.length, findings?.length, classifications?.length]);

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      const result = await promiseWrapper(updateMedicalCertificateAction)({
        id: certificate.id,
        reasonId: data.reasonId,
        findingId: data.findingId,
        classificationId: data.classificationId,
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
          <DialogTitle>Edit Medical Certificate</DialogTitle>
          <DialogDescription>
            Update the medical certificate details for {certificate.ClinicPatient?.Patient?.firstName} {certificate.ClinicPatient?.Patient?.lastName}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="reasonId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    value={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a reason" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {reasons?.map((reason) => (
                        <SelectItem key={reason.id} value={reason.id.toString()}>
                          {reason.name}
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
              name="findingId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Finding</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    value={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a finding" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {findings?.map((finding) => (
                        <SelectItem key={finding.id} value={finding.id.toString()}>
                          {finding.name}
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
              name="classificationId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Classification</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    value={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a classification" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {classifications?.map((classification) => (
                        <SelectItem key={classification.id} value={classification.id.toString()}>
                          {classification.name}
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
              name="remarks"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Remarks (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter any additional remarks..."
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
                {isLoading ? "Updating..." : "Update Certificate"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
