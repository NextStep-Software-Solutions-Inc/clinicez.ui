"use client";

import { useState } from "react";
import { Code2, Eye, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { renderPreviewTemplate } from "@/lib/liquid-template";
import TemplateVariableReference from "./TemplateVariableReference";

interface HtmlTemplateEditorProps {
  value: string;
  onChange: (value: string) => void;
  /** DocumentTemplateType.name — used to resolve variable schema and sample data */
  documentTypeName?: string | null;
  placeholder?: string;
}

/**
 * HTML template editor with a Write/Preview tab bar.
 *
 * - **Write**: monospace textarea with the raw HTML / Liquid template source.
 *   Includes the collapsible variable-reference panel so authors know which
 *   `{{ variables }}` are available.
 * - **Preview**: the template rendered inside a sandboxed `<iframe>` using
 *   realistic sample data so authors can see how the document will look.
 */
export default function HtmlTemplateEditor({
  value,
  onChange,
  documentTypeName,
  placeholder = "Enter HTML content…",
}: HtmlTemplateEditorProps) {
  const [mode, setMode] = useState<"edit" | "preview">("edit");

  const previewHtml = renderPreviewTemplate(value, documentTypeName);

  return (
    <div className="rounded-lg border border-border/50 bg-background overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-2 py-1.5 border-b border-border/40 bg-muted/20">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground px-1">
          <Code2 className="h-3.5 w-3.5" />
          HTML Template
        </span>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            size="sm"
            variant={mode === "edit" ? "secondary" : "ghost"}
            className="h-6 text-[10px] px-2 gap-1"
            onClick={() => setMode("edit")}
          >
            <Pencil className="h-3 w-3" />
            Write
          </Button>
          <Button
            type="button"
            size="sm"
            variant={mode === "preview" ? "secondary" : "ghost"}
            className="h-6 text-[10px] px-2 gap-1"
            onClick={() => setMode("preview")}
          >
            <Eye className="h-3 w-3" />
            Preview
          </Button>
        </div>
      </div>

      {/* Write mode */}
      {mode === "edit" && (
        <div className="space-y-0">
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="min-h-64 resize-y text-sm bg-transparent border-0 rounded-none border-b border-border/40 focus-visible:ring-1 focus-visible:ring-primary font-mono"
          />
          {/* Variable reference below the textarea, inside the card */}
          <div className="px-3 py-2">
            <TemplateVariableReference documentTypeName={documentTypeName} />
          </div>
        </div>
      )}

      {/* Preview mode */}
      {mode === "preview" && (
        <div className="flex flex-col">
          {value.trim() ? (
            <iframe
              srcDoc={previewHtml}
              title="Template preview"
              sandbox="allow-same-origin"
              className="w-full min-h-96 border-0"
              style={{ height: "500px" }}
            />
          ) : (
            <div className="min-h-64 flex items-center justify-center text-sm text-muted-foreground italic px-3 py-6">
              No content to preview yet. Switch to Write mode and add some HTML.
            </div>
          )}
          <p className="px-3 py-1.5 text-[10px] text-muted-foreground border-t border-border/40 bg-muted/20">
            Preview uses sample data — actual values will be filled in when the document is generated.
          </p>
        </div>
      )}
    </div>
  );
}
