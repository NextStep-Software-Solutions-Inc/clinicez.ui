'use client'

import { useState } from 'react'
import {
  GetClinicPatientsForAdmin,
  getClinicPatientsForAdminAction,
} from '@actions/super-admin/clinics.action'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui/table'
import { Button } from '@components/ui/button'
import { Input } from '@components/ui/input'
import { Badge } from '@components/ui/badge'
import { Search, Lock, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { formatDistance } from 'date-fns'
import { MemberPermissionsDialog } from './MemberPermissionsDialog'

interface ClinicPatientsTableProps {
  initialData: GetClinicPatientsForAdmin
  clinicId: number
}

type ClinicPatient = GetClinicPatientsForAdmin['data'][number]

interface SelectedPatient {
  id: number
  name: string
}

export default function ClinicPatientsTable({ initialData, clinicId }: ClinicPatientsTableProps) {
  const [rows, setRows] = useState<ClinicPatient[]>(initialData.data)
  const [hasMore, setHasMore] = useState(initialData.hasMore)
  const [nextCursor, setNextCursor] = useState<number | null>(initialData.nextCursor)
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<SelectedPatient | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const fetchPage = async (cursor: number | undefined, searchTerm: string, append: boolean) => {
    setIsLoading(true)
    try {
      const result = await getClinicPatientsForAdminAction({
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
    } catch {
      toast.error('Failed to load patients')
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

  const handleManagePermissions = (patient: ClinicPatient) => {
    const firstName = patient.Patient.firstName ?? ''
    const lastName = patient.Patient.lastName ?? ''
    setSelectedPatient({
      id: patient.id,
      name: `${firstName} ${lastName}`.trim() || patient.Patient.email,
    })
    setDialogOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-1">
        <Input
          placeholder="Search patients by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="max-w-sm"
        />
        <Button onClick={handleSearch} size="icon" variant="outline" disabled={isLoading}>
          <Search className="h-4 w-4" />
        </Button>
      </div>

      <div className="border rounded-md overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Patient</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Onboarding</TableHead>
              <TableHead>Permissions</TableHead>
              <TableHead>Registered</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No patients found
                </TableCell>
              </TableRow>
            ) : (
              rows.map((patient) => (
                <TableRow key={patient.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {patient.Patient.firstName} {patient.Patient.lastName}
                      </div>
                      <div className="text-xs text-muted-foreground">{patient.Patient.userId}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{patient.Patient.email}</TableCell>
                  <TableCell>
                    <Badge variant={patient.isActive ? 'default' : 'secondary'}>
                      {patient.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {patient.onboardingStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{patient.ClinicPatientPermissions.length}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDistance(new Date(patient.createdAt), new Date(), { addSuffix: true })}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleManagePermissions(patient)}
                      title="Manage clinic-level permissions for this patient"
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

      {selectedPatient && (
        <MemberPermissionsDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          memberId={selectedPatient.id}
          memberName={selectedPatient.name}
          memberRole="Patient"
          permissionType="CLINIC_PATIENT"
        />
      )}
    </div>
  )
}
