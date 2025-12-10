"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { useHPs } from "@hooks/useHP";
import { Badge } from "@components/ui/badge";
import { X, Tag } from "lucide-react";
import { Checkbox } from "@components/ui/checkbox";
import { Label } from "@components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@components/ui/alert";
import { Info } from "lucide-react";
import Each from "@components/utils/Each";
import { getHealthcareProviderName } from "@/lib/hp-utils";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@components/ui/sheet";
import { Button } from "@components/ui/button";
import { tagHealthcareProvidersAction } from "@actions/appointments/appointment-tags.action";
import { toast } from "sonner";

interface TagHPsSheetProps {
  appointmentId: number;
  currentTags: Array<{
    id: number;
    healthcareProviderId: number;
    HealthcareProvider: {
      id: number;
      HPProfile?: {
        title?: string | null;
        name?: string | null;
        suffix?: string | null;
      } | null;
      User?: {
        firstName?: string | null;
        middleName?: string | null;
        lastName?: string | null;
        suffix?: string | null;
      } | null;
    };
  }>;
  onTagsUpdated?: () => void;
  children?: React.ReactNode;
}

export default function TagHPsSheet({
  appointmentId,
  currentTags,
  onTagsUpdated,
  children,
}: TagHPsSheetProps) {
  const params = useParams<{ clinicUid: string }>();
  const { data: clinicHPs } = useHPs({ clinicUid: params.clinicUid });
  const [open, setOpen] = useState(false);
  const [selectedHPIds, setSelectedHPIds] = useState<number[]>(
    currentTags.map((tag) => tag.healthcareProviderId)
  );
  const [isSaving, setIsSaving] = useState(false);

  const toggleHP = (hpId: number) => {
    setSelectedHPIds((prev) =>
      prev.includes(hpId) ? prev.filter((id) => id !== hpId) : [...prev, hpId]
    );
  };

  const removeHP = (hpId: number) => {
    setSelectedHPIds((prev) => prev.filter((id) => id !== hpId));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await tagHealthcareProvidersAction({
        appointmentId,
        healthcareProviderIds: selectedHPIds,
      });
      toast.success("Healthcare providers tagged successfully");
      setOpen(false);
      onTagsUpdated?.();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to tag healthcare providers"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const selectedHPs = (clinicHPs ?? []).filter((hp) =>
    selectedHPIds.includes(hp.id)
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {children || (
          <Button variant="outline" size="sm">
            <Tag className="h-4 w-4 mr-2" />
            Tag HPs
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Tag Healthcare Providers (Informational Only)</SheetTitle>
          <SheetDescription>
            Tag healthcare providers for informational purposes. This does not
            assign them to the appointment or trigger any notifications.
          </SheetDescription>
        </SheetHeader>

        <div className="py-6 space-y-4">
          <Alert className="bg-blue-50 border-blue-200">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-900">Informational Only</AlertTitle>
            <AlertDescription className="text-blue-800">
              Tagged healthcare providers will be listed for informational purposes
              only. This does NOT assign them to the appointment, trigger
              notifications, or create any workflow responsibilities. Only assigned
              providers can take action on appointments.
            </AlertDescription>
          </Alert>

          <div>
            <h6 className="text-sm font-semibold mb-3">Selected Tagged HPs:</h6>
            {selectedHPs.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No healthcare providers tagged yet.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                <Each
                  of={selectedHPs}
                  render={(hp) => (
                    <Badge
                      key={hp.id}
                      variant="outline"
                      className="flex items-center gap-1 py-1"
                    >
                      {getHealthcareProviderName(hp)}
                      <button
                        type="button"
                        onClick={() => removeHP(hp.id)}
                        className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                />
              </div>
            )}
          </div>

          <div>
            <h6 className="text-sm font-semibold mb-3">
              Available Healthcare Providers:
            </h6>
            <div className="space-y-2 border rounded-md p-3 max-h-[400px] overflow-y-auto">
              <Each
                of={clinicHPs ?? []}
                fallback={
                  <p className="text-sm text-muted-foreground">
                    No healthcare providers available.
                  </p>
                }
                render={(hp) => {
                  const isSelected = selectedHPIds.includes(hp.id);

                  return (
                    <div
                      key={hp.id}
                      className="flex items-center space-x-2 p-2 hover:bg-accent rounded-md"
                    >
                      <Checkbox
                        id={`hp-${hp.id}`}
                        checked={isSelected}
                        onCheckedChange={() => toggleHP(hp.id)}
                      />
                      <Label
                        htmlFor={`hp-${hp.id}`}
                        className="flex-1 cursor-pointer"
                      >
                        {getHealthcareProviderName(hp)}
                      </Label>
                    </div>
                  );
                }}
              />
            </div>
          </div>
        </div>

        <SheetFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Tags"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
