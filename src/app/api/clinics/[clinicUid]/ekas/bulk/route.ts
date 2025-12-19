import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { bulkDownloadEKASAction } from "@/actions/phr/bulk-download-ekas.action"
import prisma from "@/lib/prisma"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ clinicUid: string }> }
) {
  try {
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { clinicUid } = await params
    const body = await request.json()
    const { startDate, endDate } = body

    if (!startDate || !endDate) {
      return NextResponse.json(
        { message: "Start date and end date are required" },
        { status: 400 }
      )
    }

    // Get user by Clerk ID
    const user = await prisma.user.findUnique({
      where: { userId: clerkUserId },
      select: { id: true }
    })

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    // Get clinic ID from UID
    const clinic = await prisma.clinic.findUnique({
      where: { clinicUid },
      select: { id: true }
    })

    if (!clinic) {
      return NextResponse.json({ message: "Clinic not found" }, { status: 404 })
    }

    // Verify user has access to this clinic
    const membership = await prisma.clinicMember.findFirst({
      where: {
        clinicId: clinic.id,
        userId: user.id,
        isActive: true,
        deletedAt: null
      }
    })

    if (!membership) {
      return NextResponse.json(
        { message: "You don't have access to this clinic" },
        { status: 403 }
      )
    }

    // Call the bulk download action
    const result = await bulkDownloadEKASAction(
      clinic.id,
      new Date(startDate),
      new Date(endDate)
    )

    return NextResponse.json(result)
  } catch (error) {
    console.error("Bulk EKAS download error:", error)
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    )
  }
}
