'use client'

import React, { useTransition } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { studentRecordSchema, type StudentRecordFormInput } from '@/schemas/student-record-schema'
import { useStudentLevels } from '@/hooks/useStudentLevel'
import { useOrgYearLevels } from '@/hooks/useOrgYearLevel'
import { useOrgPrograms } from '@/hooks/useOrgProgram'
import { useOrgColleges } from '@/hooks/useOrgCollege'
import { useOrgDepartments } from '@/hooks/useOrgDepartment'
import { upsertStudentRecordAction } from '@/actions/student-record.action'
import { toast } from 'sonner'

export interface StudentRecordInlineFormProps {
  studentRecord: any
  orgUid: string
  userId: string
  onSuccess: (updatedRecord: any) => void
  onCancel: () => void
}

export function StudentRecordInlineForm({
  studentRecord,
  orgUid,
  userId,
  onSuccess,
  onCancel,
}: StudentRecordInlineFormProps) {
  const [isPending, startTransition] = useTransition()

  // Dropdown list options hooks
  const { data: studentLevels } = useStudentLevels()
  const { data: orgYearLevels } = useOrgYearLevels(orgUid)
  const { data: orgPrograms } = useOrgPrograms(orgUid)
  const { data: orgColleges } = useOrgColleges(orgUid)
  const { data: orgDepartments } = useOrgDepartments(orgUid)

  const form = useForm<StudentRecordFormInput>({
    resolver: zodResolver(studentRecordSchema),
    mode: 'onBlur',
    defaultValues: {
      studentId: studentRecord?.studentId || '',
      lrn: studentRecord?.lrn || '',
      levelId: studentRecord?.level?.toString() || studentRecord?.levelId?.toString() || '',
      yearLevelId: studentRecord?.yearLevel?.toString() || studentRecord?.yearLevelId?.toString() || '',
      programId: studentRecord?.programId?.toString() || '',
      isCollege: !!studentRecord?.collegeId || !!studentRecord?.College,
      collegeId: studentRecord?.collegeId?.toString() || '',
      departmentId: studentRecord?.departmentId?.toString() || '',
    },
  })

  const isCollege = useWatch({ control: form.control, name: 'isCollege' })

  const onSubmit = async (values: StudentRecordFormInput) => {
    startTransition(async () => {
      try {
        const payload = {
          userId,
          orgUid,
          studentId: values.studentId,
          lrn: values.lrn || undefined,
          levelId: Number(values.levelId),
          yearLevelId: Number(values.yearLevelId),
          programId: Number(values.programId),
          collegeId: values.isCollege && values.collegeId ? Number(values.collegeId) : undefined,
          departmentId: values.isCollege && values.departmentId ? Number(values.departmentId) : undefined,
        }
        const res = await upsertStudentRecordAction(payload)
        if (res.status && res.data) {
          toast.success('Student record updated successfully')
          onSuccess(res.data)
        } else {
          toast.error(res.message || 'Failed to update student record')
        }
      } catch (e) {
        toast.error('An error occurred while saving student record')
      }
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 text-xs">
        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="studentId"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel className="text-[10px] font-semibold text-muted-foreground uppercase">
                  Student ID *
                </FormLabel>
                <FormControl>
                  <Input {...field} className="h-8 text-xs focus:ring-primary" placeholder="e.g. 2024-00001" />
                </FormControl>
                <FormMessage className="text-[10px] text-destructive" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lrn"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel className="text-[10px] font-semibold text-muted-foreground uppercase">
                  LRN (optional)
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value || ''}
                    className="h-8 text-xs focus:ring-primary"
                    placeholder="Learner Ref. No."
                  />
                </FormControl>
                <FormMessage className="text-[10px] text-destructive" />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="levelId"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel className="text-[10px] font-semibold text-muted-foreground uppercase">
                  Student Level *
                </FormLabel>
                <FormControl>
                  <select
                    {...field}
                    className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">Select level</option>
                    {(studentLevels ?? []).map((l) => (
                      <option key={l.id} value={l.id.toString()}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                </FormControl>
                <FormMessage className="text-[10px] text-destructive" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="yearLevelId"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel className="text-[10px] font-semibold text-muted-foreground uppercase">
                  Year / Grade *
                </FormLabel>
                <FormControl>
                  <select
                    {...field}
                    className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">Select year/grade</option>
                    {(orgYearLevels ?? []).map((l) => (
                      <option key={l.id} value={l.id.toString()}>
                        {l.name}
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
          name="programId"
          render={({ field }) => (
            <FormItem className="space-y-1">
              <FormLabel className="text-[10px] font-semibold text-muted-foreground uppercase">
                Program / Strand *
              </FormLabel>
              <FormControl>
                <select
                  {...field}
                  className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">Select program</option>
                  {(orgPrograms ?? []).map((p) => (
                    <option key={p.id} value={p.id.toString()}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </FormControl>
              <FormMessage className="text-[10px] text-destructive" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isCollege"
          render={({ field }) => (
            <FormItem className="flex items-center gap-2 space-y-0 pt-1">
              <FormControl>
                <Checkbox
                  id="college-checkbox"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <label htmlFor="college-checkbox" className="text-xs font-medium cursor-pointer">
                College student
              </label>
            </FormItem>
          )}
        />

        {isCollege && (
          <div className="grid grid-cols-2 gap-3 pt-1">
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
        )}

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
