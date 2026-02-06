"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { toast } from "sonner";

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

interface UserSearchComboboxProps {
  orgUid: string;
  value: string;
  onChange: (userId: string) => void;
  disabled?: boolean;
  placeholder?: string;
  emptyMessage?: string;
}

export const UserSearchCombobox = ({
  orgUid,
  value,
  onChange,
  disabled = false,
  placeholder = "Select user...",
  emptyMessage = "No users found",
}: UserSearchComboboxProps) => {
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
      if (!orgUid) return;

      setIsLoading(true);
      try {
        const result = await getUsersAction({
          orgUid,
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
        toast.error("Failed to load users");
      } finally {
        setIsLoading(false);
      }
    },
    [orgUid]
  );

  // Initial fetch when orgUid changes
  useEffect(() => {
    if (orgUid && open) {
      setUsers([]);
      setPage(1);
      setSearchTerm("");
      fetchUsers(1, "");
    }
  }, [orgUid, open, fetchUsers]);

  // Handle search with debounce
  useEffect(() => {
    if (!open || !orgUid) return;

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
  }, [searchTerm, open, orgUid, fetchUsers]);

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
  const selectedUser = users.find((u) => u.userId === value);
  const displayLabel = selectedUser
    ? `${selectedUser.firstName || ""} ${selectedUser.lastName || ""}`.trim() ||
      selectedUser.email ||
      "Unknown"
    : placeholder;

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
            onWheel={(e) => e.stopPropagation()}
            className="max-h-[300px] overflow-y-auto"
          >
            {users.map((user) => {
              const fullName = `${user.firstName || ""} ${
                user.middleName ? user.middleName + " " : ""
              }${user.lastName || ""}`.trim();
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
                <span>Loading users...</span>
              </div>
            )}

            {!isLoading && users.length > 0 && users.length < totalCount && (
              <div className="p-2 text-center text-xs text-muted-foreground">
                Scroll for more ({users.length} of {totalCount})
              </div>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
