"use client";

import React, { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { useHPs } from "@hooks/useHP";
import { Badge } from "@components/ui/badge";
import { X, Tag, Search } from "lucide-react";
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
import { Input } from "@components/ui/input";
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
  const [searchQuery, setSearchQuery] = useState("");

  // Filter HPs based on search query
  const filteredHPs = useMemo(() => {
    if (!clinicHPs) return [];
    if (!searchQuery.trim()) return clinicHPs;

    const query = searchQuery.toLowerCase();
    return clinicHPs.filter((hp) => {
      const name = getHealthcareProviderName(hp).toLowerCase();
      const role = hp.HPType?.name?.toLowerCase() || "";
      const specialties = (hp.HPProfile?.specialties || []).map(s => s.toLowerCase()).join(" ");
      
      return (
        name.includes(query) ||
        role.includes(query) ||
        specialties.includes(query)
      );
    });
  }, [clinicHPs, searchQuery]);

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
                      className="flex items-center gap-1 py-1.5 px-2"
                    >
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{getHealthcareProviderName(hp)}</span>
                        <span className="text-xs text-muted-foreground">
                          {hp.HPType?.name}
                          {hp.HPProfile?.specialties && hp.HPProfile.specialties.length > 0 && 
                            ` • ${hp.HPProfile.specialties.join(", ")}`
                          }
                        </span>
                      </div>
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
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by name, role, or specialty..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="space-y-2 border rounded-md p-3 max-h-[400px] overflow-y-auto">
              <Each
                of={filteredHPs}
                fallback={
                  <p className="text-sm text-muted-foreground">
                    {searchQuery ? "No matching healthcare providers found." : "No healthcare providers available."}
                  </p>
                }
                render={(hp) => {
                  const isSelected = selectedHPIds.includes(hp.id);

                  return (
                    <div
                      key={hp.id}
                      className="flex items-start space-x-2 p-2 hover:bg-accent rounded-md"
                    >
                      <Checkbox
                        id={`hp-${hp.id}`}
                        checked={isSelected}
                        onCheckedChange={() => toggleHP(hp.id)}
                        className="mt-1"
                      />
                      <Label
                        htmlFor={`hp-${hp.id}`}
                        className="flex-1 cursor-pointer"
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">{getHealthcareProviderName(hp)}</span>
                          <span className="text-xs text-muted-foreground">
                            {hp.HPType?.name}
                            {hp.HPProfile?.specialties && hp.HPProfile.specialties.length > 0 && 
                              ` • ${hp.HPProfile.specialties.join(", ")}`
                            }
                          </span>
                        </div>
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
