"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getActionErrorMessage } from "@/lib/action-error";

import { Button } from "@/components/ui/button";
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
import { getUsersAction, type GetUsers } from "@/actions/users/user.action";
import { cn } from "@/lib/utils";

type UserData = NonNullable<GetUsers>[0][number];

interface SuperAdminUserSearchComboboxProps {
  value: string;
  onChange: (email: string) => void;
  disabled?: boolean;
  placeholder?: string;
  emptyMessage?: string;
}

export const SuperAdminUserSearchCombobox = ({
  value,
  onChange,
  disabled = false,
  placeholder = "Select user...",
  emptyMessage = "No users found",
}: SuperAdminUserSearchComboboxProps) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<UserData[]>([]);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const listRef = useRef<HTMLDivElement>(null);
  const loadMoreTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch users
  const fetchUsers = useCallback(
    async (currentPage: number, search: string, append: boolean = false) => {
      setIsLoading(true);
      try {
        const result = await getUsersAction({
          search: search || undefined,
          page: currentPage,
          pageSize: 20,
        });

        const [fetchedUsers, total] = result;
        setTotalCount(total);

        if (append) {
          setUsers((prev) => {
            const existingIds = new Set(prev.map((u) => u.id));
            const newUsers = fetchedUsers.filter((u) => !existingIds.has(u.id));
            return [...prev, ...newUsers];
          });
        } else {
          setUsers(fetchedUsers);
        }
      } catch (error) {
        console.error("Failed to fetch users:", error);
        toast.error(getActionErrorMessage(error, "Failed to load users"));
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Initial fetch
  useEffect(() => {
    if (open) {
      setUsers([]);
      setPage(1);
      setSearchTerm("");
      fetchUsers(1, "");
    }
  }, [open, fetchUsers]);

  // Handle search with debounce
  useEffect(() => {
    if (!open) return;

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setPage(1);
      fetchUsers(1, searchTerm, false);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm, open, fetchUsers]);

  // Handle lazy loading on scroll
  const handleLoadMore = useCallback(() => {
    if (isLoading || users.length >= totalCount) return;

    const nextPage = page + 1;
    setPage(nextPage);
    fetchUsers(nextPage, searchTerm, true);
  }, [isLoading, users.length, totalCount, page, searchTerm, fetchUsers]);

  // Scroll event listener
  useEffect(() => {
    const list = listRef.current;
    if (!list || !open) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = list;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;

      if (isNearBottom && !isLoading && users.length < totalCount) {
        if (loadMoreTimeoutRef.current) {
          clearTimeout(loadMoreTimeoutRef.current);
        }

        loadMoreTimeoutRef.current = setTimeout(() => {
          handleLoadMore();
        }, 200);
      }
    };

    list.addEventListener("scroll", handleScroll);
    return () => {
      list.removeEventListener("scroll", handleScroll);
      if (loadMoreTimeoutRef.current) {
        clearTimeout(loadMoreTimeoutRef.current);
      }
    };
  }, [open, isLoading, users.length, totalCount, handleLoadMore]);

  // Reset search when closing
  useEffect(() => {
    if (!open) {
      setSearchTerm("");
    }
  }, [open]);

  // Get display label for selected user
  const selectedUser = users.find((u) => u.email === value);
  const displayLabel = selectedUser
    ? `${selectedUser.firstName || ""} ${selectedUser.lastName || ""} (${selectedUser.email})`.trim()
    : value || placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between"
        >
          <span className="truncate">{displayLabel}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search by name or email..."
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
          {
            !isLoading && users.length === 0 ? (
              <CommandEmpty>{emptyMessage}</CommandEmpty>
            ) : null
          }
          <CommandList
            ref={listRef}
            className="max-h-[300px] overflow-y-auto"
          >
            {users.map((user) => (
              <CommandItem
                key={user.id}
                value={user.email}
                onSelect={(currentValue) => {
                  onChange(user.email);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === user.email ? "opacity-100" : "opacity-0"
                  )}
                />
                <div className="flex flex-col">
                  <span className="font-medium">
                    {user.firstName} {user.lastName}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {user.email}
                  </span>
                </div>
              </CommandItem>
            ))}
            {isLoading && (
              <div className="py-6 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading...
              </div>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
