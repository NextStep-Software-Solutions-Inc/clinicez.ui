import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

class MockResizeObserver {
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
}
(global as unknown as Record<string, unknown>).ResizeObserver = MockResizeObserver;
if (typeof window !== "undefined") {
  (window as unknown as Record<string, unknown>).ResizeObserver = MockResizeObserver;
  window.HTMLElement.prototype.scrollIntoView = jest.fn();
}
Element.prototype.scrollIntoView = jest.fn();

jest.mock("@/actions/super-admin/sign-and-symptom.action", () => ({
  getActiveSignsAndSymptomsAction: jest.fn(),
}));

import KonsultaSubjectiveFields, {
  type SubjectiveStructuredData,
} from "./KonsultaSubjectiveFields";
import { getActiveSignsAndSymptomsAction } from "@/actions/super-admin/sign-and-symptom.action";
import { PHILHEALTH_SIGNS_AND_SYMPTOMS } from "@/lib/philhealth-yakap/signs-and-symptoms-library";

const activeMockLibrary = PHILHEALTH_SIGNS_AND_SYMPTOMS.filter((s) => s.isActive).map(
  (s, idx) => ({
    id: `sym-${idx + 1}`,
    ...s,
  })
);

function StatefulWrapper({
  initialData,
  onChangeSpy,
  disabled = false,
}: {
  initialData: SubjectiveStructuredData;
  onChangeSpy?: jest.Mock;
  disabled?: boolean;
}) {
  const [data, setData] = React.useState<SubjectiveStructuredData>(initialData);
  return (
    <KonsultaSubjectiveFields
      data={data}
      disabled={disabled}
      onChange={(next) => {
        setData(next);
        onChangeSpy?.(next);
      }}
    />
  );
}

