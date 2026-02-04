'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Sparkles, TrendingUp, AlertCircle, Loader2 } from 'lucide-react';
import { usePatientInsights } from '@/hooks/ai/use-ai';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MarkdownRenderer } from '@/components/markdown/MarkdownRenderer';

interface PatientInsightsCardProps {
  userId: number;
  clinicId?: number;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function PatientInsightsCard({
  userId,
  clinicId,
  isOpen: externalIsOpen,
  onOpenChange,
}: PatientInsightsCardProps) {
  const { generate, insights, isLoading, error } = usePatientInsights();
  const [internalIsOpen, setInternalIsOpen] = useState(false);

  // Use external state if provided, otherwise use internal state
  const isDialogOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const setIsDialogOpen = onOpenChange || setInternalIsOpen;

  const handleGenerate = async () => {
    setIsDialogOpen(true);

    // Fetch full patient data for AI analysis
    try {
      const response = await fetch(
        `/api/patients/${userId}/data?clinicId=${clinicId || ''}`
      );
      if (response.ok) {
        const patientData = await response.json();
        await generate(patientData, clinicId);
      }
    } catch (err) {
      console.error('Failed to fetch patient data:', err);
    }
  };

  // Return null if not used as dialog (grid view only shows card)
  if (!externalIsOpen && internalIsOpen === false) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            AI Patient Insights
          </CardTitle>
          <CardDescription>
            Get AI-powered analysis of patient trends and patterns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleGenerate}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Insights...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate AI Insights
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              AI Patient Insights
            </DialogTitle>
            <DialogDescription>
              AI-powered analysis of patient trends and patterns
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {insights && !isLoading && (
              <>
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Patient Analysis
                  </h4>
                  <div className="rounded-md bg-muted p-4 text-sm">
                    <MarkdownRenderer content={insights} />
                  </div>
                </div>

                <Button
                  onClick={handleGenerate}
                  variant="outline"
                  size="sm"
                  disabled={isLoading}
                  className="w-full"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Regenerate Insights
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
