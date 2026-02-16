'use server'

import prisma from '@/lib/prisma'

interface HealthCondition {
  id: number
  name: string
  usageCount: number
}

/**
 * Fetch all health conditions sorted by most-used first
 * @returns Array of health conditions with usage count, separated into frequently used and others
 */
export async function getHealthConditionsAction(): Promise<{
  success: boolean
  topConditions?: HealthCondition[]
  otherConditions?: HealthCondition[]
  error?: string
}> {
  try {
    const conditions = await prisma.healthCondition.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            MedicalHistories: true,
          },
        },
      },
      orderBy: [
        {
          MedicalHistories: {
            _count: 'desc',
          },
        },
        {
          name: 'asc',
        },
      ],
    })

    const formattedConditions: HealthCondition[] = conditions.map((c: typeof conditions[number]) => ({
      id: c.id,
      name: c.name,
      usageCount: c._count.MedicalHistories,
    }))

    // Separate conditions: frequently used (count > 0) and others (count = 0)
    const topConditions = formattedConditions.filter((c) => c.usageCount > 0)
    const otherConditions = formattedConditions.filter((c) => c.usageCount === 0)

    return {
      success: true,
      topConditions,
      otherConditions,
    }
  } catch (error) {
    console.error('[GET_HEALTH_CONDITIONS_ERROR]', error)
    return {
      success: false,
      error: 'Failed to fetch health conditions',
    }
  }
}