describe("KonsultaSubjectiveFields (Issue #520)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getActiveSignsAndSymptomsAction as jest.Mock).mockResolvedValue({
      success: true,
      data: activeMockLibrary,
    });
  });

  it("renders Chief Complaint / Signs & Symptoms and History of Illness labels with required badges and Data Dictionary limits", async () => {
    render(
      <StatefulWrapper
        initialData={{
          illnessHistory: "",
          signsSymptoms: "",
          painSite: "",
          otherComplaint: "",
        }}
      />
    );

    await waitFor(() => {
      expect(getActiveSignsAndSymptomsAction).toHaveBeenCalledTimes(1);
    });

    expect(
      screen.getByRole("combobox", { name: /Chief Complaint \/ Signs & Symptoms/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/lib_signssymptoms/i)).toBeInTheDocument();

    const hpiTextarea = screen.getByLabelText(/History of Illness/i) as HTMLTextAreaElement;
    expect(hpiTextarea).toBeInTheDocument();
    expect(hpiTextarea).toHaveAttribute("maxLength", "2000");
    expect(hpiTextarea).toBeRequired();

    const painSiteInput = screen.getByLabelText(/Pain Site/i) as HTMLInputElement;
    expect(painSiteInput).toBeDisabled();
    expect(painSiteInput).toHaveAttribute("maxLength", "500");

    const otherComplaintInput = screen.getByLabelText(/Other Complaint/i) as HTMLInputElement;
    expect(otherComplaintInput).toBeDisabled();
    expect(otherComplaintInput).toHaveAttribute("maxLength", "2000");
  });

  it("loads all 36 active library options and supports searching by both code and description", async () => {
    render(
      <StatefulWrapper
        initialData={{
          illnessHistory: "",
          signsSymptoms: "",
          painSite: "",
          otherComplaint: "",
        }}
      />
    );

    const combobox = await screen.findByRole("combobox");
    await waitFor(() => expect(combobox).not.toBeDisabled());

    fireEvent.click(combobox);

    const searchInput = await screen.findByPlaceholderText(/Search by code/i);
    expect(screen.getByText(/ALTERED MENTAL SENSORIUM/i)).toBeInTheDocument();
    expect(screen.getByText(/38/)).toBeInTheDocument();
    expect(screen.getByText(/OTHERS/)).toBeInTheDocument();

    // Search by numeric code "38" — non-matching items should be filtered out
    fireEvent.change(searchInput, { target: { value: "38" } });
    expect(screen.getByText("PAIN")).toBeInTheDocument();
    expect(screen.queryByText("HEADACHE")).not.toBeInTheDocument();
    expect(screen.queryByText("OTHERS")).not.toBeInTheDocument();

    // Search by description "HEADACHE" — non-matching items should be filtered out
    fireEvent.change(searchInput, { target: { value: "HEADACHE" } });
    expect(screen.getByText("HEADACHE")).toBeInTheDocument();
    expect(screen.queryByText("PAIN")).not.toBeInTheDocument();
    expect(screen.queryByText("OTHERS")).not.toBeInTheDocument();

    // Search by code "X" — non-matching items should be filtered out
    fireEvent.change(searchInput, { target: { value: "X" } });
    expect(screen.getByText("OTHERS")).toBeInTheDocument();
    expect(screen.queryByText("PAIN")).not.toBeInTheDocument();
    expect(screen.queryByText("HEADACHE")).not.toBeInTheDocument();
  });

  it("gates Pain Site on 38 - PAIN and Other Complaint on X - OTHERS, requiring when active and clearing on deselect", async () => {
    const onChangeSpy = jest.fn();
    render(
      <StatefulWrapper
        initialData={{
          illnessHistory: "Patient with body pain and cough",
          signsSymptoms: "",
          painSite: "",
          otherComplaint: "",
        }}
        onChangeSpy={onChangeSpy}
      />
    );

    const combobox = await screen.findByRole("combobox");
    await waitFor(() => expect(combobox).not.toBeDisabled());

    // Open dropdown and select 38 - PAIN
    fireEvent.click(combobox);
    const searchInput = await screen.findByPlaceholderText(/Search by code/i);
    fireEvent.change(searchInput, { target: { value: "38" } });
    fireEvent.click(screen.getByText("PAIN"));

    const painSiteInput = screen.getByLabelText(/Pain Site/i) as HTMLInputElement;
    expect(painSiteInput).not.toBeDisabled();
    expect(painSiteInput).toBeRequired();
    expect(
      screen.getByText(/Pain Site is required when 38 - PAIN is selected/i)
    ).toBeInTheDocument();

    fireEvent.change(painSiteInput, { target: { value: "Right lower quadrant" } });
    expect(painSiteInput.value).toBe("RIGHT LOWER QUADRANT");

    // Select X - OTHERS as well
    fireEvent.change(searchInput, { target: { value: "OTHERS" } });
    fireEvent.click(screen.getByText("OTHERS"));

    const otherComplaintInput = screen.getByLabelText(/Other Complaint/i) as HTMLInputElement;
    expect(otherComplaintInput).not.toBeDisabled();
    expect(otherComplaintInput).toBeRequired();
    expect(
      screen.getByText(/Other Complaint is required when X - OTHERS is selected/i)
    ).toBeInTheDocument();

    fireEvent.change(otherComplaintInput, { target: { value: "Mild chills " } });
    // Preserves trailing space while uppercasing live input
    expect(otherComplaintInput.value).toBe("MILD CHILLS ");

    // Deselect 38 - PAIN via badge remove button -> immediately clears painSite
    const removePainBtn = screen.getByRole("button", { name: /Remove 38 - PAIN/i });
    fireEvent.click(removePainBtn);

    expect(painSiteInput).toBeDisabled();
    expect(painSiteInput.value).toBe("");
    expect(onChangeSpy).toHaveBeenLastCalledWith(
      expect.objectContaining({
        signsSymptoms: "X",
        painSite: "",
        otherComplaint: "MILD CHILLS ",
      })
    );

    // Deselect X - OTHERS via badge remove button -> immediately clears otherComplaint
    const removeOthersBtn = screen.getByRole("button", { name: /Remove X - OTHERS/i });
    fireEvent.click(removeOthersBtn);

    expect(otherComplaintInput).toBeDisabled();
    expect(otherComplaintInput.value).toBe("");
    expect(onChangeSpy).toHaveBeenLastCalledWith(
      expect.objectContaining({
        signsSymptoms: "",
        painSite: "",
        otherComplaint: "",
      })
    );
  });

  it("hides stale pre-existing painSite/otherComplaint values when 38/X are unselected", async () => {
    render(
      <StatefulWrapper
        initialData={{
          illnessHistory: "cough",
          signsSymptoms: "09",
          painSite: "STALE PAIN SITE",
          otherComplaint: "STALE OTHER COMPLAINT",
        }}
      />
    );

    await waitFor(() => expect(getActiveSignsAndSymptomsAction).toHaveBeenCalled());

    const hpiTextarea = screen.getByLabelText(/History of Illness/i) as HTMLTextAreaElement;
    expect(hpiTextarea.value).toBe("COUGH");

    const painSiteInput = screen.getByLabelText(/Pain Site/i) as HTMLInputElement;
    expect(painSiteInput).toBeDisabled();
    expect(painSiteInput.value).toBe("");

    const otherComplaintInput = screen.getByLabelText(/Other Complaint/i) as HTMLInputElement;
    expect(otherComplaintInput).toBeDisabled();
    expect(otherComplaintInput.value).toBe("");
  });

  it("displays inactive legacy code badge label via canonical fallback without allowing selection in dropdown", async () => {
    render(
      <StatefulWrapper
        initialData={{
          illnessHistory: "back pain",
          signsSymptoms: "16",
          painSite: "",
          otherComplaint: "",
        }}
      />
    );

    await waitFor(() => expect(getActiveSignsAndSymptomsAction).toHaveBeenCalled());

    expect(screen.getByText("16 - FLANK OR LOWER BACK (INACTIVE)")).toBeInTheDocument();

    const trigger = screen.getByRole("combobox");
    fireEvent.click(trigger);

    const searchInput = await screen.findByPlaceholderText(/Search by code/i);
    fireEvent.change(searchInput, { target: { value: "FLANK" } });

    expect(screen.queryByText("FLANK OR LOWER BACK")).not.toBeInTheDocument();
  });

  it("renders inline error notice when signs & symptoms library fails to load", async () => {
    (getActiveSignsAndSymptomsAction as jest.Mock).mockResolvedValueOnce({
      success: false,
      error: "Database unavailable",
    });

    render(
      <StatefulWrapper
        initialData={{
          illnessHistory: "",
          signsSymptoms: "",
          painSite: "",
          otherComplaint: "",
        }}
      />
    );

    expect(await screen.findByText(/Database unavailable/i)).toBeInTheDocument();
  });

  it("renders inline notice when signs & symptoms library returns empty", async () => {
    (getActiveSignsAndSymptomsAction as jest.Mock).mockResolvedValueOnce({
      success: true,
      data: [],
    });

    render(
      <StatefulWrapper
        initialData={{
          illnessHistory: "",
          signsSymptoms: "",
          painSite: "",
          otherComplaint: "",
        }}
      />
    );

    expect(
      await screen.findByText(/No active signs & symptoms found\. Seed the library in Super Admin\./i)
    ).toBeInTheDocument();
  });
});
