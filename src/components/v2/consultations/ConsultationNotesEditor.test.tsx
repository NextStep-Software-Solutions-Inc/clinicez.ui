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

jest.mock("@/actions/consultation/consultation-notes.action", () => ({
  upsertConsultationNotesAction: jest.fn(),
  upsertConsultationNotesSettingsAction: jest.fn(),
}));

jest.mock("@/actions/super-admin/sign-and-symptom.action", () => ({
  getActiveSignsAndSymptomsAction: jest.fn(),
}));

jest.mock("react-markdown", () => function MockReactMarkdown({ children }: { children?: React.ReactNode }) {
  return <div>{children}</div>;
});
jest.mock("remark-gfm", () => () => {});
jest.mock("rehype-sanitize", () => () => {});

jest.mock("./DownloadEkasButton", () => function MockDownloadEkasButton() {
  return <button type="button">Download eKAS</button>;
});

jest.mock("@/components/ai", () => ({
  MedicalNoteSummarizer: ({ consultationNotes }: { consultationNotes: string }) => (
    <div data-testid="ai-summarizer" data-notes={consultationNotes} />
  ),
}));

jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

import ConsultationNotesEditor from "./ConsultationNotesEditor";
import { upsertConsultationNotesAction } from "@/actions/consultation/consultation-notes.action";
import { getActiveSignsAndSymptomsAction } from "@/actions/super-admin/sign-and-symptom.action";

const baseConsultation = (overrides: Record<string, unknown> = {}) =>
  ({
    id: 101,
    subject: "Consultation 101",
    isPhilHealthKonsulta: true,
    ConsultationTicketHPs: [
      {
        HealthCareProvider: {
          id: 10,
          HPProfile: { title: "DR.", name: "ALICE SMITH", suffix: "" },
          User: { firstName: "Alice", lastName: "Smith", userId: "usr_1" },
          HPType: { name: "Physician" },
        },
      },
    ],
    ConsultationTicketAttribute: {
      status: "PROCESSING",
      NoteTemplate: {
        name: "SOAP",
        NoteSections: [
          {
            id: 1,
            name: "subjective",
            label: "Subjective History",
            description: null,
            sortOrder: 1,
            showOnPatient: false,
          },
        ],
      },
    },
    ConsultationNotes: [],
    ...overrides,
  }) as unknown as React.ComponentProps<typeof ConsultationNotesEditor>["consultation"];

const myHPs = [
  {
    id: 10,
    HPProfile: { title: "DR.", name: "ALICE SMITH", suffix: "" },
    User: { firstName: "Alice", lastName: "Smith" },
    HPType: { name: "Physician" },
  },
] as unknown as React.ComponentProps<typeof ConsultationNotesEditor>["myHPs"];

