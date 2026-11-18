import React from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { toast } from "sonner";
import SeedConsole from "./SeedConsole";
import {
  seedAllAction,
  seedLocationsAction,
  seedPermissionsAction,
  seedProceduresAction,
  seedSignsAndSymptomsAction,
  seedVaccinesAction,
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
    (seedSignsAndSymptomsAction as jest.Mock).mockResolvedValue({
      status: true,
      message: "Seeded 39 signs & symptoms",
      data: { created: 39, skipped: 0, total: 39 },
    });

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
    (seedAllAction as jest.Mock).mockResolvedValue({
      status: true,
      message: "All seeds completed",
      data: {
        permissions: { created: 1, skipped: 2, total: 3 },
        procedures: { created: 0, skipped: 10, total: 10 },
        vaccines: { created: 0, skipped: 5, total: 5 },
        signsAndSymptoms: { created: 12, skipped: 27, total: 39 },
        locations: { created: 0, skipped: 100, total: 100 },
      },
    });

    render(<SeedConsole />);

    const runAllBtn = screen.getByRole("button", { name: /Run All Seeds/i });
    fireEvent.click(runAllBtn);

    await waitFor(() => {
      expect(seedAllAction).toHaveBeenCalledTimes(1);
    });

    const seedAllTitle = screen.getByText("Seed All");
    const seedAllCard = seedAllTitle.closest(".shadow-sm");
    expect(await within(seedAllCard as HTMLElement).findByText("All seeds completed")).toBeInTheDocument();
    expect(within(seedAllCard as HTMLElement).getByText("Success")).toBeInTheDocument();
    expect(toast.success).toHaveBeenCalledWith("All seeds completed");
  });

  it("shows error toast when seedSignsAndSymptomsAction fails", async () => {
    (seedSignsAndSymptomsAction as jest.Mock).mockResolvedValue({
      status: false,
      message: "Unauthorized",
      data: null,
    });

    render(<SeedConsole />);

    const cardTitle = screen.getByText("PhilHealth Signs & Symptoms");
    const card = cardTitle.closest(".shadow-sm");
    const seedBtn = within(card as HTMLElement).getByRole("button", { name: /^Seed$/i });
    fireEvent.click(seedBtn);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });
    expect(await within(card as HTMLElement).findByText("Failed")).toBeInTheDocument();
  });
});
