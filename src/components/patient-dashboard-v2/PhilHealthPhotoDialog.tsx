'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface PhilHealthPhotoDialogProps {
  photoUrl: string | null
  isOpen: boolean
  onClose: () => void
}

export function PhilHealthPhotoDialog({ photoUrl, isOpen, onClose }: PhilHealthPhotoDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white/30 dark:bg-slate-900/30 border border-slate-300/30 dark:border-white/20">
        <DialogHeader>
          <DialogTitle className="text-slate-900 dark:text-white">PhilHealth ID Card</DialogTitle>
        </DialogHeader>
        {photoUrl && (
          <div className="flex justify-center">
            <img 
              src={photoUrl} 
              alt="PhilHealth ID Card" 
              className="w-full rounded-lg border border-slate-200/10 dark:border-slate-700"
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
