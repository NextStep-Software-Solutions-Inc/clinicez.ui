'use client'

import { useRef, useState } from 'react'
import { Camera, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { uploadMediaAction } from '@/actions/blob.action'
import { updateClerkProfileImageAction } from '@/actions/users/update-profile-image.action'
import { compressImageAsync } from '@/lib/image-compression'

interface ProfileAvatarCameraProps {
  userId: string
  picture: string | null
  initials: string
}

/**
 * Avatar displayed on the Health Record (profile) page with an overlay camera
 * button that allows the patient to change their profile picture directly.
 * Compresses the image before uploading (same logic as ProfilePictureUpload).
 */
export function ProfileAvatarCamera({ userId, picture, initials }: ProfileAvatarCameraProps) {
  const [preview, setPreview] = useState<string | null>(picture)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (JPEG, PNG, etc.)')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size must be less than 10 MB')
      return
    }

    try {
      setIsUploading(true)

      // Show preview immediately
      const reader = new FileReader()
      reader.onloadend = () => setPreview(reader.result as string)
      reader.readAsDataURL(file)

      // Compress then upload
      toast.loading('Compressing image…', { id: 'avatar-upload' })
      const compressed = await compressImageAsync(file)

      toast.loading('Uploading…', { id: 'avatar-upload' })
      const formData = new FormData()
      formData.append('media', compressed)
      formData.append('directory', `${userId}/profile`)

      const uploadResult = await uploadMediaAction(formData)
      if (!uploadResult?.url) throw new Error('Upload failed')

      await updateClerkProfileImageAction(uploadResult.url, userId)
      toast.success('Profile picture updated', { id: 'avatar-upload' })
    } catch (err) {
      toast.error('Failed to update profile picture', { id: 'avatar-upload' })
      setPreview(picture)
      console.error(err)
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Change profile picture"
      className="relative group w-16 h-16 cursor-pointer"
      onClick={() => !isUploading && fileInputRef.current?.click()}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !isUploading) {
          e.preventDefault()
          fileInputRef.current?.click()
        }
      }}
    >
      {/* Avatar */}
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={preview}
          alt="Profile"
          className="w-16 h-16 rounded-2xl object-cover shadow-md border-2 border-white/30"
        />
      ) : (
        <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-2xl font-bold shadow-md border-2 border-white/30">
          {initials}
        </div>
      )}

      {/* Camera overlay */}
      <div className="absolute inset-0 rounded-2xl bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        {isUploading ? (
          <Loader2 className="w-5 h-5 text-white animate-spin" />
        ) : (
          <Camera className="w-5 h-5 text-white" />
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  )
}
