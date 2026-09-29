"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { Button } from "@components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@components/ui/dialog";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { Textarea } from "@components/ui/textarea";
import { toast } from "sonner";
import { createTenantAction } from "@actions/super-admin/tenants.action";
import { SuperAdminUserSearchCombobox } from "./SuperAdminUserSearchCombobox";
import { Loader2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

type FormData = {
  tenantUid: string;
  name: string;
  description: string;
  ownerEmail: string;
};

interface CreateTenantDialogProps {
  onSuccess?: () => void;
  triggerButton?: React.ReactNode;
}

export function CreateTenantDialog({ onSuccess, triggerButton }: CreateTenantDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      tenantUid: "",
      name: "",
      description: "",
      ownerEmail: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const res = await createTenantAction({
        tenantUid: data.tenantUid.trim(),
        name: data.name.trim(),
        description: data.description.trim() || undefined,
        ownerEmail: data.ownerEmail?.trim() || undefined,
      });

      if (res.success) {
        toast.success("Tenant created successfully.");
        setOpen(false);
        reset();
        router.refresh();
        if (onSuccess) onSuccess();
      } else {
        toast.error(res.error || "Failed to create tenant");
      }
    } catch (e: any) {
      toast.error(e.message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Tenant
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Tenant</DialogTitle>
          <DialogDescription>
            Create a new tenant independently. Organizations and clinics can be added later under this tenant.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tenantUid">
              Tenant UID <span className="text-destructive">*</span>
            </Label>
            <Input
              id="tenantUid"
              placeholder="e.g. tnt_acme"
              {...register("tenantUid", { required: "Tenant UID is required" })}
            />
            {errors.tenantUid && (
              <p className="text-xs text-destructive">{errors.tenantUid.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="tenantName">
              Tenant Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="tenantName"
              placeholder="e.g. Acme Healthcare System"
              {...register("name", { required: "Tenant Name is required" })}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="tenantDescription">Description (Optional)</Label>
            <Textarea
              id="tenantDescription"
              placeholder="Optional description of the tenancy"
              rows={3}
              {...register("description")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ownerEmail">Owner User (Optional)</Label>
            <Controller
              control={control}
              name="ownerEmail"
              render={({ field }) => (
                <SuperAdminUserSearchCombobox
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Search for an owner (defaults to you)..."
                />
              )}
            />
            <p className="text-xs text-muted-foreground">
              Defaults to you (the current user) as the owner if left empty.
            </p>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Tenant"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
