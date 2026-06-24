import { describe, it, expect, vi } from "vitest";
import { getNextKonsultaSequence, generateKonsultaCaseNo, generateKonsultaTransNo } from "./konsulta-utils";
import { Prisma } from "@prisma/client";

describe("Konsulta Utils", () => {
  describe("getNextKonsultaSequence", () => {
    it("should create a new sequence if none exists for the period", async () => {
      // Mock the Prisma transaction client
      const mockTx = {
        sequenceGenerator: {
          findFirst: vi.fn().mockResolvedValue(null),
          create: vi.fn().mockResolvedValue({ id: 1, currentValue: 1 }),
          update: vi.fn()
        }
      } as unknown as Prisma.TransactionClient;

      const date = new Date("2026-06-24T00:00:00Z"); // YYYYMM = 202606
      const seq = await getNextKonsultaSequence(mockTx, "KONSULTA_CASE_T", 101, date);

      expect(seq).toBe(1);
      expect(mockTx.sequenceGenerator.findFirst).toHaveBeenCalledWith({
        where: { entityType: "KONSULTA_CASE_T", clinicId: 101, date: "202606" }
      });
      expect(mockTx.sequenceGenerator.create).toHaveBeenCalledWith({
        data: { entityType: "KONSULTA_CASE_T", clinicId: 101, date: "202606", currentValue: 1 }
      });
      expect(mockTx.sequenceGenerator.update).not.toHaveBeenCalled();
    });

    it("should increment an existing sequence", async () => {
      const mockTx = {
        sequenceGenerator: {
          findFirst: vi.fn().mockResolvedValue({ id: 5, currentValue: 14 }),
          create: vi.fn(),
          update: vi.fn().mockResolvedValue({ id: 5, currentValue: 15 })
        }
      } as unknown as Prisma.TransactionClient;

      const date = new Date("2026-06-24T00:00:00Z");
      const seq = await getNextKonsultaSequence(mockTx, "KONSULTA_TRANS_P", 101, date);

      expect(seq).toBe(15);
      expect(mockTx.sequenceGenerator.update).toHaveBeenCalledWith({
        where: { id: 5 },
        data: { currentValue: 15 }
      });
      expect(mockTx.sequenceGenerator.create).not.toHaveBeenCalled();
    });
  });

  describe("generateKonsultaCaseNo", () => {
    it("should generate standard T case number", () => {
      const date = new Date("2024-05-15T00:00:00Z");
      const result = generateKonsultaCaseNo("P12345678", date, 5);
      expect(result).toBe("TP123456782024050005");
    });

    it("should allow configurable prefix", () => {
      const date = new Date("2026-06-01T00:00:00Z");
      const result = generateKonsultaCaseNo("Z00000000", date, 1234, "C");
      expect(result).toBe("CZ000000002026061234");
    });
  });

  describe("generateKonsultaTransNo", () => {
    it("should generate standard E transaction number", () => {
      const date = new Date("2024-05-15T00:00:00Z");
      const result = generateKonsultaTransNo("P12345678", date, 5);
      expect(result).toBe("EP1234567820240500005");
    });

    it("should allow configurable prefix", () => {
      const date = new Date("2026-06-01T00:00:00Z");
      const result = generateKonsultaTransNo("Z00000000", date, 1234, "X");
      expect(result).toBe("XZ0000000020260601234");
    });
  });
});
