'use client'

import { useState } from 'react'
import {
  GetClinicMembersForAdmin,
  getClinicMembersForAdminAction,
} from '@actions/super-admin/clinics.action'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui/table'
import { Button } from '@components/ui/button'
import { Input } from '@components/ui/input'
import { Badge } from '@components/ui/badge'
import { Search, Lock } from 'lucide-react'
import { toast } from 'sonner'
import { formatDistance } from 'date-fns'
import { MemberPermissionsDialog } from './MemberPermissionsDialog'

interface ClinicMembersTableProps {
  initialData: GetClinicMembersForAdmin
  clinicId: number
}

type ClinicMember = GetClinicMembersForAdmin['data'][number]

interface SelectedMember {
  id: number
  name: string
  role: string
}

export default function ClinicMembersTable({ initialData, clinicId }: ClinicMembersTableProps) {
  const [data, setData] = useState(initialData)
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedMember, setSelectedMember] = useState<SelectedMember | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const loadData = async (page = 1, searchTerm = search) => {
    setIsLoading(true)
    try {
      const result = await getClinicMembersForAdminAction({
        clinicId,
        search: searchTerm || undefined,
        pageNumber: page,
        pageSize: data.pageSize,
      })
      setData(result)
    } catch {
      toast.error('Failed to load members')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = () => {
    loadData(1, search)
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

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-1">
        <Input
          placeholder="Search members by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="max-w-sm"
        />
        <Button onClick={handleSearch} size="icon" variant="outline">
          <Search className="h-4 w-4" />
        </Button>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Permissions</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No members found
                </TableCell>
              </TableRow>
            ) : (
              data.data.map((member) => (
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
                    <Badge variant="outline">{member.Role.name}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={member.status === 'ACTIVE' ? 'default' : 'secondary'}
                    >
                      {member.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{member.ClinicMemberPermissions.length}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDistance(new Date(member.createdAt), new Date(), { addSuffix: true })}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleManagePermissions(member)}
                      title="Manage clinic-level permissions for this member"
                    >
                      <Lock className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(data.pageNumber - 1) * data.pageSize + 1} to{' '}
            {Math.min(data.pageNumber * data.pageSize, data.total)} of {data.total} members
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadData(data.pageNumber - 1)}
              disabled={data.pageNumber === 1 || isLoading}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadData(data.pageNumber + 1)}
              disabled={data.pageNumber >= data.totalPages || isLoading}
            >
              Next
            </Button>
          </div>
        </div>
      )}

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
    </div>
  )
}
