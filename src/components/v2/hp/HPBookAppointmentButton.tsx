"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { Building2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { self } from "@/services/request";
import type { HPClinic } from "@/actions/hp/hp-clinics.action";

interface HPBookAppointmentButtonProps {
  hpId: number;
  hpName?: string;
  className?: string;
}

export function HPBookAppointmentButton({ hpId, hpName, className }: HPBookAppointmentButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const { data: clinics, isLoading, error } = useSWR<HPClinic[]>(
    hpId ? `/api/hps/${hpId}/clinics` : null,
    (url: string) =>
      self.get<HPClinic[]>(url).then((data) => {
        if (!Array.isArray(data)) throw new Error(`Failed to fetch clinics for HP #${hpId}`);
        return data;
      }),
    { revalidateOnFocus: false }
  );

  const accessibleClinics = clinics ?? [];
  const hasClinics = accessibleClinics.length > 0;
  const isSingleClinic = accessibleClinics.length === 1;

  const navigateToBooking = (clinicUid: string) => {
    router.push(`/v2/book-appointment?clinic=${clinicUid}&hp=${hpId}`);
  };

  const handleClick = () => {
    if (isLoading || error || !hasClinics) return;

    if (isSingleClinic) {
      navigateToBooking(accessibleClinics[0].clinicUid);
      return;
    }

    setOpen(true);
  };

  const buttonLabel = isLoading
    ? "Loading..."
    : !hasClinics && !isLoading
      ? "No Clinic Available"
      : "Book Appointment";

  const isDisabled = isLoading || (!isLoading && !hasClinics);

  return (
    <>
      <Button
        variant="outline"
        className={`w-full justify-center text-sm sm:text-base ${className ?? ""}`}
        onClick={handleClick}
        disabled={isDisabled}
        aria-label={hpName ? `Book appointment with ${hpName}` : "Book appointment"}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading...
          </>
        ) : buttonLabel}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>Select a Clinic</DialogTitle>
            <DialogDescription>
              {hpName
                ? `${hpName} is available at multiple clinics. Select one to book.`
                : "This provider is available at multiple clinics. Select one to book."}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2 space-y-2">
            {accessibleClinics.map((clinic) => (
              <button
                key={clinic.clinicUid}
                onClick={() => {
                  setOpen(false);
                  navigateToBooking(clinic.clinicUid);
                }}
                className="flex w-full items-center gap-3 rounded-xl border border-border bg-background px-4 py-3 text-left text-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-v2"
              >
                <Building2 className="h-5 w-5 shrink-0 text-muted-foreground" />
                <span className="flex-1 font-medium">{clinic.name}</span>
                {clinic.isPublic && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                    Public
                  </span>
                )}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
