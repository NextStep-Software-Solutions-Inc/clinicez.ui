"use client"

import DownloadEkasButton from "@/components/v2/consultations/DownloadEkasButton"
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
}: EKASWrapperProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>eKAS & ePRESS Forms</CardTitle>
        <CardDescription>
          Download separate Electronic Konsulta Availment Slip (eKAS) or Electronic Prescription Slip (ePRESS) for this consultation.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <DownloadEkasButton
            ticketId={consultationTicketId}
            clinicUid={clinicUid}
          />
        </div>
      </CardContent>
    </Card>
  )
}
