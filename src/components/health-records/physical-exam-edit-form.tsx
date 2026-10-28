"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { physicalExaminationSchema, type PhysicalExaminationFormInput } from "@/schemas";
import { getPhysicalExamLibrariesAction } from "@/actions/super-admin/physical-exam-library.action";
import { savePhysicalExaminationAction, deletePhysicalExaminationAction } from "@/actions/physical-exam.action";
import { PhysicalExamSystemField } from "./physical-exam-system-field";
import { formatPeCodes } from "@/lib/physical-exam-utils";

type LibraryItem = {
  id: string;
  category: string;
  code: string;
  description: string;
  isActive: boolean;
};

export interface PhysicalExamEditFormProps {
  initialData: PhysicalExaminationFormInput | null;
  examId?: string;
  patientId: number;
  consultationTicketId?: number;
  onSuccess?: () => void;
  onDirtyChange?: (isDirty: boolean) => void;
  saveRef?: React.MutableRefObject<{
    submit: () => Promise<void>;
    hasChanges: boolean;
  } | null>;
}

export function PhysicalExamEditForm({
  initialData,
  examId,
  patientId,
  consultationTicketId,
  onSuccess,
  onDirtyChange,
  saveRef,
}: PhysicalExamEditFormProps) {
  const [libraries, setLibraries] = useState<LibraryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  const form = useForm<PhysicalExaminationFormInput>({
    resolver: zodResolver(physicalExaminationSchema),
    defaultValues: initialData
      ? {
          generalSurveyId: formatPeCodes(initialData.generalSurveyId),
          generalSurveyRemarks: initialData.generalSurveyRemarks || "",
          heentId: formatPeCodes(initialData.heentId),
          heentRemarks: initialData.heentRemarks || "",
          chestId: formatPeCodes(initialData.chestId),
          chestRemarks: initialData.chestRemarks || "",
          heartId: formatPeCodes(initialData.heartId),
          heartRemarks: initialData.heartRemarks || "",
          abdomenId: formatPeCodes(initialData.abdomenId),
          abdomenRemarks: initialData.abdomenRemarks || "",
          guId: formatPeCodes(initialData.guId),
          guRemarks: initialData.guRemarks || "",
          skinId: formatPeCodes(initialData.skinId),
          skinRemarks: initialData.skinRemarks || "",
          neuroId: formatPeCodes(initialData.neuroId),
          neuroRemarks: initialData.neuroRemarks || "",
          rectalId: formatPeCodes(initialData.rectalId),
          rectalRemarks: initialData.rectalRemarks || "",
        }
      : {
          generalSurveyId: "",
          generalSurveyRemarks: "",
          heentId: "",
          heentRemarks: "",
          chestId: "",
          chestRemarks: "",
          heartId: "",
          heartRemarks: "",
          abdomenId: "",
          abdomenRemarks: "",
          guId: "",
          guRemarks: "",
          skinId: "",
          skinRemarks: "",
          neuroId: "",
          neuroRemarks: "",
          rectalId: "",
          rectalRemarks: "",
        },
  });

  const isDirty = form.formState.isDirty;

  useEffect(() => {
    if (onDirtyChange) {
      onDirtyChange(isDirty);
    }
  }, [isDirty, onDirtyChange]);

  useEffect(() => {
    const fetchLibraries = async () => {
      try {
        const res = await getPhysicalExamLibrariesAction();
        if (res.data) {
          setLibraries(res.data.filter((d: any) => d.isActive));
        }
      } catch (error) {
        console.error("Failed to load physical exam library");
      } finally {
        setIsLoading(false);
      }
    };
    fetchLibraries();
  }, []);

  const onSubmit = async (data: PhysicalExaminationFormInput) => {
    try {
      const result = await savePhysicalExaminationAction(patientId, data, examId, consultationTicketId);
      if (result.error) {
        toast.error(result.error);
        throw new Error(result.error);
      }
      form.reset(data); // reset dirty state
      toast.success("Physical examination saved successfully");
      if (onSuccess) onSuccess();
    } catch (error) {
      // Error handled above
      throw error;
    }
  };

  const handleDelete = async () => {
    if (!examId) return;
    if (!confirm("Are you sure you want to delete this physical examination record?")) return;
    setIsDeleting(true);
    try {
      const result = await deletePhysicalExaminationAction(examId);
      if (result.error) {
        toast.error(result.error);
        throw new Error(result.error);
      }
      form.reset({
        generalSurveyId: "",
        generalSurveyRemarks: "",
        heentId: "",
        heentRemarks: "",
        chestId: "",
        chestRemarks: "",
        heartId: "",
        heartRemarks: "",
        abdomenId: "",
        abdomenRemarks: "",
        guId: "",
        guRemarks: "",
        skinId: "",
        skinRemarks: "",
        neuroId: "",
        neuroRemarks: "",
        rectalId: "",
        rectalRemarks: "",
      });
      toast.success("Physical examination deleted successfully");
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Expose submit handler if saveRef is provided
  useEffect(() => {
    if (saveRef) {
      saveRef.current = {
        submit: form.handleSubmit(onSubmit),
        hasChanges: isDirty,
      };
    }
  }, [saveRef, isDirty, form.handleSubmit]);

  const systems = [
    { key: "generalSurvey", label: "General Survey", category: "GENSURVEY", isSingleSelect: true },
    { key: "heent", label: "Head, Eyes, Ears, Nose, Throat", category: "HEENT" },
    { key: "chest", label: "Chest/Lungs", category: "CHEST" },
    { key: "heart", label: "Cardiovascular System", category: "HEART" },
    { key: "abdomen", label: "Abdomen", category: "ABDOMEN" },
    { key: "gu", label: "Genitourinary", category: "GU" },
    { key: "skin", label: "Skin/Extremities", category: "SKIN" },
    { key: "neuro", label: "Neurological", category: "NEURO" },
    { key: "rectal", label: "Rectal", category: "RECTAL" },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {systems.map((sys) => {
          const categoryOptions = libraries
            .filter((l) => l.category === sys.category)
            .sort((a, b) => a.description.localeCompare(b.description));

          return (
            <Controller
              key={sys.key}
              name={`${sys.key}Id` as keyof PhysicalExaminationFormInput}
              control={form.control}
              render={({ field }) => (
                <Controller
                  name={`${sys.key}Remarks` as keyof PhysicalExaminationFormInput}
                  control={form.control}
                  render={({ field: remarksField }) => (
                    <PhysicalExamSystemField
                      category={sys.category}
                      label={sys.label}
                      value={(field.value as string) || ""}
                      onChange={(val) => field.onChange(val)}
                      remarks={(remarksField.value as string) || ""}
                      onRemarksChange={(val) => remarksField.onChange(val)}
                      options={categoryOptions}
                      isSingleSelect={sys.isSingleSelect}
                      compact={false}
                    />
                  )}
                />
              )}
            />
          );
        })}
      </div>

      {!saveRef && (
        <div className="flex justify-between items-center">
          {examId ? (
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting || form.formState.isSubmitting}
            >
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete Record
            </Button>
          ) : (
            <div />
          )}
          <Button type="submit" disabled={form.formState.isSubmitting || !isDirty}>
            {form.formState.isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : examId ? (
              "Update Changes"
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      )}

      {/* Expose delete button even when saveRef is used if they need to delete from a parent component that only handles saves */}
      {saveRef && examId && (
        <div className="flex justify-start pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting || form.formState.isSubmitting}
          >
            {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Delete This Record
          </Button>
        </div>
      )}
    </form>
  );
}
