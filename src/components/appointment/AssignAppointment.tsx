"use client";

import { promiseWrapper } from "@/lib/with-error-handling";
import { assignAppointmentAction } from "@actions/appointments/appointment-routing.action";
import { GetAppointment } from "@actions/appointments/appointments.action";
import ActionButton from "@components/ActionButton";
import { Button } from "@components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut } from "@components/ui/command";
import { Label } from "@components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@components/ui/tooltip";
import Each from "@components/utils/Each";
import { useHPs } from "@hooks/useHP";
import { User, UserCheck, UserPlus } from "lucide-react";
import React, { useEffect, useMemo } from "react";
import { toast } from "sonner";

type HealthcareProvider = {
  id: number;
  name: string;
  hpTypeId: string;
  avatar?: string | null;
}
interface AssignAppointmentProps {
  disabled?: boolean;
  onAssigned?: () => void;
  appointment: NonNullable<GetAppointment["data"]>;
}

export default function AssignAppointment({disabled = false, appointment, onAssigned}: AssignAppointmentProps) {
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const [selectedHp, setSelectedHp] = React.useState<HealthcareProvider | null>(null);
  const [open, setOpen] = React.useState(false)
  const {data: hps } = useHPs();

  const healthcareProviders = (hps ?? []).reduce((acc, hp) => {
    const hpTypeName = hp.HPType.name;
    if (!acc[hpTypeName]) {
      acc[hpTypeName] = [];
    }

    const skip = appointment.AppointmentRouting.some(a => 
      a.RoutedTo.hpTypeId === hp.hpTypeId && 
      (["PENDING", "ACCEPTED"].includes(a.status) || 
      (["CANCELLED", "DECLINED"].includes(a.status) && Number(a.RoutedTo.id) === hp.id))
    );

    if(skip) return acc

    acc[hpTypeName].push({
      id: hp.id,
      name: `${hp.HPProfile?.title || hp.User.firstName} ${hp.HPProfile?.name || hp.User.lastName} ${hp.HPProfile?.suffix || hp.User.suffix || ""}`,
      hpTypeId: hp.hpTypeId.toString(),
      avatar: hp.HPProfile?.picture,
    });

    return acc;
  }, {} as Record<string, HealthcareProvider[]>);

  const action = async () => {
    
    if (!selectedHp) return;

    const payload = {
      routedTo: selectedHp.id,
      appointmentId: appointment.id,
    }
  
    toast.promise(promiseWrapper(assignAppointmentAction)(payload), {
      loading: "Assigning appointment...",
      success: (res) => {
        onAssigned?.()
        return res.message
      },
      error:error => error
    });
  }

  const defaultHp = useMemo(() => (hps ?? []).find(hp => hp.id === appointment.AppointmentAttribute?.PreferredAppointee?.id) ?? null, [hps, appointment.AppointmentAttribute?.PreferredAppointee?.id])
  
  useEffect(() => {
    if(defaultHp) {
      setSelectedHp({
        id: defaultHp.id,
        name: `${defaultHp.HPProfile?.title || defaultHp.User.firstName} ${defaultHp.HPProfile?.name || defaultHp.User.lastName} ${defaultHp.HPProfile?.suffix || defaultHp.User.suffix || ""}`,
        hpTypeId: defaultHp.hpTypeId.toString(),
        avatar: defaultHp.HPProfile?.picture,
      })
    }
  }, [defaultHp])

  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild ref={triggerRef}>
            <Button variant="ghost" size="icon" disabled={disabled}>
              <UserPlus className="h-4 w-4" />
              <span className="sr-only">Assign</span>
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>Assign</TooltipContent>
      </Tooltip>
      <PopoverContent className="w-full">
        <p>Assign this appointment to a healthcare provider.</p>
        <form 
          action={action}
          id="assign-appointment-form"
          className="grid gap-4 py-4"
        >
          <div className="grid grid-cols-4 items-baseline gap-4">
            <Label htmlFor="assignee" className="text-right">
              Assignee
            </Label>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm" 
                  className="col-span-3 justify-start"
                >
                  {selectedHp ? (
                    <>
                      <User className="mr-2 h-4 w-4" />
                      {selectedHp.name}
                    </>
                  ) : (
                    <>Select Healthcare Provider</>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0" side="right" align="start">
                <Command className="rounded-lg border shadow-md">
                  <CommandInput placeholder="Type name or search..."  />
                  <CommandList>
                    <CommandEmpty>No results found.</CommandEmpty>
                    <Each
                      of={Object.keys(healthcareProviders)}
                      render={(role, index) => {
                        return (
                          <>
                            <CommandGroup className="capitalize" heading={role.split("_").join(" ").toLocaleLowerCase()} key={role}>
                              <Each
                                of={healthcareProviders[role]}
                                fallback={<p className="text-xs text-muted-foreground text-center">Already assigned or not available</p>}
                                render={(hp) => (
                                  <CommandItem
                                    value={hp.id.toString()}
                                    onSelect={(val) => setSelectedHp(prev => healthcareProviders[role].find(hp => hp.id.toString() === val) || null)}
                                  >
                                    <User className="mr-2 h-4 w-4" />
                                    <span>{hp.name}</span>
                                  </CommandItem>
                                )}
                              />
                            </CommandGroup>
                            {index !== (healthcareProviders[role].length -1) && <CommandSeparator />}
                          </>
                        )
                      }} 
                    />
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <ActionButton disabled={!selectedHp?.id} form="assign-appointment-form" type="submit" variant="default">
            Assign
          </ActionButton>
        </form>
      </PopoverContent>
    </Popover>
  );
}
