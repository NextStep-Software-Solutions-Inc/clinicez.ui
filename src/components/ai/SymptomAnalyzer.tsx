'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, AlertCircle, Clock, CheckCircle, Loader2 } from 'lucide-react';
import { useSymptomAnalysis } from '@/hooks/ai/use-ai';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SymptomAnalyzerProps {
  symptoms: string;
  patientContext?: {
    age?: number;
    gender?: string;
    conditions?: string[];
    allergies?: string[];
  };
  clinicId?: string | number;
  onAnalysisComplete?: (analysis: {
    analysis: string;
    urgencyLevel: 'emergency' | 'urgent' | 'routine';
    recommendations: string[];
  }) => void;
}

export function SymptomAnalyzer({
  symptoms,
  patientContext,
  clinicId,
  onAnalysisComplete,
}: SymptomAnalyzerProps) {
  const { analyze, analysis, isLoading, error } = useSymptomAnalysis();
  const [hasAnalyzed, setHasAnalyzed] = useState(false);

  const handleAnalyze = async () => {
    if (!symptoms || symptoms.trim().length === 0) {
      return;
    }

    const result = await analyze(symptoms, patientContext, clinicId);
    
    if (result) {
      setHasAnalyzed(true);
      onAnalysisComplete?.(result);
    }
  };

  const getUrgencyColor = (level: string) => {
    switch (level) {
      case 'emergency':
        return 'destructive';
      case 'urgent':
        return 'default';
      case 'routine':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const getUrgencyIcon = (level: string) => {
    switch (level) {
      case 'emergency':
        return <AlertCircle className="h-4 w-4" />;
      case 'urgent':
        return <Clock className="h-4 w-4" />;
      case 'routine':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          AI Symptom Analysis
        </CardTitle>
        <CardDescription>
          Get instant AI-powered symptom analysis with urgency detection
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasAnalyzed && (
          <Button
            onClick={handleAnalyze}
            disabled={isLoading || !symptoms || symptoms.trim().length === 0}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing Symptoms...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Analyze Symptoms
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

        {analysis && hasAnalyzed && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">Urgency Level</h4>
              <Badge 
                variant={getUrgencyColor(analysis.urgencyLevel)}
                className="flex items-center gap-1"
              >
                {getUrgencyIcon(analysis.urgencyLevel)}
                {analysis.urgencyLevel.toUpperCase()}
              </Badge>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Analysis</h4>
              <div className="rounded-md bg-muted p-3 text-sm whitespace-pre-line">
                {analysis.analysis}
              </div>
            </div>

            {analysis.recommendations && analysis.recommendations.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Recommendations</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  {analysis.recommendations.map((rec, idx) => (
                    <li key={idx}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}

            <Button
              onClick={handleAnalyze}
              variant="outline"
              size="sm"
              disabled={isLoading}
              className="w-full"
            >
              Re-analyze
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
