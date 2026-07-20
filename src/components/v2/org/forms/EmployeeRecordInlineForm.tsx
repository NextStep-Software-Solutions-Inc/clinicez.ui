'use client'

import React, { useTransition } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { employeeRecordSchema, type EmployeeRecordFormInput } from '@/schemas/employee-record-schema'
import { useOrgOffices } from '@/hooks/useOrgOffice'
import { useOrgDepartments } from '@/hooks/useOrgDepartment'
import { useOrgColleges } from '@/hooks/useOrgCollege'
import { upsertEmploymentRecordAction } from '@/actions/employee-record.action'
import { toast } from 'sonner'

export interface EmployeeRecordInlineFormProps {
  employment: any
  orgUid: string
  userId: string
  onSuccess: (updatedRecord: any) => void
  onCancel: () => void
}

export function EmployeeRecordInlineForm({
  employment,
  orgUid,
  userId,
  onSuccess,
  onCancel,
}: EmployeeRecordInlineFormProps) {
  const [isPending, startTransition] = useTransition()

  // Dropdown list options hooks
  const { data: orgOffices } = useOrgOffices(orgUid)
  const { data: orgDepartments } = useOrgDepartments(orgUid)
  const { data: orgColleges } = useOrgColleges(orgUid)

  const form = useForm<EmployeeRecordFormInput>({
    resolver: zodResolver(employeeRecordSchema),
    mode: 'onBlur',
    defaultValues: {
      employeeId: employment?.employeeId || '',
      position: employment?.position || '',
      designation: employment?.designation || '',
      officeId: employment?.officeId?.toString() || '',
      departmentId: employment?.departmentId?.toString() || '',
      collegeId: employment?.collegeId?.toString() || '',
      isCollege: !!employment?.collegeId || !!employment?.College,
    },
  })

  const isCollege = useWatch({ control: form.control, name: 'isCollege' })

  const onSubmit = async (values: EmployeeRecordFormInput) => {
    startTransition(async () => {
      try {
        const payload = {
          userId,
          orgUid,
          employeeId: values.employeeId,
          position: values.position,
          designation: values.designation || undefined,
          officeId: Number(values.officeId),
          departmentId: values.departmentId ? Number(values.departmentId) : undefined,
          collegeId: values.isCollege && values.collegeId ? Number(values.collegeId) : undefined,
        }
        const res = await upsertEmploymentRecordAction(payload)
        if (res.status && res.data) {
          toast.success('Employee record updated successfully')
          onSuccess(res.data)
        } else {
          toast.error(res.message || 'Failed to update employee record')
        }
      } catch (e) {
        toast.error('An error occurred while saving employee record')
      }
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 text-xs">
        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="employeeId"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel className="text-[10px] font-semibold text-muted-foreground uppercase">
                  Employee ID *
                </FormLabel>
                <FormControl>
                  <Input {...field} className="h-8 text-xs focus:ring-primary" placeholder="e.g. EMP-001" />
                </FormControl>
                <FormMessage className="text-[10px] text-destructive" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="position"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel className="text-[10px] font-semibold text-muted-foreground uppercase">Position *</FormLabel>
                <FormControl>
                  <Input {...field} className="h-8 text-xs focus:ring-primary" placeholder="e.g. Nurse" />
                </FormControl>
                <FormMessage className="text-[10px] text-destructive" />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="designation"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel className="text-[10px] font-semibold text-muted-foreground uppercase">
                  Designation
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value || ''}
                    className="h-8 text-xs focus:ring-primary"
                    placeholder="e.g. Head Nurse"
                  />
                </FormControl>
                <FormMessage className="text-[10px] text-destructive" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="officeId"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel className="text-[10px] font-semibold text-muted-foreground uppercase">Office *</FormLabel>
                <FormControl>
                  <select
                    {...field}
                    className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">Select office</option>
                    {(orgOffices ?? []).map((o) => (
                      <option key={o.id} value={o.id.toString()}>
                        {o.name}
                      </option>
                    ))}
                  </select>
                </FormControl>
                <FormMessage className="text-[10px] text-destructive" />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="isCollege"
          render={({ field }) => (
            <FormItem className="flex items-center gap-2 space-y-0 pt-1">
              <FormControl>
                <Checkbox
                  id="emp-college-checkbox"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <label htmlFor="emp-college-checkbox" className="text-xs font-medium cursor-pointer">
                Associated with a College
              </label>
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-3 pt-1">
          {isCollege && (
            <FormField
              control={form.control}
              name="collegeId"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="text-[10px] font-semibold text-muted-foreground uppercase">College</FormLabel>
                  <FormControl>
                    <select
                      {...field}
                      value={field.value || ''}
                      className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="">Select college</option>
                      {(orgColleges ?? []).map((c) => (
                        <option key={c.id} value={c.id.toString()}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage className="text-[10px] text-destructive" />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="departmentId"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel className="text-[10px] font-semibold text-muted-foreground uppercase">
                  Department
                </FormLabel>
                <FormControl>
                  <select
                    {...field}
                    value={field.value || ''}
                    className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">Select dept.</option>
                    {(orgDepartments ?? []).map((d) => (
                      <option key={d.id} value={d.id.toString()}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </FormControl>
                <FormMessage className="text-[10px] text-destructive" />
              </FormItem>
            )}
          />
        </div>

        <div className="flex gap-2 justify-end pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={onCancel}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            className="h-7 text-xs bg-primary text-primary-foreground"
            disabled={isPending}
          >
            {isPending && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
            Save Record
          </Button>
        </div>
      </form>
    </Form>
  )
}
