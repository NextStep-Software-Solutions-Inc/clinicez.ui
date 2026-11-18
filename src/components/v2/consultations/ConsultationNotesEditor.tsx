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
import KonsultaSubjectiveFields, { type SubjectiveStructuredData } from "./KonsultaSubjectiveFields";
import DownloadEkasButton from "./DownloadEkasButton";
import {
  isSignsSymptomsCodeList,
  normalizeSubjectiveText,
  sanitizeStructuredDataForStorage,
  stripMarkdownToPlainText,
  SUBJECTIVE_MAX_LENGTH,
} from "@/lib/philhealth-yakap/subjective-utils";

type Detail = NonNullable<GetPatientConsultationDetail["data"]>;

type SectionSaveStatus = "idle" | "saving" | "saved" | "error";

const AUTOSAVE_DELAY_MS = 400;

function isSubjectiveSection(sectionName: string): boolean {
  return sectionName.toLowerCase().includes("subjective");
}

function createEmptyStructuredData(): SubjectiveStructuredData {
  return {
    illnessHistory: "",
    signsSymptoms: "",
    painSite: "",
    otherComplaint: "",
  };
}

function normalizeYakapSubjectiveState(
  rawSd: Partial<SubjectiveStructuredData> | undefined,
  rawContent: string
): {
  structuredData: SubjectiveStructuredData;
  hasDistinct: boolean;
  showNarrative: boolean;
} {
  const rawSigns = rawSd?.signsSymptoms?.trim() ?? "";
  let preNormalizedSd = rawSd;

  // Preserve legacy non-code free-text signsSymptoms together with any otherComplaint
  if (rawSigns && !isSignsSymptomsCodeList(rawSigns)) {
    preNormalizedSd = {
      ...rawSd,
      signsSymptoms: "X",
      otherComplaint: [rawSigns, rawSd?.otherComplaint?.trim()].filter(Boolean).join(" | "),
    };
  }

  const normalizedSd = sanitizeStructuredDataForStorage(preNormalizedSd);
  const strippedPlain = stripMarkdownToPlainText(rawContent);
  const unboundedNote = normalizeSubjectiveText(strippedPlain);
  const normalizedNote = normalizeSubjectiveText(
    strippedPlain,
    SUBJECTIVE_MAX_LENGTH.illnessHistory
  );
  const exceedsLimit = Boolean(normalizedNote) && normalizedNote !== unboundedNote;

  if (!normalizedSd.illnessHistory && normalizedNote) {
    normalizedSd.illnessHistory = normalizedNote;
    return {
      structuredData: normalizedSd,
      hasDistinct: exceedsLimit,
      showNarrative: exceedsLimit,
    };
  }

  const differs =
    Boolean(rawContent.trim()) &&
    (normalizedNote !== normalizedSd.illnessHistory || exceedsLimit);

  return {
    structuredData: normalizedSd,
    hasDistinct: differs,
    showNarrative: differs,
  };
}

interface ConsultationNotesEditorProps {
  clinicUid: string;
  consultation: Detail;
  myHPs: NonNullable<GetHPsType>;
  onPatchDetail: (patch: Partial<Detail>) => void;
  isResolved?: boolean;
}

