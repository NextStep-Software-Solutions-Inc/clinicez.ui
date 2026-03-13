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
  type TemplatePropertyInfo,
  type ArrayOfObjectsVariableInfo,
} from "@/lib/document-template-schema";

interface TemplateVariableReferenceProps {
  /** Document type name as stored in DocumentTemplateType.name */
  documentTypeName: string | null | undefined;
}

// ---------------------------------------------------------------------------
// Reusable copy chip
// ---------------------------------------------------------------------------

function CopyChip({
  label,
  copyText,
  tooltip,
  className,
}: {
  label: string;
  copyText: string;
  tooltip: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(copyText).then(() => {
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
            className={`font-mono text-xs cursor-pointer select-text gap-1 hover:bg-secondary/80 transition-colors max-w-full ${className ?? ""}`}
            onClick={handleCopy}
          >
            <span className="truncate min-w-0">{label}</span>
            {copied ? (
              <Check className="h-3 w-3 text-green-500 shrink-0" />
            ) : (
              <Copy className="h-3 w-3 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100" />
            )}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-left">
          <p className="text-xs text-muted-foreground whitespace-pre-wrap">{tooltip}</p>
          <p className="text-xs text-muted-foreground italic mt-1">Click to copy</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ---------------------------------------------------------------------------
// Renderers per variable type
// ---------------------------------------------------------------------------

/** Scalar string / html / number / untyped variable */
function ScalarVariableChip({ info }: { info: TemplateVariableInfo }) {
  return (
    <CopyChip
      label={`{{ ${info.variable} }}`}
      copyText={`{{ ${info.variable} }}`}
      tooltip={`${info.variable}\n\n${info.description}`}
    />
  );
}

/** Array-of-strings variable: show join filter chip + for-loop chip */
function ArrayOfStringsVariable({ info }: { info: TemplateVariableInfo }) {
  const joinSnippet = `{{ ${info.variable} | join: ", " }}`;
  const loopSnippet = `{% for item in ${info.variable} %}{{ item }}{% endfor %}`;

  return (
    <div className="rounded border border-border/40 bg-muted/30 px-2 py-1.5 space-y-1 min-w-0 overflow-hidden">
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
        {info.variable}
        <span className="ml-1.5 font-normal normal-case opacity-60">string[ ]</span>
      </p>
      <p className="text-[10px] text-muted-foreground">{info.description}</p>
      <div className="flex flex-wrap gap-1 pt-0.5 min-w-0">
        <CopyChip
          label={joinSnippet}
          copyText={joinSnippet}
          tooltip={`Joins all items with ", " — e.g. "CBC, Urinalysis, Fecalysis"`}
          className="max-w-full"
        />
        <CopyChip
          label={`{% for item in ${info.variable} %}…{% endfor %}`}
          copyText={loopSnippet}
          tooltip={`For-loop over each item.\n\nPaste, then replace the body with your row HTML.`}
          className="max-w-full"
        />
      </div>
    </div>
  );
}

/** Property chip used inside array-of-objects rendering */
function PropertyChip({
  loopVar,
  prop,
}: {
  loopVar: string;
  prop: TemplatePropertyInfo;
}) {
  const expr = `{{ ${loopVar}.${prop.variable} }}`;
  return (
    <CopyChip
      label={expr}
      copyText={expr}
      tooltip={`${loopVar}.${prop.variable}\n\n${prop.description}`}
      className="text-[10px]"
    />
  );
}

/** Array-of-objects variable: show loop skeleton + property chips */
function ArrayOfObjectsVariable({ info }: { info: ArrayOfObjectsVariableInfo }) {
  const { variable, loopVar, properties, description } = info;

  const firstProp = properties[0]?.variable;
  const loopBody = firstProp
    ? `  {{ ${loopVar}.${firstProp} }}`
    : `  {# render item properties here #}`;

  const loopSnippet = [
    `{% for ${loopVar} in ${variable} %}`,
    loopBody,
    `{% endfor %}`,
  ].join("\n");

  return (
    <div className="rounded border border-border/40 bg-muted/30 px-2 py-1.5 space-y-1.5 min-w-0 overflow-hidden">
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
        {variable}
        <span className="ml-1.5 font-normal normal-case opacity-60">object[ ]</span>
      </p>
      <p className="text-[10px] text-muted-foreground">{description}</p>

      {/* Loop skeleton chip */}
      <CopyChip
        label={`{% for ${loopVar} in ${variable} %}…{% endfor %}`}
        copyText={loopSnippet}
        tooltip={`For-loop over each item.\n\nCopies a starter snippet — replace the body with your row HTML.`}
        className="max-w-full"
      />

      {/* Property chips */}
      {properties.length > 0 && (
        <div className="pl-2 border-l border-border/40 space-y-1 min-w-0">
          <p className="text-[10px] text-muted-foreground italic">
            Inside the loop, use <code className="font-mono">{loopVar}.property</code>:
          </p>
          <div className="flex flex-wrap gap-1 min-w-0">
            {properties.map((prop) => (
              <PropertyChip key={prop.variable} loopVar={loopVar} prop={prop} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

/**
 * Collapsible panel that shows the available Liquid template variables
 * for a given document type.
 *
 * Scalar variables render as click-to-copy `{{ variable }}` chips.
 * Array-of-strings variables show join-filter and for-loop snippets.
 * Array-of-objects variables show a loop skeleton and per-property chips.
 */
export default function TemplateVariableReference({
  documentTypeName,
}: TemplateVariableReferenceProps) {
  const [open, setOpen] = useState(false);

  if (!documentTypeName) return null;

  const schema = getTemplateVariableSchema(documentTypeName);
  if (!schema) return null;

  return (
    <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm min-w-0">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-auto w-full justify-between px-0 font-medium hover:bg-transparent"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="flex items-center gap-1.5 min-w-0 truncate">
          <Code2 className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="truncate">Available template variables</span>
        </span>
        {open ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        )}
      </Button>

      {open && (
        <div className="mt-2 space-y-2 min-w-0">
          <p className="text-xs text-muted-foreground">{schema.description}</p>
          <p className="text-xs text-muted-foreground">
            Use{" "}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
              {"{{ variableName }}"}
            </code>{" "}
            syntax in your HTML template. Click a chip to copy it.
          </p>

          {/* Scalar variables (non-array) as a wrapping chip row */}
          {(() => {
            const scalars = schema.variables.filter(
              (v) => v.type !== "array-of-strings" && v.type !== "array-of-objects"
            );
            return scalars.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 pt-1 min-w-0">
                {scalars.map((v) => (
                  <ScalarVariableChip key={v.variable} info={v} />
                ))}
              </div>
            ) : null;
          })()}

          {/* Array variables as grouped blocks */}
          {(() => {
            const arrays = schema.variables.filter(
              (v) => v.type === "array-of-strings" || v.type === "array-of-objects"
            );
            return arrays.length > 0 ? (
              <div className="space-y-2 pt-1 min-w-0">
                {arrays.map((v) =>
                  v.type === "array-of-objects" ? (
                    <ArrayOfObjectsVariable key={v.variable} info={v} />
                  ) : (
                    <ArrayOfStringsVariable key={v.variable} info={v} />
                  )
                )}
              </div>
            ) : null;
          })()}
        </div>
      )}
    </div>
  );
}
