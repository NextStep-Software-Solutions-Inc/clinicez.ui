'use server'

import { NextRequest, NextResponse } from 'next/server'
import { getHealthConditionsAction } from '@/actions/health-records/get-health-conditions.action'

/**
 * GET /api/health-conditions
 * Returns all active health conditions, with most-used first
 */
export async function GET(req: NextRequest) {
  try {
    const result = await getHealthConditionsAction()

    if (result.success) {
      return NextResponse.json({
        topConditions: result.topConditions || [],
        otherConditions: result.otherConditions || [],
      }, { status: 200 })
    } else {
      console.error('[HEALTH_CONDITIONS_API_ERROR]', result.error)
      return NextResponse.json({ error: result.error }, { status: 500 })
    }
  } catch (error) {
    console.error('[HEALTH_CONDITIONS_API_ERROR]', error)
    return NextResponse.json(
      { error: 'Failed to fetch health conditions' },
      { status: 500 }
    )
  }
}
