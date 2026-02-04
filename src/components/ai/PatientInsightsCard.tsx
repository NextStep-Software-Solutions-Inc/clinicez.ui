'use client';

import { useState, useEffect } from 'react';
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
}

export function PatientInsightsCard({
  userId,
  clinicId,
}: PatientInsightsCardProps) {
  const { generate, insights, isLoading, error } = usePatientInsights();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [patientStats, setPatientStats] = useState({
    appointments: 0,
    conditions: 0,
    medications: 0,
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  useEffect(() => {
    const fetchPatientStats = async () => {
      try {
        setIsLoadingStats(true);
        const response = await fetch(`/api/patients/${userId}/stats?clinicId=${clinicId || ''}`);
        if (response.ok) {
          const data = await response.json();
          setPatientStats({
            appointments: data.appointments || 0,
            conditions: data.conditions || 0,
            medications: data.medications || 0,
          });
        }
      } catch (err) {
        console.error('Failed to fetch patient stats:', err);
      } finally {
        setIsLoadingStats(false);
      }
    };

    fetchPatientStats();
  }, [userId, clinicId]);

  const handleGenerate = async () => {
    setIsDialogOpen(true);
    
    // Fetch full patient data for AI analysis
    try {
      const response = await fetch(`/api/patients/${userId}/data?clinicId=${clinicId || ''}`);
      if (response.ok) {
        const patientData = await response.json();
        await generate(patientData, clinicId);
      }
    } catch (err) {
      console.error('Failed to fetch patient data:', err);
    }
  };

  return (
    <>
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
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Total Appointments</p>
              {isLoadingStats ? (
                <div className="h-8 flex items-center">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <p className="text-2xl font-bold">{patientStats.appointments}</p>
              )}
            </div>
            <div>
              <p className="text-muted-foreground">Active Conditions</p>
              {isLoadingStats ? (
                <div className="h-8 flex items-center">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <p className="text-2xl font-bold">{patientStats.conditions}</p>
              )}
            </div>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={isLoading || isLoadingStats}
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
