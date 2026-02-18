'use client'

import React, { useState, useRef } from 'react'
import { uploadMediaAction } from '@/actions/blob.action'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Upload, X, Loader2 } from 'lucide-react'
import Image from 'next/image'

export interface ProfilePictureUploadProps {
  userId: string
  currentPicture?: string | null
  onSuccess?: (pictureUrl: string) => void
  onError?: (error: string) => void
}

/**
 * ProfilePictureUpload - Manage profile picture
 * Allows uploading and updating profile picture/avatar
 */
export function ProfilePictureUpload({
  userId,
  currentPicture,
  onSuccess,
  onError,
}: ProfilePictureUploadProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentPicture || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      const errorMsg = 'Please select an image file (JPEG, PNG, etc.)'
      toast.error(errorMsg)
      onError?.(errorMsg)
      return
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      const errorMsg = 'Image size must be less than 5MB'
      toast.error(errorMsg)
      onError?.(errorMsg)
      return
    }

    try {
      setIsLoading(true)

      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(file)

      // Upload file
      const formData = new FormData()
      formData.append('media', file)
      formData.append('directory', `${userId}/profile`)

      const uploadResult = await uploadMediaAction(formData)
      if (uploadResult && uploadResult.url) {
        toast.success('Profile picture updated successfully')
        onSuccess?.(uploadResult.url)
      } else {
        throw new Error('Failed to upload image')
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to upload image'
      toast.error(errorMsg)
      onError?.(errorMsg)
      setPreview(currentPicture || null)
    } finally {
      setIsLoading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemovePicture = () => {
    setPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        {/* Current/Preview Picture */}
        <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-slate-200 dark:border-slate-700 flex-shrink-0">
          {preview ? (
            <Image
              src={preview}
              alt="Profile preview"
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-300 to-slate-400 dark:from-slate-600 dark:to-slate-700 flex items-center justify-center">
              <span className="text-3xl text-slate-600 dark:text-slate-300">👤</span>
            </div>
          )}
          {preview && (
            <button
              onClick={handleRemovePicture}
              disabled={isLoading}
              className="absolute top-1 right-1 p-1 bg-red-500 hover:bg-red-600 rounded-full text-white transition-colors disabled:opacity-50"
              title="Remove picture"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Upload Controls */}
        <div className="flex-1 space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            disabled={isLoading}
            className="hidden"
            aria-label="Upload profile picture"
          />

          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Choose Picture
              </>
            )}
          </Button>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            JPG, PNG or GIF (Max 5MB)
          </p>
        </div>
      </div>
    </div>
  )
}