export default function ConsultationNotesEditor({
  clinicUid,
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
  const initialRawStructuredData: Record<string, Partial<SubjectiveStructuredData>> = {};

  for (const note of consultation.ConsultationNotes) {
    const matchesHp = myHpIsOnTicket
      ? note.hpId === myActiveHp!.id
      : !(note.section in initialNoteMap);

    if (matchesHp) {
      initialNoteMap[note.section] = note.content;
      initialShowMap[note.section] = note.showOnPatient;
      if (
        note.structuredData &&
        typeof note.structuredData === "object" &&
        !Array.isArray(note.structuredData)
      ) {
        const sd = note.structuredData as Record<string, unknown>;
        initialRawStructuredData[note.section] = {
          illnessHistory: typeof sd.illnessHistory === "string" ? sd.illnessHistory : "",
          signsSymptoms: typeof sd.signsSymptoms === "string" ? sd.signsSymptoms : "",
          painSite: typeof sd.painSite === "string" ? sd.painSite : "",
          otherComplaint: typeof sd.otherComplaint === "string" ? sd.otherComplaint : "",
        };
      }
    }
  }

  // PhilHealth Yakap: structured subjective data & supplemental narrative state
  const isKonsulta = consultation.isPhilHealthKonsulta ?? false;
  const initialStructuredData: Record<string, SubjectiveStructuredData> = {};
  const initialDistinctNarrative: Record<string, boolean> = {};
  const initialShowNarrative: Record<string, boolean> = {};

  for (const section of sections) {
    const rawSd = initialRawStructuredData[section.name];
    const rawContent = initialNoteMap[section.name] ?? "";

    if (isKonsulta && isSubjectiveSection(section.name)) {
      const normalized = normalizeYakapSubjectiveState(rawSd, rawContent);
      initialStructuredData[section.name] = normalized.structuredData;
      initialDistinctNarrative[section.name] = normalized.hasDistinct;
      initialShowNarrative[section.name] = normalized.showNarrative;
    } else if (rawSd) {
      initialStructuredData[section.name] = {
        illnessHistory: rawSd.illnessHistory ?? "",
        signsSymptoms: rawSd.signsSymptoms ?? "",
        painSite: rawSd.painSite ?? "",
        otherComplaint: rawSd.otherComplaint ?? "",
      };
    }
  }

  const [noteValues, setNoteValues] = useState<Record<string, string>>(initialNoteMap);
  const [showOnPatient, setShowOnPatient] = useState<Record<string, boolean>>(initialShowMap);
  const [sectionSaveStatus, setSectionSaveStatus] = useState<Record<string, SectionSaveStatus>>({});
  const [isTogglingPrivacy, startToggleTransition] = useTransition();
  const [expanded, setExpanded] = useState<Record<string, boolean>>(
    Object.fromEntries(sections.map((s) => [s.name, true]))
  );
  const [structuredDataMap, setStructuredDataMap] = useState<Record<string, SubjectiveStructuredData>>(initialStructuredData);
  const [hasDistinctNarrative, setHasDistinctNarrative] = useState<Record<string, boolean>>(initialDistinctNarrative);
  const [showAdditionalNarrative, setShowAdditionalNarrative] = useState<Record<string, boolean>>(initialShowNarrative);

  // Debounce timers per section — cleared on unmount
  const debounceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // Stable refs so debounce callbacks always read the latest values
  const noteValuesRef = useRef<Record<string, string>>(noteValues);
  noteValuesRef.current = noteValues;

  const showOnPatientRef = useRef<Record<string, boolean>>(showOnPatient);
  showOnPatientRef.current = showOnPatient;

  const myActiveHpRef = useRef(myActiveHp);
  myActiveHpRef.current = myActiveHp;

  const consultationRef = useRef(consultation);
  consultationRef.current = consultation;

  const onPatchDetailRef = useRef(onPatchDetail);
  onPatchDetailRef.current = onPatchDetail;

  const structuredDataMapRef = useRef(structuredDataMap);
  structuredDataMapRef.current = structuredDataMap;

  const hasDistinctNarrativeRef = useRef(hasDistinctNarrative);
  hasDistinctNarrativeRef.current = hasDistinctNarrative;

  const isKonsultaRef = useRef(isKonsulta);
  isKonsultaRef.current = isKonsulta;

  // Hydrate HPI & narrative sync from existing Subjective note content when PhilHealth Yakap is toggled ON
  useEffect(() => {
    if (!isKonsulta) return;

    const sdUpdates: Record<string, SubjectiveStructuredData> = {};
    const distinctUpdates: Record<string, boolean> = {};
    const showUpdates: Record<string, boolean> = {};

    for (const section of sections) {
      if (!isSubjectiveSection(section.name)) continue;
      const currentRawSd = structuredDataMapRef.current[section.name];
      const rawNote = noteValuesRef.current[section.name] ?? "";
      const normalized = normalizeYakapSubjectiveState(currentRawSd, rawNote);

      const prevSd = currentRawSd ?? createEmptyStructuredData();
      if (
        normalized.structuredData.illnessHistory !== prevSd.illnessHistory ||
        normalized.structuredData.signsSymptoms !== prevSd.signsSymptoms ||
        normalized.structuredData.painSite !== prevSd.painSite ||
        normalized.structuredData.otherComplaint !== prevSd.otherComplaint
      ) {
        sdUpdates[section.name] = normalized.structuredData;
      }

      if (normalized.hasDistinct !== (hasDistinctNarrativeRef.current[section.name] ?? false)) {
        distinctUpdates[section.name] = normalized.hasDistinct;
        showUpdates[section.name] = normalized.showNarrative;
      }
    }

    if (Object.keys(sdUpdates).length > 0) {
      structuredDataMapRef.current = { ...structuredDataMapRef.current, ...sdUpdates };
      setStructuredDataMap((prev) => ({ ...prev, ...sdUpdates }));
    }
    if (Object.keys(distinctUpdates).length > 0) {
      hasDistinctNarrativeRef.current = { ...hasDistinctNarrativeRef.current, ...distinctUpdates };
      setHasDistinctNarrative((prev) => ({ ...prev, ...distinctUpdates }));
    }
    if (Object.keys(showUpdates).length > 0) {
      setShowAdditionalNarrative((prev) => ({ ...prev, ...showUpdates }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isKonsulta, consultation.id]);

  // Cleanup all pending timers when the component unmounts
  useEffect(() => {
    return () => {
      Object.values(debounceTimers.current).forEach(clearTimeout);
    };
  }, []);

  // Core save — used by both auto-save and the manual Save button
  const doSave = async (sectionName: string, contentOverride?: string) => {
    const hp = myActiveHpRef.current;
    if (!hp) return;

    setSectionSaveStatus((prev) => ({ ...prev, [sectionName]: "saving" }));

    const rawContent =
      contentOverride !== undefined ? contentOverride : (noteValuesRef.current[sectionName] ?? "");
    const rawStructured = structuredDataMapRef.current[sectionName] ?? null;

    const isYakapSubjective = isKonsultaRef.current && isSubjectiveSection(sectionName);
    const structuredToSave =
      isYakapSubjective && rawStructured
        ? sanitizeStructuredDataForStorage(rawStructured)
        : rawStructured;

    const hasDistinct = hasDistinctNarrativeRef.current[sectionName] ?? false;
    const contentToSave = isYakapSubjective
      ? hasDistinct && rawContent.trim()
        ? rawContent
        : (structuredToSave?.illnessHistory ?? "")
      : rawContent;

    try {
      const result = await upsertConsultationNotesAction({
        consultationTicketId: consultationRef.current.id,
        section: sectionName,
        content: contentToSave,
        hpId: hp.id,
        showOnPatient: showOnPatientRef.current[sectionName] ?? false,
        structuredData: structuredToSave,
      });

      if (result.status && result.data) {
        if (isYakapSubjective && !hasDistinct && noteValuesRef.current[sectionName] !== contentToSave) {
          noteValuesRef.current = { ...noteValuesRef.current, [sectionName]: contentToSave };
          setNoteValues((prev) => ({ ...prev, [sectionName]: contentToSave }));
        }
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
          structuredData: saved.structuredData,
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

  const scheduleAutoSave = (sectionName: string, contentOverride?: string) => {
    if (isResolved || !myActiveHpRef.current) return;

    if (debounceTimers.current[sectionName]) {
      clearTimeout(debounceTimers.current[sectionName]);
    }

    debounceTimers.current[sectionName] = setTimeout(() => {
      void doSave(sectionName, contentOverride);
    }, AUTOSAVE_DELAY_MS);
  };

  // Called by MarkdownEditor's onChange for standard (non-Yakap-Subjective) sections
  const handleNoteChange = (sectionName: string, value: string) => {
    noteValuesRef.current = { ...noteValuesRef.current, [sectionName]: value };
    setNoteValues((prev) => ({ ...prev, [sectionName]: value }));
    scheduleAutoSave(sectionName, value);
  };

  // Called by the collapsible supplemental narrative MarkdownEditor on Yakap Subjective sections
  const handleYakapNarrativeChange = (sectionName: string, value: string) => {
    const distinct = Boolean(value.trim());
    noteValuesRef.current = { ...noteValuesRef.current, [sectionName]: value };
    hasDistinctNarrativeRef.current = { ...hasDistinctNarrativeRef.current, [sectionName]: distinct };
    setNoteValues((prev) => ({ ...prev, [sectionName]: value }));
    setHasDistinctNarrative((prev) => ({ ...prev, [sectionName]: distinct }));
    scheduleAutoSave(sectionName);
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
    await doSave(sectionName);
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
      {/* Buttons above notes */}
      <div className="flex items-center justify-end gap-2">
        {isKonsulta && (
          <DownloadEkasButton ticketId={consultation.id} clinicUid={clinicUid} />
        )}
        {!isResolved && (
          <MedicalNoteSummarizer
            consultationNotes={sections
              .map((section) => {
                const rawNote = noteValues[section.name] ?? "";
                const sdIllness =
                  isKonsulta && isSubjectiveSection(section.name)
                    ? (structuredDataMap[section.name]?.illnessHistory ?? "")
                    : "";
                const effectiveText =
                  isKonsulta && isSubjectiveSection(section.name)
                    ? hasDistinctNarrative[section.name] && rawNote.trim()
                      ? sdIllness
                        ? `${sdIllness}\n${rawNote}`
                        : rawNote
                      : sdIllness
                    : rawNote;
                return `${section.label || section.name}: ${effectiveText}`;
              })
              .join("\n\n")}
            noteSections={sections.map((s) => s.label || s.name)}
            outputFormat="markdown"
          />
        )}
      </div>
      {sections.map((section) => {
        const isYakapSubjective = isKonsulta && isSubjectiveSection(section.name);
        const isNarrativeExpanded = Boolean(showAdditionalNarrative[section.name]);

        return (
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
                <span className={`flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${showOnPatient[section.name]
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
                {/* PhilHealth Yakap structured fields for subjective section */}
                {isYakapSubjective && (
                  <KonsultaSubjectiveFields
                    data={structuredDataMap[section.name] ?? createEmptyStructuredData()}
                    onChange={(data) => {
                      structuredDataMapRef.current = {
                        ...structuredDataMapRef.current,
                        [section.name]: data,
                      };
                      setStructuredDataMap((prev) => ({ ...prev, [section.name]: data }));
                      scheduleAutoSave(section.name);
                    }}
                    disabled={isResolved}
                  />
                )}

                {isYakapSubjective ? (
                  <div className="rounded-lg border border-border/40 bg-muted/10 overflow-hidden">
                    <button
                      type="button"
                      onClick={() =>
                        setShowAdditionalNarrative((prev) => ({
                          ...prev,
                          [section.name]: !prev[section.name],
                        }))
                      }
                      aria-expanded={isNarrativeExpanded}
                      className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors"
                    >
                      <span>Additional Clinical Narrative (Optional)</span>
                      {isNarrativeExpanded ? (
                        <ChevronUp className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5" />
                      )}
                    </button>
                    {isNarrativeExpanded && (
                      <div className="p-2 pt-0 space-y-1.5">
                        <p className="text-[11px] text-muted-foreground">
                          Optional internal notes. PhilHealth Yakap exports use History of Illness above.
                        </p>
                        <MarkdownEditor
                          value={
                            hasDistinctNarrative[section.name]
                              ? (noteValues[section.name] ?? "")
                              : ""
                          }
                          onChange={(v) => handleYakapNarrativeChange(section.name, v)}
                          placeholder="Optional supplemental clinical narrative (not required for Yakap XML)…"
                          disabled={isResolved}
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <MarkdownEditor
                    value={noteValues[section.name] ?? ""}
                    onChange={(v) => handleNoteChange(section.name, v)}
                    placeholder={`Enter ${section.label || section.name} notes… (supports **bold**, _italic_, ### headings, - lists)`}
                    disabled={isResolved}
                  />
                )}

                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => toggleShowOnPatient(section.name)}
                    disabled={isTogglingPrivacy}
                    title={showOnPatient[section.name] ? "Hide from patient" : "Show to patient"}
                    className={`flex items-center gap-1.5 text-xs rounded-md px-2 py-1 border transition-colors ${showOnPatient[section.name]
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
        );
      })}
    </div>
  );
}
