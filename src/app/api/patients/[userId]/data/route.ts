import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function GET(
    request: NextRequest,
    { params }: { params: { userId: string } }
) {
    try {
        const { userId: clerkUserId } = await auth();
        if (!clerkUserId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const clinicId = searchParams.get('clinicId');
        const userId = parseInt(params.userId);

        if (isNaN(userId)) {
            return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
        }

        // Get appointments
        const appointments = await prisma.appointmentRequester.findMany({
            where: {
                userId,
                ...(clinicId && {
                    Appointment: {
                        clinicId: parseInt(clinicId),
                    },
                }),
            },
            include: {
                Appointment: {
                    select: {
                        subject: true,
                        complaint: true,
                        createdAt: true,
                    },
                },
            },
            orderBy: {
                Appointment: {
                    createdAt: 'desc',
                },
            },
            take: 10,
        });

        // Get active health conditions
        const healthConditions = await prisma.userHealthCondition.findMany({
            where: {
                userId,
                status: 'UNRESOLVED',
            },
            include: {
                HealthCondition: {
                    select: {
                        name: true,
                    },
                },
            },
        });

        // Get active medications
        const medications = await prisma.medication.findMany({
            where: {
                userId,
                isActive: true,
            },
            select: {
                genericName: true,
                brandName: true,
                dosage: true,
            },
            take: 20,
        });

        // Get recent vital signs for trends
        const vitalSigns = await prisma.vitalSign.findMany({
            where: {
                userId,
            },
            orderBy: {
                createdAt: 'desc',
            },
            select: {
                bloodPressureSystolic: true,
                bloodPressureDiastolic: true,
                heartRate: true,
                temperature: true,
                weight: true,
                createdAt: true,
            },
            take: 10,
        });

        return NextResponse.json({
            appointments: appointments.length,
            conditions: healthConditions.map(c => c.HealthCondition.name),
            medications: medications.map(m =>
                `${m.genericName || m.brandName} ${m.dosage || ''}`.trim()
            ),
            recentVisits: appointments.slice(0, 5).map(a => ({
                date: a.Appointment.createdAt.toISOString(),
                reason: a.Appointment.subject || a.Appointment.complaint || 'General checkup',
            })),
            vitalsTrends: {
                bloodPressure: vitalSigns
                    .filter(v => v.bloodPressureSystolic && v.bloodPressureDiastolic)
                    .map(v => v.bloodPressureSystolic!),
                heartRate: vitalSigns
                    .filter(v => v.heartRate)
                    .map(v => v.heartRate!),
                temperature: vitalSigns
                    .filter(v => v.temperature)
                    .map(v => parseFloat(v.temperature!)),
                weight: vitalSigns
                    .filter(v => v.weight)
                    .map(v => parseFloat(v.weight!)),
            },
        });
    } catch (error) {
        console.error('Error fetching patient data:', error);
        return NextResponse.json(
            { error: 'Failed to fetch patient data' },
            { status: 500 }
        );
    }
}
