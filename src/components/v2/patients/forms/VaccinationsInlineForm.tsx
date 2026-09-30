'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { createUserVaccinationAction, deleteUserVaccinationAction } from '@/actions/users/user-vaccination.action'
import { getVaccinesAction } from '@/actions/vaccines/get-vaccines.action'
import { getActionErrorMessage } from '@/lib/action-error'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  Trash2,
  Plus,
  X,
  Syringe,
  ShieldCheck,
  Sparkles,
  BookOpen,
  ListFilter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Ban,
  Calendar,
} from 'lucide-react'
import { toast } from 'sonner'
import { ImmunizationCategory } from '@prisma/client'
import {
  CATEGORY_METADATA,
  STANDARD_VACCINE_FAMILIES,
  VaccineFamilyDef,
  VaccineDoseDef,
  detectRecommendedCategory,
  groupVaccinationsByFamily,
} from '@/lib/immunizations/immunization-utils'

export interface VaccinationsInlineFormProps {
  userId: string
  vaccinations: any[]
  dob?: string | Date | null
  age?: number | null
  gender?: string | null
  isPregnant?: boolean | null
  onSuccess?: () => void
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
  dob,
  age,
  gender,
  isPregnant,
  onSuccess,
}: VaccinationsInlineFormProps) {
  // Determine smart recommended category
  const recommendedCategory = useMemo(() => {
    return detectRecommendedCategory({ dob, age, gender, isPregnant })
  }, [dob, age, gender, isPregnant])

  const [isAdding, setIsAdding] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [viewMode, setViewMode] = useState<'BOOKLET' | 'TIMELINE'>('BOOKLET')

  // PhilHealth Immunization Library items from DB
  const [libraryItems, setLibraryItems] = useState<any[]>([])

  // Category Filter for Form & Fast Actions (defaults to smart recommended category)
  const [selectedCategory, setSelectedCategory] = useState<ImmunizationCategory>(recommendedCategory)

  // Selected Vaccine Family for guided multi-dose entry
  const [selectedFamilyId, setSelectedFamilyId] = useState<string>('')

  // Form Field state
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
    category: recommendedCategory,
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

  // Sync category default if recommended category changes and form is closed
  useEffect(() => {
    if (!isAdding) {
      setSelectedCategory(recommendedCategory)
      setNewVac((prev) => ({
        ...prev,
        category: recommendedCategory,
      }))
    }
  }, [recommendedCategory, isAdding])

  // Filtered standard vaccine families for current category
  const activeFamilies = useMemo(() => {
    return STANDARD_VACCINE_FAMILIES.filter((f) => f.category === selectedCategory)
  }, [selectedCategory])

  // Multi-dose grouped data for view mode
  const groupedData = useMemo(() => {
    return groupVaccinationsByFamily(vaccinations, selectedCategory)
  }, [vaccinations, selectedCategory])

  // Check if Code 999 ("None Given") is currently documented for selected category
  const noneRecordForCategory = useMemo(() => {
    return vaccinations.find(
      (v) =>
        (v.code === '999' || String(v.vaccine).toLowerCase() === 'none') &&
        (v.category === selectedCategory || (!v.category && selectedCategory === ImmunizationCategory.CHILD))
    )
  }, [vaccinations, selectedCategory])

  const handleCategoryChange = (cat: ImmunizationCategory) => {
    setSelectedCategory(cat)
    setSelectedFamilyId('')

    if (cat === ImmunizationCategory.OTHER) {
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
      // Pick first family if available
      const families = STANDARD_VACCINE_FAMILIES.filter((f) => f.category === cat)
      if (families.length > 0) {
        handleSelectFamily(families[0], cat)
      } else {
        setNewVac((prev) => ({
          ...prev,
          category: cat,
          immunizationLibId: '',
          code: '',
          vaccineName: '',
        }))
      }
    }
  }

  const handleSelectFamily = (family: VaccineFamilyDef, catOverride?: ImmunizationCategory) => {
    setSelectedFamilyId(family.id)
    const cat = catOverride || selectedCategory

    // Find next pending dose for this family from patient history
    const familyStatus = groupedData.standardSeriesList.find((s) => s.family.id === family.id)
    const nextDose: VaccineDoseDef = familyStatus?.nextPendingDose || family.doses[0]

    // Find matching library item ID if available
    const libMatch = libraryItems.find(
      (item) => item.category === cat && item.code === nextDose.code
    )

    setNewVac((prev) => ({
      ...prev,
      category: cat,
      immunizationLibId: libMatch ? String(libMatch.id) : '',
      code: nextDose.code,
      vaccineName: family.name,
      doseNumber: nextDose.doseLabel,
      route: nextDose.route || 'Intramuscular',
    }))
  }

  const handleSelectDose = (doseDef: VaccineDoseDef) => {
    const libMatch = libraryItems.find(
      (item) => item.category === selectedCategory && item.code === doseDef.code
    )
    setNewVac((prev) => ({
      ...prev,
      immunizationLibId: libMatch ? String(libMatch.id) : '',
      code: doseDef.code,
      doseNumber: doseDef.doseLabel,
      route: doseDef.route || prev.route,
    }))
  }

  // Fast-track: Launch form pre-filled for a specific pending dose
  const handleFastAddPendingDose = (family: VaccineFamilyDef, doseDef: VaccineDoseDef) => {
    setSelectedCategory(family.category)
    setSelectedFamilyId(family.id)

    const libMatch = libraryItems.find(
      (item) => item.category === family.category && item.code === doseDef.code
    )

    setNewVac({
      immunizationLibId: libMatch ? String(libMatch.id) : '',
      category: family.category,
      code: doseDef.code,
      vaccineName: family.name,
      doseNumber: doseDef.doseLabel,
      route: doseDef.route || 'Intramuscular',
      dateGiven: new Date().toISOString().split('T')[0],
      administeredBy: '',
      facilityName: '',
      notes: '',
    })

    setIsAdding(true)
  }

  // Fast-track: One-Click Mark None Given (PhilHealth Code 999)
  const handleMarkNoneGiven = async () => {
    const catMeta = CATEGORY_METADATA[selectedCategory]
    const confirmed = window.confirm(
      `Mark "No Immunizations Given" (PhilHealth Code 999) for ${catMeta.label}?\n\nThis will record official PhilHealth compliance code 999 for this demographic category.`
    )
    if (!confirmed) return

    setIsLoading(true)
    try {
      await createUserVaccinationAction({
        userId,
        category: selectedCategory,
        code: '999',
        vaccineName: 'None',
        doseNumber: 'N/A',
        route: 'N/A',
        dateGiven: new Date(),
        notes: `No ${catMeta.shortLabel.toLowerCase()} immunizations given / declared`,
      })
      toast.success(`Recorded PhilHealth Code 999 (None Given) for ${catMeta.shortLabel}`)
      onSuccess?.()
    } catch (err) {
      toast.error(getActionErrorMessage(err, 'Failed to record PhilHealth Code 999'))
    } finally {
      setIsLoading(false)
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
        toast.success(`Vaccination "${newVac.vaccineName}" recorded successfully`)
        setIsAdding(false)
        setSelectedFamilyId('')
        setNewVac({
          immunizationLibId: '',
          category: selectedCategory,
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

  const handleDelete = async (vacId: number, name?: string) => {
    if (!confirm(`Are you sure you want to remove the record for "${name || 'this vaccination'}"?`)) {
      return
    }

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

  // Selected family definition in entry mode
  const currentFamilyDef = activeFamilies.find((f) => f.id === selectedFamilyId)

  return (
    <div className="space-y-5 py-2">
      {/* Top Header & Fast Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
              <Syringe className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              Vaccination & Immunization Record
            </h4>
            <Badge variant="outline" className="text-[10px] border-teal-300 text-teal-700 dark:text-teal-400 font-semibold py-0 h-4">
              PhilHealth Konsulta DTD v1.14
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Track multi-dose primary series, patient immunizations, and official PhilHealth compliance.
          </p>
        </div>

        {/* View Switcher & Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* View Mode Toggle */}
          <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-800 p-0.5 bg-slate-50 dark:bg-slate-900/50">
            <button
              type="button"
              onClick={() => setViewMode('BOOKLET')}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                viewMode === 'BOOKLET'
                  ? 'bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-300 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title="Series & Baby Book Tracking View"
            >
              <BookOpen className="w-3.5 h-3.5" />
              Booklet View
            </button>
            <button
              type="button"
              onClick={() => setViewMode('TIMELINE')}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                viewMode === 'TIMELINE'
                  ? 'bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-300 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title="Chronological List of Administered Vaccines"
            >
              <ListFilter className="w-3.5 h-3.5" />
              Timeline
            </button>
          </div>

          {/* One-Click Fast-Track: Mark None Given (PhilHealth Code 999) */}
          {selectedCategory !== ImmunizationCategory.OTHER && !noneRecordForCategory && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleMarkNoneGiven}
              disabled={isLoading}
              className="text-xs h-8 border-amber-300 dark:border-amber-800 bg-amber-50/60 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 hover:bg-amber-100 hover:text-amber-900 flex items-center gap-1.5 shadow-none"
              title={`Instantly record PhilHealth Code 999 for ${CATEGORY_METADATA[selectedCategory].shortLabel}`}
            >
              <Ban className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              Mark None Given (999)
            </Button>
          )}

          {!isAdding && (
            <Button
              type="button"
              onClick={() => {
                setIsAdding(true)
                if (selectedCategory !== ImmunizationCategory.OTHER && activeFamilies.length > 0 && !selectedFamilyId) {
                  handleSelectFamily(activeFamilies[0])
                }
              }}
              size="sm"
              className="text-xs flex items-center gap-1.5 h-8 bg-teal-600 hover:bg-teal-700 text-white font-semibold shadow-sm"
              disabled={isLoading}
            >
              <Plus className="w-3.5 h-3.5" />
              Add Vaccination
            </Button>
          )}
        </div>
      </div>

      {/* Smart Demographic Category Pill Selector */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-extrabold text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Demographic Category Selection
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" />
            Suggested by patient profile: <strong className="text-teal-700 dark:text-teal-400">{CATEGORY_METADATA[recommendedCategory].shortLabel}</strong>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {(Object.keys(CATEGORY_METADATA) as ImmunizationCategory[]).map((catKey) => {
            const meta = CATEGORY_METADATA[catKey]
            const isSelected = selectedCategory === catKey
            const isRecommended = recommendedCategory === catKey

            return (
              <button
                key={catKey}
                type="button"
                onClick={() => handleCategoryChange(catKey)}
                className={`relative p-2.5 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'border-teal-500 bg-teal-50/70 dark:bg-teal-950/40 shadow-sm ring-1 ring-teal-400/50'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-teal-200 hover:bg-slate-50/80 dark:hover:bg-slate-800/50'
                }`}
              >
                {/* Recommended Badge */}
                {isRecommended && (
                  <span className="absolute -top-2 right-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full shadow-xs flex items-center gap-0.5 tracking-tight">
                    <Sparkles className="w-2.5 h-2.5" />
                    Recommended
                  </span>
                )}

                <div className="flex items-center gap-2">
                  <span className="text-lg shrink-0 leading-none">{meta.emoji}</span>
                  <div className="min-w-0">
                    <div
                      className={`text-xs font-bold truncate ${
                        isSelected ? 'text-teal-900 dark:text-teal-200' : 'text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {meta.shortLabel}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                      {meta.ageCriteria}
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Code 999 Status Banner (if documented for active category) */}
      {noneRecordForCategory && (
        <div className="p-3 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/60 dark:bg-amber-950/20 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs text-amber-900 dark:text-amber-200">
            <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <div>
              <span className="font-bold">PhilHealth Code 999 Documented: </span>
              Patient has officially reported <strong>No {CATEGORY_METADATA[selectedCategory].shortLabel} Immunizations Given</strong> (Logged on{' '}
              {new Date(noneRecordForCategory.dateGiven).toLocaleDateString()}).
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(noneRecordForCategory.id, 'None Given declaration')}
            disabled={isLoading}
            className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 h-7 px-2"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" />
            Remove 999
          </Button>
        </div>
      )}

      {/* Interactive Add Vaccination Panel */}
      {isAdding && (
        <div className="p-4 sm:p-5 rounded-2xl border border-dashed border-teal-300 dark:border-teal-800 bg-teal-50/30 dark:bg-teal-950/15 space-y-4 shadow-sm animate-in fade-in-50 duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold text-xs">
                <Plus className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-teal-900 dark:text-teal-200 uppercase tracking-wider block">
                  Record New Immunization
                </span>
                <span className="text-[11px] text-teal-700 dark:text-teal-400">
                  Adding to category: <strong>{CATEGORY_METADATA[selectedCategory].label}</strong>
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Guided Vaccine Family Selection for Standard Categories */}
          {selectedCategory !== ImmunizationCategory.OTHER && activeFamilies.length > 0 && (
            <div className="space-y-2">
              <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                Select Vaccine Family / Target Antigen *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {activeFamilies.map((family) => {
                  const isSelected = selectedFamilyId === family.id
                  const seriesStat = groupedData.standardSeriesList.find((s) => s.family.id === family.id)
                  const isComplete = seriesStat?.isComplete

                  return (
                    <button
                      key={family.id}
                      type="button"
                      onClick={() => handleSelectFamily(family)}
                      className={`p-2 rounded-lg border text-left transition-all ${
                        isSelected
                          ? 'border-teal-500 bg-white dark:bg-slate-800 text-teal-900 dark:text-teal-200 shadow-xs ring-1 ring-teal-400'
                          : 'border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 hover:bg-white text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs">{family.name}</span>
                        {isComplete ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        ) : (
                          <span className="text-[10px] text-slate-400 font-mono">
                            {seriesStat?.completedCount || 0}/{family.targetDoses}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {family.description}
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Interactive Dose Chips for the Selected Family */}
              {currentFamilyDef && currentFamilyDef.doses.length > 1 && (
                <div className="p-3 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-teal-100 dark:border-teal-900 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      Select Series Dose for {currentFamilyDef.name}:
                    </span>
                    <span className="text-[10px] text-slate-500">{currentFamilyDef.scheduleDescription}</span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {currentFamilyDef.doses.map((dose) => {
                      const isDoseSelected = newVac.code === dose.code
                      const alreadyGiven = groupedData.standardSeriesList
                        .find((s) => s.family.id === currentFamilyDef.id)
                        ?.administeredDoses.some(
                          (adm) =>
                            adm.code === dose.code ||
                            adm.dose.toLowerCase().includes(`${dose.doseNumber}`)
                        )

                      return (
                        <button
                          key={dose.code}
                          type="button"
                          onClick={() => handleSelectDose(dose)}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                            isDoseSelected
                              ? 'border-teal-600 bg-teal-600 text-white shadow-xs'
                              : alreadyGiven
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300'
                              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          {alreadyGiven ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : (
                            <Clock className="w-3.5 h-3.5 opacity-60" />
                          )}
                          <span>
                            {dose.doseLabel} ({dose.code})
                          </span>
                          {dose.description && (
                            <span className="text-[10px] opacity-80">· {dose.description}</span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Form Fields Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
            {/* Custom Vaccine Name input when category is OTHER */}
            {selectedCategory === ImmunizationCategory.OTHER ? (
              renderField(
                'Custom Vaccine Name *',
                <Input
                  placeholder="e.g. COVID-19 Pfizer Bivalent, Rabies Vaccine..."
                  value={newVac.vaccineName}
                  onChange={(e) =>
                    setNewVac((prev) => ({ ...prev, vaccineName: e.target.value }))
                  }
                  className="h-8 text-xs focus-visible:ring-teal-500"
                />
              )
            ) : (
              renderField(
                'Vaccine Name & PhilHealth Code *',
                <Input
                  value={`${newVac.vaccineName} ${newVac.code ? `[Code: ${newVac.code}]` : ''}`}
                  readOnly
                  disabled
                  className="h-8 text-xs bg-slate-100 dark:bg-slate-800/60 font-semibold cursor-not-allowed"
                />
              )
            )}

            {/* Dose Selector */}
            {renderField(
              'Dose Administered *',
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
                placeholder="e.g. Dr. Juan Santos / Nurse Joy"
                value={newVac.administeredBy}
                onChange={(e) =>
                  setNewVac((prev) => ({ ...prev, administeredBy: e.target.value }))
                }
                className="h-8 text-xs focus-visible:ring-teal-500"
              />
            )}

            {/* Facility Name */}
            {renderField(
              'Clinic / Health Facility',
              <Input
                placeholder="e.g. City Health Office / Rural Health Unit"
                value={newVac.facilityName}
                onChange={(e) =>
                  setNewVac((prev) => ({ ...prev, facilityName: e.target.value }))
                }
                className="h-8 text-xs focus-visible:ring-teal-500"
              />
            )}

            {/* Notes */}
            <div className="sm:col-span-3">
              {renderField(
                'Notes & Clinical Remarks',
                <Input
                  placeholder="Optional remarks, adverse reaction checks, or lot number..."
                  value={newVac.notes}
                  onChange={(e) =>
                    setNewVac((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  className="h-8 text-xs focus-visible:ring-teal-500"
                />
              )}
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-1">
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
              className="h-8 text-xs bg-teal-600 hover:bg-teal-700 text-white font-semibold shadow-xs"
              onClick={handleAdd}
              disabled={isLoading}
            >
              Save Vaccination Record
            </Button>
          </div>
        </div>
      )}

      {/* DISPLAY MODE 1: BOOKLET / BABY BOOK SERIES TRACKING VIEW */}
      {viewMode === 'BOOKLET' && (
        <div className="space-y-4">
          {/* Standard PhilHealth Series Cards */}
          {groupedData.standardSeriesList.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {groupedData.standardSeriesList.map((series) => {
                const isComplete = series.isComplete
                const nextDose = series.nextPendingDose

                return (
                  <div
                    key={series.family.id}
                    className={`rounded-xl border p-4 transition-all ${
                      isComplete
                        ? 'border-emerald-200 dark:border-emerald-950/40 bg-emerald-50/20 dark:bg-emerald-950/10'
                        : series.completedCount > 0
                        ? 'border-teal-200 dark:border-teal-950/40 bg-teal-50/15 dark:bg-teal-950/10'
                        : 'border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/30'
                    }`}
                  >
                    {/* Series Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-sm text-slate-800 dark:text-slate-100">
                            {series.family.name}
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            ({series.family.description})
                          </span>
                        </div>
                        {series.family.scheduleDescription && (
                          <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                            Target Schedule: {series.family.scheduleDescription}
                          </div>
                        )}
                      </div>

                      {/* Progress Badge */}
                      {isComplete ? (
                        <Badge className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Series Complete
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-[10px] font-bold border-teal-300 dark:border-teal-800 text-teal-700 dark:text-teal-300"
                        >
                          {series.completedCount} of {series.targetCount} Doses
                        </Badge>
                      )}
                    </div>

                    {/* Completion Meter Bar */}
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mt-2.5 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          isComplete ? 'bg-emerald-500' : 'bg-teal-500'
                        }`}
                        style={{ width: `${series.progressPercent}%` }}
                      />
                    </div>

                    {/* Doses List & Next Pending Action */}
                    <div className="mt-3.5 space-y-2">
                      {/* Administered Doses */}
                      {series.administeredDoses.length > 0 ? (
                        <div className="space-y-1.5">
                          {series.administeredDoses.map((doseRec) => (
                            <div
                              key={doseRec.id}
                              className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-800 text-xs flex items-center justify-between gap-2 shadow-2xs"
                            >
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-teal-800 dark:text-teal-300 flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                  {doseRec.dose}
                                </span>
                                {doseRec.code && (
                                  <Badge className="bg-teal-700 text-white text-[9px] px-1 py-0 h-3.5 font-mono">
                                    {doseRec.code}
                                  </Badge>
                                )}
                                <span className="text-slate-500 text-[11px] flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {doseRec.dateGiven
                                    ? new Date(doseRec.dateGiven).toLocaleDateString(undefined, {
                                        dateStyle: 'medium',
                                      })
                                    : '—'}
                                </span>
                                {doseRec.route && doseRec.route !== 'N/A' && (
                                  <span className="text-[10px] text-slate-400">({doseRec.route})</span>
                                )}
                                {doseRec.administeredBy && (
                                  <span className="text-[10px] text-slate-400">· By: {doseRec.administeredBy}</span>
                                )}
                              </div>

                              <button
                                type="button"
                                onClick={() => handleDelete(doseRec.id, `${series.family.name} (${doseRec.dose})`)}
                                className="text-slate-300 hover:text-red-500 p-1 rounded transition-colors"
                                title="Remove this dose"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-400 italic">No doses logged yet.</div>
                      )}

                      {/* Next Pending Dose Fast-Action Button */}
                      {!isComplete && nextDose && (
                        <div className="pt-1 flex items-center justify-between gap-2">
                          <span className="text-[10px] font-semibold text-teal-700 dark:text-teal-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Next: {nextDose.doseLabel} ({nextDose.code})
                          </span>
                          <button
                            type="button"
                            onClick={() => handleFastAddPendingDose(series.family, nextDose)}
                            className="text-[11px] font-bold text-teal-700 dark:text-teal-300 hover:text-teal-900 dark:hover:text-teal-100 bg-teal-50 dark:bg-teal-950/50 hover:bg-teal-100 dark:hover:bg-teal-900/60 px-2 py-1 rounded-md transition-colors flex items-center gap-1 border border-teal-200 dark:border-teal-800"
                          >
                            <Plus className="w-3 h-3" />
                            Log {nextDose.doseLabel}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Custom & Uncategorized Vaccinations Section */}
          {groupedData.customRecords.length > 0 && (
            <div className="mt-4 space-y-2">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
                <Syringe className="w-3.5 h-3.5 text-teal-600" />
                Additional & Custom Vaccines ({groupedData.customRecords.length})
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {groupedData.customRecords.map((vac) => (
                  <div
                    key={vac.id}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/40 flex justify-between items-start"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                          {vac.vaccine}
                        </span>
                        <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5 border-slate-300 text-slate-600">
                          Custom
                        </Badge>
                      </div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-400 space-y-0.5">
                        <div>
                          Dose: <strong>{vac.dose}</strong> ({vac.route})
                        </div>
                        <div>
                          Date:{' '}
                          <strong>
                            {vac.dateGiven
                              ? new Date(vac.dateGiven).toLocaleDateString(undefined, {
                                  dateStyle: 'medium',
                                })
                              : '—'}
                          </strong>
                        </div>
                        {vac.administeredBy && <div>Given By: {vac.administeredBy}</div>}
                        {vac.facilityName && <div>Facility: {vac.facilityName}</div>}
                        {vac.notes && <div className="italic text-slate-500">Note: {vac.notes}</div>}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDelete(vac.id, vac.vaccine)}
                      className="p-1 text-slate-400 hover:text-red-500 rounded transition-colors"
                      title="Remove record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* DISPLAY MODE 2: CHRONOLOGICAL TIMELINE VIEW */}
      {viewMode === 'TIMELINE' && (
        <div className="space-y-3">
          {vaccinations.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {vaccinations.map((vac, idx) => (
                <div
                  key={vac.id || idx}
                  className="p-3.5 rounded-xl border border-teal-100 dark:border-teal-950/20 bg-teal-50/15 dark:bg-teal-950/10 shadow-xs flex justify-between items-start"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Syringe className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                      <span className="font-bold text-sm text-slate-800 dark:text-slate-200">
                        {vac.vaccine || vac.vaccineName}
                      </span>
                      {vac.code && (
                        <Badge className="bg-teal-700 text-white text-[10px] px-1.5 py-0 h-4 font-mono font-bold">
                          {vac.code}
                        </Badge>
                      )}
                      {vac.category && (
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0 h-4 border-teal-300 dark:border-teal-800 text-teal-700 dark:text-teal-300 font-medium"
                        >
                          {CATEGORY_METADATA[vac.category as ImmunizationCategory]?.shortLabel || vac.category}
                        </Badge>
                      )}
                    </div>

                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Dose:{' '}
                      <span className="text-slate-900 dark:text-white font-bold">
                        {vac.dose || vac.doseNumber}
                      </span>
                      {vac.route && vac.route !== 'N/A' && ` (${vac.route})`}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold">
                      Date Given:{' '}
                      <span className="text-slate-900 dark:text-white font-bold">
                        {vac.dateGiven
                          ? new Date(vac.dateGiven).toLocaleDateString(undefined, {
                              dateStyle: 'medium',
                            })
                          : '—'}
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
                    onClick={() => handleDelete(vac.id, vac.vaccine || vac.vaccineName)}
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
            <div className="text-center py-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/5">
              <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold">
                No vaccination history logged. Click &ldquo;Add Vaccination&rdquo; to record.
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
