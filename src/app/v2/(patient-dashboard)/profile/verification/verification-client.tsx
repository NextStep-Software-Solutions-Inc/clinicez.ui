'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShieldCheck, ShieldQuestion, ShieldAlert, Shield, Upload, Plus, Trash2, FileCheck, X, Loader2, ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { submitVerificationRequestAction } from '@/actions/verification/user-verification.action'
import { uploadMediaAction } from '@/actions/blob.action'
import { getActionErrorMessage } from '@/lib/action-error'
import type { VerificationStatus, ValidIDLevel } from '@prisma/client'
import { formatDistanceToNow } from 'date-fns'
import Image from 'next/image'

// ── Types ──────────────────────────────────────────────────────────────────────

interface ValidIdType {
  id: number
  name: string
  level: ValidIDLevel
  description: string | null
  automatedVerification: boolean
}

interface LatestRequest {
  id: number
  status: VerificationStatus
  reviewerNotes: string | null
  reviewedAt: Date | null
  createdAt: Date
  VerificationDocuments: Array<{
    id: number
    ValidIDType: { id: number; name: string; level: ValidIDLevel }
  }>
}

interface DocumentEntry {
  key: string
  validIdTypeId: string
  idPhotoUrl: string
  selfieWithIdUrl: string
  selfieWithoutIdUrl: string
  // Upload loading states per photo field
  idPhotoUploading: boolean
  selfieWithIdUploading: boolean
  selfieWithoutIdUploading: boolean
}

interface VerificationClientProps {
  userId: string
  verificationStatus: VerificationStatus
  verifiedAt: string | null
  latestRequest: LatestRequest | null
  validIdTypes: ValidIdType[]
}

// ── Status Config ──────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<VerificationStatus, {
  label: string
  description: string
  icon: typeof ShieldCheck
  badgeClass: string
  cardClass: string
}> = {
  VERIFIED: {
    label: 'Verified',
    description: 'Your identity has been verified. Your account is trusted.',
    icon: ShieldCheck,
    badgeClass: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800',
    cardClass: 'border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20',
  },
  PENDING: {
    label: 'Pending Review',
    description: 'Your verification request is being reviewed. You will be notified once it is processed.',
    icon: ShieldQuestion,
    badgeClass: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
    cardClass: 'border-yellow-200 dark:border-yellow-800 bg-yellow-50/50 dark:bg-yellow-950/20',
  },
  REJECTED: {
    label: 'Rejected',
    description: 'Your previous verification request was not approved. You can submit a new request below.',
    icon: ShieldAlert,
    badgeClass: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800',
    cardClass: 'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20',
  },
  UNVERIFIED: {
    label: 'Unverified',
    description: 'Your identity has not been verified yet. Submit your documents below to get verified.',
    icon: Shield,
    badgeClass: 'bg-slate-100 text-slate-600 dark:bg-slate-800/50 dark:text-slate-400 border-slate-200 dark:border-slate-700',
    cardClass: 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/20',
  },
}

const MAX_FILE_SIZE_MB = 5
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024

// ── ImageUploadField ───────────────────────────────────────────────────────────

interface ImageUploadFieldProps {
  label: string
  helpText: string
  value: string
  isUploading: boolean
  onUploaded: (url: string) => void
  onUploadStart: () => void
  onUploadFailed: () => void
  onClear: () => void
  userId: string
}

