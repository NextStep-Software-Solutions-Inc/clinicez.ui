"use client";

import { useState } from "react";
import { Check, ChevronDown, ChevronUp, Code2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  getTemplateVariableSchema,
  type TemplateVariableInfo,
} from "@/lib/document-template-schema";

interface TemplateVariableReferenceProps {
  /** Document type name as stored in DocumentTemplateType.name */
  documentTypeName: string | null | undefined;
}

function VariableChip({ info }: { info: TemplateVariableInfo }) {
  const [copied, setCopied] = useState(false);
  const syntax = `{{ ${info.variable} }}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(syntax).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="secondary"
            className="font-mono text-xs cursor-pointer select-text gap-1 hover:bg-secondary/80 transition-colors"
            onClick={handleCopy}
          >
            {syntax}
            {copied ? (
              <Check className="h-3 w-3 text-green-500 shrink-0" />
            ) : (
              <Copy className="h-3 w-3 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100" />
            )}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-left">
          <p className="font-semibold mb-0.5">{info.variable}</p>
          <p className="text-xs text-muted-foreground">{info.description}</p>
          <p className="text-xs text-muted-foreground italic mt-1">Click to copy</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Collapsible panel that shows the available Liquid template variables
 * for a given document type. Each variable is a click-to-copy chip
 * with a tooltip description.
 */
export default function TemplateVariableReference({
  documentTypeName,
}: TemplateVariableReferenceProps) {
  const [open, setOpen] = useState(false);

  if (!documentTypeName) return null;

  const schema = getTemplateVariableSchema(documentTypeName);
  if (!schema) return null;

  return (
    <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-auto w-full justify-between px-0 font-medium hover:bg-transparent"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="flex items-center gap-1.5">
          <Code2 className="h-4 w-4 text-muted-foreground" />
          Available template variables
        </span>
        {open ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </Button>

      {open && (
        <div className="mt-2 space-y-2">
          <p className="text-xs text-muted-foreground">{schema.description}</p>
          <p className="text-xs text-muted-foreground">
            Use{" "}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
              {"{{ variableName }}"}
            </code>{" "}
            syntax in your HTML template. Click a variable to copy it.
          </p>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {schema.variables.map((v) => (
              <VariableChip key={v.variable} info={v} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
