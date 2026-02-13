'use server'

import prisma from '@/lib/prisma'
import type { LatestVitalsData, VitalHistoryData, TrendIndicator } from '@/types/patient-dashboard-v2.types'

/**
 * Calculate trend between two vital readings
 */
function calculateTrend(
  current: number | null,
  previous: number | null,
  normalRange?: { min: number; max: number }
): TrendIndicator | null {
  if (current === null || previous === null) return null

  const diff = current - previous
  const percentage = Math.abs((diff / previous) * 100)
  const direction = diff > 0 ? 'up' : diff < 0 ? 'down' : 'stable'

  let status: 'normal' | 'warning' | 'critical' = 'normal'
  if (normalRange) {
    if (current < normalRange.min || current > normalRange.max) {
      status = 'warning'
    }
    if (current < normalRange.min - 20 || current > normalRange.max + 20) {
      status = 'critical'
    }
  }

  return {
    direction,
    percentage: Math.round(percentage * 10) / 10,
    change: Math.round(diff * 10) / 10,
    status,
  }
}

/**
 * Get latest vital signs for patient
 */
export async function getLatestVitals(userId: number): Promise<LatestVitalsData> {
  try {
    const vitals = await prisma.vitalSign.findMany({
      where: { userId, isActive: true },
      orderBy: { dateTaken: 'desc' },
      take: 2,
    })

    const latest = vitals[0] || null
    const previous = vitals[1] || null

    if (!latest) {
      return {
        vitals: null,
        previousVitals: null,
        trends: {
          bp: null,
          hr: null,
          temp: null,
          weight: null,
          spo2: null,
        },
      }
    }

    return {
      vitals: latest,
      previousVitals: previous,
      trends: {
        bp:
          latest.bpSystolic && previous?.bpSystolic
            ? calculateTrend(latest.bpSystolic, previous.bpSystolic, {
                min: 90,
                max: 120,
              })
            : null,
        hr:
          latest.pulseRate && previous?.pulseRate
            ? calculateTrend(latest.pulseRate, previous.pulseRate, {
                min: 60,
                max: 100,
              })
            : null,
        temp:
          latest.temp && previous?.temp
            ? calculateTrend(latest.temp, previous.temp, {
                min: 98,
                max: 98.6,
              })
            : null,
        weight:
          latest.weight && previous?.weight
            ? calculateTrend(latest.weight, previous.weight)
            : null,
        spo2:
          latest.spo2 && previous?.spo2
            ? calculateTrend(latest.spo2, previous.spo2, {
                min: 95,
                max: 100,
              })
            : null,
      },
    }
  } catch (error) {
    console.error('Error fetching latest vitals:', error)
    return {
      vitals: null,
      previousVitals: null,
      trends: {
        bp: null,
        hr: null,
        temp: null,
        weight: null,
        spo2: null,
      },
    }
  }
}

/**
 * Get vital signs history for last N days
 */
export async function getVitalsHistory(
  userId: number,
  days: number = 7
): Promise<VitalHistoryData> {
  try {
    const fromDate = new Date()
    fromDate.setDate(fromDate.getDate() - days)

    const vitals = await prisma.vitalSign.findMany({
      where: {
        userId,
        isActive: true,
        dateTaken: { gte: fromDate },
      },
      orderBy: { dateTaken: 'desc' },
    })

    // Calculate averages
    const averages = {
      bpSystolic:
        vitals.length > 0
          ? Math.round(
              vitals.reduce((sum: number, v: (typeof vitals)[0]) => sum + (v.bpSystolic || 0), 0) /
                vitals.length
            )
          : null,
      bpDiastolic:
        vitals.length > 0
          ? Math.round(
              vitals.reduce((sum: number, v: (typeof vitals)[0]) => sum + (v.bpDiastolic || 0), 0) /
                vitals.length
            )
          : null,
      pulseRate:
        vitals.length > 0
          ? Math.round(
              vitals.reduce((sum: number, v: (typeof vitals)[0]) => sum + (v.pulseRate || 0), 0) /
                vitals.length
            )
          : null,
      temp:
        vitals.length > 0
          ? Math.round(
              (vitals.reduce((sum: number, v: (typeof vitals)[0]) => sum + (v.temp || 0), 0) /
                vitals.length) *
                10
            ) / 10
          : null,
      weight:
        vitals.length > 0
          ? Math.round(
              (vitals.reduce((sum: number, v: (typeof vitals)[0]) => sum + (v.weight || 0), 0) /
                vitals.length) *
                10
            ) / 10
          : null,
      spo2:
        vitals.length > 0
          ? Math.round(
              vitals.reduce((sum: number, v: (typeof vitals)[0]) => sum + (v.spo2 || 0), 0) / vitals.length
            )
          : null,
    }

    return {
      vitals: vitals.reverse(), // Return oldest first for charting
      dateRange: {
        from: fromDate,
        to: new Date(),
      },
      averages,
    }
  } catch (error) {
    console.error('Error fetching vitals history:', error)
    return {
      vitals: [],
      dateRange: { from: new Date(), to: new Date() },
      averages: {
        bpSystolic: null,
        bpDiastolic: null,
        pulseRate: null,
        temp: null,
        weight: null,
        spo2: null,
      },
    }
  }
}
