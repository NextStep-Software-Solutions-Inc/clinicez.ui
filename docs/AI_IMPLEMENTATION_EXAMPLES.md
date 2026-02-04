# AI Features Implementation Examples

This document provides practical examples for integrating AI features into ClinicEZ components.

## Table of Contents
1. [Medical Note Summarization Button](#medical-note-summarization-button)
2. [Symptom Analysis Widget](#symptom-analysis-widget)
3. [Patient Insights Dashboard Card](#patient-insights-dashboard-card)
4. [Streaming AI Chat Interface](#streaming-ai-chat-interface)
5. [Data Visualization Recommender](#data-visualization-recommender)

---

## Medical Note Summarization Button

Add to consultation notes component to summarize doctor's notes.

### Location
`src/components/consultation/ConsultationNotes.tsx`

### Implementation

```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, Sparkles } from 'lucide-react';
import { useMedicalNoteSummarization } from '@/hooks/ai/use-ai';

interface ConsultationNotesAIProps {
  notes: string;
  clinicId: string;
  patientId: string;
}

export function ConsultationNotesAI({ notes, clinicId, patientId }: ConsultationNotesAIProps) {
  const { summarize, summary, isLoading, error } = useMedicalNoteSummarization();
  const [showSummary, setShowSummary] = useState(false);

  const handleSummarize = async () => {
    await summarize(notes, { clinicId, patientId });
    setShowSummary(true);
  };

  return (
    <div className="space-y-4">
      <Button
        onClick={handleSummarize}
        disabled={isLoading || !notes}
        variant="outline"
        className="w-full sm:w-auto"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Summarizing...
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-4 w-4" />
            AI Summarize Notes
          </>
        )}
      </Button>

      {error && (
        <Card className="p-4 bg-red-50 border-red-200">
          <p className="text-red-600 text-sm">{error}</p>
        </Card>
      )}

      {showSummary && summary && (
        <Card className="p-6 bg-blue-50 border-blue-200">
          <div className="flex items-start justify-between mb-4">
            <h3 className="font-semibold text-lg flex items-center">
              <Sparkles className="mr-2 h-5 w-5 text-blue-600" />
              AI-Generated Summary
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSummary(false)}
            >
              ×
            </Button>
          </div>
          
          <div className="prose prose-sm max-w-none">
            <div className="whitespace-pre-wrap text-gray-700">{summary}</div>
          </div>
          
          <p className="text-xs text-gray-500 mt-4 italic">
            ⚠️ This is an AI-generated summary. Please review for accuracy and completeness.
            Not a substitute for professional medical judgment.
          </p>
        </Card>
      )}
    </div>
  );
}
```

---

## Symptom Analysis Widget

Add to appointment booking or triage workflow.

### Location
`src/components/appointments/SymptomAnalysisWidget.tsx`

### Implementation

```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, AlertTriangle, Info, Loader2 } from 'lucide-react';
import { useSymptomAnalysis } from '@/hooks/ai/use-ai';

interface PatientContext {
  age?: number;
  gender?: string;
  conditions?: string[];
  allergies?: string[];
}

interface SymptomAnalysisWidgetProps {
  patientContext?: PatientContext;
  onUrgencyDetected?: (level: 'emergency' | 'urgent' | 'routine') => void;
}

export function SymptomAnalysisWidget({ 
  patientContext, 
  onUrgencyDetected 
}: SymptomAnalysisWidgetProps) {
  const [symptoms, setSymptoms] = useState('');
  const { analyze, analysis, isLoading, error } = useSymptomAnalysis();

  const handleAnalyze = async () => {
    if (!symptoms.trim()) return;
    
    await analyze(symptoms, patientContext);
    
    if (analysis?.urgencyLevel) {
      onUrgencyDetected?.(analysis.urgencyLevel);
    }
  };

  const getUrgencyBadge = (level: 'emergency' | 'urgent' | 'routine') => {
    const config = {
      emergency: {
        icon: AlertCircle,
        label: 'Emergency',
        className: 'bg-red-100 text-red-800 border-red-300',
      },
      urgent: {
        icon: AlertTriangle,
        label: 'Urgent',
        className: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      },
      routine: {
        icon: Info,
        label: 'Routine',
        className: 'bg-green-100 text-green-800 border-green-300',
      },
    };

    const { icon: Icon, label, className } = config[level];
    
    return (
      <Badge className={className} variant="outline">
        <Icon className="mr-1 h-3 w-3" />
        {label}
      </Badge>
    );
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">AI Symptom Analysis</h3>
      
      <Textarea
        placeholder="Describe the patient's symptoms in detail..."
        value={symptoms}
        onChange={(e) => setSymptoms(e.target.value)}
        rows={4}
        className="mb-4"
      />

      <Button
        onClick={handleAnalyze}
        disabled={isLoading || !symptoms.trim()}
        className="w-full"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Analyzing...
          </>
        ) : (
          'Analyze Symptoms'
        )}
      </Button>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">
          {error}
        </div>
      )}

      {analysis && (
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">Analysis Results</h4>
            {getUrgencyBadge(analysis.urgencyLevel)}
          </div>

          {analysis.urgencyLevel === 'emergency' && (
            <div className="p-4 bg-red-50 border-2 border-red-300 rounded-lg">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-red-600 mr-2 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-900">Emergency Attention Required</p>
                  <p className="text-sm text-red-700 mt-1">
                    These symptoms require immediate medical attention. 
                    Please seek emergency care or call emergency services.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="prose prose-sm max-w-none">
            <div className="whitespace-pre-wrap text-gray-700">
              {analysis.analysis}
            </div>
          </div>

          {analysis.recommendations.length > 0 && (
            <div>
              <h5 className="font-semibold mb-2">Recommendations:</h5>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                {analysis.recommendations.map((rec, idx) => (
                  <li key={idx}>{rec}</li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-xs text-gray-500 italic mt-4">
            ⚠️ This is an AI-powered analysis tool, not a medical diagnosis. 
            Always consult with a qualified healthcare professional.
          </p>
        </div>
      )}
    </Card>
  );
}
```

---

## Patient Insights Dashboard Card

Add to patient profile or clinic dashboard.

### Location
`src/components/dashboard/PatientInsightsCard.tsx`

### Implementation

```typescript
'use client';

import { useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Brain, Loader2, RefreshCw } from 'lucide-react';
import { usePatientInsights } from '@/hooks/ai/use-ai';

interface PatientInsightsCardProps {
  patientData: {
    appointments?: number;
    conditions?: string[];
    medications?: string[];
    recentVisits?: Array<{ date: string; reason: string }>;
    vitalsTrends?: Record<string, number[]>;
  };
  clinicId?: string;
  autoGenerate?: boolean;
}

export function PatientInsightsCard({ 
  patientData, 
  clinicId, 
  autoGenerate = false 
}: PatientInsightsCardProps) {
  const { generate, insights, isLoading, error } = usePatientInsights();

  useEffect(() => {
    if (autoGenerate && patientData) {
      generate(patientData, clinicId);
    }
  }, [autoGenerate, patientData, clinicId]);

  const handleGenerate = () => {
    generate(patientData, clinicId);
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center">
          <Brain className="mr-2 h-5 w-5 text-purple-600" />
          AI Patient Insights
        </h3>
        <Button
          onClick={handleGenerate}
          disabled={isLoading}
          size="sm"
          variant="outline"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
        </Button>
      </div>

      {isLoading && !insights && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-500">Generating insights...</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">
          {error}
        </div>
      )}

      {insights && (
        <div className="space-y-4">
          <div className="prose prose-sm max-w-none">
            <div className="whitespace-pre-wrap text-gray-700">
              {insights}
            </div>
          </div>

          <div className="pt-4 border-t">
            <p className="text-xs text-gray-500 italic">
              💡 AI-generated insights based on patient data. 
              Use as a supplement to clinical judgment.
            </p>
          </div>
        </div>
      )}

      {!insights && !isLoading && !error && (
        <div className="text-center py-8">
          <Brain className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500 mb-4">
            Generate AI-powered insights from patient data
          </p>
          <Button onClick={handleGenerate}>Generate Insights</Button>
        </div>
      )}
    </Card>
  );
}
```

---

## Streaming AI Chat Interface

General-purpose AI chat with streaming support.

### Location
`src/components/ai/AIChat.tsx`

### Implementation

```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Send, Bot, User } from 'lucide-react';
import { useAICompletion } from '@/hooks/ai/use-ai';
import { AIFeatureType } from '@/lib/ai';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AIChatProps {
  featureType?: AIFeatureType;
  systemPrompt?: string;
  placeholder?: string;
}

export function AIChat({ 
  featureType = 'patient-communication',
  systemPrompt,
  placeholder = 'Type your message...'
}: AIChatProps) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const { complete, response, isStreaming, isLoading, reset } = useAICompletion();

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    await complete(input, {
      featureType,
      systemPrompt,
      stream: true,
    });
  };

  // Add AI response to messages when streaming completes
  useEffect(() => {
    if (!isStreaming && !isLoading && response) {
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
      reset();
    }
  }, [isStreaming, isLoading, response]);

  return (
    <Card className="flex flex-col h-[600px]">
      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex items-start space-x-2 ${
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4 text-purple-600" />
                </div>
              )}
              
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <User className="h-4 w-4 text-blue-600" />
                </div>
              )}
            </div>
          ))}

          {/* Streaming message */}
          {(isStreaming || isLoading) && (
            <div className="flex items-start space-x-2">
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                <Bot className="h-4 w-4 text-purple-600" />
              </div>
              <div className="max-w-[80%] p-3 rounded-lg bg-gray-100 text-gray-900">
                <p className="text-sm whitespace-pre-wrap">
                  {response || 'Thinking...'}
                </p>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 border-t">
        <div className="flex space-x-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={placeholder}
            rows={2}
            className="flex-1"
            disabled={isStreaming || isLoading}
          />
          <Button
            onClick={handleSend}
            disabled={isStreaming || isLoading || !input.trim()}
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </Card>
  );
}
```

---

## Data Visualization Recommender

Add to analytics dashboard or reporting tools.

### Location
`src/components/analytics/VisualizationRecommender.tsx`

### Implementation

```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Loader2 } from 'lucide-react';
import { useVisualizationRecommendation } from '@/hooks/ai/use-ai';

type DataType = 'appointments' | 'patient-stats' | 'clinic-metrics' | 'financial' | 'other';

export function VisualizationRecommender() {
  const [description, setDescription] = useState('');
  const [dataType, setDataType] = useState<DataType>('appointments');
  const { recommend, recommendation, isLoading, error } = useVisualizationRecommendation();

  const handleRecommend = async () => {
    if (!description.trim()) return;
    await recommend(description, dataType);
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <BarChart3 className="mr-2 h-5 w-5 text-blue-600" />
        AI Visualization Recommender
      </h3>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">
            Data Type
          </label>
          <Select
            value={dataType}
            onValueChange={(value) => setDataType(value as DataType)}
          >
            <option value="appointments">Appointments</option>
            <option value="patient-stats">Patient Statistics</option>
            <option value="clinic-metrics">Clinic Metrics</option>
            <option value="financial">Financial Data</option>
            <option value="other">Other</option>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">
            Describe Your Data
          </label>
          <Textarea
            placeholder="e.g., Monthly appointment counts by department over the last year..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>

        <Button
          onClick={handleRecommend}
          disabled={isLoading || !description.trim()}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            'Get Recommendations'
          )}
        </Button>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">
            {error}
          </div>
        )}

        {recommendation && (
          <div className="mt-6 space-y-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-semibold mb-2">Recommended Visualizations:</h4>
              <div className="flex flex-wrap gap-2">
                {recommendation.visualizationType.map((type, idx) => (
                  <Badge key={idx} variant="secondary">
                    {type}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Key Metrics to Display:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {recommendation.metrics.map((metric, idx) => (
                  <li key={idx} className="text-gray-700">{metric}</li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Detailed Suggestions:</h4>
              <div className="text-sm text-gray-700 whitespace-pre-wrap">
                {recommendation.suggestions}
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
```

---

## Usage in Existing Components

### Example: Adding to Consultation Page

```typescript
// src/app/(dashboard)/clinics/[clinicUid]/consultations/[consultationUid]/page.tsx

import { ConsultationNotesAI } from '@/components/consultation/ConsultationNotes';
import { isAIEnabled } from '@/lib/ai';

export default function ConsultationPage({ params }: { params: { consultationUid: string } }) {
  const consultation = await getConsultation(params.consultationUid);
  
  return (
    <div>
      {/* Existing consultation UI */}
      
      {/* Add AI features */}
      {isAIEnabled() && (
        <ConsultationNotesAI
          notes={consultation.notes}
          clinicId={consultation.clinicId}
          patientId={consultation.patientId}
        />
      )}
    </div>
  );
}
```

### Example: Adding to Appointment Booking

```typescript
// src/components/appointments/BookAppointmentSheet.tsx

import { SymptomAnalysisWidget } from '@/components/appointments/SymptomAnalysisWidget';

export function BookAppointmentSheet({ patient }: { patient: Patient }) {
  const handleUrgencyDetected = (level: 'emergency' | 'urgent' | 'routine') => {
    if (level === 'emergency') {
      // Show emergency alert
      // Suggest immediate care
    } else if (level === 'urgent') {
      // Prioritize appointment slots
    }
  };

  return (
    <Sheet>
      <SheetContent>
        {/* Existing booking form */}
        
        <Separator className="my-6" />
        
        <SymptomAnalysisWidget
          patientContext={{
            age: patient.age,
            gender: patient.gender,
            conditions: patient.conditions,
            allergies: patient.allergies,
          }}
          onUrgencyDetected={handleUrgencyDetected}
        />
      </SheetContent>
    </Sheet>
  );
}
```

## Best Practices

1. **Always show AI disclaimers**: Users should know content is AI-generated
2. **Handle errors gracefully**: Display user-friendly error messages
3. **Use loading states**: Show progress for better UX
4. **Feature flags**: Use `isAIEnabled()` to toggle features
5. **Cost awareness**: Consider streaming for better perceived performance
6. **Authentication**: All AI features require authentication
7. **Privacy**: Never log PHI, implement data anonymization
8. **Validation**: Always validate AI responses for healthcare compliance

## Next Steps

1. Copy relevant components to your codebase
2. Adjust styling to match your design system
3. Add proper error boundaries
4. Implement analytics tracking
5. Add user feedback mechanisms
6. Test thoroughly with real data
7. Review security and compliance

For more information, see:
- [AI Quick Start Guide](./AI_QUICK_START.md)
- [AI Integration Summary](./AI_INTEGRATION_SUMMARY.md)
- [AI Features Recommendations](./AI_FEATURES_RECOMMENDATIONS.md)
