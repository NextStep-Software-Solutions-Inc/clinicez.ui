"use client";

import { useState } from "react";
import { Eye, Pencil, Bold, Italic, List, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
  disabled?: boolean;
}

export default function MarkdownEditor({
  value,
  onChange,
  placeholder = "Write notes using **markdown**…",
  minHeight = "min-h-36",
  disabled = false,
}: MarkdownEditorProps) {
  const [mode, setMode] = useState<"edit" | "preview">(disabled ? "preview" : "edit");

  const insertMarkdown = (prefix: string, suffix = "") => {
    const ta = document.activeElement as HTMLTextAreaElement | null;
    const placeholder = "text";
    if (!ta || ta.tagName !== "TEXTAREA") {
      onChange(value + prefix + placeholder + suffix);
      return;
    }
    const start = ta.selectionStart ?? value.length;
    const end = ta.selectionEnd ?? value.length;
    const selected = value.slice(start, end);
    const newValue =
      value.slice(0, start) + prefix + (selected || placeholder) + suffix + value.slice(end);
    onChange(newValue);
    // Restore caret after React re-render
    requestAnimationFrame(() => {
      ta.selectionStart = start + prefix.length;
      ta.selectionEnd = start + prefix.length + (selected || placeholder).length;
      ta.focus();
    });
  };

  return (
    <div className="rounded-lg border border-border/50 bg-background overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-2 py-1.5 border-b border-border/40 bg-muted/20">
        <div className="flex items-center gap-0.5">
          <ToolbarButton
            icon={<Bold className="h-3.5 w-3.5" />}
            label="Bold"
            onClick={() => insertMarkdown("**", "**")}
            disabled={mode === "preview" || disabled}
          />
          <ToolbarButton
            icon={<Italic className="h-3.5 w-3.5" />}
            label="Italic"
            onClick={() => insertMarkdown("_", "_")}
            disabled={mode === "preview" || disabled}
          />
          <ToolbarButton
            icon={<Hash className="h-3.5 w-3.5" />}
            label="Heading"
            onClick={() => insertMarkdown("### ")}
            disabled={mode === "preview" || disabled}
          />
          <ToolbarButton
            icon={<List className="h-3.5 w-3.5" />}
            label="List"
            onClick={() => insertMarkdown("- ")}
            disabled={mode === "preview" || disabled}
          />
        </div>
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

      {/* Edit mode */}
      {mode === "edit" && (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={`${minHeight} resize-y text-sm bg-transparent border-0 rounded-none focus-visible:ring-1 focus-visible:ring-primary font-mono`}
        />
      )}

      {/* Preview mode */}
      {mode === "preview" && (
        <div
          className={`${minHeight} px-3 py-2 overflow-auto prose prose-sm dark:prose-invert max-w-none
            prose-headings:text-foreground prose-headings:font-semibold
            prose-p:text-foreground/80 prose-p:leading-relaxed
            prose-strong:text-foreground prose-em:text-foreground/80
            prose-ul:text-foreground/80 prose-ol:text-foreground/80
            prose-li:text-foreground/80
            prose-code:text-primary prose-code:bg-muted/50 prose-code:rounded prose-code:px-1
            prose-pre:bg-muted prose-pre:text-foreground/80`}
        >
          {value ? (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeSanitize]}
            >
              {value}
            </ReactMarkdown>
          ) : (
            <p className="text-muted-foreground italic text-xs">Nothing to preview yet.</p>
          )}
        </div>
      )}
    </div>
  );
}

function ToolbarButton({
  icon,
  label,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
    >
      {icon}
    </button>
  );
}
