"use client";

import { createDocumentTemplateAction } from "@/actions/document-template.action";
import { Textarea } from "@/components/ui/textarea";
import { useDocumentTypes } from "@/hooks/useDocumentType";
import { promiseWrapper } from "@/lib/with-error-handling";
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
import { Plus } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

interface CreateDocumentTemplateModalProps {
  onCreated?: () => void;
  documentType?: string;
  label?: string;
  clinicUid?: string;
}

type CreateDocumentTemplateForm = z.infer<typeof createDocumentTemplateFormSchema>;
const createDocumentTemplateFormSchema = z.object({
  name: z.string({
    required_error: "Document name is required"
  }).trim(),
  htmlContent: z.string({
    required_error: "Document content is required"
  }).trim(),
  typeId: z.number({
    coerce: true,
    required_error: "Document type is required"
  }),
});

export default function CreateDocumentTemplateModal({
  onCreated,
  documentType,
  label,
  clinicUid,
}: CreateDocumentTemplateModalProps) {
  const params = useParams<{clinicUid?: string}>()
  const resolvedClinicUid = clinicUid ?? params?.clinicUid
  const closeBtnRef = useRef<HTMLInputElement>(null);

  const { data: docTypes } = useDocumentTypes({
    name: documentType
  });

  const form = useForm<CreateDocumentTemplateForm>({
    resolver: zodResolver(createDocumentTemplateFormSchema),
    defaultValues: {
      name: "",
      htmlContent: "",
    }
  });

  const action = async () => {
    form.handleSubmit((data) => {
      if(!resolvedClinicUid) {
        toast.error("Clinic is required to create a document template");
        return;
      }

      toast.promise(promiseWrapper(createDocumentTemplateAction)({...data, clinicUid: resolvedClinicUid}), {
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
    if (docTypes?.data?.length === 1 && docTypes?.data[0].name === documentType) {
      form.setValue("typeId", docTypes?.data[0].id);
    }
  }, [form, docTypes?.data, documentType]);

  return (
    <Dialog>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto whitespace-nowrap">
                <Plus className="h-4 w-4 mr-2" />
                New {label ?? "Document"} Template
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent>Create New {label ?? "Document"} Template</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <CustomModalContent
        className="sm:max-w-[625px] overflow-scroll max-h-[100vh] no-scrollbar"
        label={`Create New ${label ?? "Document"} Template`}
        description={
          <>
            Create a new document template by filling in the fields below.
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
              name="typeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Document Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    name={field.name}
                    defaultValue={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select document template type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <Each
                        of={docTypes?.data ?? []}
                        render={(type) => (
                          <SelectItem value={type.id.toString()}>
                            {type.name || `Document Type #${type.id}`}
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
                      placeholder="Give this prescription a unique name"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    This name will be used to identify the templates
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="htmlContent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>HTML content</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="HTML content"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Enter the HTML content of the document template
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
              <ActionButton type="submit">Create</ActionButton>
            </DialogFooter>
          </form>
        </Form>
      </CustomModalContent>
    </Dialog>
  );
}
