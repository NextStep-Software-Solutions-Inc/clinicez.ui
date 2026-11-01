"use server";

import prisma from "@lib/prisma";

export const getVaccinesAction = async () => {
  const items = await prisma.philHealthImmunizationLibrary.findMany({
    where: { isActive: true },
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
  });

  return items.map((item) => ({
    id: item.id,
    name: item.name,
    code: item.code,
    category: item.category,
    VaccineAttribute: {
      effectivity: 1,
    },
    VaccineDoses: [
      {
        Dose: {
          id: item.doseNumber || 1,
          dose: item.defaultDoseLabel || "1st Dose",
        },
      },
    ],
    VaccineRoutes: [
      {
        Route: {
          id: 1,
          route: item.defaultRoute || "Intramuscular",
        },
      },
    ],
  }));
};