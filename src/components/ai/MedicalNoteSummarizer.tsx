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

interface MedicalNoteSummarizerProps {
  consultationNotes: string;
  clinicId?: number;
  patientId?: number;
  onSummaryGenerated?: (summary: string) => void;
  onApplyToForm?: (summary: string) => void;
}

/**
 * Extract only the medical content from AI response, removing disclaimers and instructions
 */
function extractMedicalContent(text: string): string {
  if (!text) return '';
  
  // Remove common disclaimer patterns
  const disclaimerPatterns = [
    /\*\*Disclaimer:\*\*.*?(?=\n\n|$)/gis,
    /---\s*\*\*Disclaimer:\*\*.*?(?=\n\n|$)/gis,
    /Please provide.*?(?=\n\n|$)/gis,
    /Once the content is provided.*?(?=\n\n|$)/gis,
    /This is an AI-generated.*?(?=\n\n|$)/gis,
    /should be reviewed by healthcare professionals.*?(?=\n\n|$)/gis,
  ];
  
  let cleanedText = text;
  disclaimerPatterns.forEach(pattern => {
    cleanedText = cleanedText.replace(pattern, '');
  });
  
  // Remove extra whitespace and newlines
  cleanedText = cleanedText
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\s+|\s+$/g, '')
    .trim();
  
  return cleanedText;
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
  const [editedSummary, setEditedSummary] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (summary) {
      const cleanedContent = extractMedicalContent(summary);
      setEditedSummary(cleanedContent);
      onSummaryGenerated?.(cleanedContent);
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
    await navigator.clipboard.writeText(editedSummary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApply = () => {
    if (onApplyToForm) {
      onApplyToForm(editedSummary);
      setIsDialogOpen(false);
    }
  };

  const handleRegenerate = async () => {
    setEditedSummary('');
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

            {editedSummary && !isLoading && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold">SOAP Summary</h4>
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
                  <Textarea
                    value={editedSummary}
                    onChange={(e) => setEditedSummary(e.target.value)}
                    className="min-h-[400px] resize-y font-mono text-sm"
                    placeholder="AI-generated SOAP summary will appear here..."
                  />
                  <p className="text-xs text-muted-foreground">
                    You can edit the summary before applying it to the form
                  </p>
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
