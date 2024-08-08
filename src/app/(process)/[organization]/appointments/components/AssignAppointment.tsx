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


interface AssignAppointmentProps {
  disabled?: boolean;
  onAssigned?: () => void;
  appointmentId: number;
}
export default function AssignAppointment({disabled = false, appointmentId, onAssigned}: AssignAppointmentProps) {
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const {data: hps } = useHPs();

  const healthcareProviders = (hps ?? []).map(hp => {
    return {
      id: hp.id,
      name: hp.type === "DOCTOR" ? `${hp.DoctorProfile?.title} ${hp.DoctorProfile?.name} ${hp.DoctorProfile?.suffix}` : hp.type === "NURSE" && `${hp.NurseProfile?.title} ${hp.NurseProfile?.name} ${hp.NurseProfile?.suffix}`,
      role: hp.type,
      avatar: hp.DoctorProfile?.picture,
      email: hp.User?.email
    }
  })
  
  const action = async (formData: FormData) => {
    formData.append("routedTo", selectedHp?.email ?? "");
    formData.append("appointmentId", appointmentId.toString());

    toast.promise(assignAppointmentAction(formData), {
      loading: "Assigning...",
      success: (res) => {
        if(res.status) {
          return `Assigned successfully to ${selectedHp?.name}`
        }
        return "Something went wrong"
      },
      error: "Failed to assign"
    });
  }

  const [open, setOpen] = React.useState(false)
  const [selectedHp, setSelectedHp] = React.useState<(typeof healthcareProviders)[number] | null>(
    null
  )
  
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
        <p>
          Assign this appointment to a healthcare provider.
        </p>
        <form 
          action={action}
          id="consultation-record-form"
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
                  <CommandInput placeholder="Type name or search..." />
                  <CommandList >
                    <CommandEmpty>No results found.</CommandEmpty>
                    <CommandGroup heading="Doctor">
                      <Each
                        of={healthcareProviders}
                        render={(hp) => (
                          <CommandItem
                            value={hp.email}
                            onSelect={(val) => setSelectedHp(prev => healthcareProviders.find(hp => hp.email === val) || null)}
                          >
                            <User className="mr-2 h-4 w-4" />
                            <span>{hp.name}</span>
                          </CommandItem>
                        )}
                      />
                    </CommandGroup>
                    <CommandSeparator />
                    <CommandGroup heading="Nurse">
                      <Each
                        of={healthcareProviders}
                        render={(hp) => (
                          <CommandItem 
                            value={hp.email}
                            onSelect={(val) => setSelectedHp(prev => healthcareProviders.find(hp => hp.email === val) || null)}
                          >
                            <User className="mr-2 h-4 w-4" />
                            <span>{hp.name}</span>
                          </CommandItem>
                        )}
                      />
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <ActionButton form="consultation-record-form" type="submit" variant="default">
            Assign
          </ActionButton>
        </form>
      </PopoverContent>
    </Popover>
  );
}
