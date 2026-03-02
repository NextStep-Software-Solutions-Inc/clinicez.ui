"use client";

import { useMemo, useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, Loader2, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatHealthcareProviderName } from "@/lib/utils/format-healthcare-provider-name";
import { addConsultationTicketHPAction } from "@/actions/consultation/consultation-ticket.action";
import { useHPs } from "@/hooks/useHP";
import { toast } from "sonner";
import type { GetPatientConsultationDetail } from "@/actions/consultation/patient-consultations.action";

type Detail = NonNullable<GetPatientConsultationDetail["data"]>;
type AppointmentRouting = NonNullable<Detail["Appointment"]>["AppointmentRouting"][number];

interface AddCoCreatorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  consultation: Detail;
  clinicUid: string;
  onCoCreatorsAdded: () => void;
}

export default function AddCoCreatorDialog({
  open,
  onOpenChange,
  consultation,
  clinicUid,
  onCoCreatorsAdded,
}: AddCoCreatorDialogProps) {
  const [isPending, startTransition] = useTransition();
  // IDs selected from appointment routing section
  const [selectedRoutingHpIds, setSelectedRoutingHpIds] = useState<number[]>([]);
  // ID selected from general HP search section
  const [selectedSearchHpId, setSelectedSearchHpId] = useState<number | null>(null);

  const { data: allHps, isLoading: loadingHps } = useHPs({ clinicUid }, open);

  const existingHpIds = useMemo(
    () => consultation.ConsultationTicketHPs.map((h) => h.HealthCareProvider.id),
    [consultation.ConsultationTicketHPs]
  );

  // Appointment routing records excluding HPs already in the consultation
  const routings: AppointmentRouting[] = useMemo(() => {
    return (consultation.Appointment?.AppointmentRouting ?? []).filter(
      (r) => !existingHpIds.includes(r.RoutedTo.id)
    );
  }, [consultation.Appointment?.AppointmentRouting, existingHpIds]);

  // Clinic HPs excluding those already in consultation and those shown in routing section
  const routingHpIds = useMemo(
    () => routings.map((r) => r.RoutedTo.id),
    [routings]
  );
  const searchableHps = useMemo(() => {
    const list = allHps ?? [];
    return list.filter(
      (hp) => !existingHpIds.includes(hp.id) && !routingHpIds.includes(hp.id)
    );
  }, [allHps, existingHpIds, routingHpIds]);

  const toggleRoutingHp = (hpId: number) => {
    setSelectedRoutingHpIds((prev) =>
      prev.includes(hpId) ? prev.filter((id) => id !== hpId) : [...prev, hpId]
    );
  };

  const handleClose = (value: boolean) => {
    if (!isPending) {
      onOpenChange(value);
      if (!value) {
        setSelectedRoutingHpIds([]);
        setSelectedSearchHpId(null);
      }
    }
  };

  const allSelectedIds = useMemo(() => {
    const ids = [...selectedRoutingHpIds];
    if (selectedSearchHpId !== null) ids.push(selectedSearchHpId);
    return ids;
  }, [selectedRoutingHpIds, selectedSearchHpId]);

  const handleSubmit = () => {
    if (allSelectedIds.length === 0) {
      toast.error("Select at least one healthcare provider");
      return;
    }

    startTransition(async () => {
      const results = await Promise.allSettled(
        allSelectedIds.map((hpId) =>
          addConsultationTicketHPAction({ consultationId: consultation.id, hpId, clinicUid })
        )
      );

      const failures = results.filter(
        (r) => r.status === "rejected" || (r.status === "fulfilled" && r.value?.status !== true)
      );
      if (failures.length > 0) {
        toast.error(`Failed to add ${failures.length} provider(s). Please try again.`);
      }
      const successes = results.filter((r) => r.status === "fulfilled" && r.value?.status);
      if (successes.length > 0) {
        toast.success(`Added ${successes.length} co-creator(s) successfully`);
        handleClose(false);
        onCoCreatorsAdded();
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Co-creator</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* ── Appointment routing HPs ── */}
          {routings.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Assigned to this appointment</p>
              <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2.5 space-y-2">
                {routings.map((routing) => {
                  const hp = routing.RoutedTo;
                  const isDeclined = routing.status === "DECLINED";
                  const isAccepted = routing.status === "ACCEPTED";
                  const displayName = formatHealthcareProviderName({
                    hpProfile: hp.HPProfile ?? undefined,
                    user: hp.User,
                  });
                  const isChecked = selectedRoutingHpIds.includes(hp.id);
                  return (
                    <div key={hp.id} className="flex items-center gap-2.5">
                      <Checkbox
                        id={`add-cocreator-routing-${hp.id}`}
                        checked={isChecked}
                        disabled={isDeclined || isPending}
                        onCheckedChange={() => toggleRoutingHp(hp.id)}
                      />
                      <label
                        htmlFor={`add-cocreator-routing-${hp.id}`}
                        className={cn(
                          "flex items-center gap-2 text-sm flex-1 min-w-0",
                          isDeclined ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                        )}
                      >
                        <span className="truncate">{displayName}</span>
                        {hp.HPType?.name && (
                          <span className="text-xs text-muted-foreground shrink-0">
                            ({hp.HPType.name})
                          </span>
                        )}
                      </label>
                      <Badge
                        variant={
                          isAccepted ? "default" : isDeclined ? "destructive" : "secondary"
                        }
                        className="ml-auto text-xs shrink-0"
                      >
                        {routing.status}
                      </Badge>
                    </div>
                  );
                })}
              </div>
              {searchableHps.length > 0 && <Separator />}
            </div>
          )}

          {/* ── General HP search ── */}
          {(routings.length === 0 || searchableHps.length > 0) && (
            <div className="space-y-2">
              {routings.length > 0 && (
                <p className="text-sm font-medium">Other providers</p>
              )}
              <Command shouldFilter>
                <CommandInput placeholder="Search healthcare providers..." />
                <CommandList>
                  {loadingHps ? (
                    <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading providers...
                    </div>
                  ) : (
                    <>
                      <CommandEmpty>No providers found</CommandEmpty>
                      <CommandGroup>
                        {searchableHps.map((hp) => {
                          const hpDisplayName = formatHealthcareProviderName({
                            hpProfile: hp.HPProfile ?? undefined,
                            user: hp.User,
                          });
                          return (
                          <CommandItem
                            key={hp.id}
                            value={`${hp.HPProfile?.title ?? ""} ${hp.HPProfile?.name ?? ""} ${hp.HPProfile?.suffix ?? ""} ${hp.HPType?.name ?? ""}`}
                            onSelect={() =>
                              setSelectedSearchHpId((prev) =>
                                prev === hp.id ? null : hp.id
                              )
                            }
                            className="flex items-center justify-between"
                          >
                            <div className="flex flex-col text-left">
                              <span className="text-sm font-medium">
                                {hpDisplayName}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {hp.HPType?.name}
                                {hp.HPProfile?.specialties?.length
                                  ? ` • ${hp.HPProfile.specialties.join(", ")}`
                                  : ""}
                              </span>
                            </div>
                            {selectedSearchHpId === hp.id && (
                              <Check className="h-4 w-4 text-primary shrink-0" />
                            )}
                          </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    </>
                  )}
                </CommandList>
              </Command>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleClose(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={allSelectedIds.length === 0 || isPending}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <UserPlus className="h-4 w-4 mr-1.5" />
                Add Co-creator{allSelectedIds.length > 1 ? "s" : ""}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
