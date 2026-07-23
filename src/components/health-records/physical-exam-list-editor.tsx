'use client'

import React, { useState } from 'react'
import { Plus, Pencil, Calendar, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PhysicalExamEditForm } from './physical-exam-edit-form'
import { format } from 'date-fns'

interface PhysicalExam {
  id: string;
  createdAt: string;
  generalSurveyId: string | null;
  generalSurveyRemarks: string | null;
  heentId: string | null;
  heentRemarks: string | null;
  chestId: string | null;
  chestRemarks: string | null;
  heartId: string | null;
  heartRemarks: string | null;
  abdomenId: string | null;
  abdomenRemarks: string | null;
  guId: string | null;
  guRemarks: string | null;
  skinId: string | null;
  skinRemarks: string | null;
  neuroId: string | null;
  neuroRemarks: string | null;
  rectalId: string | null;
  rectalRemarks: string | null;
}

export interface PhysicalExamListEditorProps {
  patientId: number;
  physicalExaminations: PhysicalExam[];
  onSuccess?: () => void;
}

export function PhysicalExamListEditor({ patientId, physicalExaminations, onSuccess }: PhysicalExamListEditorProps) {
  const [activeExamId, setActiveExamId] = useState<string | 'new' | null>(null);

  const handleSuccess = () => {
    setActiveExamId(null);
    if (onSuccess) onSuccess();
  };

  if (activeExamId === 'new') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Add New Physical Examination</h3>
          <Button variant="outline" size="sm" onClick={() => setActiveExamId(null)}>Cancel</Button>
        </div>
        <PhysicalExamEditForm
          patientId={patientId}
          initialData={null}
          onSuccess={handleSuccess}
        />
      </div>
    );
  }

  if (activeExamId) {
    const exam = physicalExaminations.find(e => e.id === activeExamId);
    if (exam) {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Edit Physical Examination</h3>
            <Button variant="outline" size="sm" onClick={() => setActiveExamId(null)}>Cancel</Button>
          </div>
          <PhysicalExamEditForm
            patientId={patientId}
            examId={exam.id}
            initialData={{
              generalSurveyId: exam.generalSurveyId || "",
              generalSurveyRemarks: exam.generalSurveyRemarks || "",
              heentId: exam.heentId || "",
              heentRemarks: exam.heentRemarks || "",
              chestId: exam.chestId || "",
              chestRemarks: exam.chestRemarks || "",
              heartId: exam.heartId || "",
              heartRemarks: exam.heartRemarks || "",
              abdomenId: exam.abdomenId || "",
              abdomenRemarks: exam.abdomenRemarks || "",
              guId: exam.guId || "",
              guRemarks: exam.guRemarks || "",
              skinId: exam.skinId || "",
              skinRemarks: exam.skinRemarks || "",
              neuroId: exam.neuroId || "",
              neuroRemarks: exam.neuroRemarks || "",
              rectalId: exam.rectalId || "",
              rectalRemarks: exam.rectalRemarks || "",
            }}
            onSuccess={handleSuccess}
          />
        </div>
      );
    }
  }

  return (
    <div className="space-y-4">
      {physicalExaminations.length === 0 ? (
        <div className="text-center p-8 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-dashed border-slate-200 dark:border-slate-700">
          <p className="text-slate-500 dark:text-slate-400 mb-4">No physical examination records found.</p>
          <Button onClick={() => setActiveExamId('new')}>
            <Plus className="w-4 h-4 mr-2" />
            Add Physical Examination
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {physicalExaminations.map((exam) => (
            <div 
              key={exam.id}
              className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-4">
                <div className="p-2 bg-teal-100 dark:bg-teal-900/30 text-teal-600 rounded-full">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-medium text-slate-900 dark:text-white">
                    {format(new Date(exam.createdAt), "MMM d, yyyy 'at' h:mm a")}
                  </h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Physical Examination Record
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setActiveExamId(exam.id)}>
                <Pencil className="w-4 h-4 mr-2" />
                Edit
              </Button>
            </div>
          ))}
          <div className="pt-2">
            <Button variant="outline" className="w-full" onClick={() => setActiveExamId('new')}>
              <Plus className="w-4 h-4 mr-2" />
              Add New Record
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
