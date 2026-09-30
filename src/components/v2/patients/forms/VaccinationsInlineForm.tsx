'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { createUserVaccinationAction, deleteUserVaccinationAction } from '@/actions/users/user-vaccination.action'
import { getVaccinesAction } from '@/actions/vaccines/get-vaccines.action'
import { getActionErrorMessage } from '@/lib/action-error'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Trash2, Plus, X, Syringe, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { ImmunizationCategory } from '@prisma/client'

export interface VaccinationsInlineFormProps {
  userId: string
  vaccinations: any[]
  onSuccess?: () => void
}

const CATEGORY_LABELS: Record<string, string> = {
  CHILD: 'Child (<5y)',
  YOUNG_WOMAN: 'Young Woman (10-49y)',
  PREGNANT: 'Pregnant Woman',
  ELDERLY: 'Elderly (≥60y)',
  OTHER: 'Other / Custom',
}

const DOSE_OPTIONS = [
  '1st Dose',
  '2nd Dose',
  '3rd Dose',
  'Booster 1',
  'Booster 2',
  'Annual Dose',
  'Single Dose',
]

const ROUTE_OPTIONS = [
  'Intramuscular',
  'Subcutaneous',
  'Intradermal',
  'Oral',
  'Intravenous',
  'N/A',
]

