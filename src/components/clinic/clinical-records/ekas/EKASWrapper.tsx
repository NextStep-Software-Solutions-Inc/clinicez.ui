"use client"

import { DownloadEKASButton } from "@/components/patient/DownloadEKASButton"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface EKASWrapperProps {
  consultationTicketId: number
  clinicUid: string
  userId?: number
  userInfo?: {
    firstName: string | null
    middleName?: string | null
    lastName?: string | null
    suffix?: string | null
  } | null
  appointment?: {
    Requesters?: Array<{
      User?: {
        userId?: string
        firstName?: string | null
        lastName?: string | null
      }
    }>
    Clinic?: {
      id?: number
    }
  } | null
}

export default function EKASWrapper({
  consultationTicketId,
  clinicUid,
  userInfo,
  appointment
}: EKASWrapperProps) {
  const patient = appointment?.Requesters?.[0]?.User
  const userId = patient?.userId || ""
  const clinicId = appointment?.Clinic?.id || 0
  const patientName = `${userInfo?.lastName || patient?.lastName || ''}, ${userInfo?.firstName || patient?.firstName || ''}`.trim()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Electronic Yakap Availment Slip (EKAS) and Electronic Prescription Slip (EPRESS)</CardTitle>
        <CardDescription>
          Download the Electronic Yakap Availment Slip for this consultation.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <DownloadEKASButton
            userId={userId}
            consultationTicketId={consultationTicketId}
            clinicId={clinicId}
            patientName={patientName}
          />
          <p className="text-sm text-muted-foreground">
            Generate EKAS with transaction number and authorization code
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
