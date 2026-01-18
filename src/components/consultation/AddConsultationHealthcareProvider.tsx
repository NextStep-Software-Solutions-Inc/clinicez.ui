"use client";

import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { addConsultationTicketHPAction } from "@actions/consultation/consultation-ticket.action";
import { useHPs } from "@/hooks/useHP";
import { toast } from "sonner";
import { AlertTriangle, Check, Loader2, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";

interface AddConsultationHealthcareProviderProps {
    consultationId: number;
    clinicUid: string;
    existingHpIds: number[];
}

export function AddConsultationHealthcareProvider({
    consultationId,
    clinicUid,
    existingHpIds,
}: AddConsultationHealthcareProviderProps) {
    const [open, setOpen] = useState(false);
    const [selectedHpId, setSelectedHpId] = useState<number | null>(null);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const { data: hps, isLoading } = useHPs({ clinicUid }, open);

    const availableProviders = useMemo(() => {
        const list = hps ?? [];
        return list.filter((hp) => !existingHpIds.includes(hp.id));
    }, [existingHpIds, hps]);

    const handleClose = (value: boolean) => {
        setOpen(value);
        if (!value) {
            setSelectedHpId(null);
        }
    };

    const handleSubmit = () => {
        if (!selectedHpId) {
            toast.error("Select a healthcare provider to continue");
            return;
        }

        startTransition(() => {
            const promise = addConsultationTicketHPAction({ consultationId, hpId: selectedHpId, clinicUid }).then((res) => {
                if (!res?.status) {
                    throw new Error(res?.message ?? "Failed to add healthcare provider to consultation");
                }
                return res;
            });

            toast.promise(
                promise,
                {
                    loading: "Adding healthcare provider...",
                    success: (res) => {
                        handleClose(false);
                        router.refresh();
                        return res?.message ?? "Healthcare provider added";
                    },
                    error: (error) => (error instanceof Error ? error.message : (error as string) ?? "Failed to add healthcare provider to consultation"),
                }
            );
        });
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 whitespace-nowrap">
                    <UserPlus className="h-4 w-4" />
                    Add Provider
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add Healthcare Provider</DialogTitle>
                </DialogHeader>
                <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                    <AlertTriangle className="h-4 w-4 mt-0.5" />
                    <div className="space-y-1">
                        <div className="font-semibold">Experimental feature</div>
                        <div>Double-check provider assignments after saving and refresh if anything looks off.</div>
                    </div>
                </div>
                <div className="space-y-3">
                    <Command shouldFilter>
                        <CommandInput placeholder="Search healthcare providers..." />
                        <CommandList>
                            {isLoading ? (
                                <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Loading providers...
                                </div>
                            ) : (
                                <>
                                    <CommandEmpty>No providers found for this clinic</CommandEmpty>
                                    <CommandGroup heading="Available Providers">
                                        {availableProviders.map((hp) => (
                                            <CommandItem
                                                key={hp.id}
                                                value={`${hp.HPProfile?.name ?? ""} ${hp.HPType?.name ?? ""}`}
                                                onSelect={() => setSelectedHpId(hp.id)}
                                                className="flex items-center justify-between"
                                            >
                                                <div className="flex flex-col text-left">
                                                    <span className="text-sm font-medium">
                                                        {hp.HPProfile?.title} {hp.HPProfile?.name} {hp.HPProfile?.suffix}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {hp.HPType?.name}
                                                        {hp.HPProfile?.specialties?.length
                                                            ? ` • ${hp.HPProfile.specialties.join(", ")}`
                                                            : ""}
                                                    </span>
                                                </div>
                                                {selectedHpId === hp.id && <Check className="h-4 w-4 text-primary" />}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </>
                            )}
                        </CommandList>
                    </Command>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => handleClose(false)} disabled={isPending}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={!selectedHpId || isPending}>
                        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add Provider"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
