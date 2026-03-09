"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ChevronDown, ChevronUp, FileText, GripVertical } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import Each from "@/components/utils/Each";
import { GetNoteTemplatesWithSections } from "@/actions/note-template.action";
import { updateNoteSectionsSortOrderAction } from "@/actions/note-template.action";
import { promiseWrapper } from "@/lib/with-error-handling";

type NoteTemplate = GetNoteTemplatesWithSections[number];
type NoteSection = NoteTemplate["NoteSections"][number];

interface NoteTemplateManagerProps {
  initialData: GetNoteTemplatesWithSections;
}

export default function NoteTemplateManager({ initialData }: NoteTemplateManagerProps) {
  const [templates, setTemplates] = useState(initialData);

  const handleMove = async (template: NoteTemplate, fromIndex: number, toIndex: number) => {
    const sections = [...template.NoteSections];
    const [moved] = sections.splice(fromIndex, 1);
    sections.splice(toIndex, 0, moved);
    const reordered = sections.map((s, idx) => ({ ...s, sortOrder: idx }));

    // Capture previous state for accurate rollback
    const previousSections = template.NoteSections;

    setTemplates(prev =>
      prev.map(t =>
        t.id === template.id ? { ...t, NoteSections: reordered } : t
      )
    );

    toast.promise(
      promiseWrapper(updateNoteSectionsSortOrderAction)(
        reordered.map(({ id, sortOrder }) => ({ id, sortOrder }))
      ),
      {
        loading: "Saving order...",
        success: res => res.message,
        error: err => {
          setTemplates(prev =>
            prev.map(t =>
              t.id === template.id ? { ...t, NoteSections: previousSections } : t
            )
          );
          return err;
        },
      }
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <FileText className="h-5 w-5 text-primary" />
          <div className="flex-1">
            <CardTitle className="text-lg">Note Templates</CardTitle>
            <CardDescription>
              Manage consultation note templates and reorder their sections. Sections are displayed
              in the configured order during consultations.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {templates.length === 0 && (
          <p className="text-sm text-muted-foreground">No note templates found.</p>
        )}
        <Each
          of={templates}
          render={template => (
            <TemplateCard
              key={template.id}
              template={template}
              onMove={handleMove}
            />
          )}
        />
      </CardContent>
    </Card>
  );
}

function TemplateCard({
  template,
  onMove,
}: {
  template: NoteTemplate;
  onMove: (template: NoteTemplate, from: number, to: number) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="rounded-md border">
        <CollapsibleTrigger asChild>
          <button className="flex w-full items-center gap-3 p-3 text-left hover:bg-muted/50 transition-colors">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{template.name}</span>
                <Badge variant="outline">{template.NoteSections.length} sections</Badge>
                {!template.isActive && (
                  <Badge variant="secondary">Inactive</Badge>
                )}
              </div>
            </div>
            {open ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
            )}
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="border-t px-3 pb-3 pt-2 space-y-1">
            {template.NoteSections.length === 0 && (
              <p className="text-sm text-muted-foreground py-1">No sections defined.</p>
            )}
            <Each
              of={template.NoteSections}
              render={(section, index) => (
                <SectionRow
                  key={section.id}
                  section={section}
                  index={index}
                  total={template.NoteSections.length}
                  onMoveUp={() => onMove(template, index, index - 1)}
                  onMoveDown={() => onMove(template, index, index + 1)}
                />
              )}
            />
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

function SectionRow({
  section,
  index,
  total,
  onMoveUp,
  onMoveDown,
}: {
  section: NoteSection;
  index: number;
  total: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  return (
    <div className="flex items-center gap-2 rounded-sm px-1 py-1.5 hover:bg-muted/40">
      <GripVertical className="h-4 w-4 text-muted-foreground/50 shrink-0" />
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium">{section.label || section.name}</span>
        {section.label && section.label !== section.name && (
          <span className="ml-1.5 text-xs text-muted-foreground">({section.name})</span>
        )}
        {!section.isActive && (
          <Badge variant="secondary" className="ml-2 text-xs">Inactive</Badge>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          disabled={index === 0}
          onClick={onMoveUp}
          aria-label="Move section up"
        >
          <ChevronUp className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          disabled={index === total - 1}
          onClick={onMoveDown}
          aria-label="Move section down"
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
