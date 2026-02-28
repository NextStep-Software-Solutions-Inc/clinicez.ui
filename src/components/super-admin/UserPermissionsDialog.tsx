'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import {
  getAllAvailablePermissionsAction,
  getUserPermissionsAction,
  assignPermissionToUserAction,
  revokePermissionFromUserAction,
  assignAllPermissionsToUserAction,
} from '@/actions/super-admin/permissions.action'

interface Permission {
  id: number
  name: string
  description: string | null
  type: string
}

interface UserPermissionsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: number
  userEmail: string
}

export function UserPermissionsDialog({
  open,
  onOpenChange,
  userId,
  userEmail,
}: UserPermissionsDialogProps) {
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [userPermissionIds, setUserPermissionIds] = useState<Set<number>>(new Set())
  const [selectedPermissions, setSelectedPermissions] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Load data when dialog opens
  useEffect(() => {
    if (open) {
      loadData()
    }
  }, [open])

  async function loadData() {
    try {
      setLoading(true)
      
      const [permResult, userPermResult] = await Promise.all([
        getAllAvailablePermissionsAction(),
        getUserPermissionsAction(userId),
      ])

      if (permResult.success && permResult.data) {
        setPermissions(permResult.data)
      }

      if (userPermResult.success && userPermResult.data) {
        const userPermIds = new Set(
          userPermResult.data.map((up) => up.permissionId)
        )
        setUserPermissionIds(userPermIds)
        setSelectedPermissions(new Set(userPermIds))
      }
    } catch (error) {
      console.error('[LOAD_DATA_ERROR]', error)
      toast.error('Failed to load permissions')
    } finally {
      setLoading(false)
    }
  }

  function handlePermissionToggle(permissionId: number) {
    const updated = new Set(selectedPermissions)
    if (updated.has(permissionId)) {
      updated.delete(permissionId)
    } else {
      updated.add(permissionId)
    }
    setSelectedPermissions(updated)
  }

  async function handleSaveChanges() {
    try {
      setSaving(true)

      // Determine which permissions to add and remove
      const toAdd = Array.from(selectedPermissions).filter(
        (id) => !userPermissionIds.has(id)
      )
      const toRemove = Array.from(userPermissionIds).filter(
        (id) => !selectedPermissions.has(id)
      )

      // Execute all requests
      const results = await Promise.all([
        ...toAdd.map((permId) => assignPermissionToUserAction(userId, permId)),
        ...toRemove.map((permId) => revokePermissionFromUserAction(userId, permId)),
      ])

      // Check for errors
      const hasErrors = results.some((r) => !r.success)
      if (hasErrors) {
        toast.error('Some permissions could not be updated')
      } else {
        toast.success(`Updated ${toAdd.length + toRemove.length} permission(s)`)
        // Update the state to reflect saved permissions
        setUserPermissionIds(new Set(selectedPermissions))
      }
    } catch (error) {
      console.error('[SAVE_CHANGES_ERROR]', error)
      toast.error('Failed to save permission changes')
    } finally {
      setSaving(false)
    }
  }

  async function handleAssignAll() {
    try {
      setSaving(true)
      const result = await assignAllPermissionsToUserAction(userId)

      if (result.success) {
        toast.success(result.message || 'All permissions assigned')
        // Update UI to show all permissions assigned
        const allPermIds = new Set(permissions.map((p) => p.id))
        setSelectedPermissions(allPermIds)
        setUserPermissionIds(allPermIds)
      } else {
        toast.error(result.error || 'Failed to assign all permissions')
      }
    } catch (error) {
      console.error('[ASSIGN_ALL_ERROR]', error)
      toast.error('Failed to assign all permissions')
    } finally {
      setSaving(false)
    }
  }

  // Filter permissions by search query and type
  const filteredPermissions = permissions.filter((p) =>
    p.type === 'USER' &&
    (p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description?.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  // Group permissions by type
  const groupedPermissions = filteredPermissions.reduce(
    (acc, perm) => {
      if (!acc[perm.type]) {
        acc[perm.type] = []
      }
      acc[perm.type].push(perm)
      return acc
    },
    {} as Record<string, Permission[]>
  )

  const hasChanges =
    Array.from(selectedPermissions).sort().toString() !==
    Array.from(userPermissionIds).sort().toString()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage User Permissions</DialogTitle>
          <DialogDescription>
            {userEmail} • {userPermissionIds.size} permission(s) currently assigned
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search input */}
          <Input
            placeholder="Search permissions by name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={loading}
          />

          {/* Loading state */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ScrollArea className="h-[400px] border rounded-md p-4">
              {Object.keys(groupedPermissions).length === 0 ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  No permissions found
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(groupedPermissions).map(([type, perms]) => (
                    <div key={type}>
                      <h3 className="font-semibold text-sm mb-3 capitalize text-muted-foreground">
                        {type}
                      </h3>
                      <div className="space-y-2">
                        {perms.map((perm) => {
                          const isChecked = selectedPermissions.has(perm.id)
                          const wasOriginal = userPermissionIds.has(perm.id)
                          const isChanged = isChecked !== wasOriginal

                          return (
                            <div
                              key={perm.id}
                              className={`flex items-start space-x-3 p-3 rounded-md border transition-colors ${
                                isChanged
                                  ? 'bg-blue-50 border-blue-200'
                                  : 'border-transparent'
                              }`}
                            >
                              <Checkbox
                                id={`perm-${perm.id}`}
                                checked={isChecked}
                                onCheckedChange={() => handlePermissionToggle(perm.id)}
                                disabled={saving}
                              />
                              <div className="flex-1 min-w-0">
                                <label
                                  htmlFor={`perm-${perm.id}`}
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                >
                                  {perm.name}
                                </label>
                                {perm.description && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {perm.description}
                                  </p>
                                )}
                              </div>
                              {isChanged && (
                                <span className="text-xs font-medium text-blue-600">
                                  {isChecked ? '+' : '−'}
                                </span>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          )}

          {/* Summary */}
          <div className="bg-muted p-3 rounded-md text-sm">
            <div className="flex items-start gap-2">
              {selectedPermissions.size === permissions.length ? (
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              ) : selectedPermissions.size > userPermissionIds.size ? (
                <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              ) : null}
              <div>
                <p className="font-medium">
                  {selectedPermissions.size} of {permissions.length} permissions
                  {hasChanges && ' (changes pending)'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          {!loading && (
            <>
              <Button
                variant="secondary"
                onClick={handleAssignAll}
                disabled={saving || selectedPermissions.size === permissions.length}
                className="w-full sm:w-auto"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Assigning...
                  </>
                ) : (
                  'Assign All'
                )}
              </Button>
              <Button
                onClick={handleSaveChanges}
                disabled={!hasChanges || saving}
                className="w-full sm:w-auto"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
