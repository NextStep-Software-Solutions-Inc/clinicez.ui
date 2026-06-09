"use client";

import { useState, useCallback, useRef } from "react";
import { UserPlus, Search, X, User, Mail, AlertCircle } from "lucide-react";
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
  const handleAddExisting = async () => {
    if (!selectedUser) {
      toast.error("Please search and select a user.");
      return;
    }
    setIsAddingExisting(true);
    const result = await addClinicPatientAction({ clinicUid, userId: selectedUser.userId });
    setIsAddingExisting(false);

    if (result.status) {
      toast.success("Patient added to clinic successfully.");
      reset();
      onSuccess();
    } else {
      toast.error(result.message);
    }
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

  return (
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
                  placeholder="Type name or email…"
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
                    <ul className="max-h-52 overflow-y-auto divide-y divide-border/30">
                      {searchResults.map((u) => (
                        <li key={u.id}>
                          <button
                            type="button"
                            className="w-full px-3 py-2.5 flex items-center gap-3 text-left hover:bg-muted/50 transition-colors"
                            onMouseDown={() => handleSelectUser(u)}
                          >
                            <Avatar className="h-7 w-7 shrink-0">
                              <AvatarImage src={u.picture ?? undefined} />
                              <AvatarFallback className="text-xs">{userInitials(u)}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">
                                {u.firstName} {u.lastName}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">{u.email}</p>
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
                <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage src={selectedUser.picture ?? undefined} />
                    <AvatarFallback className="text-xs">{userInitials(selectedUser)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">
                      {selectedUser.firstName} {selectedUser.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">{selectedUser.email}</p>
                  </div>
                  <User className="h-4 w-4 text-primary shrink-0" />
                </div>
              )}
            </div>

            <Button
              className="w-full"
              onClick={handleAddExisting}
              disabled={!selectedUser || isAddingExisting}
            >
              {isAddingExisting ? "Adding…" : "Add to Clinic"}
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
  );
}
