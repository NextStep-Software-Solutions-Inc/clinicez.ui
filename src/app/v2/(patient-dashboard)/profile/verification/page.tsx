import { redirect } from 'next/navigation'
import { currentUser } from '@clerk/nextjs/server'
import prisma from '@/lib/prisma'
import VerificationClient from './verification-client'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Identity Verification | Clinic EZ',
  description: 'Submit your identity documents for verification',
}

export default async function VerificationPage() {
  const user = await currentUser()
  if (!user?.id) redirect('/sign-in')

  const dbUser = await prisma.user.findUnique({
    where: { userId: user.id },
    select: {
      id: true,
      userId: true,
      firstName: true,
      lastName: true,
      verificationStatus: true,
      verifiedAt: true,
      VerificationRequests: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: {
          id: true,
          status: true,
          reviewerNotes: true,
          reviewedAt: true,
          createdAt: true,
          VerificationDocuments: {
            select: {
              id: true,
              ValidIDType: {
                select: { id: true, name: true, level: true },
              },
            },
          },
        },
      },
    },
  })

  if (!dbUser) redirect('/user-sync-error')

  const validIdTypes = await prisma.validIDType.findMany({
    where: { isActive: true },
    orderBy: [{ level: 'asc' }, { name: 'asc' }],
    select: {
      id: true,
      name: true,
      level: true,
      description: true,
      automatedVerification: true,
    },
  })

  return (
    <VerificationClient
      userId={dbUser.userId}
      verificationStatus={dbUser.verificationStatus}
      verifiedAt={dbUser.verifiedAt?.toISOString() ?? null}
      latestRequest={dbUser.VerificationRequests[0] ?? null}
      validIdTypes={validIdTypes}
    />
  )
}
