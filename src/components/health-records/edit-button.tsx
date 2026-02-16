'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Edit2 } from 'lucide-react'

export interface EditButtonProps {
  label?: string
  onClick: () => void
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'outline' | 'ghost'
}

/**
 * EditButton - Trigger button to open edit forms
 * User-centric: Clear icon, accessible label, permission-aware
 */
export function EditButton({
  label = 'Edit',
  onClick,
  disabled = false,
  size = 'sm',
  variant = 'outline',
}: EditButtonProps) {
  const sizeClass = {
    sm: 'h-8 px-2 text-xs',
    md: 'h-9 px-3 text-sm',
    lg: 'h-10 px-4 text-base',
  }[size]

  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      variant={variant}
      className={sizeClass}
      title={`Edit ${label.toLowerCase()}`}
    >
      <Edit2 className="mr-1.5 h-3.5 w-3.5" />
      {label}
    </Button>
  )
}
