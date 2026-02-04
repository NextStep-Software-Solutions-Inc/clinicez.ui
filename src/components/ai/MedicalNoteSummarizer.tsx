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
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Copy, Check, AlertCircle, Loader2 } from 'lucide-react';
import { useMedicalNoteSummarization } from '@/hooks/ai/use-ai';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MarkdownRenderer } from '@/components/markdown/MarkdownRenderer';

interface MedicalNoteSummarizerProps {
  consultationNotes: string;
  clinicId?: number;
  patientId?: number;
  onSummaryGenerated?: (summary: string) => void;
  onApplyToForm?: (soapData: {
    subjective?: string;
    objective?: string;
    assessment?: string;
    plan?: string;
  }) => void;
}

/**
 * Parse SOAP sections from AI response
 */
function parseSOAPSections(text: string): {
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
  rawText: string;
} {
  const soapData = {
    subjective: '',
    objective: '',
    assessment: '',
    plan: '',
    rawText: text,
  };

  const patterns = {
    subjective: /^##?\s*Subjective[\s\S]*?(?=^##?\s*(?:Objective|Assessment|Plan)|$)/mi,
    objective: /^##?\s*Objective[\s\S]*?(?=^##?\s*(?:Assessment|Plan|Subjective)|$)/mi,
    assessment: /^##?\s*Assessment[\s\S]*?(?=^##?\s*(?:Plan|Subjective|Objective)|$)/mi,
    plan: /^##?\s*Plan[\s\S]*?(?=^##?\s*(?:Subjective|Objective|Assessment)|$)/mi,
  };

  Object.entries(patterns).forEach(([key, pattern]) => {
    const match = text.match(pattern);
    if (match) {
      soapData[key as keyof typeof soapData] = match[0]
        .replace(/^##?\s*(Subjective|Objective|Assessment|Plan)[:\s]*/i, '')
        .trim();
    }
  });

  return soapData;
}

export function MedicalNoteSummarizer({
  consultationNotes,
  clinicId,
  patientId,
  onSummaryGenerated,
  onApplyToForm,
}: MedicalNoteSummarizerProps) {
  const { summarize, summary, isLoading, error } = useMedicalNoteSummarization();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [soapData, setSOAPData] = useState<ReturnType<typeof parseSOAPSections> | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (summary) {
      const parsed = parseSOAPSections(summary);
      setSOAPData(parsed);
      onSummaryGenerated?.(parsed.rawText);
    }
  }, [summary, onSummaryGenerated]);

  const handleSummarize = async () => {
    setIsDialogOpen(true);
    await summarize(consultationNotes, { 
      clinicId, 
      patientId 
    });
  };

  const handleCopy = async () => {
    if (soapData?.rawText) {
      await navigator.clipboard.writeText(soapData.rawText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleApply = () => {
    if (onApplyToForm && soapData) {
      onApplyToForm({
        subjective: soapData.subjective,
        objective: soapData.objective,
        assessment: soapData.assessment,
        plan: soapData.plan,
      });
      setIsDialogOpen(false);
    }
  };

  const handleRegenerate = async () => {
    setSOAPData(null);
    await summarize(consultationNotes, { 
      clinicId, 
      patientId 
    });
  };

  return (
    <>
      <Button
        onClick={handleSummarize}
        disabled={isLoading || !consultationNotes || consultationNotes.trim().length === 0}
        variant="outline"
        size="sm"
      >
        <Sparkles className="mr-2 h-4 w-4" />
        AI Summarize
      </Button>

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

            {soapData && !isLoading && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold">SOAP Summary (Rendered)</h4>
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
                  <div className="rounded-md bg-muted p-4 max-h-[400px] overflow-y-auto prose prose-sm">
                    <MarkdownRenderer content={soapData.rawText} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Parsed SOAP sections will be automatically applied to form fields
                  </p>
                </div>

                <div className="space-y-2 border-t pt-4">
                  <h4 className="text-sm font-semibold">Parsed SOAP Sections</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {soapData.subjective && (
                      <div className="bg-blue-50 p-2 rounded border border-blue-200">
                        <p className="font-semibold text-blue-900">Subjective</p>
                        <p className="text-blue-800 line-clamp-2">{soapData.subjective.substring(0, 100)}...</p>
                      </div>
                    )}
                    {soapData.objective && (
                      <div className="bg-green-50 p-2 rounded border border-green-200">
                        <p className="font-semibold text-green-900">Objective</p>
                        <p className="text-green-800 line-clamp-2">{soapData.objective.substring(0, 100)}...</p>
                      </div>
                    )}
                    {soapData.assessment && (
                      <div className="bg-yellow-50 p-2 rounded border border-yellow-200">
                        <p className="font-semibold text-yellow-900">Assessment</p>
                        <p className="text-yellow-800 line-clamp-2">{soapData.assessment.substring(0, 100)}...</p>
                      </div>
                    )}
                    {soapData.plan && (
                      <div className="bg-purple-50 p-2 rounded border border-purple-200">
                        <p className="font-semibold text-purple-900">Plan</p>
                        <p className="text-purple-800 line-clamp-2">{soapData.plan.substring(0, 100)}...</p>
                      </div>
                    )}
                  </div>
                </div>

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
