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

function getCardByTitle(title: string): HTMLElement {
  const cardTitle = screen.getByText(title);
  const card = cardTitle.closest(".shadow-sm");
  expect(card).not.toBeNull();
  return card as HTMLElement;
}

describe("SeedConsole", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each([
    {
      title: "Permissions",
      action: seedPermissionsAction,
      result: {
        status: true,
        message: "Permissions seeded. Created: 5, Skipped: 40",
        data: { created: 5, skipped: 40, total: 45 },
      } satisfies SeedResult,
    },
    {
      title: "Diagnostics & Procedures",
      action: seedProceduresAction,
      result: {
        status: true,
        message: "Procedures seeded. Imaging: 8, Lab: 76, Heart Station: 19",
        data: { created: 10, skipped: 93, total: 103 },
      } satisfies SeedResult,
    },
    {
      title: "Vaccines, Routes & Doses",
      action: seedVaccinesAction,
      result: {
        status: true,
        message: "PhilHealth Immunizations seeded. Created: 2, Updated: 20",
        data: { created: 2, skipped: 20, total: 22 },
      } satisfies SeedResult,
    },
    {
      title: "PhilHealth Signs & Symptoms",
      action: seedSignsAndSymptomsAction,
      result: {
        status: true,
        message: "Seeded 39 signs & symptoms",
        data: { created: 39, skipped: 0, total: 39 },
      } satisfies SeedResult,
    },
    {
      title: "Philippine Locations",
      action: seedLocationsAction,
      result: {
        status: true,
        message: "Philippine locations seeded",
        data: { created: 41967, skipped: 0, total: 41967 },
      } satisfies SeedResult,
    },
  ])(
    "renders $title seed card and displays result badges on success",
    async ({ title, action, result }) => {
      jest.mocked(action).mockResolvedValue(result);

      render(<SeedConsole />);

      const card = getCardByTitle(title);
      const seedBtn = within(card).getByRole("button", { name: /^Seed$/i });
      fireEvent.click(seedBtn);

      await waitFor(() => {
        expect(action).toHaveBeenCalledTimes(1);
      });

      expect(await within(card).findByText(result.message)).toBeInTheDocument();
      expect(within(card).getByText("Success")).toBeInTheDocument();
      expect(within(card).getByText(`Created: ${result.data.created}`)).toBeInTheDocument();
      expect(within(card).getByText(`Skipped: ${result.data.skipped}`)).toBeInTheDocument();
      expect(within(card).queryByText("Failed")).not.toBeInTheDocument();
      expect(toast.success).toHaveBeenCalledWith(result.message);
    }
  );

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

    const seedAllCard = getCardByTitle("Seed All");
    expect(
      await within(seedAllCard).findByText("All seeds completed. Created: 13, Skipped: 144")
    ).toBeInTheDocument();
    expect(within(seedAllCard).getByText("Success")).toBeInTheDocument();
    expect(within(seedAllCard).getByText("Created: 13")).toBeInTheDocument();
    expect(within(seedAllCard).getByText("Skipped: 144")).toBeInTheDocument();
    expect(within(seedAllCard).queryByText("Failed")).not.toBeInTheDocument();
    expect(toast.success).toHaveBeenCalledWith("All seeds completed. Created: 13, Skipped: 144");
  });

  it("renders zero count badges on Seed All when created and skipped are 0", async () => {
    const result: SeedResult = {
      status: true,
      message: "All seeds completed. Created: 0, Skipped: 0",
      data: { created: 0, skipped: 0, total: 0 },
    };
    jest.mocked(seedAllAction).mockResolvedValue(result);

    render(<SeedConsole />);

    fireEvent.click(screen.getByRole("button", { name: /Run All Seeds/i }));

    const seedAllCard = getCardByTitle("Seed All");
    expect(await within(seedAllCard).findByText("Created: 0")).toBeInTheDocument();
    expect(within(seedAllCard).getByText("Skipped: 0")).toBeInTheDocument();
    expect(within(seedAllCard).getByText("Success")).toBeInTheDocument();
    expect(within(seedAllCard).queryByText("Failed")).not.toBeInTheDocument();
  });

  it("disables all seed buttons while Seed All is running and re-enables them once settled", async () => {
    let resolveSeedAll!: (value: SeedResult) => void;
    const pendingPromise = new Promise<SeedResult>((resolve) => {
      resolveSeedAll = resolve;
    });
    jest.mocked(seedAllAction).mockReturnValue(pendingPromise);

    render(<SeedConsole />);

    const runAllBtn = screen.getByRole("button", { name: /Run All Seeds/i });
    const seedButtons = screen.getAllByRole("button", { name: /^Seed$/i });
    expect(seedButtons).toHaveLength(5);

    fireEvent.click(runAllBtn);

    expect(runAllBtn).toBeDisabled();
    for (const btn of seedButtons) {
      expect(btn).toBeDisabled();
    }

    // Subsequent click while disabled does not invoke seedAllAction again
    fireEvent.click(runAllBtn);
    expect(seedAllAction).toHaveBeenCalledTimes(1);

    resolveSeedAll({
      status: true,
      message: "All seeds completed. Created: 1, Skipped: 2",
      data: { created: 1, skipped: 2, total: 3 },
    });

    const seedAllCard = getCardByTitle("Seed All");
    expect(await within(seedAllCard).findByText("Created: 1")).toBeInTheDocument();
    expect(within(seedAllCard).getByText("Skipped: 2")).toBeInTheDocument();

    await waitFor(() => {
      expect(runAllBtn).toBeEnabled();
      for (const btn of seedButtons) {
        expect(btn).toBeEnabled();
      }
    });
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

    const seedAllCard = getCardByTitle("Seed All");
    expect(await within(seedAllCard).findByText("Failed")).toBeInTheDocument();
    expect(within(seedAllCard).queryByText("Success")).not.toBeInTheDocument();
    expect(
      within(seedAllCard).getByText("Some seeds failed: Unauthorized")
    ).toBeInTheDocument();
    expect(within(seedAllCard).queryByText(/^Created:/)).not.toBeInTheDocument();
    expect(within(seedAllCard).queryByText(/^Skipped:/)).not.toBeInTheDocument();
  });

  it("shows error toast and leaves Seed All badge unset when seedAllAction throws an unexpected error", async () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    jest.mocked(seedAllAction).mockRejectedValue(new Error("Network timeout"));

    try {
      render(<SeedConsole />);

      const runAllBtn = screen.getByRole("button", { name: /Run All Seeds/i });
      fireEvent.click(runAllBtn);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Network timeout");
      });
      await waitFor(() => {
        expect(runAllBtn).toBeEnabled();
      });

      const seedAllCard = getCardByTitle("Seed All");
      expect(within(seedAllCard).queryByText("Success")).not.toBeInTheDocument();
      expect(within(seedAllCard).queryByText("Failed")).not.toBeInTheDocument();
      expect(within(seedAllCard).queryByText(/^Created:/)).not.toBeInTheDocument();
      expect(within(seedAllCard).queryByText(/^Skipped:/)).not.toBeInTheDocument();
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

    const card = getCardByTitle("PhilHealth Signs & Symptoms");
    const seedBtn = within(card).getByRole("button", { name: /^Seed$/i });
    fireEvent.click(seedBtn);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Unauthorized");
    });
    expect(await within(card).findByText("Failed")).toBeInTheDocument();
    expect(within(card).queryByText("Success")).not.toBeInTheDocument();
    expect(within(card).getByText("Unauthorized")).toBeInTheDocument();
    expect(within(card).queryByText(/^Created:/)).not.toBeInTheDocument();
    expect(within(card).queryByText(/^Skipped:/)).not.toBeInTheDocument();
  });

  it("shows error toast and preserves 'Not run yet' when an individual seed action throws", async () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    jest
      .mocked(seedSignsAndSymptomsAction)
      .mockRejectedValueOnce(new Error("Database connection lost"))
      .mockRejectedValueOnce(null);

    try {
      render(<SeedConsole />);

      const card = getCardByTitle("PhilHealth Signs & Symptoms");
      const seedBtn = within(card).getByRole("button", { name: /^Seed$/i });

      fireEvent.click(seedBtn);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Database connection lost");
      });
      await waitFor(() => {
        expect(seedBtn).toBeEnabled();
      });
      expect(within(card).getByText("Not run yet")).toBeInTheDocument();
      expect(within(card).queryByText("Success")).not.toBeInTheDocument();
      expect(within(card).queryByText("Failed")).not.toBeInTheDocument();

      fireEvent.click(seedBtn);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Failed to run seed: philhealth");
      });
      await waitFor(() => {
        expect(seedBtn).toBeEnabled();
      });
    } finally {
      consoleErrorSpy.mockRestore();
    }
  });
});
