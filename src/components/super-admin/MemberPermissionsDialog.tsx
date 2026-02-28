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
import { Badge } from '@/components/ui/badge'
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import {
  getAllAvailablePermissionsAction,
} from '@/actions/super-admin/permissions.action'
import {
  getOrgMemberPermissionsForAdminAction,
  setOrgMemberPermissionsForAdminAction,
} from '@/actions/super-admin/organizations.action'
import {
  getClinicMemberPermissionsForAdminAction,
  setClinicMemberPermissionsForAdminAction,
  getClinicPatientPermissionsForAdminAction,
  setClinicPatientPermissionsForAdminAction,
} from '@/actions/super-admin/clinics.action'

interface Permission {
  id: number
  name: string
  description: string | null
  type: string
}

interface MemberPermissionsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  memberId: number
  memberName: string
  memberRole: string
  permissionType: 'ORGANIZATION' | 'CLINIC' | 'CLINIC_PATIENT'
}

export function MemberPermissionsDialog({
  open,
  onOpenChange,
  memberId,
  memberName,
  memberRole,
  permissionType,
}: MemberPermissionsDialogProps) {
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [memberPermissionIds, setMemberPermissionIds] = useState<Set<number>>(new Set())
  const [selectedPermissions, setSelectedPermissions] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (open) {
      loadData()
    }
  }, [open, memberId, permissionType])

  async function loadData() {
    try {
      setLoading(true)

      const [permResult, memberPermResult] = await Promise.all([
        getAllAvailablePermissionsAction(),
        permissionType === 'ORGANIZATION'
          ? getOrgMemberPermissionsForAdminAction(memberId)
          : permissionType === 'CLINIC_PATIENT'
          ? getClinicPatientPermissionsForAdminAction(memberId)
          : getClinicMemberPermissionsForAdminAction(memberId),
      ])

      if (permResult.success && permResult.data) {
        // Patients use CLINIC-type permissions; org members use ORGANIZATION type
        const filterType = permissionType === 'ORGANIZATION' ? 'ORGANIZATION' : 'CLINIC'
        setPermissions(permResult.data.filter((p: Permission) => p.type === filterType))
      }

      if (memberPermResult.data) {
        const permIds = new Set<number>(memberPermResult.data.map((p: { permissionId: number }) => p.permissionId))
        setMemberPermissionIds(permIds)
        setSelectedPermissions(new Set<number>(permIds))
      }
    } catch (error) {
      console.error('[LOAD_MEMBER_PERMISSIONS_ERROR]', error)
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

      const result =
        permissionType === 'ORGANIZATION'
          ? await setOrgMemberPermissionsForAdminAction({
            orgMemberId: memberId,
            permissionIds: Array.from(selectedPermissions),
          })
          : permissionType === 'CLINIC_PATIENT'
          ? await setClinicPatientPermissionsForAdminAction({
            clinicPatientId: memberId,
            permissionIds: Array.from(selectedPermissions),
          })
          : await setClinicMemberPermissionsForAdminAction({
            clinicMemberId: memberId,
            permissionIds: Array.from(selectedPermissions),
          })

      if (result.success) {
        toast.success(result.message || 'Permissions updated')
        setMemberPermissionIds(new Set(selectedPermissions))
      } else {
        toast.error('error' in result ? result.error : 'Failed to update permissions')
      }
    } catch (error) {
      console.error('[SAVE_MEMBER_PERMISSIONS_ERROR]', error)
      toast.error('Failed to save permission changes')
    } finally {
      setSaving(false)
    }
  }

  function handleSelectAll() {
    setSelectedPermissions(new Set(permissions.map((p) => p.id)))
  }

  function handleClearAll() {
    setSelectedPermissions(new Set())
  }

  const filteredPermissions = permissions.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const hasChanges =
    Array.from(selectedPermissions).sort().toString() !==
    Array.from(memberPermissionIds).sort().toString()

  const label = permissionType === 'ORGANIZATION' ? 'Organization' : 'Clinic'
  const dialogTitle =
    permissionType === 'CLINIC_PATIENT'
      ? 'Manage Patient Permissions'
      : `Manage ${label} Permissions`

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>
            <span className="font-medium">{memberName}</span> •{' '}
            <Badge variant="outline" className="text-xs">
              {memberRole}
            </Badge>{' '}
            • {memberPermissionIds.size} permission(s) currently assigned
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Input
            placeholder="Search permissions by name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={loading}
          />

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ScrollArea className="h-[400px] border rounded-md p-4">
              {filteredPermissions.length === 0 ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  No permissions found
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredPermissions.map((perm) => {
                    const isChecked = selectedPermissions.has(perm.id)
                    const wasOriginal = memberPermissionIds.has(perm.id)
                    const isChanged = isChecked !== wasOriginal

                    return (
                      <div
                        key={perm.id}
                        className={`flex items-start space-x-3 p-3 rounded-md border transition-colors ${
                          isChanged ? 'bg-blue-50 border-blue-200' : 'border-transparent'
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
              )}
            </ScrollArea>
          )}

          <div className="bg-muted p-3 rounded-md text-sm">
            <div className="flex items-start gap-2">
              {selectedPermissions.size === permissions.length && permissions.length > 0 ? (
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              ) : selectedPermissions.size > memberPermissionIds.size ? (
                <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              ) : null}
              <p className="font-medium">
                {selectedPermissions.size} of {permissions.length} {label.toLowerCase()} permissions selected
                {hasChanges && ' (changes pending)'}
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving} className="w-full sm:w-auto">
            Cancel
          </Button>
          {!loading && (
            <>
              <Button
                variant="secondary"
                onClick={handleClearAll}
                disabled={saving || selectedPermissions.size === 0}
                className="w-full sm:w-auto"
              >
                Clear All
              </Button>
              <Button
                variant="secondary"
                onClick={handleSelectAll}
                disabled={saving || selectedPermissions.size === permissions.length}
                className="w-full sm:w-auto"
              >
                Select All
              </Button>
              <Button onClick={handleSaveChanges} disabled={!hasChanges || saving} className="w-full sm:w-auto">
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
