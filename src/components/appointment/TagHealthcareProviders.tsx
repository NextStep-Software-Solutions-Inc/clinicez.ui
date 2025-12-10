"use client";

import React from "react";
import { useAtom } from "jotai";
import { bookAppointmentAtom } from "@state/book-appointment";
import BackSubmitAndNext from "@components/SubmitAndNext";
import { useParams } from "next/navigation";
import { useHPs } from "@hooks/useHP";
import { Badge } from "@components/ui/badge";
import { X } from "lucide-react";
import { Checkbox } from "@components/ui/checkbox";
import { Label } from "@components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@components/ui/alert";
import { Info } from "lucide-react";
import Each from "@components/utils/Each";
import { getHealthcareProviderName } from "@/lib/hp-utils";

interface TagHealthcareProvidersProps {
  nextStep?: () => void;
  prevStep?: () => void;
  isFirstStep?: boolean;
  isLastStep?: boolean;
}

export default function TagHealthcareProviders({
  nextStep,
  prevStep,
  isFirstStep,
  isLastStep,
}: TagHealthcareProvidersProps) {
  const [bookAppointmentForm, setBookAppointmentForm] = useAtom(bookAppointmentAtom);
  const params = useParams<{ clinicUid: string }>();
  const { data: clinicHPs } = useHPs({ clinicUid: params.clinicUid });

  const handleNext = () => {
    nextStep?.();
  };

  const toggleHP = (hpId: number) => {
    setBookAppointmentForm((prev) => {
      const currentTaggedHpIds = prev.taggedHpIds ?? [];
      const isSelected = currentTaggedHpIds.includes(hpId);
      
      return {
        ...prev,
        taggedHpIds: isSelected
          ? currentTaggedHpIds.filter((id) => id !== hpId)
          : [...currentTaggedHpIds, hpId],
      };
    });
  };

  const removeHP = (hpId: number) => {
    setBookAppointmentForm((prev) => ({
      ...prev,
      taggedHpIds: (prev.taggedHpIds ?? []).filter((id) => id !== hpId),
    }));
  };

  const getHPName = (hp: NonNullable<typeof clinicHPs>[number]) => {
    const title = hp.HPProfile?.title ?? "";
    const name = hp.HPProfile?.name ?? "";
    const suffix = hp.HPProfile?.suffix ?? "";
    const profName = `${title} ${name} ${suffix}`.replace(/\s+/g, " ").trim();
    if (profName) return profName;

    const firstName = hp.User?.firstName ?? "";
    const middleName = hp.User?.middleName ?? "";
    const lastName = hp.User?.lastName ?? "";
    const userSuffix = hp.User?.suffix ?? "";
    const userName = `${firstName} ${middleName} ${lastName} ${userSuffix}`
      .replace(/\s+/g, " ")
      .trim();
    return userName || "Unknown";
  };

  const selectedTaggedHpIds = bookAppointmentForm.taggedHpIds ?? [];
  const selectedHPs = (clinicHPs ?? []).filter((hp) =>
    selectedTaggedHpIds.includes(hp.id)
  );

  return (
    <div className="shadow-lg w-full p-8 bg-white rounded-md">
      <h5 className="text-lg font-semibold">Tag Healthcare Providers (Optional)</h5>
      <Alert className="my-5 bg-blue-50 border-blue-200">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertTitle className="text-blue-900">Informational Only</AlertTitle>
        <AlertDescription className="text-blue-800">
          Tagged healthcare providers will be listed for informational purposes only.
          This does NOT assign them to the appointment, trigger notifications, or create
          any workflow responsibilities. Only assigned providers can take action on
          appointments.
        </AlertDescription>
      </Alert>

      <div className="my-5">
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

      <div className="my-5">
        <h6 className="text-sm font-semibold mb-3">Available Healthcare Providers:</h6>
        <div className="overflow-y-auto max-h-[calc(40dvh)] space-y-2 border rounded-md p-3">
          <Each
            of={clinicHPs ?? []}
            fallback={<p className="text-sm text-muted-foreground">No healthcare providers available.</p>}
            render={(hp) => {
              const isSelected = selectedTaggedHpIds.includes(hp.id);
              const isPrimaryHP = hp.id === bookAppointmentForm.hpId;
              
              return (
                <div
                  key={hp.id}
                  className="flex items-center space-x-2 p-2 hover:bg-accent rounded-md"
                >
                  <Checkbox
                    id={`hp-${hp.id}`}
                    checked={isSelected}
                    onCheckedChange={() => toggleHP(hp.id)}
                    disabled={isPrimaryHP}
                  />
                  <Label
                    htmlFor={`hp-${hp.id}`}
                    className={`flex-1 cursor-pointer ${
                      isPrimaryHP ? "opacity-50" : ""
                    }`}
                  >
                    {getHealthcareProviderName(hp)}
                    {isPrimaryHP && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        Preferred HP
                      </Badge>
                    )}
                  </Label>
                </div>
              );
            }}
          />
        </div>
      </div>

      <BackSubmitAndNext
        labels={{
          next: "Continue",
          previous: "Back",
        }}
        disabled={{
          previous: isFirstStep,
          next: isLastStep,
        }}
        actions={{
          next: handleNext,
          previous: prevStep,
        }}
      />
    </div>
  );
}
