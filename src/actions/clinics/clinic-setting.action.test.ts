jest.mock("server-only", () => ({}));

jest.mock("react", () => {
  const actual = jest.requireActual("react");
  return {
    ...actual,
    cache: <T extends (...args: never[]) => unknown>(fn: T) => fn,
  };
});

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
  revalidateTag: jest.fn(),
}));

jest.mock("@actions/session.action", () => ({
  getCachedSession: jest.fn(),
}));

jest.mock("@actions/permission.action", () => ({
  getPermissionsAction: jest.fn(),
}));

jest.mock("@lib/prisma", () => ({
  __esModule: true,
  default: {
    clinic: {
      findFirst: jest.fn(),
    },
    clinicSetting: {
      findFirst: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
    },
  },
}));

import { revalidatePath } from "next/cache";
import prisma from "@lib/prisma";
import { getCachedSession } from "@actions/session.action";
import { getPermissionsAction } from "@actions/permission.action";
import { PERMISSIONS } from "@lib/permissions";
import {
  getClinicSettingAction,
  updateClinicSettingsAction,
  updatePhilHealthSettingsAction,
} from "./clinic-setting.action";

const mockPrisma = prisma as unknown as {
  clinic: { findFirst: jest.Mock };
  clinicSetting: {
    findFirst: jest.Mock;
    update: jest.Mock;
    upsert: jest.Mock;
  };
};

const mockGetCachedSession = getCachedSession as unknown as jest.Mock;
const mockGetPermissions = getPermissionsAction as unknown as jest.Mock;
const mockRevalidatePath = revalidatePath as unknown as jest.Mock;

