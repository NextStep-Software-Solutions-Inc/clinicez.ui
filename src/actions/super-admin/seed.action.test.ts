jest.mock("server-only", () => ({}));

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

jest.mock("./admin-check.action", () => ({
  isSuperAdminAction: jest.fn(),
}));

jest.mock("@lib/prisma", () => ({
  __esModule: true,
  default: {
    permission: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    imagingProcedure: {
      count: jest.fn(),
      upsert: jest.fn(),
    },
    laboratoryProcedure: {
      count: jest.fn(),
      upsert: jest.fn(),
    },
    heartStationProcedure: {
      count: jest.fn(),
      upsert: jest.fn(),
    },
    philHealthImmunizationLibrary: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    konsultaSignAndSymptom: {
      findMany: jest.fn(),
      upsert: jest.fn(),
    },
  },
}));

import prisma from "@lib/prisma";
import { revalidatePath } from "next/cache";
import { isSuperAdminAction } from "./admin-check.action";
import {
  seedAllAction,
  seedSignsAndSymptomsAction,
} from "./seed.action";
import { seedPhilHealthSignsAndSymptomsAction } from "./sign-and-symptom.action";
import { PHILHEALTH_SIGNS_AND_SYMPTOMS } from "@lib/philhealth-yakap/signs-and-symptoms-library";

const mockIsSuperAdmin = isSuperAdminAction as jest.Mock;
const mockPrisma = prisma as unknown as {
  permission: { findUnique: jest.Mock; create: jest.Mock };
  imagingProcedure: { count: jest.Mock; upsert: jest.Mock };
  laboratoryProcedure: { count: jest.Mock; upsert: jest.Mock };
  heartStationProcedure: { count: jest.Mock; upsert: jest.Mock };
  philHealthImmunizationLibrary: {
    findUnique: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
  };
  konsultaSignAndSymptom: {
    findMany: jest.Mock;
    upsert: jest.Mock;
  };
};

describe("Super Admin Signs & Symptoms Seeding", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsSuperAdmin.mockResolvedValue(true);
    mockPrisma.konsultaSignAndSymptom.findMany.mockResolvedValue([]);
    mockPrisma.konsultaSignAndSymptom.upsert.mockImplementation(async ({ create }) => create);
  });

  it("rejects non-super-admin callers", async () => {
    mockIsSuperAdmin.mockResolvedValue(false);

    const res = await seedSignsAndSymptomsAction();
    expect(res).toEqual({
      status: false,
      message: "Super admin privileges required.",
      data: null,
    });
    expect(mockPrisma.konsultaSignAndSymptom.upsert).not.toHaveBeenCalled();
  });

  it("seeds all 39 lib_signs_symptoms.xlsx records (36 active, 3 inactive: 16, 24, 31) into empty DB", async () => {
    const res = await seedSignsAndSymptomsAction();

    expect(res.status).toBe(true);
    expect(res.data).toEqual({ created: 39, skipped: 0, total: 39 });
    expect(mockPrisma.konsultaSignAndSymptom.findMany).toHaveBeenCalledTimes(1);
    expect(mockPrisma.konsultaSignAndSymptom.upsert).toHaveBeenCalledTimes(39);

    const upsertedItems = mockPrisma.konsultaSignAndSymptom.upsert.mock.calls.map(
      (call) => call[0].create
    );
    expect(upsertedItems.filter((i) => i.isActive)).toHaveLength(36);
    expect(
      upsertedItems.filter((i) => !i.isActive).map((i) => i.code)
    ).toEqual(["16", "24", "31"]);
    expect(upsertedItems.find((i) => i.code === "38")).toEqual({
      code: "38",
      description: "PAIN",
      isActive: true,
      sortOrder: 38,
    });
    expect(upsertedItems.find((i) => i.code === "X")).toEqual({
      code: "X",
      description: "OTHERS",
      isActive: true,
      sortOrder: 39,
    });
  });

  it("is idempotent across partial and repeated seed runs", async () => {
    mockPrisma.konsultaSignAndSymptom.findMany.mockResolvedValueOnce([{ code: "01" }]);
    const partialRes = await seedSignsAndSymptomsAction();
    expect(partialRes.data).toEqual({ created: 38, skipped: 1, total: 39 });

    mockPrisma.konsultaSignAndSymptom.findMany.mockResolvedValueOnce(
      PHILHEALTH_SIGNS_AND_SYMPTOMS.map((item) => ({ code: item.code }))
    );
    const repeatRes = await seedSignsAndSymptomsAction();
    expect(repeatRes.data).toEqual({ created: 0, skipped: 39, total: 39 });
  });

  it("seedAllAction includes seedSignsAndSymptomsAction", async () => {
    mockPrisma.permission.findUnique.mockResolvedValue({ id: 1 });
    mockPrisma.imagingProcedure.count.mockResolvedValue(8);
    mockPrisma.laboratoryProcedure.count.mockResolvedValue(76);
    mockPrisma.heartStationProcedure.count.mockResolvedValue(19);
    mockPrisma.philHealthImmunizationLibrary.findUnique.mockResolvedValue({ id: "1" });
    mockPrisma.konsultaSignAndSymptom.findMany.mockResolvedValue([{ code: "01" }]);

    const res = await seedAllAction();

    expect(res.status).toBe(true);
    expect(mockPrisma.konsultaSignAndSymptom.upsert).toHaveBeenCalledTimes(39);
    expect(res.data?.created).toBeGreaterThanOrEqual(38);
    expect(res.data?.total).toBeGreaterThanOrEqual(39);
  });

  it("seedPhilHealthSignsAndSymptomsAction delegates and revalidates paths", async () => {
    const res = await seedPhilHealthSignsAndSymptomsAction();

    expect(res.success).toBe(true);
    expect(res.data).toEqual({ created: 39, skipped: 0, total: 39 });
    expect(revalidatePath).toHaveBeenCalledWith("/super-admin/signs-and-symptoms");
  });
});
