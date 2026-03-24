"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { Save, ChevronDown, ChevronUp, Eye, EyeOff, Loader2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  upsertConsultationNotesAction,
  upsertConsultationNotesSettingsAction,
} from "@/actions/consultation/consultation-notes.action";
import type { GetPatientConsultationDetail } from "@/actions/consultation/patient-consultations.action";
import type { GetHPsType } from "@/actions/hp.actions";
import MarkdownEditor from "./MarkdownEditor";
import { MedicalNoteSummarizer } from "@/components/ai";
import { sortNoteSectionsSOAP } from "@/utils/soap-ordering";

type Detail = NonNullable<GetPatientConsultationDetail["data"]>;

type SectionSaveStatus = "idle" | "saving" | "saved" | "error";

const AUTOSAVE_DELAY_MS = 400;

interface ConsultationNotesEditorProps {
  clinicUid: string;
  consultation: Detail;
  myHPs: NonNullable<GetHPsType>;
  onPatchDetail: (patch: Partial<Detail>) => void;
  isResolved?: boolean;
}

export default function ConsultationNotesEditor({
  consultation,
  myHPs,
  onPatchDetail,
  isResolved = false,
}: ConsultationNotesEditorProps) {
  const sections = sortNoteSectionsSOAP(
    consultation.ConsultationTicketAttribute?.NoteTemplate?.NoteSections ?? []
  );

  // Determine which HP to write notes as (prefer HP already on this ticket)
  const ticketHpIds = consultation.ConsultationTicketHPs.map(
    (h) => h.HealthCareProvider.id
  );
  const myActiveHp =
    myHPs.find((hp) => ticketHpIds.includes(hp.id)) ?? myHPs[0] ?? null;

  // Build initial note map: section name → content and showOnPatient
  // Prioritize the current HP's notes; fall back to any note for that section
  // when the current HP is not one of the consultation's assigned HPs.
  const myHpIsOnTicket = myActiveHp !== null && ticketHpIds.includes(myActiveHp.id);
  const initialNoteMap: Record<string, string> = {};
  const initialShowMap: Record<string, boolean> = {};
  for (const note of consultation.ConsultationNotes) {
    if (myHpIsOnTicket) {
      // Only pre-fill with the current HP's own notes
      if (note.hpId === myActiveHp!.id) {
        initialNoteMap[note.section] = note.content;
        initialShowMap[note.section] = note.showOnPatient;
      }
    } else if (!(note.section in initialNoteMap)) {
      // Current HP is not on this ticket — show the first available note per section
      initialNoteMap[note.section] = note.content;
      initialShowMap[note.section] = note.showOnPatient;
    }
  }

  const [noteValues, setNoteValues] = useState<Record<string, string>>(initialNoteMap);
  const [showOnPatient, setShowOnPatient] = useState<Record<string, boolean>>(initialShowMap);
  const [sectionSaveStatus, setSectionSaveStatus] = useState<Record<string, SectionSaveStatus>>({});
  const [isTogglingPrivacy, startToggleTransition] = useTransition();
  const [expanded, setExpanded] = useState<Record<string, boolean>>(
    Object.fromEntries(sections.map((s) => [s.name, true]))
  );

  // Debounce timers per section — cleared on unmount
  const debounceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // Stable refs so debounce callbacks always read the latest values
  const showOnPatientRef = useRef<Record<string, boolean>>(initialShowMap);
  showOnPatientRef.current = showOnPatient;

  const myActiveHpRef = useRef(myActiveHp);
  myActiveHpRef.current = myActiveHp;

  const consultationRef = useRef(consultation);
  consultationRef.current = consultation;

  const onPatchDetailRef = useRef(onPatchDetail);
  onPatchDetailRef.current = onPatchDetail;

  // Cleanup all pending timers when the component unmounts
  useEffect(() => {
    return () => {
      Object.values(debounceTimers.current).forEach(clearTimeout);
    };
  }, []);

  // Core save — used by both auto-save and the manual Save button
  const doSave = async (sectionName: string, content: string) => {
    const hp = myActiveHpRef.current;
    if (!hp) return;

    setSectionSaveStatus((prev) => ({ ...prev, [sectionName]: "saving" }));

    try {
      const result = await upsertConsultationNotesAction({
        consultationTicketId: consultationRef.current.id,
        section: sectionName,
        content,
        hpId: hp.id,
        showOnPatient: showOnPatientRef.current[sectionName] ?? false,
      });

      if (result.status && result.data) {
        setSectionSaveStatus((prev) => ({ ...prev, [sectionName]: "saved" }));
        toast.success(result.message ?? "Note saved");
        // Patch only the notes array — no full reload needed
        const saved = result.data;
        const existing = consultationRef.current.ConsultationNotes;
        const idx = existing.findIndex((n) => n.section === saved.section && n.hpId === saved.hpId);
        const patch = {
          id: saved.id,
          section: saved.section,
          content: saved.content,
          hpId: saved.hpId,
          showOnPatient: saved.showOnPatient,
        } satisfies (typeof existing)[number];
        onPatchDetailRef.current({
          ConsultationNotes: idx >= 0
            ? existing.map((n, i) => (i === idx ? patch : n))
            : [...existing, patch],
        });
      } else {
        setSectionSaveStatus((prev) => ({ ...prev, [sectionName]: "error" }));
        toast.error(result.message ?? "Failed to save note");
      }
    } catch {
      setSectionSaveStatus((prev) => ({ ...prev, [sectionName]: "error" }));
      toast.error("Failed to save note");
    }
  };

  // Called by MarkdownEditor's onChange — updates state then schedules auto-save
  const handleNoteChange = (sectionName: string, value: string) => {
    setNoteValues((prev) => ({ ...prev, [sectionName]: value }));

    if (isResolved || !myActiveHpRef.current) return;

    // Clear any previously scheduled save for this section
    if (debounceTimers.current[sectionName]) {
      clearTimeout(debounceTimers.current[sectionName]);
    }

    // Schedule auto-save after the user pauses typing
    debounceTimers.current[sectionName] = setTimeout(() => {
      void doSave(sectionName, value);
    }, AUTOSAVE_DELAY_MS);
  };

  // Manual save — cancels any pending auto-save and saves immediately
  const saveSection = async (sectionName: string) => {
    if (isResolved) {
      toast.error("Cannot edit notes on a resolved consultation.");
      return;
    }
    if (!myActiveHp) {
      toast.error("You must have an HP profile to add notes");
      return;
    }
    if (debounceTimers.current[sectionName]) {
      clearTimeout(debounceTimers.current[sectionName]);
    }
    await doSave(sectionName, noteValues[sectionName] ?? "");
  };

  const toggleShowOnPatient = (sectionName: string) => {
    if (!myActiveHp) {
      toast.error("You must have an HP profile to change privacy settings");
      return;
    }
    const next = !showOnPatient[sectionName];
    setShowOnPatient((prev) => ({ ...prev, [sectionName]: next }));

    // If the note hasn't been saved yet, just update local state.
    // The privacy setting will be persisted together with the content when the user saves.
    const noteExists = consultation.ConsultationNotes.some(
      (n) => n.section === sectionName && n.hpId === myActiveHp.id
    );
    if (!noteExists) return;

    startToggleTransition(async () => {
      const fd = new FormData();
      fd.append("consultationTicketId", String(consultation.id));
      fd.append("hpId", String(myActiveHp.id));
      fd.append(sectionName, String(next));
      const result = await upsertConsultationNotesSettingsAction(fd);
      if (result.status) {
        // Update the notes array with the new showOnPatient value
        const existing = consultation.ConsultationNotes;
        const idx = existing.findIndex(
          (n) => n.section === sectionName && n.hpId === myActiveHp.id
        );
        if (idx >= 0) {
          onPatchDetail({
            ConsultationNotes: existing.map((n, i) =>
              i === idx ? { ...n, showOnPatient: next } : n
            ),
          });
        }
      } else {
        // Revert on failure
        setShowOnPatient((prev) => ({ ...prev, [sectionName]: !next }));
        toast.error(result.message ?? "Failed to update privacy setting");
      }
    });
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
      {/* AI Summarize button — hidden once consultation is resolved */}
      {!isResolved && (
      <div className="flex items-center justify-end">
        <MedicalNoteSummarizer
          consultationNotes={sections
            .map((section) => `${section.label || section.name}: ${noteValues[section.name] ?? ""}`)
            .join("\n\n")}
          noteSections={sections.map((s) => s.label || s.name)}
          outputFormat="markdown"
        />
      </div>
      )}
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
            <div className="flex items-center gap-2 shrink-0">
              <span className={`flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${
                showOnPatient[section.name]
                  ? "border-emerald-300 text-emerald-700 bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400 dark:bg-emerald-950/30"
                  : "border-border/50 text-muted-foreground bg-muted/30"
              }`}>
                {showOnPatient[section.name] ? (
                  <Eye className="h-3 w-3" />
                ) : (
                  <EyeOff className="h-3 w-3" />
                )}
                {showOnPatient[section.name] ? "Patient visible" : "Private"}
              </span>
              {expanded[section.name] ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </button>

          {expanded[section.name] && (
            <div className="px-4 pb-4 space-y-2">
              <MarkdownEditor
                value={noteValues[section.name] ?? ""}
                onChange={(v) => handleNoteChange(section.name, v)}
                placeholder={`Enter ${section.label || section.name} notes… (supports **bold**, _italic_, ### headings, - lists)`}
                disabled={isResolved}
              />
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => toggleShowOnPatient(section.name)}
                  disabled={isTogglingPrivacy}
                  title={showOnPatient[section.name] ? "Hide from patient" : "Show to patient"}
                  className={`flex items-center gap-1.5 text-xs rounded-md px-2 py-1 border transition-colors ${
                    showOnPatient[section.name]
                      ? "border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:border-emerald-700 dark:text-emerald-400 dark:bg-emerald-950/30"
                      : "border-border/50 text-muted-foreground hover:border-border hover:text-foreground"
                  }`}
                >
                  {showOnPatient[section.name] ? (
                    <Eye className="h-3.5 w-3.5" />
                  ) : (
                    <EyeOff className="h-3.5 w-3.5" />
                  )}
                  {showOnPatient[section.name] ? "Visible to patient" : "Hidden from patient"}
                </button>
                {!isResolved && (
                  <div className="flex items-center gap-1.5">
                    {sectionSaveStatus[section.name] === "saving" && (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                    )}
                    {sectionSaveStatus[section.name] === "saved" && (
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                    )}
                    {sectionSaveStatus[section.name] === "error" && (
                      <X className="h-3.5 w-3.5 text-destructive" />
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 h-7 text-xs"
                      disabled={sectionSaveStatus[section.name] === "saving"}
                      onClick={() => saveSection(section.name)}
                    >
                      <Save className="h-3.5 w-3.5" />
                      Save
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