describe("clinic-setting.action", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCachedSession.mockResolvedValue({ user: { sub: "user_1" } });
    mockGetPermissions.mockResolvedValue([
      { name: PERMISSIONS.CLINIC["UPDATE:CLINIC:SETTINGS"].name },
    ]);
    mockPrisma.clinic.findFirst.mockResolvedValue({
      id: 42,
      clinicUid: "clinic-uid-1",
    });
  });

  describe("getClinicSettingAction redaction", () => {
    it("strips secret fields and exposes boolean presence flags when credentials exist", async () => {
      mockPrisma.clinicSetting.findFirst.mockResolvedValue({
        id: 1,
        clinicId: 42,
        isPublic: true,
        sendEmailNotification: true,
        emailToClinicOnly: false,
        enableAppointment: true,
        enableConsultation: true,
        philhealthAccreditationNumber: "P10038831",
        facilityName: "City Clinic",
        philhealthYakapUsername: "mock_user_value",
        philhealthYakapPassword: "mock_password_value",
        philhealthYakapPmccNumber: "Z15445",
        konsultaCipherKey: "TEST-CIPHER-KEY",
        konsultaCertificationId: "CERT123",
        Clinic: {
          AppointmentConfig: null,
          ConsultationConfig: null,
          updatedAt: new Date("2026-01-01T00:00:00.000Z"),
        },
      });

      const res = await getClinicSettingAction("clinic-uid-1");

      expect(res.status).toBe(true);
      expect(res.data).not.toBeNull();
      expect(res.data).not.toHaveProperty("philhealthYakapUsername");
      expect(res.data).not.toHaveProperty("philhealthYakapPassword");
      expect(res.data).not.toHaveProperty("konsultaCipherKey");
      expect(res.data?.hasPhilhealthYakapUsername).toBe(true);
      expect(res.data?.hasPhilhealthYakapPassword).toBe(true);
      expect(res.data?.philhealthAccreditationNumber).toBe("P10038831");
      expect(res.data?.facilityName).toBe("City Clinic");
    });

    it("reports false presence flags when stored credentials are null, empty, or whitespace", async () => {
      mockPrisma.clinicSetting.findFirst.mockResolvedValue({
        id: 1,
        clinicId: 42,
        isPublic: false,
        sendEmailNotification: true,
        emailToClinicOnly: false,
        enableAppointment: true,
        enableConsultation: true,
        philhealthAccreditationNumber: "P10038831",
        facilityName: "City Clinic",
        philhealthYakapUsername: null,
        philhealthYakapPassword: "   ",
        philhealthYakapPmccNumber: "Z15445",
        konsultaCipherKey: null,
        konsultaCertificationId: null,
      });

      const res = await getClinicSettingAction("clinic-uid-1");

      expect(res.status).toBe(true);
      expect(res.data?.hasPhilhealthYakapUsername).toBe(false);
      expect(res.data?.hasPhilhealthYakapPassword).toBe(false);
      expect(res.data).not.toHaveProperty("philhealthYakapUsername");
      expect(res.data).not.toHaveProperty("philhealthYakapPassword");
    });

    it("returns null data cleanly when no ClinicSetting exists", async () => {
      mockPrisma.clinicSetting.findFirst.mockResolvedValue(null);

      const res = await getClinicSettingAction("clinic-uid-1");

      expect(res.status).toBe(true);
      expect(res.data).toBeNull();
    });
  });

  describe("updateClinicSettingsAction redaction", () => {
    it("redacts secrets from returned ClinicSetting", async () => {
      mockPrisma.clinicSetting.update.mockResolvedValue({
        id: 1,
        clinicId: 42,
        isPublic: false,
        sendEmailNotification: true,
        emailToClinicOnly: false,
        enableAppointment: true,
        enableConsultation: false,
        philhealthYakapUsername: "mock_hidden_user",
        philhealthYakapPassword: "mock_hidden_password",
        konsultaCipherKey: "TEST-CIPHER-KEY",
      });

      const res = await updateClinicSettingsAction(1, {
        clinicUid: "clinic-uid-1",
        enableAppointment: true,
        enableConsultation: false,
      });

      expect(res.status).toBe(true);
      expect(res.data).not.toHaveProperty("philhealthYakapUsername");
      expect(res.data).not.toHaveProperty("philhealthYakapPassword");
      expect(res.data).not.toHaveProperty("konsultaCipherKey");
      expect(res.data?.hasPhilhealthYakapUsername).toBe(true);
      expect(res.data?.hasPhilhealthYakapPassword).toBe(true);
    });
  });

  describe("updatePhilHealthSettingsAction tri-state credential semantics", () => {
    it("omits username/password from update when left undefined, empty, or whitespace", async () => {
      mockPrisma.clinicSetting.upsert.mockResolvedValue({
        id: 1,
        clinicId: 42,
        facilityName: "Updated Facility",
        philhealthAccreditationNumber: "P10038831",
        philhealthYakapUsername: "mock_existing_user",
        philhealthYakapPassword: "mock_existing_password",
        philhealthYakapPmccNumber: "Z15445",
        konsultaCipherKey: "TEST-CIPHER-KEY",
      });

      const res = await updatePhilHealthSettingsAction("clinic-uid-1", {
        facilityName: "Updated Facility",
        philhealthYakapUsername: "",
        philhealthYakapPassword: "   ",
      });

      expect(res.status).toBe(true);
      expect(mockPrisma.clinicSetting.upsert).toHaveBeenCalledWith({
        where: { clinicId: 42 },
        create: expect.objectContaining({
          clinicId: 42,
          facilityName: "Updated Facility",
          philhealthYakapUsername: null,
          philhealthYakapPassword: null,
        }),
        update: {
          philhealthAccreditationNumber: undefined,
          facilityName: "Updated Facility",
          philhealthYakapPmccNumber: undefined,
        },
      });
      const upsertArg = mockPrisma.clinicSetting.upsert.mock.calls[0][0];
      expect("philhealthYakapUsername" in upsertArg.update).toBe(false);
      expect("philhealthYakapPassword" in upsertArg.update).toBe(false);
      expect(res.data).not.toHaveProperty("philhealthYakapUsername");
      expect(res.data).not.toHaveProperty("philhealthYakapPassword");
      expect(res.data?.hasPhilhealthYakapUsername).toBe(true);
      expect(res.data?.hasPhilhealthYakapPassword).toBe(true);
      expect(mockRevalidatePath).toHaveBeenCalledWith(
        "/v2/clinic/clinic-uid-1/settings",
      );
    });

    it("writes null to DB when username and password are explicitly cleared with null", async () => {
      mockPrisma.clinicSetting.upsert.mockResolvedValue({
        id: 1,
        clinicId: 42,
        facilityName: "City Clinic",
        philhealthAccreditationNumber: "P10038831",
        philhealthYakapUsername: null,
        philhealthYakapPassword: null,
        philhealthYakapPmccNumber: "Z15445",
      });

      const res = await updatePhilHealthSettingsAction("clinic-uid-1", {
        philhealthYakapUsername: null,
        philhealthYakapPassword: null,
      });

      expect(res.status).toBe(true);
      expect(mockPrisma.clinicSetting.upsert).toHaveBeenCalledWith({
        where: { clinicId: 42 },
        create: expect.objectContaining({
          philhealthYakapUsername: null,
          philhealthYakapPassword: null,
        }),
        update: expect.objectContaining({
          philhealthYakapUsername: null,
          philhealthYakapPassword: null,
        }),
      });
      expect(res.data?.hasPhilhealthYakapUsername).toBe(false);
      expect(res.data?.hasPhilhealthYakapPassword).toBe(false);
    });

    it("supports clearing one credential while updating or keeping the other", async () => {
      mockPrisma.clinicSetting.upsert.mockResolvedValue({
        id: 1,
        clinicId: 42,
        philhealthYakapUsername: null,
        philhealthYakapPassword: "  test_padded_password  ",
      });

      const res = await updatePhilHealthSettingsAction("clinic-uid-1", {
        philhealthYakapUsername: null,
        philhealthYakapPassword: "  test_padded_password  ",
      });

      expect(res.status).toBe(true);
      expect(mockPrisma.clinicSetting.upsert).toHaveBeenCalledWith({
        where: { clinicId: 42 },
        create: expect.objectContaining({
          philhealthYakapUsername: null,
          philhealthYakapPassword: "  test_padded_password  ",
        }),
        update: expect.objectContaining({
          philhealthYakapUsername: null,
          philhealthYakapPassword: "  test_padded_password  ",
        }),
      });
      expect(res.data?.hasPhilhealthYakapUsername).toBe(false);
      expect(res.data?.hasPhilhealthYakapPassword).toBe(true);
    });

    it("trims non-empty username and never returns raw credentials in response", async () => {
      mockPrisma.clinicSetting.upsert.mockResolvedValue({
        id: 1,
        clinicId: 42,
        philhealthYakapUsername: "trimmed_user",
        philhealthYakapPassword: "test_new_password",
      });

      const res = await updatePhilHealthSettingsAction("clinic-uid-1", {
        philhealthYakapUsername: "  trimmed_user  ",
        philhealthYakapPassword: "test_new_password",
      });

      expect(res.status).toBe(true);
      const upsertArg = mockPrisma.clinicSetting.upsert.mock.calls[0][0];
      expect(upsertArg.update.philhealthYakapUsername).toBe("trimmed_user");
      expect(upsertArg.update.philhealthYakapPassword).toBe("test_new_password");
      expect(res.data).not.toHaveProperty("philhealthYakapUsername");
      expect(res.data).not.toHaveProperty("philhealthYakapPassword");
      expect(res.data?.hasPhilhealthYakapUsername).toBe(true);
      expect(res.data?.hasPhilhealthYakapPassword).toBe(true);
    });

    it("rejects unauthorized users lacking clinic settings permission", async () => {
      mockGetPermissions.mockResolvedValue([]);

      const res = await updatePhilHealthSettingsAction("clinic-uid-1", {
        philhealthYakapUsername: null,
      });

      expect(res.status).toBe(false);
      expect(res.message).toMatch(/permission/i);
      expect(mockPrisma.clinicSetting.upsert).not.toHaveBeenCalled();
    });
  });
});
