"use client";

import { Code2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import TemplateVariableReference from "./TemplateVariableReference";

interface HtmlTemplateEditorProps {
  value: string;
  onChange: (value: string) => void;
  /** DocumentTemplateType.name — used to resolve variable schema */
  documentTypeName?: string | null;
  placeholder?: string;
}

/**
 * HTML template editor panel — monospace textarea with a collapsible
 * variable-reference panel below it.
 *
 * The live preview is intentionally kept out of this component.
 * When used inside the full-page template editor sheet the preview is
 * always visible in the adjacent right-side panel.
 */
export default function HtmlTemplateEditor({
  value,
  onChange,
  documentTypeName,
  placeholder = "Enter HTML content…",
}: HtmlTemplateEditorProps) {
  return (
    <div className="rounded-lg border border-border/50 bg-background overflow-hidden flex flex-col">
      {/* Header bar */}
      <div className="flex items-center px-3 py-1.5 border-b border-border/40 bg-muted/20 shrink-0">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Code2 className="h-3.5 w-3.5" />
          HTML Template
        </span>
      </div>

      {/* Textarea */}
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 min-h-[480px] resize-y text-sm bg-transparent border-0 rounded-none border-b border-border/40 focus-visible:ring-1 focus-visible:ring-primary font-mono"
      />

      {/* Variable reference */}
      <div className="px-3 py-2 shrink-0">
        <TemplateVariableReference documentTypeName={documentTypeName} />
      </div>
    </div>
  );
}
