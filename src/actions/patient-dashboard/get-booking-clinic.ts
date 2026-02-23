'use server'

import { currentUser } from '@clerk/nextjs/server'
import prisma from '@/lib/prisma'
import { withErrorHandling } from '@/lib/with-error-handling'

/**
 * Fetch the clinic name and associated organisation T&C / privacy URLs
 * needed to render the book-appointment page server-side.
 */
export type GetBookingClinicResult = Awaited<ReturnType<typeof getBookingClinicAction>>

export const getBookingClinicAction = withErrorHandling(
  async ({ clinicUid }: { clinicUid: string }) => {
    const user = await currentUser()
    if (!user?.id) throw new Error('Unauthorized')

    const clinic = await prisma.clinic.findUnique({
      where: { clinicUid },
      select: {
        name: true,
        ClinicOrganizations: {
          where: { isActive: true, deletedAt: null },
          take: 1,
          select: {
            Organization: {
              select: {
                termsAndConditionsUrl: true,
                privacyPolicyUrl: true,
              },
            },
          },
        },
      },
    })

    if (!clinic) throw new Error('Clinic not found')

    const org = clinic.ClinicOrganizations[0]?.Organization

    return {
      message: 'Clinic fetched',
      data: {
        clinicName: clinic.name,
        termsUrl: org?.termsAndConditionsUrl ?? null,
        privacyUrl: org?.privacyPolicyUrl ?? null,
      },
    }
  }
)
