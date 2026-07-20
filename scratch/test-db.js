const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const consultations = await prisma.consultationTicket.findMany({
        where: { konsultaAtcValidationStatus: { not: "VALID" } },
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            konsultaAtc: true,
            ClinicPatient: {
                select: {
                    id: true,
                    konsultaMemberPin: true,
                    Patient: {
                        select: {
                            id: true,
                            PhilHealthRecords: {
                                select: { pin: true, deletedAt: true }
                            }
                        }
                    }
                }
            }
        }
    });
    console.log(JSON.stringify(consultations, null, 2));
}

main().finally(() => prisma.$disconnect());
