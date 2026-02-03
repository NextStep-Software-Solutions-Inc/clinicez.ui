'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Copy, Check, AlertCircle, Loader2 } from 'lucide-react';
import { useMedicalNoteSummarization } from '@/hooks/ai/use-ai';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface MedicalNoteSummarizerProps {
  consultationNotes: string;
  clinicId?: string | number;
  patientId?: string | number;
  onSummaryGenerated?: (summary: string) => void;
  onApplyToForm?: (summary: string) => void;
}

export function MedicalNoteSummarizer({
  consultationNotes,
  clinicId,
  patientId,
  onSummaryGenerated,
  onApplyToForm,
}: MedicalNoteSummarizerProps) {
  const { summarize, summary, isLoading, error } = useMedicalNoteSummarization();
  const [editedSummary, setEditedSummary] = useState('');
  const [copied, setCopied] = useState(false);

  const handleSummarize = async () => {
    const result = await summarize(consultationNotes, { 
      clinicId: clinicId?.toString(), 
      patientId: patientId?.toString() 
    });
    
    if (result) {
      setEditedSummary(result);
      onSummaryGenerated?.(result);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(editedSummary || summary || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApply = () => {
    const finalSummary = editedSummary || summary || '';
    onApplyToForm?.(finalSummary);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          AI Medical Note Summarizer
        </CardTitle>
        <CardDescription>
          Generate SOAP format summary from consultation notes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!summary && (
          <Button
            onClick={handleSummarize}
            disabled={isLoading || !consultationNotes || consultationNotes.trim().length === 0}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Summary...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Summarize Notes (SOAP Format)
              </>
            )}
          </Button>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {summary && (
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
                value={editedSummary || summary}
                onChange={(e) => setEditedSummary(e.target.value)}
                className="min-h-[300px] resize-y font-mono text-sm"
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
                onClick={handleSummarize}
                variant="outline"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Regenerating...
                  </>
                ) : (
                  'Regenerate'
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
