"use client";

import { useState, useTransition } from "react";
import { Save, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { upsertConsultationNotesAction } from "@/actions/consultation/consultation-notes.action";
import type { GetPatientConsultationDetail } from "@/actions/consultation/patient-consultations.action";
import type { GetHPsType } from "@/actions/hp.actions";
import MarkdownEditor from "./MarkdownEditor";

type Detail = NonNullable<GetPatientConsultationDetail["data"]>;

interface ConsultationNotesEditorProps {
  clinicUid: string;
  consultation: Detail;
  myHPs: NonNullable<GetHPsType>;
  onPatchDetail: (patch: Partial<Detail>) => void;
}

export default function ConsultationNotesEditor({
  consultation,
  myHPs,
  onPatchDetail,
}: ConsultationNotesEditorProps) {
  const sections =
    consultation.ConsultationTicketAttribute?.NoteTemplate?.NoteSections ?? [];

  // Determine which HP to write notes as (prefer HP already on this ticket)
  const ticketHpIds = consultation.ConsultationTicketHPs.map(
    (h) => h.HealthCareProvider.id
  );
  const myActiveHp =
    myHPs.find((hp) => ticketHpIds.includes(hp.id)) ?? myHPs[0] ?? null;

  // Build initial note map: section name → content
  const initialNoteMap: Record<string, string> = {};
  for (const note of consultation.ConsultationNotes) {
    initialNoteMap[note.section] = note.content;
  }

  const [noteValues, setNoteValues] = useState<Record<string, string>>(initialNoteMap);
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>(
    Object.fromEntries(sections.map((s) => [s.name, true]))
  );

  const saveSection = async (sectionName: string) => {
    if (!myActiveHp) {
      toast.error("You must have an HP profile to add notes");
      return;
    }
    setSavingSection(sectionName);
    const result = await upsertConsultationNotesAction({
      consultationTicketId: consultation.id,
      section: sectionName,
      content: noteValues[sectionName] ?? "",
      hpId: myActiveHp.id,
    });
    setSavingSection(null);
    if (result.status && result.data) {
      toast.success(result.message ?? "Note saved");
      // Patch only the notes array — no full reload needed
      const saved = result.data;
      const existing = consultation.ConsultationNotes;
      const idx = existing.findIndex((n) => n.section === saved.section && n.hpId === saved.hpId);
      const patch = {
        id: saved.id,
        section: saved.section,
        content: saved.content,
        hpId: saved.hpId,
        showOnPatient: saved.showOnPatient,
      } satisfies (typeof existing)[number];
      onPatchDetail({
        ConsultationNotes: idx >= 0
          ? existing.map((n, i) => (i === idx ? patch : n))
          : [...existing, patch],
      });
    } else {
      toast.error(result.message ?? "Failed to save note");
    }
  };

  if (sections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-center px-6">
        <p className="text-sm text-muted-foreground">
          No note template is configured for this consultation.
        </p>
      </div>
    );
  }

  if (!myActiveHp) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 px-6 text-center">
        <p className="text-sm text-muted-foreground">
          You must have a healthcare provider profile assigned to this consultation to write notes.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-3">
      {sections.map((section) => (
        <div
          key={section.name}
          className="rounded-lg border border-border/50 bg-background overflow-hidden"
        >
          <button
            type="button"
            onClick={() =>
              setExpanded((prev) => ({ ...prev, [section.name]: !prev[section.name] }))
            }
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors text-left"
          >
            <div>
              <span className="text-sm font-semibold text-foreground">{section.label || section.name}</span>
              {section.description && (
                <span className="block text-xs text-muted-foreground mt-0.5">{section.description}</span>
              )}
            </div>
            {expanded[section.name] ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
            )}
          </button>

          {expanded[section.name] && (
            <div className="px-4 pb-4 space-y-2">
              <MarkdownEditor
                value={noteValues[section.name] ?? ""}
                onChange={(v) =>
                  setNoteValues((prev) => ({ ...prev, [section.name]: v }))
                }
                placeholder={`Enter ${section.label || section.name} notes… (supports **bold**, _italic_, ### headings, - lists)`}
              />
              <div className="flex justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 h-7 text-xs"
                  disabled={savingSection === section.name}
                  onClick={() => saveSection(section.name)}
                >
                  <Save className="h-3.5 w-3.5" />
                  {savingSection === section.name ? "Saving…" : "Save"}
                </Button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
