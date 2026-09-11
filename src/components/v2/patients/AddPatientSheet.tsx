"use client";

import { useState, useCallback, useRef } from "react";
import { UserPlus, Search, X, User, Mail, AlertCircle, AlertTriangle, CheckCircle2, ShieldAlert, ShieldCheck, Building2 } from "lucide-react";
import dayjs from "@/lib/day-utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  addClinicPatientAction,
  searchNonClinicPatientsAction,
  createAndAddClinicPatientAction,
  type SearchNonClinicPatientsResult,
} from "@/actions/clinics/clinic-patient.action";

const DROPDOWN_CLOSE_DELAY = 150;

interface AddPatientSheetProps {
  open: boolean;
  clinicUid: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddPatientSheet({
  open,
  clinicUid,
  onClose,
  onSuccess,
}: AddPatientSheetProps) {
  // ── Tab 1: Search existing user ──────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchNonClinicPatientsResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SearchNonClinicPatientsResult | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isAddingExisting, setIsAddingExisting] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Tab 2: Create new patient ─────────────────────────────────────────────
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newGender, setNewGender] = useState<"MALE" | "FEMALE" | "">("");
  const [newDob, setNewDob] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const reset = () => {
    setSearchQuery("");
    setSearchResults([]);
    setSelectedUser(null);
    setShowDropdown(false);
    setShowConfirmDialog(false);
    setNewFirstName("");
    setNewLastName("");
    setNewEmail("");
    setNewGender("");
    setNewDob("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  // ── Debounced search ─────────────────────────────────────────────────────
  const doSearch = useCallback(
    (query: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (!query.trim()) {
        setSearchResults([]);
        setShowDropdown(false);
        return;
      }
      debounceRef.current = setTimeout(async () => {
        setIsSearching(true);
        try {
          const result = await searchNonClinicPatientsAction({ clinicUid, search: query.trim() });
          setSearchResults(result.data ?? []);
          setShowDropdown(true);
        } catch {
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      }, 300);
    },
    [clinicUid]
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setSearchQuery(q);
    setSelectedUser(null);
    doSearch(q);
  };

  const handleSelectUser = (user: SearchNonClinicPatientsResult) => {
    setSelectedUser(user);
    setSearchQuery(`${user.firstName ?? ""} ${user.lastName ?? ""}`.trim());
    setShowDropdown(false);
  };

  const handleClearUser = () => {
    setSelectedUser(null);
    setSearchQuery("");
    setShowDropdown(false);
    setSearchResults([]);
  };

  // ── Add existing user ─────────────────────────────────────────────────────
  const executeAddExisting = async () => {
    if (!selectedUser) return;
    setIsAddingExisting(true);
    const result = await addClinicPatientAction({ clinicUid, userId: selectedUser.userId });
    setIsAddingExisting(false);

    if (result.status) {
      toast.success("Patient added to clinic successfully.");
      setShowConfirmDialog(false);
      reset();
      onSuccess();
    } else {
      toast.error(result.message);
    }
  };

  const handleAddExisting = () => {
    if (!selectedUser) {
      toast.error("Please search and select a user.");
      return;
    }

    if (selectedUser.warnings && selectedUser.warnings.length > 0) {
      setShowConfirmDialog(true);
      return;
    }

    void executeAddExisting();
  };

  // ── Create new patient ────────────────────────────────────────────────────
  const handleCreateNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFirstName.trim()) { toast.error("First name is required."); return; }
    if (!newLastName.trim()) { toast.error("Last name is required."); return; }
    if (!newEmail.trim()) { toast.error("Email address is required."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail.trim())) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setIsCreating(true);
    const result = await createAndAddClinicPatientAction({
      clinicUid,
      firstName: newFirstName.trim(),
      lastName: newLastName.trim(),
      email: newEmail.trim(),
      gender: newGender ? (newGender as "MALE" | "FEMALE") : undefined,
      dob: newDob ? new Date(newDob) : undefined,
    });
    setIsCreating(false);

    if (result.status) {
      toast.success("Patient created and added to clinic successfully.");
      reset();
      onSuccess();
    } else {
      toast.error(result.message);
    }
  };

  const userInitials = (user: SearchNonClinicPatientsResult) =>
    `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase() || "U";

  const getUserDemographics = (u: SearchNonClinicPatientsResult) => {
    const parts: string[] = [];
    if (u.gender) {
      parts.push(u.gender.charAt(0).toUpperCase() + u.gender.slice(1).toLowerCase());
    }
    if (u.dob) {
      const age = dayjs().diff(dayjs(u.dob), "year");
      if (!isNaN(age) && age >= 0) parts.push(`${age} yrs old`);
    }
    if (u.mobile) {
      parts.push(u.mobile);
    }
    return parts.join(" • ");
  };

  return (
    <>
      <Sheet open={open} onOpenChange={(o) => !o && handleClose()}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto" side="right">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Add Patient
          </SheetTitle>
          <SheetDescription>
            Search for an existing ClinicEZ user or create a new patient account.
          </SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="search">
          <TabsList className="grid grid-cols-2 w-full mb-4">
            <TabsTrigger value="search">Existing User</TabsTrigger>
            <TabsTrigger value="new">New Patient</TabsTrigger>
          </TabsList>

          {/* ── Tab 1: Search existing user ─────────────────────────────── */}
          <TabsContent value="search" className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">
                Search by name or email
              </Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                  onBlur={() => setTimeout(() => setShowDropdown(false), DROPDOWN_CLOSE_DELAY)}
                  placeholder="Search by name, email, student ID, employee ID…"
                  className="pl-8 pr-8"
                  disabled={!!selectedUser}
                />
                {(searchQuery || selectedUser) && (
                  <button
                    type="button"
                    className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                    onClick={handleClearUser}
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Search dropdown */}
              {showDropdown && !selectedUser && (
                <div className="absolute z-50 w-full mt-1 rounded-lg border bg-popover shadow-lg overflow-hidden">
                  {isSearching ? (
                    <div className="px-3 py-4 text-sm text-muted-foreground text-center">
                      Searching…
                    </div>
                  ) : searchResults.length > 0 ? (
                    <ul className="max-h-56 overflow-y-auto divide-y divide-border/30">
                      {searchResults.map((u) => (
                        <li key={u.id}>
                          <button
                            type="button"
                            className="w-full px-3 py-2.5 flex items-start gap-3 text-left hover:bg-muted/50 transition-colors"
                            onMouseDown={() => handleSelectUser(u)}
                          >
                            <Avatar className="h-7 w-7 shrink-0 mt-0.5">
                              <AvatarImage src={u.picture ?? undefined} />
                              <AvatarFallback className="text-xs">{userInitials(u)}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium truncate">
                                {u.firstName} {u.lastName}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                              <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                                {u.isVerified ? (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800">
                                    <ShieldCheck className="h-2.5 w-2.5" />
                                    Verified
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800">
                                    <ShieldAlert className="h-2.5 w-2.5" />
                                    {u.verificationStatus === "PENDING"
                                      ? "Pending Verification"
                                      : u.verificationStatus === "REJECTED"
                                      ? "Verification Rejected"
                                      : "Unverified"}
                                  </span>
                                )}
                                {u.partnerOrgStatus === "ACTIVE" ? (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800">
                                    <Building2 className="h-2.5 w-2.5" />
                                    {u.partnerOrgDetails?.orgName ? `${u.partnerOrgDetails.orgName} Member` : "Partner Member"}
                                  </span>
                                ) : u.partnerOrgStatus === "PENDING" ? (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800">
                                    <Building2 className="h-2.5 w-2.5" />
                                    Application Pending
                                  </span>
                                ) : u.partnerOrgStatus === "NOT_MEMBER" ? (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
                                    Non-partner Member
                                  </span>
                                ) : null}
                                {u.studentId && (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800">
                                    STU: {u.studentId}
                                  </span>
                                )}
                                {u.employeeId && (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800">
                                    EMP: {u.employeeId}
                                  </span>
                                )}
                              </div>
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="px-3 py-3 text-sm text-muted-foreground text-center">
                      No users found.
                    </div>
                  )}
                </div>
              )}

              {/* Selected user chip */}
              {selectedUser && (
                <div className="space-y-2.5 pt-1">
                  <div className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30">
                    <Avatar className="h-8 w-8 shrink-0 mt-0.5">
                      <AvatarImage src={selectedUser.picture ?? undefined} />
                      <AvatarFallback className="text-xs">{userInitials(selectedUser)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">
                          {selectedUser.firstName} {selectedUser.middleName ? `${selectedUser.middleName} ` : ""}{selectedUser.lastName}
                        </p>
                        <User className="h-4 w-4 text-primary shrink-0" />
                      </div>
                      <p className="text-xs text-muted-foreground">{selectedUser.email}</p>
                      {getUserDemographics(selectedUser) && (
                        <p className="text-[11px] text-muted-foreground/90">
                          {getUserDemographics(selectedUser)}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        {selectedUser.isVerified ? (
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] px-1.5 py-0 font-medium dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800">
                            <ShieldCheck className="h-2.5 w-2.5 mr-1" />
                            Verified Account
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] px-1.5 py-0 font-medium dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800">
                            <ShieldAlert className="h-2.5 w-2.5 mr-1" />
                            {selectedUser.verificationStatus === "PENDING"
                              ? "Pending Verification"
                              : selectedUser.verificationStatus === "REJECTED"
                              ? "Verification Rejected"
                              : "Unverified Account"}
                          </Badge>
                        )}
                        {selectedUser.partnerOrgStatus === "ACTIVE" ? (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] px-1.5 py-0 font-medium dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800">
                            <Building2 className="h-2.5 w-2.5 mr-1" />
                            {selectedUser.partnerOrgDetails?.orgName ? `${selectedUser.partnerOrgDetails.orgName} Member` : "Partner Member"}
                            {selectedUser.partnerOrgDetails?.roleName ? ` • ${selectedUser.partnerOrgDetails.roleName}` : ""}
                          </Badge>
                        ) : selectedUser.partnerOrgStatus === "PENDING" ? (
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] px-1.5 py-0 font-medium dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800">
                            <Building2 className="h-2.5 w-2.5 mr-1" />
                            Applied (Pending Activation)
                          </Badge>
                        ) : selectedUser.partnerOrgStatus === "NOT_MEMBER" ? (
                          <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-200 text-[10px] px-1.5 py-0 font-medium dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
                            Not a Partner Org Member
                          </Badge>
                        ) : null}
                        {selectedUser.studentId && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] px-1.5 py-0 font-medium dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800">
                            STU: {selectedUser.studentId}
                          </Badge>
                        )}
                        {selectedUser.employeeId && (
                          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-[10px] px-1.5 py-0 font-medium dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800">
                            EMP: {selectedUser.employeeId}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Warning / Heads-up Callout */}
                  {selectedUser.warnings && selectedUser.warnings.length > 0 ? (
                    <div className="rounded-lg border border-amber-200 bg-amber-50/80 dark:border-amber-900/50 dark:bg-amber-950/20 p-3 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-300 font-medium text-xs">
                        <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                        <span>Notice before adding this patient:</span>
                      </div>
                      <ul className="text-xs text-amber-700 dark:text-amber-400 space-y-1 pl-5 list-disc">
                        {selectedUser.warnings.map((warning, idx) => (
                          <li key={idx}>{warning}</li>
                        ))}
                      </ul>
                      <p className="text-[11px] text-amber-600 dark:text-amber-500 pt-0.5">
                        You will be asked to confirm before proceeding.
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50/80 dark:border-emerald-900/50 dark:bg-emerald-950/20 p-2.5 flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                      <span>This user is verified and an active partner organization member.</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <Button
              className="w-full"
              onClick={handleAddExisting}
              disabled={!selectedUser || isAddingExisting}
            >
              {isAddingExisting
                ? "Adding…"
                : selectedUser?.warnings?.length
                ? "Review & Add to Clinic"
                : "Add to Clinic"}
            </Button>
          </TabsContent>

          {/* ── Tab 2: Create new patient ────────────────────────────────── */}
          <TabsContent value="new">
            <form onSubmit={handleCreateNew} className="space-y-4">
              <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/20 p-3 flex gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  A new ClinicEZ account will be created for this patient. The email address must be unique and will be used to log in.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="new-first-name" className="text-xs font-medium">
                    First Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="new-first-name"
                    value={newFirstName}
                    onChange={(e) => setNewFirstName(e.target.value)}
                    placeholder="First name"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="new-last-name" className="text-xs font-medium">
                    Last Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="new-last-name"
                    value={newLastName}
                    onChange={(e) => setNewLastName(e.target.value)}
                    placeholder="Last name"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="new-email" className="text-xs font-medium">
                  Email Address <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="new-email"
                    type="email"
                    inputMode="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="patient@example.com"
                    className="pl-8"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="new-gender" className="text-xs font-medium">Gender</Label>
                  <Select value={newGender} onValueChange={(v) => setNewGender(v as "MALE" | "FEMALE" | "")}>
                    <SelectTrigger id="new-gender">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MALE">Male</SelectItem>
                      <SelectItem value="FEMALE">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="new-dob" className="text-xs font-medium">Date of Birth</Label>
                  <Input
                    id="new-dob"
                    type="date"
                    value={newDob}
                    onChange={(e) => setNewDob(e.target.value)}
                    max={dayjs().format("YYYY-MM-DD")}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isCreating}>
                {isCreating ? "Creating…" : "Create & Add Patient"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>

    {/* Confirmation Alert Dialog for users with status warnings */}
    <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            Patient Eligibility Warning
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 pt-2 text-sm text-foreground">
              {/* Patient Identity & Membership Card */}
              <div className="p-3 rounded-lg border bg-muted/40 space-y-2.5">
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10 shrink-0 border mt-0.5">
                    <AvatarImage src={selectedUser?.picture ?? undefined} />
                    <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                      {selectedUser ? userInitials(selectedUser) : "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <p className="font-semibold text-sm text-foreground leading-tight">
                      {selectedUser?.firstName} {selectedUser?.middleName ? `${selectedUser.middleName} ` : ""}{selectedUser?.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground break-all">{selectedUser?.email}</p>
                    {selectedUser && getUserDemographics(selectedUser) && (
                      <p className="text-[11px] text-muted-foreground/90 pt-0.5">
                        {getUserDemographics(selectedUser)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Status Badges Row in Dialog */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-border/40">
                  {selectedUser?.isVerified ? (
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] px-1.5 py-0 font-medium dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800">
                      <ShieldCheck className="h-2.5 w-2.5 mr-1" />
                      Verified Account
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] px-1.5 py-0 font-medium dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800">
                      <ShieldAlert className="h-2.5 w-2.5 mr-1" />
                      {selectedUser?.verificationStatus === "PENDING"
                        ? "Pending Verification"
                        : selectedUser?.verificationStatus === "REJECTED"
                        ? "Verification Rejected"
                        : "Unverified Account"}
                    </Badge>
                  )}

                  {selectedUser?.partnerOrgStatus === "ACTIVE" ? (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] px-1.5 py-0 font-medium dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800">
                      <Building2 className="h-2.5 w-2.5 mr-1" />
                      {selectedUser?.partnerOrgDetails?.orgName ? `${selectedUser.partnerOrgDetails.orgName} Member` : "Partner Member"}
                      {selectedUser?.partnerOrgDetails?.roleName ? ` • ${selectedUser.partnerOrgDetails.roleName}` : ""}
                    </Badge>
                  ) : selectedUser?.partnerOrgStatus === "PENDING" ? (
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] px-1.5 py-0 font-medium dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800">
                      <Building2 className="h-2.5 w-2.5 mr-1" />
                      Applied to {selectedUser?.partnerOrgDetails?.orgName || "Partner Org"} (Pending Activation)
                    </Badge>
                  ) : selectedUser?.partnerOrgStatus === "NOT_MEMBER" ? (
                    <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-200 text-[10px] px-1.5 py-0 font-medium dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
                      Not a Partner Org Member
                    </Badge>
                  ) : null}
                </div>

                {/* Membership Breakdown */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/40 text-[11px]">
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase font-medium tracking-wide">
                      Partner Organization
                    </span>
                    <span className="font-semibold text-foreground truncate block">
                      {selectedUser?.partnerOrgDetails?.orgName || (selectedUser?.partnerOrgNames?.length ? selectedUser.partnerOrgNames.join(", ") : "None affiliated")}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase font-medium tracking-wide">
                      Membership Status
                    </span>
                    <span className="font-semibold text-foreground block">
                      {selectedUser?.partnerOrgStatus === "ACTIVE"
                        ? `Active${selectedUser?.partnerOrgDetails?.roleName ? ` (${selectedUser.partnerOrgDetails.roleName})` : ""}`
                        : selectedUser?.partnerOrgStatus === "PENDING"
                        ? `Pending Activation${selectedUser?.partnerOrgDetails?.roleName ? ` (${selectedUser.partnerOrgDetails.roleName})` : ""}`
                        : "Not a Member"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Warnings */}
              <div className="rounded-lg border border-amber-200 bg-amber-50/80 dark:border-amber-900/50 dark:bg-amber-950/20 p-3 space-y-1.5">
                <p className="text-xs font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                  Please review the following status notices:
                </p>
                <ul className="text-xs text-amber-700 dark:text-amber-400 space-y-1.5 pl-5 list-disc">
                  {selectedUser?.warnings?.map((w, idx) => (
                    <li key={idx} className="leading-snug">{w}</li>
                  ))}
                </ul>
              </div>

              <p className="text-xs text-muted-foreground pt-0.5">
                Do you want to proceed and add this patient to the clinic anyway?
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isAddingExisting}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={isAddingExisting}
            onClick={(e) => {
              e.preventDefault();
              void executeAddExisting();
            }}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            {isAddingExisting ? "Adding…" : "Proceed"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
