import React from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { toast } from "sonner";
import SeedConsole from "./SeedConsole";
import {
  seedAllAction,
  seedSignsAndSymptomsAction,
  type SeedResult,
} from "@actions/super-admin/seed.action";

jest.mock("@actions/super-admin/seed.action", () => ({
  seedPermissionsAction: jest.fn(),
  seedProceduresAction: jest.fn(),
  seedVaccinesAction: jest.fn(),
  seedSignsAndSymptomsAction: jest.fn(),
  seedLocationsAction: jest.fn(),
  seedAllAction: jest.fn(),
}));

jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe("SeedConsole", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders PhilHealth Signs & Symptoms seed card and invokes seedSignsAndSymptomsAction", async () => {
    const result: SeedResult = {
      status: true,
      message: "Seeded 39 signs & symptoms",
      data: { created: 39, skipped: 0, total: 39 },
    };
    jest.mocked(seedSignsAndSymptomsAction).mockResolvedValue(result);

    render(<SeedConsole />);

    const cardTitle = screen.getByText("PhilHealth Signs & Symptoms");
    const card = cardTitle.closest(".shadow-sm");
    expect(card).toBeTruthy();

    const seedBtn = within(card as HTMLElement).getByRole("button", { name: /^Seed$/i });
    fireEvent.click(seedBtn);

    await waitFor(() => {
      expect(seedSignsAndSymptomsAction).toHaveBeenCalledTimes(1);
    });

    expect(await within(card as HTMLElement).findByText("Created: 39")).toBeInTheDocument();
    expect(within(card as HTMLElement).getByText("Skipped: 0")).toBeInTheDocument();
    expect(within(card as HTMLElement).queryByText("Failed")).not.toBeInTheDocument();
    expect(within(card as HTMLElement).getByText("Seeded 39 signs & symptoms")).toBeInTheDocument();
    expect(toast.success).toHaveBeenCalled();
  });

  it("runs all seeds including PhilHealth Signs & Symptoms when clicking Run All Seeds", async () => {
    const result: SeedResult = {
      status: true,
      message: "All seeds completed. Created: 13, Skipped: 144",
      data: { created: 13, skipped: 144, total: 157 },
    };
    jest.mocked(seedAllAction).mockResolvedValue(result);

    render(<SeedConsole />);

    const runAllBtn = screen.getByRole("button", { name: /Run All Seeds/i });
    fireEvent.click(runAllBtn);

    await waitFor(() => {
      expect(seedAllAction).toHaveBeenCalledTimes(1);
    });

    const seedAllTitle = screen.getByText("Seed All");
    const seedAllCard = seedAllTitle.closest(".shadow-sm");
    expect(seedAllCard).toBeTruthy();
    expect(
      await within(seedAllCard as HTMLElement).findByText(
        "All seeds completed. Created: 13, Skipped: 144"
      )
    ).toBeInTheDocument();
    expect(within(seedAllCard as HTMLElement).getByText("Success")).toBeInTheDocument();
    expect(within(seedAllCard as HTMLElement).getByText("Created: 13")).toBeInTheDocument();
    expect(within(seedAllCard as HTMLElement).getByText("Skipped: 144")).toBeInTheDocument();
    expect(within(seedAllCard as HTMLElement).queryByText("Failed")).not.toBeInTheDocument();
    expect(toast.success).toHaveBeenCalledWith("All seeds completed. Created: 13, Skipped: 144");
  });

  it("shows error toast and omits count badges when seedAllAction fails", async () => {
    const failureResult: SeedResult = {
      status: false,
      message: "Some seeds failed: Unauthorized",
      data: null,
    };
    jest.mocked(seedAllAction).mockResolvedValue(failureResult);

    render(<SeedConsole />);

    const runAllBtn = screen.getByRole("button", { name: /Run All Seeds/i });
    fireEvent.click(runAllBtn);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Some seeds failed: Unauthorized");
    });

    const seedAllTitle = screen.getByText("Seed All");
    const seedAllCard = seedAllTitle.closest(".shadow-sm");
    expect(seedAllCard).toBeTruthy();
    expect(await within(seedAllCard as HTMLElement).findByText("Failed")).toBeInTheDocument();
    expect(
      within(seedAllCard as HTMLElement).getByText("Some seeds failed: Unauthorized")
    ).toBeInTheDocument();
    expect(within(seedAllCard as HTMLElement).queryByText(/^Created:/)).not.toBeInTheDocument();
    expect(within(seedAllCard as HTMLElement).queryByText(/^Skipped:/)).not.toBeInTheDocument();
  });

  it("shows error toast when seedAllAction throws an unexpected error", async () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    jest.mocked(seedAllAction).mockRejectedValue(new Error("Network timeout"));

    try {
      render(<SeedConsole />);

      const runAllBtn = screen.getByRole("button", { name: /Run All Seeds/i });
      fireEvent.click(runAllBtn);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Network timeout");
      });
      expect(runAllBtn).toBeEnabled();
    } finally {
      consoleErrorSpy.mockRestore();
    }
  });

  it("shows error toast when seedSignsAndSymptomsAction fails", async () => {
    const failureResult: SeedResult = {
      status: false,
      message: "Unauthorized",
      data: null,
    };
    jest.mocked(seedSignsAndSymptomsAction).mockResolvedValue(failureResult);

    render(<SeedConsole />);

    const cardTitle = screen.getByText("PhilHealth Signs & Symptoms");
    const card = cardTitle.closest(".shadow-sm");
    const seedBtn = within(card as HTMLElement).getByRole("button", { name: /^Seed$/i });
    fireEvent.click(seedBtn);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });
    expect(await within(card as HTMLElement).findByText("Failed")).toBeInTheDocument();
    expect(within(card as HTMLElement).queryByText(/^Created:/)).not.toBeInTheDocument();
    expect(within(card as HTMLElement).queryByText(/^Skipped:/)).not.toBeInTheDocument();
  });
});
