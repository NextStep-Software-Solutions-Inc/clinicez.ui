'use client';

import { Sparkles, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@components/ui/dialog';
import Markdown from 'react-markdown';

interface AIInsightsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fullName: string;
  isLoading: boolean;
  status: 'idle' | 'fetching' | 'analyzing' | 'generating' | 'complete';
  insights: string | null;
  debugData: any;
  error?: string;
}

export function AIInsightsDialog({
  open,
  onOpenChange,
  fullName,
  isLoading,
  status,
  insights,
  debugData,
  error,
}: AIInsightsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Patient AI Insights
          </DialogTitle>
          <DialogDescription>
            AI-generated insights for {fullName}
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isLoading ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center py-12">
                <div className="space-y-4 w-full max-w-md">
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-5 w-5 animate-spin text-primary flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        {status === 'fetching' && 'Fetching patient data...'}
                        {status === 'analyzing' && 'Analyzing patient data...'}
                        {status === 'generating' && 'Generating AI insights...'}
                        {status === 'idle' && 'Preparing analysis...'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {status === 'fetching' && 'Retrieving comprehensive medical records'}
                        {status === 'analyzing' && 'Processing demographics, medical history, and recent visits'}
                        {status === 'generating' && 'Creating personalized clinical insights'}
                        {status === 'idle' && 'Preparing to fetch patient data'}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2 pl-8">
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-2 w-2 rounded-full ${
                          status === 'fetching'
                            ? 'bg-primary'
                            : status !== 'idle'
                              ? 'bg-primary'
                              : 'bg-muted'
                        } animate-pulse`}
                      ></div>
                      <p
                        className={`text-xs ${
                          status !== 'idle'
                            ? 'text-foreground'
                            : 'text-muted-foreground'
                        }`}
                      >
                        Retrieving patient conditions
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-2 w-2 rounded-full ${
                          status === 'analyzing' ||
                          status === 'generating' ||
                          status === 'complete'
                            ? 'bg-primary'
                            : 'bg-muted'
                        } animate-pulse`}
                        style={{ animationDelay: '0.2s' }}
                      ></div>
                      <p
                        className={`text-xs ${
                          status === 'analyzing' ||
                          status === 'generating' ||
                          status === 'complete'
                            ? 'text-foreground'
                            : 'text-muted-foreground'
                        }`}
                      >
                        Reviewing medications and treatments
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-2 w-2 rounded-full ${
                          status === 'generating' || status === 'complete'
                            ? 'bg-primary'
                            : 'bg-muted'
                        } animate-pulse`}
                        style={{ animationDelay: '0.4s' }}
                      ></div>
                      <p
                        className={`text-xs ${
                          status === 'generating' || status === 'complete'
                            ? 'text-foreground'
                            : 'text-muted-foreground'
                        }`}
                      >
                        Generating personalized insights
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : insights ? (
            <div className="prose dark:prose-invert max-w-none text-sm space-y-4">
              <Markdown>{insights}</Markdown>

              {/* DEBUG SECTION */}
              {debugData && (
                <details className="mt-8 pt-6 border-t">
                  <summary className="cursor-pointer font-semibold text-sm text-foreground hover:text-primary">
                    🔍 Debug: Patient Data Sent to AI
                  </summary>
                  <div className="mt-4 space-y-4 bg-slate-900/90 dark:bg-slate-950/95 p-4 rounded-lg border border-slate-700/50">
                    <div>
                      <p className="font-mono text-xs font-bold mb-2 text-slate-300">
                        Comprehensive Patient Data:
                      </p>
                      <pre className="text-xs bg-slate-950 p-4 rounded overflow-auto max-h-96 font-mono border border-slate-700 text-slate-100">
                        {JSON.stringify(debugData.processed, null, 2)}
                      </pre>
                    </div>
                    {debugData.error && (
                      <div>
                        <p className="font-mono text-xs font-bold mb-2 text-destructive">
                          Error:
                        </p>
                        <pre className="text-xs bg-destructive/10 p-3 rounded overflow-auto font-mono border border-destructive/50">
                          {debugData.error}
                        </pre>
                      </div>
                    )}
                    <div>
                      <p className="font-mono text-xs text-muted-foreground">
                        Generated: {debugData.timestamp}
                      </p>
                    </div>
                  </div>
                </details>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No insights generated yet.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
