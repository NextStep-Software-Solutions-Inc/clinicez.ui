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

// ── Image Crop Modal ──────────────────────────────────────────────────────────

const CROP_SIZE = 260 // display crop window (px, square)
const OUTPUT_SIZE = 512 // output image size

interface CropModalProps {
  objectUrl: string
  onConfirm: (file: File) => void
  onCancel: () => void
}

function ImageCropModal({ objectUrl, onConfirm, onCancel }: CropModalProps) {
  const imgRef = useRef<HTMLImageElement>(null)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [displaySize, setDisplaySize] = useState({ w: 0, h: 0 })
  const [naturalSize, setNaturalSize] = useState({ w: 0, h: 0 })
  const drag = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null)

  const handleImgLoad = () => {
    const img = imgRef.current
    if (!img) return
    const { naturalWidth: nw, naturalHeight: nh } = img
    setNaturalSize({ w: nw, h: nh })
    // Scale image to cover the crop window
    const scale = Math.max(CROP_SIZE / nw, CROP_SIZE / nh)
    const dw = nw * scale
    const dh = nh * scale
    setDisplaySize({ w: dw, h: dh })
    // Center the image
    setOffset({ x: -(dw - CROP_SIZE) / 2, y: -(dh - CROP_SIZE) / 2 })
  }

  const clampOffset = (ox: number, oy: number, dw: number, dh: number) => ({
    x: Math.min(0, Math.max(CROP_SIZE - dw, ox)),
    y: Math.min(0, Math.max(CROP_SIZE - dh, oy)),
  })

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault()
    drag.current = { sx: e.clientX, sy: e.clientY, ox: offset.x, oy: offset.y }
    ;(e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return
    const dx = e.clientX - drag.current.sx
    const dy = e.clientY - drag.current.sy
    setOffset(clampOffset(drag.current.ox + dx, drag.current.oy + dy, displaySize.w, displaySize.h))
  }

  const handlePointerUp = () => { drag.current = null }

  const handleConfirm = () => {
    const img = imgRef.current
    if (!img || !naturalSize.w || !displaySize.w) return

    const canvas = document.createElement('canvas')
    canvas.width = OUTPUT_SIZE
    canvas.height = OUTPUT_SIZE
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const scaleX = naturalSize.w / displaySize.w
    const scaleY = naturalSize.h / displaySize.h
    // offset is the image's top-left corner within the crop container (negative = shifted left/up)
    const srcX = (-offset.x) * scaleX
    const srcY = (-offset.y) * scaleY
    const srcW = CROP_SIZE * scaleX
    const srcH = CROP_SIZE * scaleY

    ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE)
    canvas.toBlob(
      (blob) => {
        if (blob) onConfirm(new File([blob], 'cropped.jpg', { type: 'image/jpeg' }))
      },
      'image/jpeg',
      0.92,
    )
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 w-full max-w-xs shadow-2xl">
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">Crop Photo</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Drag to reposition your photo</p>

        {/* Circular crop preview */}
        <div
          className="relative mx-auto overflow-hidden rounded-full border-4 border-teal-500 cursor-move touch-none select-none shadow-lg"
          style={{ width: CROP_SIZE, height: CROP_SIZE }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgRef}
            src={objectUrl}
            alt="Crop preview"
            onLoad={handleImgLoad}
            draggable={false}
            className="absolute"
            style={{
              width: displaySize.w || 'auto',
              height: displaySize.h || 'auto',
              left: offset.x,
              top: offset.y,
              userSelect: 'none',
              pointerEvents: 'none',
            }}
          />
        </div>

        <div className="flex gap-3 mt-5">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 h-11 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 h-11 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white text-sm font-semibold shadow-md shadow-teal-500/20 active:scale-95 transition-transform"
          >
            Use Photo
          </button>
        </div>
      </div>
    </div>
  )
}

// ── ProfileAvatarCamera ───────────────────────────────────────────────────────

/**
 * Avatar displayed on the Health Record (profile) page with an overlay camera
 * button that allows the patient to change their profile picture directly.
 * Shows a circular crop modal before uploading. Compresses the image before upload.
 */
export function ProfileAvatarCamera({ userId, picture, initials }: ProfileAvatarCameraProps) {
  const [preview, setPreview] = useState<string | null>(picture)
  const [isUploading, setIsUploading] = useState(false)
  const [cropData, setCropData] = useState<{ objectUrl: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    // Show crop modal instead of uploading directly
    const objectUrl = URL.createObjectURL(file)
    setCropData({ objectUrl })
    // Reset file input so the same file can be reselected after cancel
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleCropConfirm = async (croppedFile: File) => {
    const { objectUrl } = cropData!
    setCropData(null)

    try {
      setIsUploading(true)
      // Show preview from cropped file immediately
      const reader = new FileReader()
      reader.onloadend = () => setPreview(reader.result as string)
      reader.readAsDataURL(croppedFile)

      toast.loading('Compressing image…', { id: 'avatar-upload' })
      const compressed = await compressImageAsync(croppedFile)

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
      URL.revokeObjectURL(objectUrl)
    }
  }

  const handleCropCancel = () => {
    if (cropData) URL.revokeObjectURL(cropData.objectUrl)
    setCropData(null)
  }

  return (
    <>
      {/* Crop modal */}
      {cropData && (
        <ImageCropModal
          objectUrl={cropData.objectUrl}
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
        />
      )}

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

        {/* Camera overlay on hover */}
        <div className="absolute inset-0 rounded-2xl bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          {isUploading ? (
            <Loader2 className="w-5 h-5 text-white animate-spin" />
          ) : (
            <Camera className="w-5 h-5 text-white" />
          )}
        </div>

        {/* Persistent camera badge for mobile touch discoverability */}
        <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-teal-500 border-2 border-white dark:border-slate-900 flex items-center justify-center shadow-sm pointer-events-none z-10">
          <Camera className="w-3 h-3 text-white" />
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
    </>
  )
}
