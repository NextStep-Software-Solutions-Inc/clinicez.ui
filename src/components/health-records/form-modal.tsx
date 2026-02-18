'use client'

import React, { ReactNode } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

export interface FormModalProps {
  isOpen: boolean
  title: string
  description?: string
  onClose: () => void
  onSubmit: () => Promise<void>
  isLoading?: boolean
  submitLabel?: string
  submitDisabled?: boolean
  cancelLabel?: string
  children: ReactNode
  size?: 'default' | 'sm' | 'lg'
}

/**
 * FormModal - Reusable modal wrapper for editing forms
 * User-centric: Clear title, manageable form size, responsive loading state
 */
export function FormModal({
  isOpen,
  title,
  description,
  onClose,
  onSubmit,
  isLoading = false,
  submitLabel = 'Save Changes',
  submitDisabled = false,
  cancelLabel = 'Cancel',
  children,
  size = 'default',
}: FormModalProps) {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit()
  }

  const sizeClass = {
    sm: 'max-w-sm',
    default: 'max-w-md',
    lg: 'max-w-lg',
  }[size]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={sizeClass}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {children}

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              {cancelLabel}
            </Button>
            <Button type="submit" disabled={isLoading || submitDisabled}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
