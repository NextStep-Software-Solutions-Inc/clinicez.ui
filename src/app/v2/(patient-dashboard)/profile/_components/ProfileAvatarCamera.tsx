'use client'

import { useCallback, useRef, useState } from 'react'
import Cropper from 'react-easy-crop'
import type { Area, Point } from 'react-easy-crop'
import { Camera, Loader2, ZoomIn, ZoomOut } from 'lucide-react'
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

const OUTPUT_SIZE = 512
const MIN_ZOOM = 1.0
const MAX_ZOOM = 4.0
const ZOOM_STEP = 0.2

interface CropModalProps {
  objectUrl: string
  onConfirm: (file: File) => void
  onCancel: () => void
}

async function cropImageToFile(imageSrc: string, pixelCrop: Area): Promise<File> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = imageSrc
  })

  const canvas = document.createElement('canvas')
  canvas.width = OUTPUT_SIZE
  canvas.height = OUTPUT_SIZE
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas context unavailable')

  ctx.drawImage(
    image,
    pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
    0, 0, OUTPUT_SIZE, OUTPUT_SIZE,
  )

  return new Promise<File>((resolve, reject) => {
    canvas.toBlob(
      (blob) => blob
        ? resolve(new File([blob], 'cropped.jpg', { type: 'image/jpeg' }))
        : reject(new Error('Canvas toBlob failed')),
      'image/jpeg',
      0.92,
    )
  })
}

function ImageCropModal({ objectUrl, onConfirm, onCancel }: CropModalProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels)
  }, [])

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return
    const file = await cropImageToFile(objectUrl, croppedAreaPixels)
    onConfirm(file)
  }

  const zoomPercent = Math.round(zoom * 100)

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 w-full max-w-xs shadow-2xl">
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">Crop Photo</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Drag to reposition · pinch or use slider to zoom</p>

        {/* Crop area */}
        <div className="relative mx-auto rounded-full overflow-hidden" style={{ width: 260, height: 260 }}>
          <Cropper
            image={objectUrl}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            minZoom={MIN_ZOOM}
            maxZoom={MAX_ZOOM}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            style={{
              containerStyle: { width: '100%', height: '100%', borderRadius: '50%' },
              cropAreaStyle: { border: '4px solid rgb(20 184 166)', borderRadius: '50%' },
            }}
          />
        </div>

        {/* Zoom controls */}
        <div className="flex items-center gap-2 mt-4">
          <button
            type="button"
            aria-label="Zoom out"
            onClick={() => setZoom(z => Math.max(MIN_ZOOM, z - ZOOM_STEP))}
            className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shrink-0"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <input
            type="range"
            min={MIN_ZOOM}
            max={MAX_ZOOM}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            className="flex-1 accent-teal-500"
            aria-label="Zoom level"
          />
          <button
            type="button"
            aria-label="Zoom in"
            onClick={() => setZoom(z => Math.min(MAX_ZOOM, z + ZOOM_STEP))}
            className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shrink-0"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 w-10 text-right shrink-0">
            {zoomPercent}%
          </span>
        </div>

        <div className="flex gap-3 mt-4">
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
    if (!cropData) return
    const { objectUrl } = cropData
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
