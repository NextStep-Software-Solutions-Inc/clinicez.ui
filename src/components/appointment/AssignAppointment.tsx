"use client";

import { assignAppointmentAction } from "@actions/appointments/appointment-routing.action";
import ActionButton from "@components/ActionButton";
import { Button } from "@components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut } from "@components/ui/command";
import { Label } from "@components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@components/ui/tooltip";
import Each from "@components/utils/Each";
import { useHPs } from "@hooks/useHP";
import { User, UserCheck } from "lucide-react";
import React from "react";
import { toast } from "sonner";

type HealthcareProvider = {
  id: number;
  name: string;
  role: string;
  avatar?: string | null;
  email: string;
}
interface AssignAppointmentProps {
  disabled?: boolean;
  onAssigned?: () => void;
  appointmentId: number;
  preferredAppointee?: string | null;
  assigned: {
    role: string;
    email: string;
    status: string;
  }[];
}
export default function AssignAppointment({disabled = false, appointmentId, onAssigned, assigned, preferredAppointee}: AssignAppointmentProps) {
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const {data: hps } = useHPs();

  const healthcareProviders = (hps ?? []).reduce((acc, hp) => {
    const role = hp.type;
    if (!acc[role]) {
      acc[role] = [];
    }
    const skip = assigned.some(a => {
      if(a.role.toUpperCase() === role) {
        return ["PENDING", "ACCEPTED"].includes(a.status) || ["CANCELLED", "DECLINED"].includes(a.status) && a.email === hp.User?.email
      }
      return false
    })
    if(skip) return acc

    acc[role].push({
      id: hp.id,
      name: `${hp.HPProfile?.title} ${hp.HPProfile?.name} ${hp.HPProfile?.suffix}`,
      role: hp.type,
      avatar: hp.HPProfile?.picture,
      email: hp.User?.email
    });

    return acc;
  }, {} as Record<string, HealthcareProvider[]>);

  const action = async (formData: FormData) => {
    
    if (!selectedHp) return;

    formData.append("routedTo", selectedHp.email);
    formData.append("routedToRole", selectedHp.role);
    formData.append("appointmentId", appointmentId.toString());

    toast.promise(assignAppointmentAction(formData), {
      loading: "Assigning...",
      success: (res) => {
        if(res.status) {
          onAssigned?.()
          return `Assigned successfully to ${selectedHp?.name}`
        }
        return "Something went wrong"
      },
      error: "Failed to assign"
    });
  }

  const [open, setOpen] = React.useState(false)
  const defaultHp = (hps ?? []).find(hp => hp.User.email === preferredAppointee) ?? null
  
  const [selectedHp, setSelectedHp] = React.useState<(typeof healthcareProviders)[number][number] | null>({
    email: defaultHp?.User.email ?? "",
    id: defaultHp?.id ?? 0,
    name: `${defaultHp?.HPProfile?.title} ${defaultHp?.HPProfile?.name} ${defaultHp?.HPProfile?.suffix}`,
    role: defaultHp?.type ?? "",
  })
  
  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild ref={triggerRef}>
            <Button variant="ghost" size="icon" disabled={disabled}>
              <UserCheck className="h-4 w-4" />
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
                                    value={hp.email}
                                    onSelect={(val) => setSelectedHp(prev => healthcareProviders[role].find(hp => hp.email === val) || null)}
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
