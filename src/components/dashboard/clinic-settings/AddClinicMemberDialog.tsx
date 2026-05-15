"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import ActionButton from "@/components/ActionButton";
import Each from "@/components/utils/Each";

import { useOrganizations } from "@/hooks/useOrganization";
import { useClinicRoles } from "@/hooks/useClinicRole";
import { promiseWrapper } from "@/lib/with-error-handling";
import { addClinicMemberAction } from "@/actions/clinics/clinic-member.action";
import { UserSearchCombobox } from "./UserSearchCombobox";

interface AddClinicMemberDialogProps {
  onAdded?: () => void;
}

export const AddClinicMemberDialog = ({ onAdded }: AddClinicMemberDialogProps) => {
  const [open, setOpen] = useState(false);
  const [selectedOrgUid, setSelectedOrgUid] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRoleId, setSelectedRoleId] = useState("");

  const { clinicUid } = useParams<{ clinicUid: string }>();

  // Fetch organizations and roles
  const { data: organizations } = useOrganizations({ clinicUid });
  const { data: roles } = useClinicRoles({});

  // Filter out restricted roles
  const availableRoles =
    roles?.filter((r) => !["owner", "patient"].includes(r.name.toLowerCase())) ?? [];

  // Handle organization change
  const handleOrgChange = (orgUid: string) => {
    setSelectedOrgUid(orgUid);
    setSelectedUserId(""); // Reset user selection when org changes
  };

  const resetFormState = () => {
    setSelectedOrgUid("");
    setSelectedUserId("");
    setSelectedRoleId("");
  };

  // Submit handler
  const handleSubmit = async () => {
    if (!selectedRoleId || !selectedUserId) {
      toast.error("Please select a user and a role");
      return;
    }

    toast.promise(
      promiseWrapper(addClinicMemberAction)({
        clinicUid,
        roleId: Number(selectedRoleId),
        userId: selectedUserId,
      }),
      {
        loading: "Adding clinic member...",
        success: (res) => {
          setOpen(false);
          onAdded?.();
          return res.message;
        },
        error: (err) => err,
      }
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        resetFormState();
      }}
    >
      <DialogTrigger asChild>
        <Button>Add Member</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Clinic Member</DialogTitle>
          <DialogDescription>
            Select an organization, then choose a user to add as a clinic member.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Organization Selection */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="organization" className="text-right">
              Organization
            </Label>
            <div className="col-span-3">
              <Select value={selectedOrgUid} onValueChange={handleOrgChange}>
                <SelectTrigger id="organization" className="w-full">
                  <SelectValue placeholder="Select organization" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Organizations</SelectLabel>
                    <Each
                      of={organizations ?? []}
                      render={(org) => (
                        <SelectItem key={org.id} value={org.orgUid}>
                          {org.name}
                        </SelectItem>
                      )}
                    />
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* User Selection */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="user" className="text-right">
              User
            </Label>
            <div className="col-span-3">
              <UserSearchCombobox
                orgUid={selectedOrgUid}
                value={selectedUserId}
                onChange={setSelectedUserId}
                disabled={!selectedOrgUid}
                placeholder="Select user..."
                emptyMessage={
                  !selectedOrgUid
                    ? "Please select an organization first"
                    : "No users found"
                }
              />
            </div>
          </div>

          {/* Role Selection */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="role" className="text-right">
              Role
            </Label>
            <div className="col-span-3">
              <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
                <SelectTrigger id="role" className="w-full">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Roles</SelectLabel>
                    <Each
                      of={availableRoles}
                      render={(role) => (
                        <SelectItem key={role.id} value={role.id.toString()}>
                          {role.name}
                        </SelectItem>
                      )}
                    />
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <ActionButton type="button" onClick={handleSubmit}>
            Add Member
          </ActionButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
