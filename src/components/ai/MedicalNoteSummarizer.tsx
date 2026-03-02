'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Sparkles, Copy, Check, AlertCircle, Loader2 } from 'lucide-react';
import { useMedicalNoteSummarization } from '@/hooks/ai/use-ai';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MarkdownRenderer } from '@/components/markdown/MarkdownRenderer';
import { AIButton } from './AIButton';

interface MedicalNoteSummarizerProps {
  consultationNotes: string;
  noteSections?: string[];
  outputFormat?: 'markdown' | 'plain_text';
  clinicId?: number;
  patientId?: number;
  onSummaryGenerated?: (summary: string) => void;
  onApplyToForm?: (sectionData: Record<string, string>) => void;
}

const DEFAULT_SECTIONS = ['Subjective', 'Objective', 'Assessment', 'Plan'];
const PREVIEW_LENGTH = 100;

const SECTION_COLORS = [
  { bg: 'bg-blue-50', border: 'border-blue-200', title: 'text-blue-900', body: 'text-blue-800' },
  { bg: 'bg-green-50', border: 'border-green-200', title: 'text-green-900', body: 'text-green-800' },
  { bg: 'bg-yellow-50', border: 'border-yellow-200', title: 'text-yellow-900', body: 'text-yellow-800' },
  { bg: 'bg-purple-50', border: 'border-purple-200', title: 'text-purple-900', body: 'text-purple-800' },
];

/**
 * Parse section content from AI response using the actual section names.
 * Supports both markdown (## Heading) and plain-text (Heading:) formats.
 */
function parseSections(
  text: string,
  sectionNames: string[],
  outputFormat: 'markdown' | 'plain_text' = 'markdown',
): { sections: Record<string, string>; rawText: string } {
  const sections: Record<string, string> = {};
  const lines = text.split('\n');
  let currentSection: string | null = null;
  const buffer: string[] = [];

  const flush = () => {
    if (currentSection !== null) {
      sections[currentSection] = buffer.join('\n').trim();
    }
    buffer.length = 0;
  };

  for (const line of lines) {
    let matched: string | undefined;
    let inlineContent: string | undefined;

    if (outputFormat === 'markdown') {
      const headingMatch = line.match(/^##?\s+(.+)/);
      if (headingMatch) {
        const heading = headingMatch[1].replace(/:?\s*$/, '').trim();
        matched = sectionNames.find(
          (s) => s.toLowerCase() === heading.toLowerCase(),
        );
      }
    } else {
      // plain_text: match "SectionName: ..." or "SectionName:" at start of line
      const plainMatch = line.match(/^([^:]+):\s*(.*)$/);
      if (plainMatch) {
        const heading = plainMatch[1].trim();
        const candidate = sectionNames.find(
          (s) => s.toLowerCase() === heading.toLowerCase(),
        );
        if (candidate) {
          matched = candidate;
          inlineContent = plainMatch[2] || undefined;
        }
      }
    }

    if (matched !== undefined) {
      flush();
      currentSection = matched;
      if (inlineContent) buffer.push(inlineContent);
    } else if (currentSection !== null) {
      buffer.push(line);
    }
  }
  flush();

  return { sections, rawText: text };
}

export function MedicalNoteSummarizer({
  consultationNotes,
  noteSections,
  outputFormat = 'markdown',
  clinicId,
  patientId,
  onSummaryGenerated,
  onApplyToForm,
}: MedicalNoteSummarizerProps) {
  const { summarize, summary, isLoading, error } = useMedicalNoteSummarization();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [parsedData, setParsedData] = useState<{ sections: Record<string, string>; rawText: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const activeSections = noteSections?.length ? noteSections : DEFAULT_SECTIONS;

  useEffect(() => {
    if (summary) {
      const sections = noteSections?.length ? noteSections : DEFAULT_SECTIONS;
      const parsed = parseSections(summary, sections, outputFormat);
      setParsedData(parsed);
      onSummaryGenerated?.(parsed.rawText);
    }
  }, [summary, onSummaryGenerated, noteSections, outputFormat]);

  const handleSummarize = async () => {
    setIsDialogOpen(true);
    await summarize(consultationNotes, {
      clinicId,
      patientId,
      sectionNames: activeSections,
      outputFormat,
    });
  };

  const handleCopy = async () => {
    if (parsedData?.rawText) {
      await navigator.clipboard.writeText(parsedData.rawText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleApply = () => {
    if (onApplyToForm && parsedData) {
      onApplyToForm(parsedData.sections);
      setIsDialogOpen(false);
    }
  };

  const handleRegenerate = async () => {
    setParsedData(null);
    await summarize(consultationNotes, {
      clinicId,
      patientId,
      sectionNames: activeSections,
      outputFormat,
    });
  };

  return (
    <>
      <AIButton
        onClick={handleSummarize}
        disabled={isLoading || !consultationNotes || consultationNotes.trim().length === 0}
        isLoading={isLoading}
        variant="outline"
        size="sm"
      >
        AI Summarize
      </AIButton>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Medical Note Summarizer
            </DialogTitle>
            <DialogDescription>
              Generate SOAP format summary from consultation notes
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-3 text-sm text-muted-foreground">Generating summary...</span>
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {parsedData && !isLoading && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold">Summary (Rendered)</h4>
                    <Button
                      onClick={handleCopy}
                      variant="outline"
                      size="sm"
                    >
                      {copied ? (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="mr-2 h-4 w-4" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="rounded-md bg-muted p-4 max-h-[400px] overflow-y-auto">
                    {outputFormat === 'plain_text' ? (
                      <div className="whitespace-pre-wrap text-sm">{parsedData.rawText}</div>
                    ) : (
                      <MarkdownRenderer content={parsedData.rawText} />
                    )}
                  </div>
                </div>

                {Object.keys(parsedData.sections).length > 0 && (
                  <div className="space-y-2 border-t pt-4">
                    <h4 className="text-sm font-semibold">Parsed Sections</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {Object.entries(parsedData.sections).map(([name, content], idx) => {
                        if (!content) return null;
                        const colors = SECTION_COLORS[idx % SECTION_COLORS.length];
                        return (
                          <div key={name} className={`${colors.bg} p-2 rounded border ${colors.border}`}>
                            <p className={`font-semibold ${colors.title}`}>{name}</p>
                            <p className={`${colors.body} line-clamp-2`}>
                              {content.length > PREVIEW_LENGTH ? `${content.substring(0, PREVIEW_LENGTH)}...` : content}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  {onApplyToForm && (
                    <Button
                      onClick={handleApply}
                      className="flex-1"
                    >
                      Apply to Form
                    </Button>
                  )}
                  <Button
                    onClick={handleRegenerate}
                    variant="outline"
                    disabled={isLoading}
                  >
                    Regenerate
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
