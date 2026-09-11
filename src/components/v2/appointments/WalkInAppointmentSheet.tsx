"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, Stethoscope, Search, X, ExternalLink } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { createWalkInAppointmentAction } from "@/actions/appointments/appointments.action";
import { getClinicPatientsAction, type GetClinicPatientsResult } from "@/actions/clinics/clinic-patient.action";
import type { GetAppointmentModes } from "@/actions/appointments/appointment-mode.action";
import type { GetAppointmentTypes } from "@/actions/appointments/appointment-type.action";
import type { GetClinicServiceCategories } from "@/actions/clinics/clinic-service-category.action";
import type { GetHPsType } from "@/actions/hp.actions";
import type { GetSystems } from "@/actions/system.action";

/** Delay before closing the dropdown (allows click events to fire before blur) */
const DROPDOWN_CLOSE_DELAY = 150;

type PatientResult = GetClinicPatientsResult["data"][number];

interface WalkInAppointmentSheetProps {
  open: boolean;
  clinicUid: string;
  modes: GetAppointmentModes;
  types: GetAppointmentTypes;
  serviceCategories: GetClinicServiceCategories;
  systems: NonNullable<GetSystems>;
  hps: GetHPsType;
  onClose: () => void;
  onSuccess: () => void;
}

export function WalkInAppointmentSheet({
  open,
  clinicUid,
  modes,
  types,
  serviceCategories,
  systems,
  hps,
  onClose,
  onSuccess,
}: WalkInAppointmentSheetProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  // Patient search state
  const [patientQuery, setPatientQuery] = useState("");
  const [patientResults, setPatientResults] = useState<PatientResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientResult | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  // For unregistered walk-ins when no patient found
  const [unregisteredName, setUnregisteredName] = useState("");
  const [noPatientFound, setNoPatientFound] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Form fields
  const [subject, setSubject] = useState("");
  const [complaint, setComplaint] = useState("");
  const [modeId, setModeId] = useState<string>("");
  const [typeId, setTypeId] = useState<string>("");
  const [serviceId, setServiceId] = useState<string>("");
  const [systemId, setSystemId] = useState<string>("");
  const [hpId, setHpId] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [timeStart, setTimeStart] = useState<string>("");
  const [timeEnd, setTimeEnd] = useState<string>("");

  const reset = () => {
    setPatientQuery("");
    setPatientResults([]);
    setSelectedPatient(null);
    setUnregisteredName("");
    setNoPatientFound(false);
    setShowDropdown(false);
    setSubject("");
    setComplaint("");
    setModeId("");
    setTypeId("");
    setServiceId("");
    setSystemId("");
    setHpId("");
    setDate("");
    setTimeStart("");
    setTimeEnd("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  // Debounced patient search
  const searchPatients = useCallback(
    (query: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (!query.trim()) {
        setPatientResults([]);
        setNoPatientFound(false);
        setShowDropdown(false);
        return;
      }
      debounceRef.current = setTimeout(async () => {
        setIsSearching(true);
        try {
          const result = await getClinicPatientsAction({ clinicUid, search: query.trim(), pageSize: 8 });
          setPatientResults(result.data ?? []);
          setNoPatientFound((result.data ?? []).length === 0);
          setShowDropdown(true);
        } catch {
          setPatientResults([]);
          setNoPatientFound(false);
        } finally {
          setIsSearching(false);
        }
      }, 300);
    },
    [clinicUid]
  );

  const handlePatientQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setPatientQuery(q);
    setSelectedPatient(null);
    setUnregisteredName("");
    setNoPatientFound(false);
    searchPatients(q);
  };

  const handleSelectPatient = (patient: PatientResult) => {
    setSelectedPatient(patient);
    setPatientQuery(
      `${patient.Patient.firstName} ${patient.Patient.lastName}`.trim()
    );
    setShowDropdown(false);
    setNoPatientFound(false);
    setUnregisteredName("");
  };

  const handleClearPatient = () => {
    setSelectedPatient(null);
    setPatientQuery("");
    setNoPatientFound(false);
    setUnregisteredName("");
    setShowDropdown(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient && !unregisteredName.trim()) {
      toast.error("Please search and select a patient or enter an unregistered patient name.");
      return;
    }
    if (!subject.trim()) {
      toast.error("Subject / reason for visit is required.");
      return;
    }
    if (!complaint.trim()) {
      toast.error("Chief complaint is required.");
      return;
    }
    if (!modeId || !typeId || !serviceId) {
      toast.error("Please fill in appointment mode, type, and service.");
      return;
    }

    setIsPending(true);
    const result = await createWalkInAppointmentAction({
      clinicUid,
      patientId: selectedPatient?.Patient.userId ?? undefined,
      patientName: selectedPatient ? undefined : unregisteredName.trim(),
      subject: subject.trim(),
      complaint: complaint.trim(),
      modeId: parseInt(modeId),
      typeId: parseInt(typeId),
      serviceId: parseInt(serviceId),
      systemId: systemId ? parseInt(systemId) : undefined,
      hpId: hpId ? parseInt(hpId) : undefined,
      date: date ? (() => { const [y, m, d] = date.split("-").map(Number); return new Date(y, m - 1, d); })() : undefined,
      timeStart: timeStart || undefined,
      timeEnd: timeEnd || undefined,
    });
    setIsPending(false);

    if (result.status) {
      toast.success(result.message);
      reset();
      onSuccess();
    } else {
      toast.error(result.message);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && handleClose()}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto" side="right">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Walk-In Appointment
          </SheetTitle>
          <SheetDescription>
            Search for a registered clinic patient or create for an unregistered walk-in.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* ── Patient Search ─────────────────────────────────────────────── */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">
              Patient <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  value={patientQuery}
                  onChange={handlePatientQueryChange}
                  onFocus={() => patientResults.length > 0 && setShowDropdown(true)}
                  onBlur={(e) => {
                    if (dropdownRef.current?.contains(e.relatedTarget as Node)) return;
                    setTimeout(() => setShowDropdown(false), DROPDOWN_CLOSE_DELAY);
                  }}
                  placeholder="Search by name, email, student ID, employee ID..."
                  className="pl-8 pr-8"
                  autoFocus
                  disabled={!!selectedPatient}
                />
                {(patientQuery || selectedPatient) && (
                  <button
                    type="button"
                    className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                    onClick={handleClearPatient}
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Search dropdown */}
              {showDropdown && !selectedPatient && (
                <div
                  ref={dropdownRef}
                  className="absolute z-50 w-full mt-1 rounded-lg border bg-popover shadow-lg overflow-hidden"
                  onBlur={(e) => {
                    if (!dropdownRef.current?.contains(e.relatedTarget as Node)) {
                      setShowDropdown(false);
                    }
                  }}
                >
                  {isSearching ? (
                    <div className="px-3 py-4 text-sm text-muted-foreground text-center">
                      Searching...
                    </div>
                  ) : patientResults.length > 0 ? (
                    <ul className="max-h-52 overflow-y-auto divide-y divide-border/30">
                      {patientResults.map((p) => {
                        const sid = p.Patient.StudentRecords?.[0]?.studentId;
                        const eid = p.Patient.UserEmployments?.[0]?.employeeId;
                        return (
                          <li key={p.id}>
                            <button
                              type="button"
                              className="w-full px-3 py-2.5 text-left hover:bg-muted/50 transition-colors"
                              onMouseDown={() => handleSelectPatient(p)}
                            >
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-sm font-medium">
                                  {p.Patient.firstName} {p.Patient.lastName}
                                </p>
                                {sid && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                    STU: {sid}
                                  </span>
                                )}
                                {eid && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                                    EMP: {eid}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">{p.Patient.email}</p>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  ) : noPatientFound ? (
                    <div className="px-3 py-3 space-y-2">
                      <p className="text-sm text-muted-foreground">No registered patients found.</p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full gap-1.5 text-xs"
                        onClick={() => router.push(`/v2/clinic/${clinicUid}/patients?addPatient=1`)}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Add New Patient
                      </Button>
                      <div className="border-t pt-2">
                        <p className="text-xs text-muted-foreground mb-1">Or enter name for unregistered walk-in:</p>
                        <Input
                          value={unregisteredName}
                          onChange={(e) => setUnregisteredName(e.target.value)}
                          placeholder="Full name of walk-in patient"
                          className="h-8 text-sm"
                        />
                        {unregisteredName.trim() && (
                          <Button
                            type="button"
                            size="sm"
                            className="w-full mt-1.5 h-7 text-xs"
                            onClick={() => {
                              setPatientQuery(unregisteredName.trim());
                              setShowDropdown(false);
                            }}
                          >
                            Use &ldquo;{unregisteredName.trim()}&rdquo;
                          </Button>
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            {/* Show selection confirmation */}
            {selectedPatient && (
              <p className="text-xs text-teal-700 dark:text-teal-400">
                ✓ Registered patient: {selectedPatient.Patient.firstName} {selectedPatient.Patient.lastName}
                {selectedPatient.Patient.StudentRecords?.[0]?.studentId && ` (STU: ${selectedPatient.Patient.StudentRecords[0].studentId})`}
                {selectedPatient.Patient.UserEmployments?.[0]?.employeeId && ` (EMP: ${selectedPatient.Patient.UserEmployments[0].employeeId})`}
              </p>
            )}
            {!selectedPatient && unregisteredName && !showDropdown && (
              <p className="text-xs text-muted-foreground">
                Walk-in (unregistered): {unregisteredName}
              </p>
            )}
          </div>

          {/* ── Subject / Reason for Visit ─────────────────────────────────── */}
          <div className="space-y-1.5">
            <Label htmlFor="subject" className="text-xs font-medium">
              Subject / Reason for Visit <span className="text-destructive">*</span>
            </Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Routine check-up, Follow-up..."
            />
          </div>

          {/* ── Chief Complaint ────────────────────────────────────────────── */}
          <div className="space-y-1.5">
            <Label htmlFor="complaint" className="text-xs font-medium">
              Chief Complaint <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="complaint"
              value={complaint}
              onChange={(e) => setComplaint(e.target.value)}
              placeholder="Describe the main reason for the visit..."
              rows={2}
              className="resize-none"
            />
          </div>

          {/* ── Mode ──────────────────────────────────────────────────────── */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">
              Appointment Mode <span className="text-destructive">*</span>
            </Label>
            <Select value={modeId} onValueChange={setModeId}>
              <SelectTrigger><SelectValue placeholder="Select mode" /></SelectTrigger>
              <SelectContent>
                {modes.map((mode) => (
                  <SelectItem key={mode.id} value={String(mode.id)}>{mode.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* ── Type ──────────────────────────────────────────────────────── */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">
              Appointment Type <span className="text-destructive">*</span>
            </Label>
            <Select value={typeId} onValueChange={setTypeId}>
              <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
              <SelectContent>
                {types.map((type) => (
                  <SelectItem key={type.id} value={String(type.id)}>{type.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* ── Service ───────────────────────────────────────────────────── */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">
              Service <span className="text-destructive">*</span>
            </Label>
            <Select value={serviceId} onValueChange={setServiceId}>
              <SelectTrigger><SelectValue placeholder="Select service" /></SelectTrigger>
              <SelectContent>
                {serviceCategories.map((category) => (
                  <SelectGroup key={category.id}>
                    <SelectLabel>{category.name}</SelectLabel>
                    {category.Services.map((service) => (
                      <SelectItem key={service.id} value={String(service.id)}>{service.name}</SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* ── System / Department ───────────────────────────────────────── */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">
              System / Department <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Select value={systemId} onValueChange={setSystemId}>
              <SelectTrigger><SelectValue placeholder="Select system / department (optional)" /></SelectTrigger>
              <SelectContent>
                {systems.map((system) => (
                  <SelectItem key={system.id} value={String(system.id)}>{system.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* ── Assign Healthcare Provider (optional) ───────────────────────────────────── */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">
              Assign Healthcare Provider <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Select value={hpId} onValueChange={setHpId}>
              <SelectTrigger><SelectValue placeholder="Select doctor (optional)" /></SelectTrigger>
              <SelectContent>
                {hps.map((hp) => {
                  const name = hp.HPProfile?.name ?? `${hp.User.firstName ?? ""} ${hp.User.lastName ?? ""}`.trim();
                  return (
                    <SelectItem key={hp.id} value={String(hp.id)}>
                      <span className="flex items-center gap-1.5">
                        <Stethoscope className="h-3.5 w-3.5 text-muted-foreground" />
                        {hp.HPProfile?.title ? `${hp.HPProfile.title} ` : ""}{name}
                        {hp.HPType?.name && <span className="text-muted-foreground text-xs">· {hp.HPType.name}</span>}
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* ── Date ──────────────────────────────────────────────────────── */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Schedule Date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          {/* ── Time ──────────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Time Start</Label>
              <Input type="time" value={timeStart} onChange={(e) => setTimeStart(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Time End</Label>
              <Input type="time" value={timeEnd} onChange={(e) => setTimeEnd(e.target.value)} />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={handleClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1 bg-primary/90 hover:bg-primary" disabled={isPending}>
              {isPending ? "Creating..." : "Create Walk-In"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
