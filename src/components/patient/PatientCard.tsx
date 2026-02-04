'use client';

import { Avatar, AvatarFallback } from '@components/ui/avatar';
import { Badge } from '@components/ui/badge';
import { Button } from '@components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@components/ui/dialog';
import ConditionalRender from '@components/utils/ConditionalRender';
import Image from 'next/image';
import { GetClinicPatients } from '@/actions/clinics/clinic-patient.action';
import dayjs from '@lib/day-utils';
import { ViewEMRButton } from './ViewEMRButton';
import { calculateAge } from '@/lib/utils';
import { Heart, AlertCircle, Pill, Sparkles, Loader2 } from 'lucide-react';
import { useState } from 'react';
import Markdown from 'react-markdown';
import { usePatientInsights } from '@/hooks/ai/use-ai';
import { usePatientComprehensiveData } from '@/hooks/usePatientComprehensiveData';

type ViewMode = 'list' | 'grid';

interface PatientCardProps {
  patient: NonNullable<GetClinicPatients['data']>[number] & {
    immunocompromised?: boolean;
  };
  viewMode?: ViewMode;
}

export function PatientCard({ patient, viewMode = 'grid' }: PatientCardProps) {
  const [showAIInsights, setShowAIInsights] = useState(false);
  const [debugPatientData, setDebugPatientData] = useState<any>(null);
  const [aiStatus, setAiStatus] = useState<'idle' | 'fetching' | 'analyzing' | 'generating' | 'complete'>('idle');
  const { generate, insights, isLoading: isLoadingInsights } = usePatientInsights();

  // Destructure patient data first
  const {
    id: clinicPatientId,
    Patient: {
      id: patientId,
      dob,
      gender,
      firstName,
      middleName,
      lastName,
      suffix,
      updatedAt,
      bloodType,
      nickname,
      userId,
      picture = 'https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png',
    },
    immunocompromised,
    stats = {
      appointments: 0,
      conditions: 0,
      medications: 0,
    },
  } = patient;

  // Use the comprehensive data hook - disabled by default, only fetch on demand
  const { 
    data: comprehensiveData, 
    loading: isLoadingPatientData, 
    error: patientDataError,
    refetch: refetchPatientData,
    updateCursor,
  } = usePatientComprehensiveData({
    userId: patientId, // Use numeric patientId, not string userId (Clerk ID)
    clinicId: (patient.Clinic?.id as number) || undefined,
    enabled: false, // Don't fetch automatically, only on demand
  });

  const handleOpenAIInsights = async () => {
    setShowAIInsights(true);
    setAiStatus('idle');
    
    if (!insights) {
      try {
        // Fetch data using the hook's refetch method (removes manual fetch duplication)
        let dataToUse = comprehensiveData;
        
        if (!dataToUse) {
          setAiStatus('fetching');
          console.log('Fetching patient data for patientId:', patientId);
          dataToUse = await refetchPatientData();
        }
        
        if (dataToUse) {
          setAiStatus('analyzing');
          
          setDebugPatientData({
            raw: dataToUse,
            processed: dataToUse,
            timestamp: new Date().toISOString(),
          });

          console.log('Comprehensive Patient Data Sent to AI:', dataToUse);

          setAiStatus('generating');
          // Generate AI insights with comprehensive data
          await generate(dataToUse, patient.Clinic?.id);
          setAiStatus('complete');
        }
      } catch (error) {
        console.error('Failed to fetch patient data:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        // Fallback: generate with basic stats
        const patientData = {
          appointments: stats.appointments,
          conditions: [],
          medications: [],
          recentVisits: [],
          vitalsTrends: {},
        };
        setDebugPatientData({
          raw: {},
          processed: patientData,
          timestamp: new Date().toISOString(),
          error: errorMessage,
          patientId: patientId,
          clinicId: patient.Clinic?.id,
        });
        setAiStatus('idle');
        await generate(patientData, patient.Clinic?.id);
      }
    } else {
      setAiStatus('complete');
    }
  };

  const nameInitials = `${firstName?.charAt(0) ?? ''}${lastName?.charAt(0) ?? ''}`;
  const fullName = `${firstName || '-'} ${middleName ?? ''} ${lastName || '-'}`.trim();
  const displayName = `${lastName || '-'}, ${firstName || '-'} ${middleName ?? ''} ${suffix ?? ''}`.trim();
  const age = calculateAge(dob);

  // List view - horizontal compact layout with improved design
  if (viewMode === 'list') {
    return (
      <>
        <Card className="shadow-sm hover:shadow-lg transition-all duration-200 border-l-4 border-l-primary/20 hover:border-l-primary/50">
          <CardContent className="p-3 sm:p-4">
            <div className="flex gap-3 sm:gap-4 items-center justify-between">
              {/* Avatar & Basic Info */}
              <div className="flex gap-2.5 sm:gap-3 items-start flex-1 min-w-0">
                <Avatar className="rounded-lg h-12 sm:h-14 w-12 sm:w-14 flex-shrink-0 border border-border">
                  {picture ? (
                    <Image
                      width={56}
                      height={56}
                      className="object-cover w-full"
                      src={picture}
                      alt={nickname ?? ''}
                    />
                  ) : (
                    <AvatarFallback className="text-xs font-semibold">{nameInitials}</AvatarFallback>
                  )}
                </Avatar>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm sm:text-base line-clamp-1">{fullName}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <p className="text-xs text-muted-foreground">
                      {gender?.charAt(0).toUpperCase()}{gender?.slice(1).toLowerCase()} • {age}y
                    </p>
                    {bloodType && (
                      <Badge className="text-xs font-semibold bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-200 border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900">
                        {bloodType.replace('_', '')}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="hidden md:flex gap-4 sm:gap-6 flex-shrink-0">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Heart className="h-4 w-4 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Appointments</p>
                  </div>
                  <p className="font-bold text-lg">{stats.appointments}</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Conditions</p>
                  </div>
                  <p className="font-bold text-lg">{stats.conditions}</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Pill className="h-4 w-4 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Medications</p>
                  </div>
                  <p className="font-bold text-lg">{stats.medications}</p>
                </div>
              </div>

              {/* Mobile Stats */}
              <div className="md:hidden flex gap-3 flex-shrink-0">
                <div className="text-center text-xs">
                  <p className="font-bold">{stats.appointments}</p>
                  <p className="text-muted-foreground text-xs">Appts</p>
                </div>
                <div className="text-center text-xs">
                  <p className="font-bold">{stats.conditions}</p>
                  <p className="text-muted-foreground text-xs">Conditions</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-1 items-center flex-shrink-0">
                <ConditionalRender condition={immunocompromised ?? false}>
                  <Badge variant="destructive" className="text-xs gap-1">
                    <AlertCircle className="h-3 w-3" />
                    IC
                  </Badge>
                </ConditionalRender>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  onClick={handleOpenAIInsights}
                  title="Generate AI Insights"
                >
                  <Sparkles className="h-4 w-4" />
                </Button>
                <ViewEMRButton userId={userId} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Insights Dialog */}
        <Dialog open={showAIInsights} onOpenChange={setShowAIInsights}>
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
              {isLoadingInsights ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-center py-12">
                    <div className="space-y-4 w-full max-w-md">
                      <div className="flex items-center gap-3">
                        <Loader2 className="h-5 w-5 animate-spin text-primary flex-shrink-0" />
                        <div className="flex-1">
                          <p className="font-medium text-sm">
                            {aiStatus === 'fetching' && 'Fetching patient data...'}
                            {aiStatus === 'analyzing' && 'Analyzing patient data...'}
                            {aiStatus === 'generating' && 'Generating AI insights...'}
                            {aiStatus === 'idle' && 'Preparing analysis...'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {aiStatus === 'fetching' && 'Retrieving comprehensive medical records'}
                            {aiStatus === 'analyzing' && 'Processing demographics, medical history, and recent visits'}
                            {aiStatus === 'generating' && 'Creating personalized clinical insights'}
                            {aiStatus === 'idle' && 'Preparing to fetch patient data'}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2 pl-8">
                        <div className="flex items-center gap-2">
                          <div className={`h-2 w-2 rounded-full ${aiStatus === 'fetching' ? 'bg-primary' : aiStatus !== 'idle' ? 'bg-primary' : 'bg-muted'} animate-pulse`}></div>
                          <p className={`text-xs ${aiStatus !== 'idle' ? 'text-foreground' : 'text-muted-foreground'}`}>
                            Retrieving patient conditions
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`h-2 w-2 rounded-full ${aiStatus === 'analyzing' || aiStatus === 'generating' || aiStatus === 'complete' ? 'bg-primary' : 'bg-muted'} animate-pulse`} style={{ animationDelay: '0.2s' }}></div>
                          <p className={`text-xs ${aiStatus === 'analyzing' || aiStatus === 'generating' || aiStatus === 'complete' ? 'text-foreground' : 'text-muted-foreground'}`}>
                            Reviewing medications and treatments
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`h-2 w-2 rounded-full ${aiStatus === 'generating' || aiStatus === 'complete' ? 'bg-primary' : 'bg-muted'} animate-pulse`} style={{ animationDelay: '0.4s' }}></div>
                          <p className={`text-xs ${aiStatus === 'generating' || aiStatus === 'complete' ? 'text-foreground' : 'text-muted-foreground'}`}>
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
                  {debugPatientData && (
                    <details className="mt-8 pt-6 border-t">
                      <summary className="cursor-pointer font-semibold text-sm text-foreground hover:text-primary">
                        🔍 Debug: Patient Data Sent to AI
                      </summary>
                      <div className="mt-4 space-y-4 bg-slate-900/90 dark:bg-slate-950/95 p-4 rounded-lg border border-slate-700/50">
                        <div>
                          <p className="font-mono text-xs font-bold mb-2 text-slate-300">Comprehensive Patient Data:</p>
                          <pre className="text-xs bg-slate-950 p-4 rounded overflow-auto max-h-96 font-mono border border-slate-700 text-slate-100">
                            {JSON.stringify(debugPatientData.processed, null, 2)}
                          </pre>
                        </div>
                        {debugPatientData.error && (
                          <div>
                            <p className="font-mono text-xs font-bold mb-2 text-destructive">Error:</p>
                            <pre className="text-xs bg-destructive/10 p-3 rounded overflow-auto font-mono border border-destructive/50">
                              {debugPatientData.error}
                            </pre>
                          </div>
                        )}
                        <div>
                          <p className="font-mono text-xs text-muted-foreground">
                            Generated: {debugPatientData.timestamp}
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
      </>
    );
  }

  // Grid view - modern vertical card layout
  return (
    <>
      <Card className="shadow-md hover:shadow-xl transition-all duration-200 overflow-hidden flex flex-col h-full hover:border-primary/50">
        {/* Header with gradient background */}
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-4">
          <CardHeader className="p-0 mb-3">
            <CardTitle className="text-base sm:text-lg line-clamp-1">{fullName}</CardTitle>
            <CardDescription className="text-xs line-clamp-1">
              Updated {dayjs(updatedAt).fromNow()}
            </CardDescription>
          </CardHeader>

          {/* Avatar */}
          <Avatar className="rounded-lg w-full h-40 sm:h-48 border-2 border-background shadow-md">
            {picture ? (
              <Image
                width={300}
                height={300}
                className="object-cover w-full"
                src={picture}
                alt={nickname ?? ''}
              />
            ) : (
              <AvatarFallback className="text-2xl font-bold">{nameInitials}</AvatarFallback>
            )}
          </Avatar>
        </div>

        {/* Content */}
        <CardContent className="flex-1 p-4 space-y-4">
          {/* Demographics */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Demographics</p>
            <div className="flex gap-2 items-center flex-wrap">
              <Badge variant="secondary" className="text-xs">
                {gender?.charAt(0).toUpperCase()}{gender?.slice(1).toLowerCase()}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {age} years
              </Badge>
              {bloodType && (
                <Badge variant="outline" className="text-xs font-semibold">
                  {bloodType.replace('_', '')}
                </Badge>
              )}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3 text-center">
              <Heart className="h-4 w-4 mx-auto mb-1 text-blue-600" />
              <p className="font-bold text-lg">{stats.appointments}</p>
              <p className="text-xs text-muted-foreground">Appointments</p>
            </div>
            <div className="bg-amber-50 dark:bg-amber-950/30 rounded-lg p-3 text-center">
              <AlertCircle className="h-4 w-4 mx-auto mb-1 text-amber-600" />
              <p className="font-bold text-lg">{stats.conditions}</p>
              <p className="text-xs text-muted-foreground">Conditions</p>
            </div>
            <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-3 text-center">
              <Pill className="h-4 w-4 mx-auto mb-1 text-green-600" />
              <p className="font-bold text-lg">{stats.medications}</p>
              <p className="text-xs text-muted-foreground">Medications</p>
            </div>
          </div>

          {/* Alerts */}
          <ConditionalRender condition={immunocompromised ?? false}>
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-xs font-medium text-destructive">Immunocompromised patient</p>
            </div>
          </ConditionalRender>
        </CardContent>

        {/* Footer Actions */}
        <div className="bg-muted/30 px-4 py-3 mt-auto flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            className="flex-1 gap-2"
            onClick={handleOpenAIInsights}
          >
            <Sparkles className="h-4 w-4" />
            <span className="text-xs">AI Insights</span>
          </Button>
          <ViewEMRButton userId={userId} />
        </div>
      </Card>

      {/* AI Insights Dialog */}
      <Dialog open={showAIInsights} onOpenChange={setShowAIInsights}>
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
            {isLoadingInsights ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center py-12">
                  <div className="space-y-4 w-full max-w-md">
                    <div className="flex items-center gap-3">
                      <Loader2 className="h-5 w-5 animate-spin text-primary flex-shrink-0" />
                      <div className="flex-1">
                        <p className="font-medium text-sm">
                          {aiStatus === 'fetching' && 'Fetching patient data...'}
                          {aiStatus === 'analyzing' && 'Analyzing patient data...'}
                          {aiStatus === 'generating' && 'Generating AI insights...'}
                          {aiStatus === 'idle' && 'Preparing analysis...'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {aiStatus === 'fetching' && 'Retrieving comprehensive medical records'}
                          {aiStatus === 'analyzing' && 'Processing demographics, medical history, and recent visits'}
                          {aiStatus === 'generating' && 'Creating personalized clinical insights'}
                          {aiStatus === 'idle' && 'Preparing to fetch patient data'}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2 pl-8">
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${aiStatus === 'fetching' ? 'bg-primary' : aiStatus !== 'idle' ? 'bg-primary' : 'bg-muted'} animate-pulse`}></div>
                        <p className={`text-xs ${aiStatus !== 'idle' ? 'text-foreground' : 'text-muted-foreground'}`}>
                          Retrieving patient conditions
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${aiStatus === 'analyzing' || aiStatus === 'generating' || aiStatus === 'complete' ? 'bg-primary' : 'bg-muted'} animate-pulse`} style={{ animationDelay: '0.2s' }}></div>
                        <p className={`text-xs ${aiStatus === 'analyzing' || aiStatus === 'generating' || aiStatus === 'complete' ? 'text-foreground' : 'text-muted-foreground'}`}>
                          Reviewing medications and treatments
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${aiStatus === 'generating' || aiStatus === 'complete' ? 'bg-primary' : 'bg-muted'} animate-pulse`} style={{ animationDelay: '0.4s' }}></div>
                        <p className={`text-xs ${aiStatus === 'generating' || aiStatus === 'complete' ? 'text-foreground' : 'text-muted-foreground'}`}>
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
                {debugPatientData && (
                  <details className="mt-8 pt-6 border-t">
                    <summary className="cursor-pointer font-semibold text-sm text-foreground hover:text-primary">
                      🔍 Debug: Patient Data Sent to AI
                    </summary>
                    <div className="mt-4 space-y-4 bg-slate-900/90 dark:bg-slate-950/95 p-4 rounded-lg border border-slate-700/50">
                      <div>
                        <p className="font-mono text-xs font-bold mb-2 text-slate-300">Comprehensive Patient Data:</p>
                        <pre className="text-xs bg-slate-950 p-4 rounded overflow-auto max-h-96 font-mono border border-slate-700 text-slate-100">
                          {JSON.stringify(debugPatientData.processed, null, 2)}
                        </pre>
                      </div>
                      {debugPatientData.error && (
                        <div>
                          <p className="font-mono text-xs font-bold mb-2 text-destructive">Error:</p>
                          <pre className="text-xs bg-destructive/10 p-3 rounded overflow-auto font-mono border border-destructive/50">
                            {debugPatientData.error}
                          </pre>
                        </div>
                      )}
                      <div>
                        <p className="font-mono text-xs text-muted-foreground">
                          Generated: {debugPatientData.timestamp}
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
    </>
  );
}


