import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import { PhilHealthTab } from "./PhilHealthTab";
import {
  updatePhilHealthSettingsAction,
  type GetClinicSetting,
} from "@/actions/clinics/clinic-setting.action";

const mockRefresh = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: mockRefresh,
  }),
}));

jest.mock("@/actions/clinics/clinic-setting.action", () => ({
  updatePhilHealthSettingsAction: jest.fn(),
}));

jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

type ClinicSettingData = NonNullable<GetClinicSetting["data"]>;

function buildClinicSetting(
  overrides: Partial<ClinicSettingData> = {},
): ClinicSettingData {
  return {
    id: 1,
    clinicId: 42,
    isPublic: false,
    sendEmailNotification: true,
    emailToClinicOnly: false,
    enableAppointment: true,
    enableConsultation: true,
    philhealthAccreditationNumber: "P10038831",
    facilityName: "City Health Clinic",
    philhealthYakapPmccNumber: "Z15445",
    konsultaCertificationId: "CERT-123",
    hasPhilhealthYakapUsername: true,
    hasPhilhealthYakapPassword: true,
    Clinic: {
      AppointmentConfig: null,
      ConsultationConfig: null,
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    },
    ...overrides,
  };
}

describe("PhilHealthTab", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("never prefills username/password and keeps password masked without reveal toggle", () => {
    render(
      <PhilHealthTab
        clinicUid="clinic-1"
        clinicSetting={buildClinicSetting()}
      />,
    );

    const usernameInput = screen.getByLabelText("PhilHealth Yakap Username");
    const passwordInput = screen.getByLabelText("PhilHealth Yakap Password");

    expect(usernameInput).toHaveValue("");
    expect(passwordInput).toHaveValue("");
    expect(usernameInput).toHaveAttribute("type", "text");
    expect(usernameInput).toHaveAttribute("autocomplete", "off");
    expect(passwordInput).toHaveAttribute("type", "password");
    expect(passwordInput).toHaveAttribute("autocomplete", "new-password");

    expect(screen.getAllByText("Configured")).toHaveLength(2);
    expect(
      screen.getByRole("button", { name: "Clear PhilHealth Yakap Username" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Clear PhilHealth Yakap Password" }),
    ).toBeInTheDocument();
  });

  it("leaves credentials unmodified (sends undefined) when inputs are untouched or blank", async () => {
    const setting = buildClinicSetting();
    jest.mocked(updatePhilHealthSettingsAction).mockResolvedValue({
      status: true,
      message: "PhilHealth settings updated successfully",
      data: {
        ...setting,
        facilityName: "Updated Facility",
      },
    });

    render(<PhilHealthTab clinicUid="clinic-1" clinicSetting={setting} />);

    fireEvent.change(screen.getByLabelText("Facility Name"), {
      target: { value: "Updated Facility" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Save Changes/i }));

    await waitFor(() => {
      expect(updatePhilHealthSettingsAction).toHaveBeenCalledWith("clinic-1", {
        philhealthAccreditationNumber: "P10038831",
        facilityName: "Updated Facility",
        philhealthYakapUsername: undefined,
        philhealthYakapPassword: undefined,
        philhealthYakapPmccNumber: "Z15445",
      });
    });

    expect(screen.getAllByText("Configured")).toHaveLength(2);
    expect(mockRefresh).toHaveBeenCalledTimes(1);
    expect(toast.success).toHaveBeenCalledWith("PhilHealth settings saved.");
  });

  it("supports staging Clear, Undoing, and automatically canceling Clear when typing a new value", async () => {
    render(
      <PhilHealthTab
        clinicUid="clinic-1"
        clinicSetting={buildClinicSetting()}
      />,
    );

    const clearUsernameBtn = screen.getByRole("button", {
      name: "Clear PhilHealth Yakap Username",
    });
    fireEvent.click(clearUsernameBtn);

    expect(screen.getByText("Will be cleared on save")).toBeInTheDocument();

    const undoUsernameBtn = screen.getByRole("button", {
      name: "Undo clear PhilHealth Yakap Username",
    });
    fireEvent.click(undoUsernameBtn);
    expect(screen.queryByText("Will be cleared on save")).not.toBeInTheDocument();
    expect(screen.getAllByText("Configured")).toHaveLength(2);

    // Stage clear again, then type a replacement value to cancel the staged clear
    fireEvent.click(
      screen.getByRole("button", { name: "Clear PhilHealth Yakap Username" }),
    );
    expect(screen.getByText("Will be cleared on save")).toBeInTheDocument();

    const usernameInput = screen.getByLabelText("PhilHealth Yakap Username");
    fireEvent.change(usernameInput, { target: { value: "replacement_user" } });

    expect(screen.queryByText("Will be cleared on save")).not.toBeInTheDocument();
    expect(usernameInput).toHaveValue("replacement_user");
  });

  it("sends null for cleared credentials and updates badges to Empty on save", async () => {
    const setting = buildClinicSetting();
    jest.mocked(updatePhilHealthSettingsAction).mockResolvedValue({
      status: true,
      message: "PhilHealth settings updated successfully",
      data: {
        ...setting,
        hasPhilhealthYakapUsername: false,
        hasPhilhealthYakapPassword: false,
      },
    });

    render(<PhilHealthTab clinicUid="clinic-1" clinicSetting={setting} />);

    fireEvent.click(
      screen.getByRole("button", { name: "Clear PhilHealth Yakap Username" }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Clear PhilHealth Yakap Password" }),
    );
    expect(screen.getAllByText("Will be cleared on save")).toHaveLength(2);

    fireEvent.click(screen.getByRole("button", { name: /Save Changes/i }));

    await waitFor(() => {
      expect(updatePhilHealthSettingsAction).toHaveBeenCalledWith("clinic-1", {
        philhealthAccreditationNumber: "P10038831",
        facilityName: "City Health Clinic",
        philhealthYakapUsername: null,
        philhealthYakapPassword: null,
        philhealthYakapPmccNumber: "Z15445",
      });
    });

    expect(screen.getAllByText("Empty")).toHaveLength(2);
    expect(
      screen.queryByRole("button", { name: /Clear PhilHealth Yakap/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText("PhilHealth Yakap Username")).toHaveValue("");
    expect(screen.getByLabelText("PhilHealth Yakap Password")).toHaveValue("");
  });

  it("allows clearing one credential while keeping the other", async () => {
    const setting = buildClinicSetting();
    jest.mocked(updatePhilHealthSettingsAction).mockResolvedValue({
      status: true,
      message: "PhilHealth settings updated successfully",
      data: {
        ...setting,
        hasPhilhealthYakapUsername: false,
        hasPhilhealthYakapPassword: true,
      },
    });

    render(<PhilHealthTab clinicUid="clinic-1" clinicSetting={setting} />);

    fireEvent.click(
      screen.getByRole("button", { name: "Clear PhilHealth Yakap Username" }),
    );
    fireEvent.click(screen.getByRole("button", { name: /Save Changes/i }));

    await waitFor(() => {
      expect(updatePhilHealthSettingsAction).toHaveBeenCalledWith("clinic-1", {
        philhealthAccreditationNumber: "P10038831",
        facilityName: "City Health Clinic",
        philhealthYakapUsername: null,
        philhealthYakapPassword: undefined,
        philhealthYakapPmccNumber: "Z15445",
      });
    });

    expect(screen.getByText("Empty")).toBeInTheDocument();
    expect(screen.getByText("Configured")).toBeInTheDocument();
  });

  it("clears newly entered credentials from inputs immediately after saving", async () => {
    const emptySetting = buildClinicSetting({
      hasPhilhealthYakapUsername: false,
      hasPhilhealthYakapPassword: false,
    });
    jest.mocked(updatePhilHealthSettingsAction).mockResolvedValue({
      status: true,
      message: "PhilHealth settings updated successfully",
      data: {
        ...emptySetting,
        hasPhilhealthYakapUsername: true,
        hasPhilhealthYakapPassword: true,
      },
    });

    render(<PhilHealthTab clinicUid="clinic-1" clinicSetting={emptySetting} />);

    expect(screen.getAllByText("Empty")).toHaveLength(2);

    fireEvent.change(screen.getByLabelText("PhilHealth Yakap Username"), {
      target: { value: "  new_user  " },
    });
    fireEvent.change(screen.getByLabelText("PhilHealth Yakap Password"), {
      target: { value: "test_new_password" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Save Changes/i }));

    await waitFor(() => {
      expect(updatePhilHealthSettingsAction).toHaveBeenCalledWith("clinic-1", {
        philhealthAccreditationNumber: "P10038831",
        facilityName: "City Health Clinic",
        philhealthYakapUsername: "new_user",
        philhealthYakapPassword: "test_new_password",
        philhealthYakapPmccNumber: "Z15445",
      });
    });

    expect(screen.getByLabelText("PhilHealth Yakap Username")).toHaveValue("");
    expect(screen.getByLabelText("PhilHealth Yakap Password")).toHaveValue("");
    expect(screen.getAllByText("Configured")).toHaveLength(2);
  });

  it("allows saving with empty credentials without blocking validation", async () => {
    const emptySetting = buildClinicSetting({
      hasPhilhealthYakapUsername: false,
      hasPhilhealthYakapPassword: false,
    });
    jest.mocked(updatePhilHealthSettingsAction).mockResolvedValue({
      status: true,
      message: "PhilHealth settings updated successfully",
      data: emptySetting,
    });

    render(<PhilHealthTab clinicUid="clinic-1" clinicSetting={emptySetting} />);

    fireEvent.click(screen.getByRole("button", { name: /Save Changes/i }));

    await waitFor(() => {
      expect(updatePhilHealthSettingsAction).toHaveBeenCalledWith("clinic-1", {
        philhealthAccreditationNumber: "P10038831",
        facilityName: "City Health Clinic",
        philhealthYakapUsername: undefined,
        philhealthYakapPassword: undefined,
        philhealthYakapPmccNumber: "Z15445",
      });
    });

    expect(toast.success).toHaveBeenCalledWith("PhilHealth settings saved.");
  });

  it("shows error toast and preserves unsaved staged state when save fails", async () => {
    const setting = buildClinicSetting();
    jest.mocked(updatePhilHealthSettingsAction).mockResolvedValue({
      status: false,
      message: "Permission denied",
      data: null,
    });

    render(<PhilHealthTab clinicUid="clinic-1" clinicSetting={setting} />);

    fireEvent.change(screen.getByLabelText("PhilHealth Yakap Password"), {
      target: { value: "test_unsaved_password" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Save Changes/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Permission denied");
    });

    expect(screen.getByLabelText("PhilHealth Yakap Password")).toHaveValue(
      "test_unsaved_password",
    );
    expect(mockRefresh).not.toHaveBeenCalled();
  });
});
