"use client";

import { useState } from "react";
import { Tags, User } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { tagHealthcareProvidersAction } from "@/actions/appointments/appointment-tags.action";
import type { GetHPsType } from "@/actions/hp.actions";

interface TagHPDialogProps {
  open: boolean;
  appointmentId: number;
  hps: GetHPsType;
  /** IDs of HPs that are currently tagged */
  taggedHpIds: number[];
  onClose: () => void;
  onSuccess: () => void;
}

export function TagHPDialog({
  open,
  appointmentId,
  hps,
  taggedHpIds,
  onClose,
  onSuccess,
}: TagHPDialogProps) {
  const [isPending, setIsPending] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set(taggedHpIds));

  const toggle = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSave = async () => {
    setIsPending(true);
    const result = await tagHealthcareProvidersAction({
      appointmentId,
      healthcareProviderIds: Array.from(selected),
    });
    setIsPending(false);
    if (result.status) {
      toast.success(result.message);
      onSuccess();
    } else {
      toast.error(result.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tags className="h-5 w-5 text-primary" />
            Tag Healthcare Providers
          </DialogTitle>
          <DialogDescription>
            Tag providers for visibility. They can see this appointment without being assigned.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {hps.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No healthcare providers available.
            </p>
          ) : (
            hps.map((hp) => {
              const name =
                hp.HPProfile?.name ??
                `${hp.User.firstName ?? ""} ${hp.User.lastName ?? ""}`.trim();
              const initials = `${hp.User.firstName?.charAt(0) ?? ""}${hp.User.lastName?.charAt(0) ?? ""}`;
              const isSelected = selected.has(hp.id);

              return (
                <button
                  key={hp.id}
                  type="button"
                  onClick={() => toggle(hp.id)}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all duration-150 ${
                    isSelected
                      ? "border-primary bg-primary/10"
                      : "border-border/50 bg-background/50 hover:border-primary/40 hover:bg-muted/30"
                  }`}
                >
                  <Avatar className="h-8 w-8 rounded-full flex-shrink-0">
                    <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                      {initials || <User className="h-3 w-3" />}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-xs line-clamp-1">
                      {hp.HPProfile?.title ? `${hp.HPProfile.title} ` : ""}
                      {name}
                    </p>
                    {hp.HPType?.name && (
                      <p className="text-[10px] text-muted-foreground">{hp.HPType.name}</p>
                    )}
                  </div>
                  {isSelected ? (
                    <Badge className="text-[10px] px-1.5 py-0 bg-primary/20 text-primary border-0 flex-shrink-0">
                      Tagged
                    </Badge>
                  ) : null}
                </button>
              );
            })
          )}
        </div>

        <div className="flex gap-3 pt-1">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            type="button"
            className="flex-1 bg-primary/90 hover:bg-primary"
            disabled={isPending}
            onClick={handleSave}
          >
            {isPending ? "Saving..." : `Save Tags (${selected.size})`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
