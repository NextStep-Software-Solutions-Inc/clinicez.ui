"use client";

import { useState } from "react";
import { Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { upsertAppointmentListPreferenceAction } from "@/actions/users/preference.action";
import type { AppointmentListPreference, AppointmentSortOrder } from "@/types/appointment-preference";
import { DEFAULT_APPOINTMENT_LIST_PREFERENCE } from "@/types/appointment-preference";
import { promiseWrapper } from "@/lib/with-error-handling";

interface AppointmentPreferencesDialogProps {
  currentPreference: AppointmentListPreference | null;
  onSave: (preference: AppointmentListPreference) => void;
}

const SORT_ORDER_OPTIONS: { value: AppointmentSortOrder; label: string; description: string }[] = [
  {
    value: "FIFO",
    label: "FIFO (Queue Order)",
    description: "Oldest arrivals shown first. Pending at top, then received, routed — completed at bottom.",
  },
  {
    value: "STATUS",
    label: "By Status",
    description: "Group appointments by their current status, newest first within each group.",
  },
  {
    value: "PROVIDER",
    label: "By Provider",
    description: "Group appointments by assigned healthcare provider.",
  },
];

export function AppointmentPreferencesDialog({ currentPreference, onSave }: AppointmentPreferencesDialogProps) {
  const [open, setOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState<AppointmentSortOrder>(
    currentPreference?.sortOrder ?? DEFAULT_APPOINTMENT_LIST_PREFERENCE.sortOrder
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    const newPreference: AppointmentListPreference = { sortOrder };
    toast.promise(
      promiseWrapper(upsertAppointmentListPreferenceAction)(newPreference),
      {
        loading: "Saving preferences...",
        success: (res) => {
          onSave(newPreference);
          setOpen(false);
          return res.message;
        },
        error: (err) => String(err),
        finally: () => setIsSaving(false),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
          aria-label="Appointment list preferences"
          title="Appointment list preferences"
        >
          <Settings2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Appointment List Preferences</DialogTitle>
          <DialogDescription>
            Customize how appointments are sorted in the list. Your preference is saved per user.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm font-medium mb-3">Sort Order</p>
          <RadioGroup
            value={sortOrder}
            onValueChange={(val) => setSortOrder(val as AppointmentSortOrder)}
            className="space-y-3"
          >
            {SORT_ORDER_OPTIONS.map((option) => (
              <div
                key={option.value}
                className="flex items-start gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setSortOrder(option.value)}
              >
                <RadioGroupItem value={option.value} id={option.value} className="mt-0.5" />
                <div className="space-y-0.5">
                  <Label htmlFor={option.value} className="text-sm font-medium cursor-pointer">
                    {option.label}
                  </Label>
                  <p className="text-xs text-muted-foreground">{option.description}</p>
                </div>
              </div>
            ))}
          </RadioGroup>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            Save Preferences
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
