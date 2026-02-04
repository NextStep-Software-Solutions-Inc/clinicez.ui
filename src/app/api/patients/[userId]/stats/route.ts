import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const { userId: clerkUserId } = await auth();
        if (!clerkUserId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const clinicId = searchParams.get('clinicId');
        const { userId: userIdParam } = await params;
        const userId = parseInt(userIdParam);

        if (isNaN(userId)) {
            return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
        }

        // Count appointments for this user
        const appointmentsCount = await prisma.appointmentRequester.count({
            where: {
                userId,
                ...(clinicId && {
                    Appointment: {
                        clinicId: parseInt(clinicId),
                    },
                }),
            },
        });

        // Count active health conditions
        const conditionsCount = await prisma.userHealthCondition.count({
            where: {
                userId,
                status: 'UNRESOLVED',
            },
        });

        // Count medications
        const medicationsCount = await prisma.medication.count({
            where: {
                patientId: userId,
            },
        });

        return NextResponse.json({
            appointments: appointmentsCount,
            conditions: conditionsCount,
            medications: medicationsCount,
        });
    } catch (error) {
        console.error('Error fetching patient stats:', error);
        return NextResponse.json(
            { error: 'Failed to fetch patient stats' },
            { status: 500 }
        );
    }
}
