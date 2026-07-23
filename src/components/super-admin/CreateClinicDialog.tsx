"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@components/ui/dialog";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { useToast } from "@components/ui/use-toast";
import { createClinicAction } from "@actions/super-admin/setup-wizard.action";
import { Loader2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { GetTenantOrganizations } from "@actions/super-admin/tenants.action";

type FormData = {
  clinicUid: string;
  name: string;
  description: string;
  organizationId?: string;
};

type OrganizationData = GetTenantOrganizations["data"][number];

export function CreateClinicDialog({ 
  tenantId, 
  organizations, 
  onSuccess 
}: { 
  tenantId: number; 
  organizations: OrganizationData[]; 
  onSuccess?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const orgId = data.organizationId ? parseInt(data.organizationId) : undefined;
      const res = await createClinicAction({
        tenantId,
        clinicUid: data.clinicUid,
        name: data.name,
        description: data.description,
        organizationId: !isNaN(orgId as any) ? orgId : undefined,
      });

      if (res.success) {
        toast({ title: "Success", description: "Clinic created successfully." });
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
          Create Clinic
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Clinic</DialogTitle>
          <DialogDescription>Add a new clinic to this tenant.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Clinic UID <span className="text-destructive">*</span></Label>
            <Input {...register("clinicUid", { required: "Clinic UID is required" })} placeholder="e.g. cln_123" />
            {errors.clinicUid && <p className="text-xs text-destructive">{errors.clinicUid.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Name <span className="text-destructive">*</span></Label>
            <Input {...register("name", { required: "Name is required" })} placeholder="e.g. Downtown Clinic" />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Input {...register("description")} placeholder="Optional description" />
          </div>
          <div className="space-y-2">
            <Label>Link to Organization (Optional)</Label>
            <select
              {...register("organizationId")}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <option value="">None</option>
              {organizations.map(org => (
                <option key={org.id} value={org.id}>{org.name}</option>
              ))}
            </select>
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