function ImageUploadField({
  label,
  helpText,
  value,
  isUploading,
  onUploaded,
  onUploadStart,
  onUploadFailed,
  onClear,
  userId,
}: ImageUploadFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (JPEG, PNG, etc.)')
      return
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      toast.error(`Image size must be less than ${MAX_FILE_SIZE_MB}MB`)
      return
    }

    onUploadStart()

    try {
      // Sanitize userId before using it as a path segment
      const safeUserId = userId.replace(/[^a-zA-Z0-9_-]/g, '')
      const formData = new FormData()
      formData.append('media', file)
      formData.append('directory', `${safeUserId}/verification`)

      const result = await uploadMediaAction(formData)
      if (result?.url) {
        onUploaded(result.url)
      } else {
        throw new Error('Upload failed: no URL returned')
      }
    } catch (err) {
      toast.error(getActionErrorMessage(err, 'Failed to upload image. Please try again.'))
      // Only reset the uploading state — do NOT clear an existing uploaded image
      onUploadFailed()
    } finally {
      // Reset the input so the same file can be re-selected if needed
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <p className="text-xs text-slate-500 dark:text-slate-400">{helpText}</p>

      {value ? (
        // Uploaded — show preview with replace/remove option
        <div className="relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
          <div className="relative w-full h-40">
            <Image
              src={value}
              alt={label}
              fill
              className="object-contain"
            />
          </div>
          <div className="absolute top-2 right-2 flex gap-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-700 rounded-md shadow-sm transition-colors"
              title="Replace image"
            >
              <Upload className="h-3.5 w-3.5 text-slate-600 dark:text-slate-300" />
            </button>
            <button
              type="button"
              onClick={onClear}
              className="p-1.5 bg-white/80 dark:bg-slate-800/80 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-md shadow-sm transition-colors"
              title="Remove image"
            >
              <X className="h-3.5 w-3.5 text-red-500" />
            </button>
          </div>
        </div>
      ) : (
        // Empty — show upload dropzone
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="w-full rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500 bg-slate-50 dark:bg-slate-900/50 hover:bg-blue-50/30 dark:hover:bg-blue-950/20 transition-colors p-6 flex flex-col items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
              <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">Uploading…</span>
            </>
          ) : (
            <>
              <ImageIcon className="h-8 w-8 text-slate-400" />
              <span className="text-sm text-slate-600 dark:text-slate-300 font-medium">Click to upload</span>
              <span className="text-xs text-slate-400">JPG, PNG (max {MAX_FILE_SIZE_MB}MB)</span>
            </>
          )}
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        disabled={isUploading}
        aria-label={`Upload ${label}`}
      />
    </div>
  )
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function createEmptyDocument(): DocumentEntry {
  return {
    key: crypto.randomUUID(),
    validIdTypeId: '',
    idPhotoUrl: '',
    selfieWithIdUrl: '',
    selfieWithoutIdUrl: '',
    idPhotoUploading: false,
    selfieWithIdUploading: false,
    selfieWithoutIdUploading: false,
  }
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function VerificationClient({
  userId,
  verificationStatus,
  verifiedAt,
  latestRequest,
  validIdTypes,
}: VerificationClientProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [documents, setDocuments] = useState<DocumentEntry[]>([createEmptyDocument()])

  const statusConfig = STATUS_CONFIG[verificationStatus]
  const StatusIcon = statusConfig.icon
  const canSubmit = verificationStatus === 'UNVERIFIED' || verificationStatus === 'REJECTED'

  const primaryIds = validIdTypes.filter((t) => t.level === 'PRIMARY')
  const secondaryIds = validIdTypes.filter((t) => t.level === 'SECONDARY')

  const isAnyUploading = documents.some(
    (d) => d.idPhotoUploading || d.selfieWithIdUploading || d.selfieWithoutIdUploading
  )

  const addDocument = () => setDocuments((prev) => [...prev, createEmptyDocument()])

  const removeDocument = (key: string) =>
    setDocuments((prev) => prev.filter((d) => d.key !== key))

  const updateDocument = <K extends keyof DocumentEntry>(key: string, field: K, value: DocumentEntry[K]) => {
    setDocuments((prev) =>
      prev.map((d) => (d.key === key ? { ...d, [field]: value } : d))
    )
  }

  const handleSubmit = async () => {
    const validDocs = documents.filter(
      (d) => d.validIdTypeId && d.idPhotoUrl && d.selfieWithIdUrl && d.selfieWithoutIdUrl
    )

    if (validDocs.length === 0) {
      toast.error('Please complete at least one document with all required photo uploads.')
      return
    }

    setIsSubmitting(true)
    try {
      const result = await submitVerificationRequestAction(
        validDocs.map((d) => ({
          validIdTypeId: parseInt(d.validIdTypeId, 10),
          idPhotoUrl: d.idPhotoUrl,
          selfieWithIdUrl: d.selfieWithIdUrl,
          selfieWithoutIdUrl: d.selfieWithoutIdUrl,
        }))
      )

      if (result.status) {
        toast.success(result.message)
        router.refresh()
      } else {
        toast.error(result.message || 'Failed to submit verification request')
      }
    } catch (error) {
      toast.error(getActionErrorMessage(error, 'Failed to submit verification request'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full max-w-3xl mx-auto pt-2">
      {/* Current Status Card */}
      <Card className={`mb-6 ${statusConfig.cardClass}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <StatusIcon className="h-8 w-8 text-current opacity-70" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">Verification Status</CardTitle>
                <Badge variant="outline" className={`text-xs font-medium ${statusConfig.badgeClass}`}>
                  {statusConfig.label}
                </Badge>
              </div>
              <CardDescription className="mt-1">{statusConfig.description}</CardDescription>
            </div>
          </div>
        </CardHeader>
        {(verifiedAt || latestRequest) && (
          <CardContent className="pt-0">
            <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
              {verifiedAt && (
                <p>Verified {formatDistanceToNow(new Date(verifiedAt), { addSuffix: true })}</p>
              )}
              {latestRequest?.createdAt && (
                <p>
                  Last request submitted{' '}
                  {formatDistanceToNow(new Date(latestRequest.createdAt), { addSuffix: true })}
                </p>
              )}
              {latestRequest?.reviewerNotes && latestRequest.status === 'REJECTED' && (
                <div className="mt-2 p-2 bg-red-50 dark:bg-red-950/30 rounded text-red-700 dark:text-red-400 text-sm">
                  <strong>Reviewer notes:</strong> {latestRequest.reviewerNotes}
                </div>
              )}
              {latestRequest?.VerificationDocuments && latestRequest.VerificationDocuments.length > 0 && (
                <div className="mt-2">
                  <p className="font-medium text-slate-600 dark:text-slate-300">Documents submitted:</p>
                  <ul className="mt-1 space-y-0.5">
                    {latestRequest.VerificationDocuments.map((doc) => (
                      <li key={doc.id} className="flex items-center gap-1">
                        <FileCheck className="h-3 w-3" />
                        {doc.ValidIDType.name}
                        <Badge variant="outline" className="text-[10px] ml-1">
                          {doc.ValidIDType.level}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Submission Form — only show for UNVERIFIED or REJECTED */}
      {canSubmit && (
        <>
          <Separator className="my-6" />

          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Submit for Verification
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Upload photos of your valid ID, a selfie holding the ID, and a selfie without the ID.
                At least one document set is required.
              </p>
            </div>

            {/* Document entries */}
            {documents.map((doc, index) => (
              <Card key={doc.key} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">
                      Document #{index + 1}
                    </CardTitle>
                    {documents.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                        onClick={() => removeDocument(doc.key)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  {/* ID Type Selection */}
                  <div className="space-y-2">
                    <Label>Valid ID Type <span className="text-red-500">*</span></Label>
                    <Select
                      value={doc.validIdTypeId}
                      onValueChange={(val) => updateDocument(doc.key, 'validIdTypeId', val)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select an ID type..." />
                      </SelectTrigger>
                      <SelectContent>
                        {primaryIds.length > 0 && (
                          <>
                            <div className="px-2 py-1.5 text-xs font-semibold text-slate-500">
                              Primary IDs
                            </div>
                            {primaryIds.map((idType) => (
                              <SelectItem key={idType.id} value={String(idType.id)}>
                                <div className="flex items-center gap-2">
                                  <span>{idType.name}</span>
                                  {idType.automatedVerification && (
                                    <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400">
                                      Auto
                                    </Badge>
                                  )}
                                </div>
                              </SelectItem>
                            ))}
                          </>
                        )}
                        {secondaryIds.length > 0 && (
                          <>
                            <div className="px-2 py-1.5 text-xs font-semibold text-slate-500 mt-1">
                              Secondary IDs
                            </div>
                            {secondaryIds.map((idType) => (
                              <SelectItem key={idType.id} value={String(idType.id)}>
                                {idType.name}
                              </SelectItem>
                            ))}
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Photo Upload Fields */}
                  <ImageUploadField
                    label="ID Photo *"
                    helpText="A clear photo of your valid government-issued ID"
                    value={doc.idPhotoUrl}
                    isUploading={doc.idPhotoUploading}
                    userId={userId}
                    onUploadStart={() => updateDocument(doc.key, 'idPhotoUploading', true)}
                    onUploaded={(url) => {
                      updateDocument(doc.key, 'idPhotoUrl', url)
                      updateDocument(doc.key, 'idPhotoUploading', false)
                    }}
                    onUploadFailed={() => updateDocument(doc.key, 'idPhotoUploading', false)}
                    onClear={() => {
                      updateDocument(doc.key, 'idPhotoUrl', '')
                      updateDocument(doc.key, 'idPhotoUploading', false)
                    }}
                  />

                  <ImageUploadField
                    label="Selfie Holding Your ID *"
                    helpText="A photo of you clearly holding your ID next to your face"
                    value={doc.selfieWithIdUrl}
                    isUploading={doc.selfieWithIdUploading}
                    userId={userId}
                    onUploadStart={() => updateDocument(doc.key, 'selfieWithIdUploading', true)}
                    onUploaded={(url) => {
                      updateDocument(doc.key, 'selfieWithIdUrl', url)
                      updateDocument(doc.key, 'selfieWithIdUploading', false)
                    }}
                    onUploadFailed={() => updateDocument(doc.key, 'selfieWithIdUploading', false)}
                    onClear={() => {
                      updateDocument(doc.key, 'selfieWithIdUrl', '')
                      updateDocument(doc.key, 'selfieWithIdUploading', false)
                    }}
                  />

                  <ImageUploadField
                    label="Selfie Without ID *"
                    helpText="A plain selfie of your face without holding anything"
                    value={doc.selfieWithoutIdUrl}
                    isUploading={doc.selfieWithoutIdUploading}
                    userId={userId}
                    onUploadStart={() => updateDocument(doc.key, 'selfieWithoutIdUploading', true)}
                    onUploaded={(url) => {
                      updateDocument(doc.key, 'selfieWithoutIdUrl', url)
                      updateDocument(doc.key, 'selfieWithoutIdUploading', false)
                    }}
                    onUploadFailed={() => updateDocument(doc.key, 'selfieWithoutIdUploading', false)}
                    onClear={() => {
                      updateDocument(doc.key, 'selfieWithoutIdUrl', '')
                      updateDocument(doc.key, 'selfieWithoutIdUploading', false)
                    }}
                  />
                </CardContent>
              </Card>
            ))}

            <Button
              variant="outline"
              className="w-full"
              onClick={addDocument}
              disabled={isAnyUploading}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Another Document
            </Button>

            <Button
              className="w-full"
              size="lg"
              onClick={handleSubmit}
              disabled={isSubmitting || isAnyUploading}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting…
                </>
              ) : isAnyUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading images…
                </>
              ) : (
                'Submit for Verification'
              )}
            </Button>
          </div>
        </>
      )}

      {/* Pending state — cannot resubmit */}
      {verificationStatus === 'PENDING' && (
        <Card className="mt-6 border-yellow-200 dark:border-yellow-800 bg-yellow-50/30 dark:bg-yellow-950/10">
          <CardContent className="flex items-center gap-3 py-6">
            <ShieldQuestion className="h-6 w-6 text-yellow-600 dark:text-yellow-400 shrink-0" />
            <p className="text-sm text-yellow-800 dark:text-yellow-300">
              Your verification request is currently under review. You will receive a notification once it has been processed.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
