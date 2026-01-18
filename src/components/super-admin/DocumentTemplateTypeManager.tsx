"use client";

import { useMemo, useRef } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, Pencil, Trash, FileText } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useDocumentTypes } from "@/hooks/useDocumentType";
import { createDocumentTypeAction, deleteDocumentTypeAction, updateDocumentTypeAction } from "@/actions/document-type.action";
import { promiseWrapper } from "@/lib/with-error-handling";
import Each from "@/components/utils/Each";
import ActionButton from "@/components/ActionButton";

const documentTypeSchema = z.object({
  name: z.string({ required_error: "Name is required" }).trim().min(1, "Name is required"),
  description: z.string().optional().nullable(),
});

type DocumentTypeForm = z.infer<typeof documentTypeSchema>;

type DocumentTypeManagerItem = {
  id: number;
  name: string;
  description?: string | null;
  _count?: {
    DocumentTemplates?: number;
  };
};

export default function DocumentTemplateTypeManager() {
  const { data, mutate, isLoading } = useDocumentTypes();
  const documentTypes = useMemo(() => data?.data ?? [], [data?.data]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
          <FileText className="h-5 w-5 text-primary" />
          <div className="flex-1">
            <CardTitle className="text-lg">Document Template Types</CardTitle>
            <CardDescription>Manage the available template types that clinics can use.</CardDescription>
          </div>
          <div className="ml-auto">
            <CreateDocumentTypeDialog onCreated={mutate} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading && <p className="text-sm text-muted-foreground">Loading document template types...</p>}
        {!isLoading && documentTypes.length === 0 && (
          <p className="text-sm text-muted-foreground">No document template types found.</p>
        )}
        <div className="space-y-2">
          <Each
            of={documentTypes as DocumentTypeManagerItem[]}
            render={(type) => (
              <div className="flex items-start gap-3 rounded-md border p-3" key={type.id}>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{type.name}</span>
                    {type._count?.DocumentTemplates ? (
                      <Badge variant="outline">{type._count.DocumentTemplates} templates</Badge>
                    ) : null}
                  </div>
                  {type.description ? (
                    <p className="text-sm text-muted-foreground whitespace-pre-line">{type.description}</p>
                  ) : null}
                </div>
                <div className="flex items-center gap-1">
                  <UpdateDocumentTypeDialog documentType={type} onUpdated={mutate} />
                  <DeleteDocumentTypeButton documentType={type} onDeleted={mutate} />
                </div>
              </div>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function CreateDocumentTypeDialog({ onCreated }: { onCreated?: () => void }) {
  const closeRef = useRef<HTMLInputElement>(null);
  const form = useForm<DocumentTypeForm>({
    resolver: zodResolver(documentTypeSchema),
    defaultValues: { name: "", description: "" },
  });

  const handleSubmit = () => {
    form.handleSubmit((data) => {
      toast.promise(promiseWrapper(createDocumentTypeAction)(data), {
        loading: "Creating document template type...",
        success: (res) => {
          onCreated?.();
          closeRef.current?.click();
          form.reset({ name: "", description: data.description ?? "" });
          return res.message;
        },
        error: (error) => error,
      });
    })();
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Type
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Create Document Template Type</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form action={handleSubmit} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Prescription, Referral Slip" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Optional description"
                      {...field}
                      value={field.value ?? ""}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <DialogClose asChild>
                <input ref={closeRef} type="hidden" />
              </DialogClose>
              <ActionButton type="submit">Create</ActionButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function UpdateDocumentTypeDialog({ documentType, onUpdated }: { documentType: DocumentTypeManagerItem; onUpdated?: () => void }) {
  const closeRef = useRef<HTMLInputElement>(null);
  const form = useForm<DocumentTypeForm>({
    resolver: zodResolver(documentTypeSchema),
    defaultValues: {
      name: documentType.name,
      description: documentType.description ?? "",
    },
  });

  const handleSubmit = () => {
    form.handleSubmit((data) => {
      toast.promise(promiseWrapper(updateDocumentTypeAction)(documentType.id, data), {
        loading: "Updating document template type...",
        success: (res) => {
          onUpdated?.();
          closeRef.current?.click();
          form.reset(data);
          return res.message;
        },
        error: (error) => error,
      });
    })();
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-muted-foreground">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Edit Document Template Type</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form action={handleSubmit} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Optional description"
                      {...field}
                      value={field.value ?? ""}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <DialogClose asChild>
                <input ref={closeRef} type="hidden" />
              </DialogClose>
              <ActionButton type="submit">Save</ActionButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteDocumentTypeButton({ documentType, onDeleted }: { documentType: DocumentTypeManagerItem; onDeleted?: () => void }) {
  const isInUse = (documentType._count?.DocumentTemplates ?? 0) > 0;

  const handleDelete = async () => {
    if (isInUse) {
      toast.error("Cannot delete a type that is already used by templates");
      return;
    }

    toast.promise(promiseWrapper(deleteDocumentTypeAction)(documentType.id), {
      loading: "Deleting document template type...",
      success: (res) => {
        onDeleted?.();
        return res.message;
      },
      error: (error) => error,
    });
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleDelete}
      disabled={isInUse}
      className="text-destructive hover:text-destructive/90"
    >
      <Trash className="h-4 w-4" />
    </Button>
  );
}
