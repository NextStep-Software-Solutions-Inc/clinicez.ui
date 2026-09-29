'use client'

import { useState, useEffect } from 'react'
import {
  GetClinicMembersForAdmin,
  getClinicMembersForAdminAction,
  getAllClinicRolesAction,
  addClinicMemberForAdminAction,
  updateClinicMemberRoleForAdminAction,
  removeClinicMemberForAdminAction,
} from '@actions/super-admin/clinics.action'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui/table'
import { Button } from '@components/ui/button'
import { Input } from '@components/ui/input'
import { Badge } from '@components/ui/badge'
import { Label } from '@components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@components/ui/alert-dialog'
import { Search, Lock, Loader2, UserPlus, Shield, Trash2, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { getActionErrorMessage } from '@/lib/action-error'
import { formatDistance } from 'date-fns'
import { MemberPermissionsDialog } from './MemberPermissionsDialog'
import { SuperAdminUserSearchCombobox } from './SuperAdminUserSearchCombobox'

interface ClinicRoleItem {
  id: number
  name: string
  canAccessDashboard?: boolean
}

interface ClinicMembersTableProps {
  initialData: GetClinicMembersForAdmin
  clinicId: number
  availableRoles?: ClinicRoleItem[]
}

type ClinicMember = GetClinicMembersForAdmin['data'][number]

interface SelectedMember {
  id: number
  name: string
  role: string
}

export default function ClinicMembersTable({
  initialData,
  clinicId,
  availableRoles = [],
}: ClinicMembersTableProps) {
  const [rows, setRows] = useState<ClinicMember[]>(initialData.data)
  const [hasMore, setHasMore] = useState(initialData.hasMore)
  const [nextCursor, setNextCursor] = useState<number | null>(initialData.nextCursor)
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [roles, setRoles] = useState<ClinicRoleItem[]>(availableRoles)

  // Modals state
  const [selectedMember, setSelectedMember] = useState<SelectedMember | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  // Add Member Dialog state
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [addEmail, setAddEmail] = useState('')
  const [addRoleId, setAddRoleId] = useState<string>('')
  const [isAdding, setIsAdding] = useState(false)

  // Change Role Dialog state
  const [roleDialogOpen, setRoleDialogOpen] = useState(false)
  const [memberForRoleChange, setMemberForRoleChange] = useState<ClinicMember | null>(null)
  const [targetRoleId, setTargetRoleId] = useState<string>('')
  const [isUpdatingRole, setIsUpdatingRole] = useState(false)

  // Remove Member Dialog state
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false)
  const [memberToRemove, setMemberToRemove] = useState<ClinicMember | null>(null)
  const [isRemoving, setIsRemoving] = useState(false)

  // Load roles if not provided
  useEffect(() => {
    if (roles.length === 0) {
      getAllClinicRolesAction()
        .then((fetchedRoles) => setRoles(fetchedRoles))
        .catch((err) => console.error('Failed to load clinic roles:', err))
    }
  }, [roles.length])

  const fetchPage = async (cursor: number | undefined, searchTerm: string, append: boolean) => {
    setIsLoading(true)
    try {
      const result = await getClinicMembersForAdminAction({
        clinicId,
        search: searchTerm || undefined,
        cursor,
      })
      if (append) {
        setRows((prev) => [...prev, ...result.data])
      } else {
        setRows(result.data)
      }
      setHasMore(result.hasMore)
      setNextCursor(result.nextCursor)
    } catch (error) {
      toast.error(getActionErrorMessage(error, 'Failed to load members'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = () => {
    fetchPage(undefined, search, false)
  }

  const handleLoadMore = () => {
    if (nextCursor) {
      fetchPage(nextCursor, search, true)
    }
  }

  const handleManagePermissions = (member: ClinicMember) => {
    const firstName = member.User.firstName ?? ''
    const lastName = member.User.lastName ?? ''
    setSelectedMember({
      id: member.id,
      name: `${firstName} ${lastName}`.trim() || member.User.email,
      role: member.Role.name,
    })
    setDialogOpen(true)
  }

  // Add Member Handler
  const handleAddMember = async () => {
    if (!addEmail) {
      toast.error('Please select a user to add')
      return
    }
    if (!addRoleId) {
      toast.error('Please select a role')
      return
    }

    setIsAdding(true)
    try {
      const res = await addClinicMemberForAdminAction({
        clinicId,
        userEmail: addEmail,
        roleId: Number(addRoleId),
      })
      if (res.success) {
        toast.success(res.message || 'Member added successfully')
        setAddDialogOpen(false)
        setAddEmail('')
        setAddRoleId('')
        fetchPage(undefined, search, false)
      } else {
        toast.error(res.error || 'Failed to add member')
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to add member')
    } finally {
      setIsAdding(false)
    }
  }

  // Open Change Role Dialog
  const openRoleDialog = (member: ClinicMember) => {
    setMemberForRoleChange(member)
    setTargetRoleId(String(member.Role.id))
    setRoleDialogOpen(true)
  }

  // Update Role Handler
  const handleUpdateRole = async () => {
    if (!memberForRoleChange || !targetRoleId) return

    setIsUpdatingRole(true)
    try {
      const res = await updateClinicMemberRoleForAdminAction({
        clinicMemberId: memberForRoleChange.id,
        roleId: Number(targetRoleId),
      })
      if (res.success) {
        toast.success(res.message || 'Role updated successfully')
        setRoleDialogOpen(false)
        setMemberForRoleChange(null)
        fetchPage(undefined, search, false)
      } else {
        toast.error(res.error || 'Failed to update role')
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update role')
    } finally {
      setIsUpdatingRole(false)
    }
  }

  // Open Remove Dialog
  const openRemoveDialog = (member: ClinicMember) => {
    setMemberToRemove(member)
    setRemoveDialogOpen(true)
  }

  // Remove Member Handler
  const handleRemoveMember = async () => {
    if (!memberToRemove) return

    setIsRemoving(true)
    try {
      const res = await removeClinicMemberForAdminAction({
        clinicMemberId: memberToRemove.id,
      })
      if (res.success) {
        toast.success(res.message || 'Member removed successfully')
        setRemoveDialogOpen(false)
        setMemberToRemove(null)
        fetchPage(undefined, search, false)
      } else {
        toast.error(res.error || 'Failed to remove member')
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove member')
    } finally {
      setIsRemoving(false)
    }
  }

  const selectedTargetRole = roles.find((r) => String(r.id) === targetRoleId)
  const isTransferringOwnership =
    selectedTargetRole?.name.toLowerCase() === 'owner' &&
    memberForRoleChange?.Role.name.toLowerCase() !== 'owner'

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <Input
            placeholder="Search members by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button onClick={handleSearch} size="icon" variant="outline" disabled={isLoading}>
            <Search className="h-4 w-4" />
          </Button>
        </div>
        <Button onClick={() => setAddDialogOpen(true)} size="sm" className="shrink-0">
          <UserPlus className="h-4 w-4 mr-2" />
          Add Member
        </Button>
      </div>

      <div className="border rounded-md overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Permissions</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No members found
                </TableCell>
              </TableRow>
            ) : (
              rows.map((member) => {
                const isOwner = member.Role.name.toLowerCase() === 'owner'
                return (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {member.User.firstName} {member.User.lastName}
                        </div>
                        <div className="text-xs text-muted-foreground">{member.User.userId}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{member.User.email}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          isOwner
                            ? 'border-amber-500 text-amber-600 bg-amber-50 dark:bg-amber-950/20 font-semibold'
                            : ''
                        }
                      >
                        {member.Role.name}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={member.status === 'ACTIVE' ? 'default' : 'secondary'}>
                        {member.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{member.ClinicMemberPermissions.length}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDistance(new Date(member.createdAt), new Date(), { addSuffix: true })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleManagePermissions(member)}
                          title="Manage clinic-level permissions"
                        >
                          <Lock className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => openRoleDialog(member)}
                          title="Change member role"
                        >
                          <Shield className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => openRemoveDialog(member)}
                          title="Remove member"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {hasMore && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={handleLoadMore} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Loading...
              </>
            ) : (
              'Load More'
            )}
          </Button>
        </div>
      )}

      {/* Permissions Dialog */}
      {selectedMember && (
        <MemberPermissionsDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          memberId={selectedMember.id}
          memberName={selectedMember.name}
          memberRole={selectedMember.role}
          permissionType="CLINIC"
        />
      )}

      {/* Add Member Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Add Clinic Member</DialogTitle>
            <DialogDescription>
              Assign a registered user to this clinic and configure their initial role.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <div className="space-y-2">
              <Label>Select User</Label>
              <SuperAdminUserSearchCombobox
                value={addEmail}
                onChange={setAddEmail}
                placeholder="Search user by name or email..."
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={addRoleId} onValueChange={setAddRoleId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role..." />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r.id} value={String(r.id)}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setAddDialogOpen(false)}
              disabled={isAdding}
            >
              Cancel
            </Button>
            <Button onClick={handleAddMember} disabled={isAdding || !addEmail || !addRoleId}>
              {isAdding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Add Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Role Dialog */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Change Member Role</DialogTitle>
            <DialogDescription>
              Update role for {memberForRoleChange?.User.firstName}{' '}
              {memberForRoleChange?.User.lastName} ({memberForRoleChange?.User.email}).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <div className="space-y-2">
              <Label>Current Role</Label>
              <div className="text-sm font-semibold">{memberForRoleChange?.Role.name}</div>
            </div>
            <div className="space-y-2">
              <Label>New Role</Label>
              <Select value={targetRoleId} onValueChange={setTargetRoleId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select new role..." />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r.id} value={String(r.id)}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isTransferringOwnership && (
              <div className="rounded-md border border-amber-500/40 bg-amber-50/50 dark:bg-amber-950/20 p-3 text-sm text-amber-800 dark:text-amber-300 flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
                <div>
                  <strong>Transfer Ownership Notice:</strong> Setting this member as{' '}
                  <span className="font-semibold">Owner</span> will automatically demote any current
                  clinic owner to <span className="font-semibold">Admin</span>.
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setRoleDialogOpen(false)}
              disabled={isUpdatingRole}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateRole} disabled={isUpdatingRole || !targetRoleId}>
              {isUpdatingRole ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Update Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Member Dialog */}
      <AlertDialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Clinic Member?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{' '}
              <span className="font-medium text-foreground">
                {memberToRemove?.User.firstName} {memberToRemove?.User.lastName} (
                {memberToRemove?.User.email})
              </span>{' '}
              from this clinic? This will revoke their access and all assigned permissions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemoving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleRemoveMember()
              }}
              disabled={isRemoving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isRemoving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Remove Member
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
