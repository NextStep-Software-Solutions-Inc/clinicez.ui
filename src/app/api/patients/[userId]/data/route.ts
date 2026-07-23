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

        console.log('Fetching data for user:', userId, 'clinic:', clinicId);

        // First, find ClinicPatient records if clinicId is provided
        let clinicPatientIds: number[] = [];
        if (clinicId) {
            const clinicPatients = await prisma.clinicPatient.findMany({
                where: {
                    patientId: userId,
                    clinicId: parseInt(clinicId),
                },
                select: { id: true },
            });
            clinicPatientIds = clinicPatients.map(cp => cp.id);
        }

        // Parallel fetch all patient data (18 data sources)
        const [
            user,
            appointments,
            healthConditions,
            medications,
            medicationDetails,
            disabilities,
            medicalHistory,
            familyMedicalHistory,
            vaccinations,
            vitalSigns,
            consultationNotes,
            preAssessmentNotes,
            interventions,
            prescriptions,
            surgicalHistories,
            allergies,
            userAllergies,
        ] = await Promise.all([
            // 1. Get user demographics
            prisma.user.findUnique({
                where: { id: userId },
                select: {
                    firstName: true,
                    lastName: true,
                    middleName: true,
                    email: true,
                    dob: true,
                    gender: true,
                    bloodType: true,
                    picture: true,
                    caseNumber: true,
                },
            }),

            // 2. Get appointments
            prisma.appointmentRequester.findMany({
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
                take: 20,
            }),

            // 3. Get active health conditions with details
            prisma.userHealthCondition.findMany({
                where: {
                    userId,
                    status: { not: 'RESOLVED' },
                },
                include: {
                    HealthCondition: {
                        select: {
                            name: true,
                        },
                    },
                },
                orderBy: {
                    dateDiagnosed: 'desc',
                },
            }),

            // 4. Get medications (count and names)
            prisma.medication.findMany({
                where: {
                    patientId: userId,
                },
                select: {
                    name: true,
                },
                take: 20,
            }),

            // 5. Get detailed medications with dosage
            prisma.medication.findMany({
                where: {
                    patientId: userId,
                },
                include: {
                    MedicationDrugs: {
                        select: {
                            dosage: true,
                            frequency: true,
                            duration: true,
                            notes: true,
                        },
                    },
                },
                take: 20,
            }),

            // 6. Get disabilities
            prisma.userDisability.findMany({
                where: {
                    userId,
                },
                include: {
                    Disability: {
                        select: {
                            name: true,
                        },
                    },
                },
            }),

            // 7. Get medical history
            prisma.medicalHistory.findMany({
                where: {
                    userId,
                },
                include: {
                    Condition: {
                        select: {
                            name: true,
                        },
                    },
                },
            }),

            // 8. Get family medical history
            prisma.familyMedicalHistory.findMany({
                where: {
                    userId,
                },
                include: {
                    Condition: {
                        select: {
                            name: true,
                        },
                    },
                },
            }),

            // 9. Get vaccinations
            prisma.userVaccination.findMany({
                where: {
                    userId,
                },
                include: {
                    Vaccine: {
                        select: {
                            name: true,
                        },
                    },
                    Dose: {
                        select: {
                            dose: true,
                        },
                    },
                },
                orderBy: {
                    dateGiven: 'desc',
                },
                take: 20,
            }),

            // 10. Get vital signs trends
            prisma.vitalSign.findMany({
                where: {
                    userId,
                },
                select: {
                    bpSystolic: true,
                    bpDiastolic: true,
                    pulseRate: true,
                    temp: true,
                    weight: true,
                    respRate: true,
                    createdAt: true,
                },
                orderBy: {
                    createdAt: 'desc',
                },
                take: 20,
            }),

            // 11. Get consultation notes (via ConsultationTicket)
            prisma.consultationNote.findMany({
                where: {
                    ConsultationTicket: {
                        Appointment: {
                            Requesters: {
                                some: {
                                    userId,
                                },
                            },
                        },
                    },
                },
                include: {
                    HealthCareProvider: {
                        select: {
                            User: {
                                select: {
                                    firstName: true,
                                    lastName: true,
                                },
                            },
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
                take: 20,
            }),

            // 12. Get pre-assessment notes
            prisma.preAssessmentNote.findMany({
                where: {
                    Appointment: {
                        Requesters: {
                            some: {
                                userId,
                            },
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
                take: 10,
            }),

            // 13. Get interventions (via ConsultationTicket)
            prisma.intervention.findMany({
                where: {
                    ConsultationTicket: {
                        Appointment: {
                            Requesters: {
                                some: {
                                    userId,
                                },
                            },
                        },
                    },
                },
                include: {
                    Action: {
                        select: {
                            name: true,
                        },
                    },
                    HealthCareProvider: {
                        select: {
                            User: {
                                select: {
                                    firstName: true,
                                    lastName: true,
                                },
                            },
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
                take: 20,
            }),

            // 14. Get prescriptions (using ClinicPatient IDs or direct search)
            clinicPatientIds.length > 0
                ? prisma.prescription.findMany({
                    where: {
                        patientId: {
                            in: clinicPatientIds,
                        },
                    },
                    include: {
                        Medicines: {
                            select: {
                                name: true,
                                dosage: true,
                                frequency: true,
                                duration: true,
                                notes: true,
                            },
                        },
                        HealthcareProvider: {
                            select: {
                                User: {
                                    select: {
                                        firstName: true,
                                        lastName: true,
                                    },
                                },
                            },
                        },
                    },
                    orderBy: {
                        createdAt: 'desc',
                    },
                    take: 20,
                })
                : Promise.resolve([]),

            // 15. Get surgical histories
            prisma.surgicalHistory.findMany({
                where: {
                    userId,
                },
                orderBy: {
                    operationDate: 'desc',
                },
                take: 20,
            }),

            // 16. Get allergies (simplified)
            prisma.allergen.findMany({
                take: 100,
            }),

            // 17. Get procedure usage history
            Promise.resolve([] as any[]),

            // 18. Get user allergies
            prisma.userAllergy.findMany({
                where: {
                    userId,
                },
                include: {
                    Allergen: {
                        select: {
                            name: true,
                        },
                    },
                },
            }),
        ]);

        // Calculate age
        let age: number | undefined;
        if (user?.dob) {
            const today = new Date();
            const birthDate = new Date(user.dob);
            age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
        }

        return NextResponse.json({
            // Demographics
            firstName: user?.firstName,
            lastName: user?.lastName,
            middleName: user?.middleName,
            age,
            gender: user?.gender,
            dob: user?.dob?.toISOString().split('T')[0],
            bloodType: user?.bloodType,
            email: user?.email,
            picture: user?.picture,
            caseNumber: user?.caseNumber,

            // Current counts
            appointments: appointments.length,
            conditions: healthConditions.map((c: any) => c.HealthCondition.name),
            medications: medications.map((m: any) => m.name),

            // Detailed data
            healthConditions: healthConditions.map((c: any) => ({
                name: c.HealthCondition.name,
                severity: c.severity,
                status: c.status,
                dateDiagnosed: c.dateDiagnosed?.toISOString(),
                dateResolved: c.dateResolved?.toISOString(),
                notes: c.notes,
            })),

            medicationDetails: medicationDetails.map((m: any) => ({
                name: m.name,
                dosage: m.MedicationDrugs[0]?.dosage,
                frequency: m.MedicationDrugs[0]?.frequency,
                duration: m.MedicationDrugs[0]?.duration,
                notes: m.MedicationDrugs[0]?.notes,
            })),

            disabilities: disabilities.map((d: any) => ({
                name: d.Disability.name,
                severity: d.severity,
                notes: d.notes,
                isManaged: d.isManaged,
            })),

            medicalHistory: medicalHistory.map((m: any) => ({
                condition: m.Condition.name,
                details: m.details,
            })),

            familyMedicalHistory: familyMedicalHistory.map((f: any) => ({
                condition: f.Condition.name,
                details: f.details,
            })),

            vaccinations: vaccinations.map((v: any) => ({
                vaccine: v.Vaccine.name,
                dose: v.Dose?.dose || 'Unknown',
                dateGiven: v.dateGiven.toISOString(),
                notes: v.notes,
            })),

            recentVisits: appointments.slice(0, 10).map((a: any) => ({
                date: a.Appointment.createdAt.toISOString(),
                reason: a.Appointment.subject || 'General visit',
                complaint: a.Appointment.complaint,
            })),

            vitalsTrends: {
                bloodPressure: vitalSigns
                    .filter((v: any) => v.bpSystolic && v.bpDiastolic)
                    .map((v: any) => `${v.bpSystolic}/${v.bpDiastolic}`),
                heartRate: vitalSigns
                    .filter((v: any) => v.pulseRate)
                    .map((v: any) => v.pulseRate!),
                temperature: vitalSigns
                    .filter((v: any) => v.temp)
                    .map((v: any) => v.temp!),
                weight: vitalSigns
                    .filter((v: any) => v.weight)
                    .map((v: any) => v.weight!),
                respiratoryRate: vitalSigns
                    .filter((v: any) => v.respRate)
                    .map((v: any) => v.respRate!),
            },

            // Clinical documentation
            consultationNotes: consultationNotes.map((n: any) => ({
                section: n.section,
                content: n.content,
                hpName: `${n.HealthCareProvider?.User?.firstName || ''} ${n.HealthCareProvider?.User?.lastName || ''}`.trim(),
                createdAt: n.createdAt.toISOString(),
                showOnPatient: n.showOnPatient,
            })),

            preAssessmentNotes: preAssessmentNotes.map((n: any) => ({
                assessment: n.assessment,
                homeInstructions: n.homeInstructions,
                remarks: n.remarks,
                createdAt: n.createdAt.toISOString(),
            })),

            interventions: interventions.map((i: any) => ({
                action: i.Action.name,
                details: i.details,
                hpName: `${i.HealthCareProvider?.User?.firstName || ''} ${i.HealthCareProvider?.User?.lastName || ''}`.trim(),
                createdAt: i.createdAt.toISOString(),
            })),

            prescriptions: prescriptions.map((p: any) => ({
                medicines: p.Medicines.map((m: any) => ({
                    name: m.name,
                    dosage: m.dosage,
                    frequency: m.frequency,
                    duration: m.duration,
                    notes: m.notes,
                })),
                prescribedBy: `${p.HealthcareProvider?.User?.firstName || ''} ${p.HealthcareProvider?.User?.lastName || ''}`.trim(),
                createdAt: p.createdAt.toISOString(),
            })),

            surgicalHistories: surgicalHistories.map((s: any) => ({
                operationName: s.operationName,
                operationDate: s.operationDate?.toISOString(),
                notes: s.notes,
            })),

            allergies: userAllergies.map((a: any) => ({
                allergen: a.Allergen.name,
                reaction: a.reaction,
                notes: a.notes,
            })),



            // Summary counts
            totalConsultationNotes: consultationNotes.length,
            totalPreAssessments: preAssessmentNotes.length,
            totalInterventions: interventions.length,
            totalPrescriptions: prescriptions.length,
            totalSurgeries: surgicalHistories.length,
            totalAllergies: userAllergies.length,
            totalVaccinations: vaccinations.length,
            totalVitals: vitalSigns.length,
        });
    } catch (error) {
        console.error('Error fetching comprehensive patient data:', error);
        console.error('Error details:', {
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : 'No stack trace',
        });
        return NextResponse.json(
            {
                error: 'Failed to fetch patient data',
                details: error instanceof Error ? error.message : String(error),
            },
            { status: 500 }
        );
    }
}