describe("ConsultationNotesEditor (Issue #520)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getActiveSignsAndSymptomsAction as jest.Mock).mockResolvedValue({
      success: true,
      data: [
        { id: "1", code: "37", description: "FEVER", sortOrder: 37, isActive: true },
        { id: "2", code: "38", description: "PAIN", sortOrder: 38, isActive: true },
        { id: "3", code: "X", description: "OTHERS", sortOrder: 39, isActive: true },
      ],
    });
    (upsertConsultationNotesAction as jest.Mock).mockResolvedValue({
      status: true,
      message: "Note saved",
      data: {
        id: 55,
        section: "subjective",
        content: "FEVER FOR 3 DAYS",
        hpId: 10,
        showOnPatient: false,
        structuredData: {
          illnessHistory: "FEVER FOR 3 DAYS",
          signsSymptoms: "",
          painSite: "",
          otherComplaint: "",
        },
      },
    });
  });

  it("collapses duplicate MarkdownEditor on Yakap subjective sections and hydrates blank illnessHistory from existing note.content", async () => {
    const consultation = baseConsultation({
      ConsultationNotes: [
        {
          id: 1,
          section: "subjective",
          content: "### Chief Complaint\n- **Fever** for 3 days",
          hpId: 10,
          showOnPatient: false,
          structuredData: null,
        },
      ],
    });

    render(
      <ConsultationNotesEditor
        clinicUid="clinic-1"
        consultation={consultation}
        myHPs={myHPs}
        onPatchDetail={jest.fn()}
      />
    );

    const hpiTextarea = (await screen.findByLabelText(/History of Illness/i)) as HTMLTextAreaElement;
    expect(hpiTextarea.value).toBe("CHIEF COMPLAINT\nFEVER FOR 3 DAYS");

    const toggleBtn = screen.getByRole("button", {
      name: /Additional Clinical Narrative \(Optional\)/i,
    });
    expect(toggleBtn).toHaveAttribute("aria-expanded", "false");
    expect(
      screen.queryByPlaceholderText(/Optional supplemental clinical narrative/i)
    ).not.toBeInTheDocument();
  });

  it("auto-expands Additional Clinical Narrative when existing note.content differs from illnessHistory", async () => {
    const consultation = baseConsultation({
      ConsultationNotes: [
        {
          id: 1,
          section: "subjective",
          content: "Supplemental follow-up preference",
          hpId: 10,
          showOnPatient: false,
          structuredData: {
            illnessHistory: "FEVER FOR 3 DAYS",
            signsSymptoms: "37",
            painSite: "",
            otherComplaint: "",
          },
        },
      ],
    });

    render(
      <ConsultationNotesEditor
        clinicUid="clinic-1"
        consultation={consultation}
        myHPs={myHPs}
        onPatchDetail={jest.fn()}
      />
    );

    const toggleBtn = await screen.findByRole("button", {
      name: /Additional Clinical Narrative \(Optional\)/i,
    });
    expect(toggleBtn).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByPlaceholderText(/Optional supplemental clinical narrative/i)
    ).toHaveValue("Supplemental follow-up preference");
  });

  it("mirrors History of Illness into saved content when no distinct narrative is entered and sanitizes structuredData", async () => {
    const onPatchDetail = jest.fn();
    const consultation = baseConsultation({
      ConsultationNotes: [
        {
          id: 1,
          section: "subjective",
          content: "",
          hpId: 10,
          showOnPatient: false,
          structuredData: {
            illnessHistory: "",
            signsSymptoms: "37",
            painSite: "STALE PAIN",
            otherComplaint: "STALE OTHER",
          },
        },
      ],
    });

    render(
      <ConsultationNotesEditor
        clinicUid="clinic-1"
        consultation={consultation}
        myHPs={myHPs}
        onPatchDetail={onPatchDetail}
      />
    );

    const hpiTextarea = (await screen.findByLabelText(/History of Illness/i)) as HTMLTextAreaElement;
    fireEvent.change(hpiTextarea, { target: { value: "Fever for 3 days" } });

    const summarizer = screen.getByTestId("ai-summarizer");
    expect(summarizer.getAttribute("data-notes")).toContain("FEVER FOR 3 DAYS");

    fireEvent.click(screen.getByRole("button", { name: /^Save$/i }));

    await waitFor(() => {
      expect(upsertConsultationNotesAction).toHaveBeenCalledWith({
        consultationTicketId: 101,
        section: "subjective",
        content: "FEVER FOR 3 DAYS",
        hpId: 10,
        showOnPatient: false,
        structuredData: {
          illnessHistory: "FEVER FOR 3 DAYS",
          signsSymptoms: "37",
          painSite: "",
          otherComplaint: "",
        },
      });
    });
  });

  it("hydrates History of Illness when isPhilHealthKonsulta toggles from false to true", async () => {
    const nonKonsulta = baseConsultation({
      isPhilHealthKonsulta: false,
      ConsultationNotes: [
        {
          id: 1,
          section: "subjective",
          content: "Persistent **headache** since yesterday",
          hpId: 10,
          showOnPatient: false,
          structuredData: null,
        },
      ],
    });

    const { rerender } = render(
      <ConsultationNotesEditor
        clinicUid="clinic-1"
        consultation={nonKonsulta}
        myHPs={myHPs}
        onPatchDetail={jest.fn()}
      />
    );

    expect(screen.queryByLabelText(/History of Illness/i)).not.toBeInTheDocument();

    rerender(
      <ConsultationNotesEditor
        clinicUid="clinic-1"
        consultation={{ ...nonKonsulta, isPhilHealthKonsulta: true }}
        myHPs={myHPs}
        onPatchDetail={jest.fn()}
      />
    );

    const hpiTextarea = (await screen.findByLabelText(/History of Illness/i)) as HTMLTextAreaElement;
    expect(hpiTextarea.value).toBe("PERSISTENT HEADACHE SINCE YESTERDAY");
  });
});
