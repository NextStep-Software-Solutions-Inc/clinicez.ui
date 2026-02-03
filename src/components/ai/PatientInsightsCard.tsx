'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, TrendingUp, AlertCircle, Loader2 } from 'lucide-react';
import { usePatientInsights } from '@/hooks/ai/use-ai';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PatientInsightsCardProps {
  patientData: {
    appointments?: number;
    conditions?: string[];
    medications?: string[];
    recentVisits?: Array<{
      date: string;
      reason: string;
    }>;
    vitalsTrends?: Record<string, number[]>;
  };
  clinicId?: number;
}

export function PatientInsightsCard({
  patientData,
  clinicId,
}: PatientInsightsCardProps) {
  const { generate, insights, isLoading, error } = usePatientInsights();
  const [showInsights, setShowInsights] = useState(false);

  const handleGenerate = async () => {
    const result = await generate(patientData, clinicId);
    
    if (result) {
      setShowInsights(true);
    }
  };

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
      <CardContent className="space-y-4">
        {!showInsights && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Total Appointments</p>
                <p className="text-2xl font-bold">{patientData.appointments || 0}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Active Conditions</p>
                <p className="text-2xl font-bold">{patientData.conditions?.length || 0}</p>
              </div>
            </div>

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
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {insights && showInsights && (
          <div className="space-y-4">
            <div className="space-y-2">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Patient Analysis
              </h4>
              <div className="rounded-md bg-muted p-4 text-sm whitespace-pre-line">
                {insights}
              </div>
            </div>

            {patientData.conditions && patientData.conditions.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Active Conditions</h4>
                <div className="flex flex-wrap gap-2">
                  {patientData.conditions.map((condition, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 text-xs rounded-md bg-secondary text-secondary-foreground"
                    >
                      {condition}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {patientData.medications && patientData.medications.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Current Medications</h4>
                <ul className="list-disc list-inside text-sm text-muted-foreground">
                  {patientData.medications.map((med, idx) => (
                    <li key={idx}>{med}</li>
                  ))}
                </ul>
              </div>
            )}

            <Button
              onClick={handleGenerate}
              variant="outline"
              size="sm"
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Regenerating...
                </>
              ) : (
                'Regenerate Insights'
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
