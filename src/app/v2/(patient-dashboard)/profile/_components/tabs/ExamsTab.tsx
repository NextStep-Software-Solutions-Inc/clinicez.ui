'use client'

import { Eye, Stethoscope } from 'lucide-react'
import type { ExamsTabData } from '@/types/patient-profile-tabs'
import { useEffect, useState } from 'react'
import { getPhysicalExamLibrariesAction } from '@/actions/super-admin/physical-exam-library.action'

type Props = { data: ExamsTabData }



export function ExamsTab({ data }: Props) {
  const physicalExamRecords = data.physicalExaminations || []
  const [libraries, setLibraries] = useState<any[]>([])

  useEffect(() => {
    const fetchLibraries = async () => {
      try {
        const res = await getPhysicalExamLibrariesAction();
        if (res.data) {
          setLibraries(res.data);
        }
      } catch (error) {
        console.error("Failed to load physical exam library");
      }
    };
    fetchLibraries();
  }, []);

  return (
    <div className="space-y-6">
      {/* Physical Examination Section */}
      <div className="glassmorphic-card p-6">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white mb-2">
          <Stethoscope className="w-5 h-5 text-teal-500" /> Physical Examination
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
          Historical physical examination findings
        </p>

        {physicalExamRecords.length > 0 ? (
          <div className="space-y-4">
            {physicalExamRecords.map((pe, idx) => {
              const dateTime = new Date(pe.createdAt)
              const date = dateTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              const time = dateTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })

              const findings = [
                { label: 'General Survey', val: pe.generalSurveyId, remarks: pe.generalSurveyRemarks },
                { label: 'Head, Eyes, Ears, Nose, Throat', val: pe.heentId, remarks: pe.heentRemarks },
                { label: 'Chest/Lungs', val: pe.chestId, remarks: pe.chestRemarks },
                { label: 'Cardiovascular System', val: pe.heartId, remarks: pe.heartRemarks },
                { label: 'Abdomen', val: pe.abdomenId, remarks: pe.abdomenRemarks },
                { label: 'Genitourinary', val: pe.guId, remarks: pe.guRemarks },
                { label: 'Skin/Extremities', val: pe.skinId, remarks: pe.skinRemarks },
                { label: 'Neurological', val: pe.neuroId, remarks: pe.neuroRemarks },
                { label: 'Rectal', val: pe.rectalId, remarks: pe.rectalRemarks },
              ].filter(f => f.val || f.remarks)

              return (
                <div key={pe.id || idx} className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                  <div className="flex items-start justify-between mb-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{date}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{time}</p>
                    </div>
                  </div>

                  {findings.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {findings.map((finding, i) => (
                        <div key={i} className="flex flex-col">
                          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">
                            {finding.label}
                          </p>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">
                            {finding.val 
                              ? libraries.find(l => l.code === finding.val)?.description || `Code: ${finding.val}` 
                              : 'No code'}
                          </p>
                          {finding.remarks && (
                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                              {finding.remarks}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 italic">No specific findings recorded for this exam.</p>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-slate-600 dark:text-slate-400 text-center py-8">No physical examination records found</p>
        )}
      </div>

    </div>
  )
}
