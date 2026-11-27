import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import SignsAndSymptomsTable from "./signs-and-symptoms-table";
import {
  deleteSignAndSymptomAction,
  getSignsAndSymptomsAction,
  seedPhilHealthSignsAndSymptomsAction,
  upsertSignAndSymptomAction,
} from "@/actions/super-admin/sign-and-symptom.action";

jest.mock("@/actions/super-admin/sign-and-symptom.action", () => ({
  getSignsAndSymptomsAction: jest.fn(),
  upsertSignAndSymptomAction: jest.fn(),
  deleteSignAndSymptomAction: jest.fn(),
  seedPhilHealthSignsAndSymptomsAction: jest.fn(),
}));

jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

function renderTable(
  initialData = [
    { id: "1", code: "01", description: "ABDOMINAL PAIN", sortOrder: 1, isActive: true },
  ]
) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <SignsAndSymptomsTable initialData={initialData} />
    </QueryClientProvider>
  );
}

describe("SignsAndSymptomsTable", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getSignsAndSymptomsAction as jest.Mock).mockResolvedValue({
      success: true,
      data: [
        { id: "1", code: "01", description: "ABDOMINAL PAIN", sortOrder: 1, isActive: true },
        { id: "2", code: "38", description: "PAIN", sortOrder: 38, isActive: true },
      ],
    });
  });

  it("triggers seedPhilHealthSignsAndSymptomsAction and refreshes list on Seed PhilHealth Library click", async () => {
    (seedPhilHealthSignsAndSymptomsAction as jest.Mock).mockResolvedValue({
      success: true,
      data: { created: 38, skipped: 1, total: 39 },
    });

    renderTable();

    const seedBtn = screen.getByRole("button", { name: /Seed PhilHealth Library/i });
    fireEvent.click(seedBtn);

    await waitFor(() => {
      expect(seedPhilHealthSignsAndSymptomsAction).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalled();
    });

    expect(await screen.findByText("PAIN")).toBeInTheDocument();
  });

  it("displays an error toast when seedPhilHealthSignsAndSymptomsAction returns failure", async () => {
    (seedPhilHealthSignsAndSymptomsAction as jest.Mock).mockResolvedValue({
      success: false,
      error: "Super admin privileges required.",
    });

    renderTable();

    const seedBtn = screen.getByRole("button", { name: /Seed PhilHealth Library/i });
    fireEvent.click(seedBtn);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Super admin privileges required.");
    });
  });
});
