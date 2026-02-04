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

        // Get medications for this user
        const medications = await prisma.medication.findMany({
            where: {
                patientId: userId,
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
            take: 10,
        });

        return NextResponse.json({
            appointments: appointments.length,
            conditions: healthConditions.map((c: any) => c.HealthCondition.name),
            medications: medications.map((m: any) => m.name),
            recentVisits: appointments.slice(0, 5).map((a: any) => ({
                date: a.Appointment.createdAt.toISOString(),
                reason:
                    a.Appointment.subject ||
                    a.Appointment.complaint ||
                    'General checkup',
            })),
            vitalsTrends: {
                bloodPressure: vitalSigns
                    .filter((v: any) => v.bpSystolic && v.bpDiastolic)
                    .map((v: any) => v.bpSystolic!),
                heartRate: vitalSigns
                    .filter((v: any) => v.pulseRate)
                    .map((v: any) => v.pulseRate!),
                temperature: vitalSigns
                    .filter((v: any) => v.temp)
                    .map((v: any) => v.temp!),
                weight: vitalSigns
                    .filter((v: any) => v.weight)
                    .map((v: any) => v.weight!),
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