export function VaccinationsInlineForm({
  userId,
  vaccinations,
  onSuccess,
}: VaccinationsInlineFormProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Options from PhilHealth Immunization Library
  const [libraryItems, setLibraryItems] = useState<any[]>([])

  // Category Filter for Form
  const [selectedCategory, setSelectedCategory] = useState<string>('CHILD')

  // Form Field
  const [newVac, setNewVac] = useState<{
    immunizationLibId: string
    category: ImmunizationCategory
    code: string
    vaccineName: string
    doseNumber: string
    route: string
    dateGiven: string
    administeredBy: string
    facilityName: string
    notes: string
  }>({
    immunizationLibId: '',
    category: ImmunizationCategory.CHILD,
    code: '',
    vaccineName: '',
    doseNumber: '1st Dose',
    route: 'Intramuscular',
    dateGiven: new Date().toISOString().split('T')[0],
    administeredBy: '',
    facilityName: '',
    notes: '',
  })

  // Load PhilHealth Immunization Library
  useEffect(() => {
    async function loadOptions() {
      try {
        const res = await getVaccinesAction()
        if (res.success && res.data) {
          setLibraryItems(res.data)
        }
      } catch (err) {
        console.error('Failed to load immunizations library:', err)
      }
    }
    loadOptions()
  }, [])

  // Filtered library items for selected category
  const filteredLibrary = useMemo(() => {
    if (selectedCategory === 'ALL') return libraryItems
    return libraryItems.filter((item) => item.category === selectedCategory)
  }, [libraryItems, selectedCategory])

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat)
    if (cat === 'OTHER') {
      setNewVac((prev) => ({
        ...prev,
        category: ImmunizationCategory.OTHER,
        immunizationLibId: '',
        code: '',
        vaccineName: '',
        doseNumber: '1st Dose',
        route: 'Intramuscular',
      }))
    } else {
      setNewVac((prev) => ({
        ...prev,
        category: cat as ImmunizationCategory,
        immunizationLibId: '',
        code: '',
        vaccineName: '',
      }))
    }
  }

  const handleLibrarySelect = (libId: string) => {
    const item = libraryItems.find((v) => String(v.id) === libId)
    if (item) {
      setNewVac((prev) => ({
        ...prev,
        immunizationLibId: String(item.id),
        category: item.category as ImmunizationCategory,
        code: item.code || '',
        vaccineName: item.name || '',
        doseNumber: item.defaultDoseLabel || prev.doseNumber || '1st Dose',
        route: item.defaultRoute || prev.route || 'Intramuscular',
      }))
    }
  }

  const handleAdd = async () => {
    if (!newVac.vaccineName.trim()) {
      toast.error('Vaccine name is required.')
      return
    }
    if (!newVac.dateGiven) {
      toast.error('Date Given is required.')
      return
    }

    setIsLoading(true)
    try {
      const result = await createUserVaccinationAction({
        userId,
        category: newVac.category,
        immunizationLibId: newVac.immunizationLibId ? Number(newVac.immunizationLibId) : null,
        code: newVac.code || null,
        vaccineName: newVac.vaccineName.trim(),
        doseNumber: newVac.doseNumber || '1st Dose',
        route: newVac.route || null,
        dateGiven: new Date(newVac.dateGiven),
        administeredBy: newVac.administeredBy.trim() || null,
        facilityName: newVac.facilityName.trim() || null,
        notes: newVac.notes.trim() || null,
      })

      if (result) {
        toast.success('Vaccination recorded successfully')
        setIsAdding(false)
        setNewVac({
          immunizationLibId: '',
          category: ImmunizationCategory.CHILD,
          code: '',
          vaccineName: '',
          doseNumber: '1st Dose',
          route: 'Intramuscular',
          dateGiven: new Date().toISOString().split('T')[0],
          administeredBy: '',
          facilityName: '',
          notes: '',
        })
        onSuccess?.()
      }
    } catch (err) {
      toast.error(getActionErrorMessage(err, 'Failed to add vaccination'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (vacId: number) => {
    if (!confirm('Are you sure you want to remove this vaccination?')) return

    setIsLoading(true)
    try {
      await deleteUserVaccinationAction(vacId)
      toast.success('Vaccination record removed successfully')
      onSuccess?.()
    } catch (err) {
      toast.error(getActionErrorMessage(err, 'Failed to remove vaccination'))
    } finally {
      setIsLoading(false)
    }
  }

  const renderField = (label: string, control: React.ReactNode) => {
    return (
      <div className="space-y-1">
        <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
          {label}
        </label>
        <div className="w-full">{control}</div>
      </div>
    )
  }

  return (
    <div className="space-y-4 py-2">
      <div className="flex justify-between items-center">
        <div className="text-xs text-muted-foreground">
          PhilHealth Konsulta-compliant immunization records
        </div>
        {!isAdding && (
          <Button
            type="button"
            onClick={() => setIsAdding(true)}
            size="sm"
            className="text-xs flex items-center gap-1.5 h-8 bg-teal-600 hover:bg-teal-700 text-white"
            disabled={isLoading}
          >
            <Plus className="w-3.5 h-3.5" />
            Add Vaccination
          </Button>
        )}
      </div>

      {isAdding && (
        <div className="p-4 rounded-xl border border-dashed border-teal-200 dark:border-teal-900 bg-teal-50/20 dark:bg-teal-950/10 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-teal-800 dark:text-teal-300 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              Record PhilHealth-Aligned Immunization
            </span>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
            {/* Demographic Category */}
            {renderField(
              'Target Demographic Category *',
              <Select
                value={selectedCategory}
                onValueChange={handleCategoryChange}
              >
                <SelectTrigger className="h-8 text-xs focus:ring-teal-500">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CHILD">Child (&lt;5y)</SelectItem>
                  <SelectItem value="YOUNG_WOMAN">Young Woman (10-49y)</SelectItem>
                  <SelectItem value="PREGNANT">Pregnant Woman</SelectItem>
                  <SelectItem value="ELDERLY">Elderly (≥60y)</SelectItem>
                  <SelectItem value="OTHER">Other / Custom Vaccine</SelectItem>
                </SelectContent>
              </Select>
            )}

            {/* Vaccine Selection (Standard or Custom) */}
            {selectedCategory === 'OTHER'
              ? renderField(
                  'Custom Vaccine Name *',
                  <Input
                    placeholder="e.g. COVID-19 Bivalent Pfizer, Rabies Vaccine"
                    value={newVac.vaccineName}
                    onChange={(e) =>
                      setNewVac((prev) => ({ ...prev, vaccineName: e.target.value }))
                    }
                    className="h-8 text-xs focus-visible:ring-teal-500"
                  />
                )
              : renderField(
                  'PhilHealth Standard Vaccine *',
                  <Select
                    value={newVac.immunizationLibId}
                    onValueChange={handleLibrarySelect}
                  >
                    <SelectTrigger className="h-8 text-xs focus:ring-teal-500">
                      <SelectValue placeholder="Select Standard Vaccine" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredLibrary.map((item) => (
                        <SelectItem key={item.id} value={String(item.id)}>
                          <span className="font-semibold text-teal-700 dark:text-teal-400 mr-1.5">
                            [{item.code}]
                          </span>
                          {item.name}
                          {item.description ? ` — ${item.description}` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

            {/* Dose */}
            {renderField(
              'Dose *',
              <Select
                value={newVac.doseNumber}
                onValueChange={(val) => setNewVac((prev) => ({ ...prev, doseNumber: val }))}
              >
                <SelectTrigger className="h-8 text-xs focus:ring-teal-500">
                  <SelectValue placeholder="Select Dose" />
                </SelectTrigger>
                <SelectContent>
                  {DOSE_OPTIONS.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Route */}
            {renderField(
              'Administration Route *',
              <Select
                value={newVac.route}
                onValueChange={(val) => setNewVac((prev) => ({ ...prev, route: val }))}
              >
                <SelectTrigger className="h-8 text-xs focus:ring-teal-500">
                  <SelectValue placeholder="Select Route" />
                </SelectTrigger>
                <SelectContent>
                  {ROUTE_OPTIONS.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Date Given */}
            {renderField(
              'Date Given *',
              <Input
                type="date"
                value={newVac.dateGiven}
                onChange={(e) =>
                  setNewVac((prev) => ({ ...prev, dateGiven: e.target.value }))
                }
                className="h-8 text-xs focus-visible:ring-teal-500"
              />
            )}

            {/* Administered By */}
            {renderField(
              'Administered By',
              <Input
                placeholder="e.g. Dr. Santos / Nurse Joy"
                value={newVac.administeredBy}
                onChange={(e) =>
                  setNewVac((prev) => ({ ...prev, administeredBy: e.target.value }))
                }
                className="h-8 text-xs focus-visible:ring-teal-500"
              />
            )}

            {/* Facility Name */}
            {renderField(
              'Health Facility / Clinic',
              <Input
                placeholder="e.g. City Health Center"
                value={newVac.facilityName}
                onChange={(e) =>
                  setNewVac((prev) => ({ ...prev, facilityName: e.target.value }))
                }
                className="h-8 text-xs focus-visible:ring-teal-500"
              />
            )}

            {/* Notes */}
            <div className="sm:col-span-2">
              {renderField(
                'Notes / Remarks',
                <Input
                  placeholder="Optional remarks or deficiency reasons..."
                  value={newVac.notes}
                  onChange={(e) =>
                    setNewVac((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  className="h-8 text-xs focus-visible:ring-teal-500"
                />
              )}
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => setIsAdding(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              className="h-8 text-xs bg-teal-600 hover:bg-teal-700 text-white"
              onClick={handleAdd}
              disabled={isLoading}
            >
              Save Vaccination
            </Button>
          </div>
        </div>
      )}

      {vaccinations.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {vaccinations.map((vac, idx) => (
            <div
              key={vac.id || idx}
              className="p-3.5 rounded-xl border border-teal-100 dark:border-teal-950/20 bg-teal-50/15 dark:bg-teal-950/10 shadow-sm flex justify-between items-start"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Syringe className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                  <span className="font-bold text-sm text-slate-800 dark:text-slate-200">
                    {vac.vaccine}
                  </span>
                  {vac.code && (
                    <Badge className="bg-teal-700 text-white text-[10px] px-1.5 py-0 h-4 font-mono font-bold">
                      {vac.code}
                    </Badge>
                  )}
                  {vac.category && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-teal-300 dark:border-teal-800 text-teal-700 dark:text-teal-300 font-medium">
                      {CATEGORY_LABELS[vac.category] || vac.category}
                    </Badge>
                  )}
                </div>

                <p className="text-xs font-semibold text-slate-700 dark:text-slate-350">
                  Dose: <span className="text-slate-900 dark:text-white font-bold">{vac.dose}</span>
                  {vac.route && vac.route !== 'N/A' && ` (${vac.route})`}
                </p>
                <p className="text-xs text-slate-650 dark:text-slate-400 font-semibold">
                  Date Given:{' '}
                  <span className="text-slate-900 dark:text-white font-bold">
                    {vac.dateGiven ? new Date(vac.dateGiven).toLocaleDateString(undefined, { dateStyle: 'medium' }) : '—'}
                  </span>
                </p>
                {vac.administeredBy && (
                  <p className="text-[11px] text-slate-500 leading-snug">
                    Administered By: {vac.administeredBy}
                  </p>
                )}
                {vac.facilityName && (
                  <p className="text-[11px] text-slate-500 leading-snug">
                    Facility: {vac.facilityName}
                  </p>
                )}
                {vac.notes && (
                  <p className="text-[11px] text-slate-500 italic leading-snug">
                    Notes: {vac.notes}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => handleDelete(vac.id)}
                className="p-1 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20 dark:hover:text-red-400 rounded transition-colors text-slate-400"
                disabled={isLoading}
                title="Remove vaccination record"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/5">
          <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold">
            No vaccination history logged. Click &ldquo;Add Vaccination&rdquo; to record.
          </span>
        </div>
      )}
    </div>
  )
}
