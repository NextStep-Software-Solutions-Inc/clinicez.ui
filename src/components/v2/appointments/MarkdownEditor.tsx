"use client";

import { useRef } from "react";
import { Bold, Italic, List, Heading2, Quote, Code } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { MarkdownRenderer } from "@/components/markdown/MarkdownRenderer";
import { cn } from "@/lib/utils";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
}

type ToolbarItem = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  prefix: string;
  suffix: string;
  block?: boolean;
};

const TOOLBAR: ToolbarItem[] = [
  { icon: Bold, label: "Bold", prefix: "**", suffix: "**" },
  { icon: Italic, label: "Italic", prefix: "_", suffix: "_" },
  { icon: Heading2, label: "Heading", prefix: "## ", suffix: "", block: true },
  { icon: List, label: "List", prefix: "- ", suffix: "", block: true },
  { icon: Quote, label: "Blockquote", prefix: "> ", suffix: "", block: true },
  { icon: Code, label: "Code", prefix: "`", suffix: "`" },
];

export function MarkdownEditor({
  value,
  onChange,
  placeholder = "Write in markdown...",
  rows = 10,
  className,
}: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertMarkdown = (item: ToolbarItem) => {
    const ta = textareaRef.current;
    if (!ta) return;

    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = value.slice(start, end);

    let insertion: string;
    if (item.block) {
      // Prefix each selected line; if nothing is selected, add an empty prefixed line
      const lines = selected ? selected.split("\n") : [""];
      insertion = lines.map((l) => `${item.prefix}${l}`).join("\n");
    } else {
      insertion = `${item.prefix}${selected}${item.suffix}`;
    }

    const newValue = value.slice(0, start) + insertion + value.slice(end);
    onChange(newValue);

    // Restore cursor after insertion
    requestAnimationFrame(() => {
      ta.focus();
      const cursor = start + insertion.length;
      ta.setSelectionRange(cursor, cursor);
    });
  };

  return (
    <div className={cn("rounded-lg border border-border/60 overflow-hidden", className)}>
      <Tabs defaultValue="write">
        <div className="flex items-center justify-between px-2 pt-1.5 pb-1 border-b border-border/40 bg-muted/20">
          {/* Toolbar */}
          <div className="flex items-center gap-0.5">
            {TOOLBAR.map((item) => (
              <Button
                key={item.label}
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6 rounded text-muted-foreground hover:text-foreground hover:bg-muted"
                title={item.label}
                onClick={() => insertMarkdown(item)}
              >
                <item.icon className="h-3.5 w-3.5" />
              </Button>
            ))}
          </div>
          {/* Tabs */}
          <TabsList className="h-6 p-0.5 gap-0">
            <TabsTrigger value="write" className="h-5 px-2 text-xs">
              Write
            </TabsTrigger>
            <TabsTrigger value="preview" className="h-5 px-2 text-xs">
              Preview
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="write" className="mt-0 p-0">
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={rows}
            className="resize-y rounded-none border-0 border-t-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent text-sm font-mono"
          />
          <p className="px-3 pb-1.5 text-[10px] text-muted-foreground/50">
            Markdown supported: **bold**, _italic_, ## heading, - list, `code`
          </p>
        </TabsContent>

        <TabsContent value="preview" className="mt-0">
          <div className="min-h-[10rem] px-3 py-2">
            {value.trim() ? (
              <MarkdownRenderer content={value} className="text-sm" />
            ) : (
              <p className="text-sm text-muted-foreground/50 italic">
                Nothing to preview yet.
              </p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
