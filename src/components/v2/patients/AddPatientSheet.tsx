"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, UserPlus, UserSearch, Check, ChevronsUpDown, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { addClinicPatientAction, createAndAddClinicPatientAction } from "@/actions/clinics/clinic-patient.action";
import { getUsersAction, type GetUsers } from "@/actions/users/user.action";
import { promiseWrapper } from "@/lib/with-error-handling";
import { cn } from "@/lib/utils";
import { $Enums } from "@prisma/client";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type UserResult = NonNullable<GetUsers>[0][number];

interface AddPatientSheetProps {
  clinicUid: string;
  onPatientAdded?: () => void;
}

/* ------------------------------------------------------------------ */
/*  Schemas                                                            */
/* ------------------------------------------------------------------ */

const createPatientSchema = z.object({
  firstName: z.string().trim().min(2, "First name must be at least 2 characters"),
  lastName: z.string().trim().min(2, "Last name must be at least 2 characters"),
  email: z.string().trim().email("Please enter a valid email address"),
  gender: z.nativeEnum($Enums.Gender).optional(),
  dob: z.string().optional(),
});

type CreatePatientFormValues = z.infer<typeof createPatientSchema>;

/* ------------------------------------------------------------------ */
/*  User Search Combobox (for existing users)                         */
/* ------------------------------------------------------------------ */

interface UserSearchComboboxProps {
  value: string;
  onChange: (userId: string) => void;
}

function UserSearchCombobox({ value, onChange }: UserSearchComboboxProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<UserResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchUsers = useCallback(async (search: string) => {
    if (!search.trim()) {
      setUsers([]);
      return;
    }
    setIsLoading(true);
    try {
      const [fetchedUsers] = await getUsersAction({ search, pageSize: 20 });
      setUsers(fetchedUsers);
    } catch {
      toast.error("Failed to search users");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) {
      setSearchTerm("");
      setUsers([]);
      return;
    }
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      fetchUsers(searchTerm);
    }, 300);
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchTerm, open, fetchUsers]);

  const selectedUser = users.find((u) => u.userId === value);
  const displayLabel = selectedUser
    ? `${selectedUser.firstName ?? ""} ${selectedUser.lastName ?? ""}`.trim() || selectedUser.email
    : "Search by name or email...";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          <span className="truncate text-sm">{displayLabel}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start" style={{ width: "var(--radix-popover-trigger-width)" }}>
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search by name or email..."
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
          {!isLoading && users.length === 0 && searchTerm.trim() && (
            <CommandEmpty>No users found.</CommandEmpty>
          )}
          {!isLoading && !searchTerm.trim() && (
            <div className="p-3 text-sm text-muted-foreground text-center">
              Start typing to search users...
            </div>
          )}
          <CommandList className="max-h-[250px] overflow-y-auto">
            {users.map((user) => {
              const fullName = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
              const displayName = fullName || user.email || "Unknown User";
              return (
                <CommandItem
                  key={user.id}
                  value={user.userId}
                  onSelect={() => {
                    onChange(user.userId);
                    setOpen(false);
                  }}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      user.userId === value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="font-medium truncate">{displayName}</span>
                    {user.email && fullName && (
                      <span className="text-xs text-muted-foreground truncate">
                        {user.email}
                      </span>
                    )}
                  </div>
                </CommandItem>
              );
            })}
            {isLoading && (
              <div className="flex items-center justify-center gap-2 p-3 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Searching...</span>
              </div>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export function AddPatientSheet({ clinicUid, onPatientAdded }: AddPatientSheetProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"existing" | "new">("existing");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [isAddingExisting, setIsAddingExisting] = useState(false);

  const form = useForm<CreatePatientFormValues>({
    resolver: zodResolver(createPatientSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
    },
  });

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setSelectedUserId("");
      setActiveTab("existing");
      form.reset();
    }
  };

  const handleAddExistingPatient = async () => {
    if (!selectedUserId) {
      toast.error("Please select a user first");
      return;
    }
    setIsAddingExisting(true);
    try {
      await toast.promise(
        promiseWrapper(addClinicPatientAction)({ clinicUid, userId: selectedUserId }),
        {
          loading: "Adding patient to clinic...",
          success: (res) => {
            handleOpenChange(false);
            onPatientAdded?.();
            return res.message;
          },
          error: (err) => String(err),
        }
      );
    } finally {
      setIsAddingExisting(false);
    }
  };

  const handleCreateNewPatient = form.handleSubmit(async (values) => {
    toast.promise(
      promiseWrapper(createAndAddClinicPatientAction)({
        clinicUid,
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        gender: values.gender,
        dob: values.dob ? new Date(values.dob) : undefined,
      }),
      {
        loading: "Creating patient account...",
        success: (res) => {
          handleOpenChange(false);
          onPatientAdded?.();
          return res.message;
        },
        error: (err) => String(err),
      }
    );
  });

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Patient
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Add Patient</SheetTitle>
          <SheetDescription>
            Search for an existing ClinicEZ user or create a new patient account.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "existing" | "new")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="existing" className="gap-2">
                <UserSearch className="h-4 w-4" />
                <span className="hidden sm:inline">Add Existing User</span>
                <span className="sm:hidden">Existing</span>
              </TabsTrigger>
              <TabsTrigger value="new" className="gap-2">
                <UserPlus className="h-4 w-4" />
                <span className="hidden sm:inline">Create New Patient</span>
                <span className="sm:hidden">New</span>
              </TabsTrigger>
            </TabsList>

            {/* ---- Tab: Add Existing User ---- */}
            <TabsContent value="existing" className="mt-6 space-y-4">
              <p className="text-sm text-muted-foreground">
                Search for an existing ClinicEZ user by name or email address and add them as a patient.
              </p>
              <div className="space-y-2">
                <label className="text-sm font-medium">Search User</label>
                <UserSearchCombobox
                  value={selectedUserId}
                  onChange={setSelectedUserId}
                />
              </div>

              <SheetFooter className="pt-4">
                <Button
                  type="button"
                  onClick={handleAddExistingPatient}
                  disabled={!selectedUserId || isAddingExisting}
                  className="w-full sm:w-auto"
                >
                  {isAddingExisting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Add to Clinic
                </Button>
              </SheetFooter>
            </TabsContent>

            {/* ---- Tab: Create New Patient ---- */}
            <TabsContent value="new" className="mt-6">
              <p className="text-sm text-muted-foreground mb-4">
                Create a new patient account. The email address must be unique as it will be used to register them in the system.
              </p>
              <Form {...form}>
                <form onSubmit={handleCreateNewPatient} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name <span className="text-destructive">*</span></FormLabel>
                          <FormControl>
                            <Input placeholder="Enter first name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name <span className="text-destructive">*</span></FormLabel>
                          <FormControl>
                            <Input placeholder="Enter last name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            inputMode="email"
                            placeholder="patient@example.com"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="gender"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gender</FormLabel>
                          <Select
                            onValueChange={(val) => field.onChange(val as $Enums.Gender)}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select gender" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value={$Enums.Gender.MALE}>Male</SelectItem>
                              <SelectItem value={$Enums.Gender.FEMALE}>Female</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="dob"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date of Birth</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <SheetFooter className="pt-4">
                    <Button type="submit" className="w-full sm:w-auto">
                      Create Patient
                    </Button>
                  </SheetFooter>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}
