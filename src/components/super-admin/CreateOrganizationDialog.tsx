"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@components/ui/dialog";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { useToast } from "@components/ui/use-toast";
import { createOrganizationAction } from "@actions/super-admin/setup-wizard.action";
import { Loader2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

type FormData = {
  orgUid: string;
  name: string;
  description: string;
};

export function CreateOrganizationDialog({ tenantId, onSuccess }: { tenantId: number; onSuccess?: () => void }) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const res = await createOrganizationAction({
        tenantId,
        orgUid: data.orgUid,
        name: data.name,
        description: data.description,
      });

      if (res.success) {
        toast({ title: "Success", description: "Organization created successfully." });
        setOpen(false);
        reset();
        router.refresh();
        if (onSuccess) onSuccess();
      } else {
        toast({ title: "Error", description: res.error, variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Something went wrong", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Create Organization
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Organization</DialogTitle>
          <DialogDescription>Add a new organization to this tenant.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Organization UID <span className="text-destructive">*</span></Label>
            <Input {...register("orgUid", { required: "Organization UID is required" })} placeholder="e.g. org_123" />
            {errors.orgUid && <p className="text-xs text-destructive">{errors.orgUid.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Name <span className="text-destructive">*</span></Label>
            <Input {...register("name", { required: "Name is required" })} placeholder="e.g. Main Branch" />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Input {...register("description")} placeholder="Optional description" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
