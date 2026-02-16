'use client'

import React, { ReactNode } from 'react'
import { Label } from '@/components/ui/label'
import { AlertCircle, HelpCircle } from 'lucide-react'

export interface FormFieldProps {
  label: string
  children: ReactNode
  error?: string
  required?: boolean
  helpText?: string
  htmlFor?: string
}

/**
 * FormField - Wrapper for form fields with label, error, and help text
 * User-centric: Clear structure, accessible labeling, helpful error messages
 */
export function FormField({
  label,
  children,
  error,
  required = false,
  helpText,
  htmlFor,
}: FormFieldProps) {
  return (
    <div className="space-y-2.5">
      <Label htmlFor={htmlFor} className="text-sm font-semibold text-slate-700 dark:text-slate-300">
        {label}
        {required && <span className="ml-1.5 text-red-500 font-bold">*</span>}
      </Label>

      <div className="relative">
        {children}
      </div>

      {error && (
        <div className="flex items-start gap-2.5 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 p-3">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600 dark:text-red-400" />
          <p className="text-sm font-medium text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {helpText && !error && (
        <div className="flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400">
          <HelpCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
          <p>{helpText}</p>
        </div>
      )}
    </div>
  )
}
